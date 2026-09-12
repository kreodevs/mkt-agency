import {
  darkenHex,
  expandVisualPalette,
  lightenHex,
  mixHex,
  resolvePanelColor,
} from './visual-palette-expand.util';
import type { ResolvedVisualBrandKit } from './visual-brand-kit.util';

const kit: ResolvedVisualBrandKit = {
  style: 'bold',
  primaryColor: '#0d9488',
  secondaryColor: '#0f172a',
  accentColor: '#99f6e4',
  productName: 'Oraltrack',
  logoAssetId: null,
};

describe('visual-palette-expand.util', () => {
  it('derives lighter and darker variants from brand colors', () => {
    const palette = expandVisualPalette(kit);
    expect(palette.primary).toBe('#0d9488');
    expect(palette.primaryLight).not.toBe(palette.primary);
    expect(palette.primaryDark).not.toBe(palette.primary);
    expect(palette.glow).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('mixes colors predictably', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(lightenHex('#000000', 1)).toBe('#ffffff');
    expect(darkenHex('#ffffff', 1)).toBe('#000000');
  });

  it('varies panel tone across carousel slides', () => {
    const cover = resolvePanelColor(kit, 0, 3);
    const step = resolvePanelColor(kit, 1, 3);
    const cta = resolvePanelColor(kit, 2, 3);
    expect(cover).not.toBe(step);
    expect(step).not.toBe(cta);
  });
});
