import sharp from '@/shared/media/sharp.util';
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

describe('visual-template-render.util', () => {
  describe('resolveVisualLayoutMode', () => {
    it('uses split layout for product-hero with screenshot', () => {
      expect(resolveVisualLayoutMode('product-hero', 0, 1, true)).toBe('split-screenshot-top');
    });

    it('varies carousel slides: hook, feature, cta', () => {
      expect(resolveVisualLayoutMode('tip-card', 0, 3, true)).toBe('gradient-hook');
      expect(resolveVisualLayoutMode('tip-card', 1, 3, true)).toBe('split-screenshot-top');
      expect(resolveVisualLayoutMode('tip-card', 2, 3, true)).toBe('cta-solid');
    });

    it('falls back to gradient when there is no photo', () => {
      expect(resolveVisualLayoutMode('product-hero', 0, 1, false)).toBe('gradient-only');
    });

    it('uses device mockup for promo posts with screenshot', () => {
      expect(resolveVisualLayoutMode('promo-cta', 0, 1, true)).toBe('device-mockup');
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
