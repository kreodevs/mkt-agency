import sharp from '@/shared/media/sharp.util';
import type { ImageGenerationSize } from '../../../shared/social/image-generation-size.util';
import {
  DEVICE_SCREEN_BACKGROUND,
  resizeScreenshotContain,
} from '../domain/screenshot-crop.util';
import { parseImageSize } from '../domain/visual-template-render.util';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { ScenePromptRecipe, SceneScreenLayout, SceneScreenRegion } from './art-prompt.types';
import { wantsProductScreenShowcase } from './scene-routing.util';

/** Normalized screen regions (0–1) per device layout for inpainting kit screenshots. */
const SCREEN_LAYOUT_REGIONS: Record<
  Exclude<SceneScreenLayout, 'none'>,
  { left: number; top: number; width: number; height: number; borderRadius?: number }
> = {
  laptop: { left: 0.22, top: 0.38, width: 0.56, height: 0.28, borderRadius: 8 },
  'phone-hand': { left: 0.35, top: 0.28, width: 0.3, height: 0.52, borderRadius: 24 },
  'phone-table': { left: 0.3, top: 0.32, width: 0.4, height: 0.48, borderRadius: 20 },
};

const CM_IDENTITY_SUFFIX =
  'IMPORTANT: The presenter must match the facial identity of the reference portrait image. ' +
  'Same person, professional appearance, photorealistic.';

/** Append CM identity instructions when a portrait reference is used. */
export function buildScenePromptWithReference(basePrompt: string, useReference: boolean): string {
  if (!useReference) return basePrompt.trim();
  return `${basePrompt.trim()}. ${CM_IDENTITY_SUFFIX}`;
}

export function resolveSceneScreenRegion(
  layout: SceneScreenLayout,
  width: number,
  height: number,
): SceneScreenRegion | null {
  if (layout === 'none') return null;
  const normalized = SCREEN_LAYOUT_REGIONS[layout];
  return {
    left: Math.round(normalized.left * width),
    top: Math.round(normalized.top * height),
    width: Math.round(normalized.width * width),
    height: Math.round(normalized.height * height),
    borderRadius: normalized.borderRadius,
  };
}

async function roundedMask(
  width: number,
  height: number,
  borderRadius: number,
): Promise<Buffer> {
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="${borderRadius}" ry="${borderRadius}" fill="white"/>
    </svg>`,
  );
  return sharp(svg).png().toBuffer();
}

/**
 * Composite a real media-kit screenshot into the device screen region of an IA-generated scene.
 */
export async function compositeScreenIntoScene(
  sceneBuffer: Buffer,
  screenshotBuffer: Buffer,
  layout: SceneScreenLayout,
  size: ImageGenerationSize,
): Promise<Buffer> {
  const { width, height } = parseImageSize(size);
  const region = resolveSceneScreenRegion(layout, width, height);
  if (!region) {
    return sharp(sceneBuffer).resize(width, height, { fit: 'cover' }).png().toBuffer();
  }

  const canvas = await sharp(sceneBuffer)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  const inset = Math.max(4, Math.round(Math.min(region.width, region.height) * 0.04));
  const innerW = region.width - inset * 2;
  const innerH = region.height - inset * 2;

  let screen = await resizeScreenshotContain(
    screenshotBuffer,
    innerW,
    innerH,
    DEVICE_SCREEN_BACKGROUND,
  );

  if (region.borderRadius && region.borderRadius > 0) {
    const meta = await sharp(screen).metadata();
    const sw = meta.width ?? innerW;
    const sh = meta.height ?? innerH;
    const mask = await roundedMask(sw, sh, Math.min(region.borderRadius, sw / 4));
    screen = await sharp(screen)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
  }

  const screenMeta = await sharp(screen).metadata();
  const screenW = screenMeta.width ?? innerW;
  const screenH = screenMeta.height ?? innerH;
  const left = region.left + Math.round((region.width - screenW) / 2);
  const top = region.top + Math.round((region.height - screenH) / 2);

  return sharp(canvas)
    .composite([{ input: screen, top, left }])
    .png()
    .toBuffer();
}

export function sceneRecipeRequiresKitScreen(recipe: ScenePromptRecipe): boolean {
  return recipe.requiresKitScreen && recipe.screenLayout !== 'none';
}

/**
 * Screen inpainting uses fixed regions and only works with art-kit mockup geometry.
 * Lifestyle scene-kit posts skip kit overlay unless explicitly a product showcase post.
 */
export function shouldCompositeKitScreenIntoScene(
  post: SocialCopyPost,
  recipe: ScenePromptRecipe,
): boolean {
  if (!sceneRecipeRequiresKitScreen(recipe)) {
    return false;
  }
  return wantsProductScreenShowcase(post);
}
