import sharp from '@/shared/media/sharp.util';
import { compositeVisualTextOverlay } from './visual-text-overlay.util';

describe('visual-text-overlay.util', () => {
  let blankCanvas: Buffer;

  beforeAll(async () => {
    blankCanvas = await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 240, g: 240, b: 240, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  });

  it('returns untouched canvas if headline is empty', async () => {
    const res = await compositeVisualTextOverlay(blankCanvas, {
      headline: '',
      size: '1024x1024',
    });
    expect(res).toBe(blankCanvas);
  });

  it('composites headline, subline and cta over canvas buffer', async () => {
    const res = await compositeVisualTextOverlay(blankCanvas, {
      headline: 'Tu consultorio más organizado',
      subline: 'Oraltrack, la herramienta que necesitas',
      cta: 'Prueba gratis',
      brandKit: {
        style: 'minimal',
        primaryColor: '#0ea5e9',
        secondaryColor: '#0369a1',
        accentColor: '#38bdf8',
        fontFamily: 'Inter',
        productName: 'OralTrack',
        logoAssetId: null,
      },
      size: '1024x1024',
    });

    expect(Buffer.isBuffer(res)).toBe(true);
    const meta = await sharp(res).metadata();
    expect(meta.width).toBe(1024);
    expect(meta.height).toBe(1024);
    expect(meta.format).toBe('png');
  });

  it('handles multi-line headlines and missing optional fields cleanly', async () => {
    const res = await compositeVisualTextOverlay(blankCanvas, {
      headline: '¿Cuántas citas no confirmadas te costaron ingresos esta semana en tu clínica dental?',
      size: '1024x1024',
    });

    expect(Buffer.isBuffer(res)).toBe(true);
    const meta = await sharp(res).metadata();
    expect(meta.width).toBe(1024);
  });

  it('adapts to real canvas resolution (1920x1920) even when size parameter defaults to 1024', async () => {
    const largeCanvas = await sharp({
      create: {
        width: 1920,
        height: 1920,
        channels: 4,
        background: { r: 200, g: 200, b: 200, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const res = await compositeVisualTextOverlay(largeCanvas, {
      headline: '¿Un solo fotógrafo?',
      subline: 'QR + WhatsApp + IA = Álbum',
      cta: 'Descubre',
      size: '1024x1024',
    });

    const meta = await sharp(res).metadata();
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1920);
  });
});
