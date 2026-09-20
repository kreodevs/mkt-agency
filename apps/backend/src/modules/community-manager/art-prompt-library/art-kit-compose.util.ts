import sharp from '@/shared/media/sharp.util';
import type { ImageGenerationSize } from '../../../shared/social/image-generation-size.util';
import type { AssetDeviceHint } from '../../assets/domain/asset-folder.util';
import {
  buildDeviceShadow,
  renderDeviceFrame,
  resolveDeviceFrameType,
  resolveHeroDevicePlacement,
  readCaptureImageSize,
  resolveMockupDeviceHint,
  resolveVisualAspectRatio,
} from '../domain/device-frame-render.util';
import { parseImageSize } from '../domain/visual-template-render.util';
import {
  DEVICE_SCREEN_BACKGROUND,
  resizeScreenshotContain,
  resizeScreenshotCover,
} from '../domain/screenshot-crop.util';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { ArtKitLayoutMode, ArtPromptRecipe } from './art-prompt.types';

const KIT_OVERLAY_BASE =
  'CRITICAL BACKGROUND RULES: This image is BACKGROUND ART ONLY. Software will composite a real product screenshot later. ' +
  'Do NOT generate fake UI, app interfaces, device screens, mock product screenshots, smartphones, tablets, laptops, monitors, bezels, blank screens, or device silhouettes. ' +
  'Do not draw an empty phone-shaped object. Abstract atmosphere only.';

const PHONE_MOCKUP_HINT =
  'The overlay will be a vertical iPhone mockup placed by software. Do not draw a phone. No landscape monitor.';

const LAPTOP_MOCKUP_HINT =
  'The overlay will be a laptop mockup placed by software. Do not draw a laptop, desktop, or monitor. No vertical phone.';

const TABLET_MOCKUP_HINT =
  'The overlay will be a tablet mockup placed by software. Do not draw a tablet or iPad.';

const MOCKUP_BACKGROUND_RULE =
  'Forbidden objects: people, faces, hands, phones, tablets, laptops, monitors, screens, device silhouettes, blank white screens. ' +
  'Use only abstract gradient, soft office bokeh, or minimal brand-colored negative space.';

const LOGO_OVERLAY_RULE =
  'The official brand logo is added later in the top-left corner by software. ' +
  'Do NOT render the brand name, product name, wordmark, logotype, or any typographic spelling of the brand anywhere in the image.';

const LAYOUT_HINTS: Record<ArtKitLayoutMode, string> = {
  mockup:
    'Fill the whole canvas with soft abstract background. A device mockup overlay is added later by software — do not leave a device-shaped hole and do not draw any device.',
  'center-panel':
    'Reserve a centered rectangular panel (about 45–55% of canvas width) with neutral fill for screenshot overlay. Do not draw devices inside it.',
  'split-bottom':
    'Reserve the bottom 40% of the canvas as clean empty space or subtle gradient for a real photo overlay.',
};

const DEVICE_DRAWING_PHRASES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bcentered product mockup\b/gi, replacement: 'abstract brand atmosphere' },
  { pattern: /\bproduct mockup\b/gi, replacement: 'brand atmosphere' },
  { pattern: /\bproduct in hand\b/gi, replacement: 'ambient setting' },
  { pattern: /\bholding a smartphone\b/gi, replacement: 'in a premium setting' },
];

export function stripDeviceDrawingLanguage(prompt: string): string {
  return DEVICE_DRAWING_PHRASES.reduce((text, { pattern, replacement }) => {
    const fresh = new RegExp(pattern.source, pattern.flags);
    return text.replace(fresh, replacement);
  }, prompt);
}

export function wantsProductMockupPreset(
  post: Pick<SocialCopyPost, 'visualTemplateId'>,
): boolean {
  const id = post.visualTemplateId?.trim();
  return id === 'product-hero' || id === 'promo-cta';
}

function resolveKitOverlayHint(
  layout: ArtKitLayoutMode,
  post?: Pick<SocialCopyPost, 'visualTemplateId'>,
  deviceHint?: AssetDeviceHint | null,
): string {
  if (layout !== 'mockup' && !(post && wantsProductMockupPreset(post))) {
    return LAYOUT_HINTS[layout];
  }

  const parts = [LAYOUT_HINTS.mockup];
  if (deviceHint === 'pc') {
    parts.push(LAPTOP_MOCKUP_HINT);
  } else if (deviceHint === 'ipad') {
    parts.push(TABLET_MOCKUP_HINT);
  } else if (deviceHint === 'ios') {
    parts.push(PHONE_MOCKUP_HINT);
  }
  return parts.join(' ');
}

/** Prepend kit-overlay rules so IA never draws a blank device the overlay must fight. */
export function buildKitOverlayPrompt(
  basePrompt: string,
  recipe: ArtPromptRecipe,
  post?: Pick<SocialCopyPost, 'visualTemplateId' | 'platform'>,
  deviceHint?: AssetDeviceHint | null,
  options?: { logoOverlay?: boolean },
): string {
  const layout = resolveArtKitLayout(recipe, post?.platform ?? 'instagram', post);
  const hint = resolveKitOverlayHint(layout, post, deviceHint);
  const noPeopleRule = layout === 'mockup' ? MOCKUP_BACKGROUND_RULE : '';
  const logoRule = options?.logoOverlay ? LOGO_OVERLAY_RULE : '';
  const brief = stripDeviceDrawingLanguage(basePrompt.trim());
  return [
    KIT_OVERLAY_BASE,
    hint,
    noPeopleRule,
    logoRule,
    `Creative brief for the BACKGROUND ONLY (ignore any instruction to draw devices, screens, UI, or mockups): ${brief}.`,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Resolve compositing layout from recipe family or explicit kitLayout. */
export function resolveArtKitLayout(
  recipe: ArtPromptRecipe,
  _platform: string,
  post?: Pick<SocialCopyPost, 'visualTemplateId'>,
): ArtKitLayoutMode {
  if (post && wantsProductMockupPreset(post)) {
    return 'mockup';
  }

  if (recipe.kitLayout) {
    return recipe.kitLayout;
  }

  const family = recipe.family.toLowerCase();
  if (family.includes('product-hero') || family.startsWith('poster') || family.includes('carousel-dtc')) {
    return 'mockup';
  }
  if (family.includes('infographic') || family.includes('saas-dashboard')) {
    return 'center-panel';
  }
  return 'split-bottom';
}

async function compositeMockupLayout(
  canvas: Buffer,
  photoBuffer: Buffer,
  width: number,
  height: number,
  platform: string,
  device?: AssetDeviceHint | null,
): Promise<Buffer> {
  const size = `${width}x${height}` as ImageGenerationSize;
  const aspectRatio = resolveVisualAspectRatio(size);
  const frameType = resolveDeviceFrameType(platform, aspectRatio, device);
  const placement = resolveHeroDevicePlacement(width, height, frameType, aspectRatio);
  const { left, top } = placement;

  const deviceFrame = await renderDeviceFrame(photoBuffer, placement);
  const shadow = await buildDeviceShadow(placement.frameWidth, placement.frameHeight, 24);
  const shadowLeft = left;

  return sharp(canvas)
    .composite([
      { input: shadow, top: top + 8, left: shadowLeft + 4 },
      { input: deviceFrame, top, left: shadowLeft },
    ])
    .png()
    .toBuffer();
}

async function compositeCenterPanelLayout(
  canvas: Buffer,
  photoBuffer: Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  const panelW = Math.round(width * 0.74);
  const panelH = Math.round(height * 0.46);
  const left = Math.round((width - panelW) / 2);
  const top = Math.round(height * 0.27);
  const inset = 12;

  const photo = await resizeScreenshotContain(
    photoBuffer,
    panelW - inset * 2,
    panelH - inset * 2,
    DEVICE_SCREEN_BACKGROUND,
  );

  const panelSvg = Buffer.from(
    `<svg width="${panelW}" height="${panelH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${panelW}" height="${panelH}" rx="16" ry="16" fill="rgba(255,255,255,0.94)"/>
      <rect x="1" y="1" width="${panelW - 2}" height="${panelH - 2}" rx="15" ry="15" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="2"/>
    </svg>`,
  );

  const photoMeta = await sharp(photo).metadata();
  const photoW = photoMeta.width ?? panelW - inset * 2;
  const photoH = photoMeta.height ?? panelH - inset * 2;
  const photoLeft = left + Math.round((panelW - photoW) / 2);
  const photoTop = top + Math.round((panelH - photoH) / 2);

  return sharp(canvas)
    .composite([
      { input: panelSvg, top, left },
      { input: photo, top: photoTop, left: photoLeft },
    ])
    .png()
    .toBuffer();
}

async function compositeSplitBottomLayout(
  canvas: Buffer,
  photoBuffer: Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  const photoH = Math.round(height * 0.4);
  const photoTop = height - photoH;
  const photo = await resizeScreenshotCover(photoBuffer, width, photoH);

  const fadeH = Math.min(48, Math.round(photoH * 0.15));
  const fadeSvg = Buffer.from(
    `<svg width="${width}" height="${fadeH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="black" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.35"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${fadeH}" fill="url(#fade)"/>
    </svg>`,
  );

  return sharp(canvas)
    .composite([
      { input: photo, top: photoTop, left: 0 },
      { input: fadeSvg, top: photoTop - fadeH, left: 0 },
    ])
    .png()
    .toBuffer();
}

/** Composite a real kit screenshot on top of an IA-generated art background. */
export async function compositeKitOnArtBackground(
  artBuffer: Buffer,
  photoBuffer: Buffer,
  layout: ArtKitLayoutMode,
  size: ImageGenerationSize,
  platform: string,
  device?: AssetDeviceHint | null,
  visualTemplateId?: string | null,
): Promise<Buffer> {
  const captureSize = await readCaptureImageSize(photoBuffer);
  const effectiveDevice = resolveMockupDeviceHint(device, captureSize);
  const effectiveLayout =
    visualTemplateId && wantsProductMockupPreset({ visualTemplateId }) ? 'mockup' : layout;
  const { width, height } = parseImageSize(size);
  const canvas = await sharp(artBuffer)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  if (effectiveLayout === 'mockup') {
    return compositeMockupLayout(canvas, photoBuffer, width, height, platform, effectiveDevice);
  }
  if (effectiveLayout === 'center-panel') {
    return compositeCenterPanelLayout(canvas, photoBuffer, width, height);
  }
  return compositeSplitBottomLayout(canvas, photoBuffer, width, height);
}
