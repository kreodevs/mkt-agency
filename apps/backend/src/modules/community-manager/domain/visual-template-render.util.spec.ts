import sharp from '@/shared/media/sharp.util';
import {
  resolveDeviceFrameType,
  resolveVisualAspectRatio,
  renderDeviceFrame,
  resolveDevicePlacement,
} from './device-frame-render.util';
import {
  buildVisualTemplateSlots,
  parseImageSize,
  resolveVisualLayoutMode,
  renderVisualTemplateFrame,
  splitCarouselTips,
  summarizeHeadline,
} from './visual-template-render.util';
import type { ResolvedVisualBrandKit } from './visual-brand-kit.util';

async function createTestPhoto(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 96, g: 165, b: 250 },
    },
  })
    .png()
    .toBuffer();
}

const brandKit: ResolvedVisualBrandKit = {
  style: 'minimal',
  primaryColor: '#2563eb',
  secondaryColor: '#0f172a',
  accentColor: '#dbeafe',
  productName: 'Oraltrack',
  logoAssetId: null,
};

const squareContext = { aspectRatio: 'square' as const };
const verticalContext = { aspectRatio: 'vertical' as const };

describe('visual-template-render.util', () => {
  describe('resolveVisualLayoutMode', () => {
    it('uses split layout for product-hero square without mobile platform', () => {
      expect(
        resolveVisualLayoutMode('product-hero', 0, 1, true, squareContext),
      ).toBe('split-screenshot-top');
    });

    it('uses device mockup for product-hero on Instagram', () => {
      expect(
        resolveVisualLayoutMode('product-hero', 0, 1, true, {
          ...squareContext,
          platform: 'instagram',
        }),
      ).toBe('device-mockup');
    });

    it('uses device mockup for product-hero on LinkedIn', () => {
      expect(
        resolveVisualLayoutMode('product-hero', 0, 1, true, {
          ...squareContext,
          platform: 'linkedin',
        }),
      ).toBe('device-mockup');
    });

    it('varies carousel slides: hook, feature, cta', () => {
      expect(resolveVisualLayoutMode('tip-card', 0, 3, true, squareContext)).toBe('gradient-hook');
      expect(resolveVisualLayoutMode('tip-card', 1, 3, true, squareContext)).toBe(
        'split-screenshot-top',
      );
      expect(resolveVisualLayoutMode('tip-card', 2, 3, true, squareContext)).toBe('cta-solid');
    });

    it('uses device mockup on carousel middle slide for vertical', () => {
      expect(resolveVisualLayoutMode('tip-card', 1, 3, true, verticalContext)).toBe(
        'device-mockup',
      );
    });

    it('falls back to gradient when there is no photo', () => {
      expect(resolveVisualLayoutMode('product-hero', 0, 1, false)).toBe('gradient-only');
    });

    it('uses device mockup for promo posts with screenshot', () => {
      expect(resolveVisualLayoutMode('promo-cta', 0, 1, true, squareContext)).toBe(
        'device-mockup',
      );
    });
  });

  describe('device-frame-render.util', () => {
    it('detects vertical aspect ratio from size', () => {
      expect(resolveVisualAspectRatio('1440x2560')).toBe('vertical');
      expect(resolveVisualAspectRatio('1920x1920')).toBe('square');
    });

    it('picks macbook for LinkedIn and iphone for TikTok', () => {
      expect(resolveDeviceFrameType('linkedin', 'square')).toBe('macbook');
      expect(resolveDeviceFrameType('tiktok', 'vertical')).toBe('iphone');
      expect(resolveDeviceFrameType('instagram', 'square')).toBe('iphone');
    });

    it('renders iphone and macbook device frames', async () => {
      const photo = await createTestPhoto(640, 480);
      const iphonePlacement = resolveDevicePlacement(1080, 1080, 'iphone', 'square');
      const macPlacement = resolveDevicePlacement(1080, 1080, 'macbook', 'square');

      const iphone = await renderDeviceFrame(photo, iphonePlacement);
      const macbook = await renderDeviceFrame(photo, macPlacement);

      expect(iphone.length).toBeGreaterThan(500);
      expect(macbook.length).toBeGreaterThan(500);
    });
  });

  describe('text helpers', () => {
    it('parses image size', () => {
      expect(parseImageSize('1920x1920')).toEqual({ width: 1920, height: 1920 });
    });

    it('summarizes headline from title', () => {
      expect(summarizeHeadline('La nueva era de Oraltrack', 'body largo')).toBe(
        'La nueva era de Oraltrack',
      );
    });

    it('splits carousel tips from body lines', () => {
      const tips = splitCarouselTips('Primer tip\nSegundo tip\nTercer tip', 3);
      expect(tips).toHaveLength(3);
      expect(tips[0]).toContain('Primer');
    });

    it('builds slots with visual headline override', () => {
      const slots = buildVisualTemplateSlots(
        {
          title: 'Título largo',
          body: 'Cuerpo del post',
          callToAction: 'Demo gratis',
          visualHeadline: 'Hook corto',
        },
        'product-hero',
      );
      expect(slots.headline).toBe('Hook corto');
      expect(slots.cta).toBe('Demo gratis');
    });
  });

  describe('renderVisualTemplateFrame', () => {
    it('renders split layout PNG with screenshot', async () => {
      const photoBuffer = await createTestPhoto(800, 600);
      const output = await renderVisualTemplateFrame({
        templateId: 'product-hero',
        brandKit,
        slots: {
          headline: 'La nueva era de Oraltrack',
          subline: 'Gestión inteligente para dentistas',
          cta: 'Demo gratis',
        },
        size: '1024x1024',
        platform: 'facebook',
        photoBuffer,
      });

      expect(output.length).toBeGreaterThan(500);
    });

    it('renders device mockup for LinkedIn promo', async () => {
      const photoBuffer = await createTestPhoto(1200, 800);
      const output = await renderVisualTemplateFrame({
        templateId: 'promo-cta',
        brandKit,
        slots: {
          headline: 'Optimiza tu consultorio con IA',
          subline: 'Guía gratuita para la gestión dental moderna',
          cta: 'Descargar guía',
        },
        size: '1920x1920',
        platform: 'linkedin',
        photoBuffer,
      });

      expect(output.length).toBeGreaterThan(500);
    });

    it('renders vertical TikTok layout', async () => {
      const photoBuffer = await createTestPhoto(800, 1200);
      const output = await renderVisualTemplateFrame({
        templateId: 'story-vertical',
        brandKit,
        slots: {
          headline: 'Del caos al control total',
          subline: 'La transición digital que tu consultorio merece',
          cta: 'Ver Oraltrack',
        },
        size: '1440x2560',
        platform: 'tiktok',
        photoBuffer,
      });

      expect(output.length).toBeGreaterThan(500);
    });

    it('renders gradient-only without photo', async () => {
      const buffer = await renderVisualTemplateFrame({
        templateId: 'tip-card',
        brandKit,
        slots: {
          headline: 'Del caos al control',
          subline: 'La transición digital que tu consultorio merece',
          cta: 'Ver Oraltrack',
        },
        size: '1024x1024',
        slideIndex: 0,
        slideCount: 3,
      });

      expect(buffer.length).toBeGreaterThan(500);
    });
  });
});
