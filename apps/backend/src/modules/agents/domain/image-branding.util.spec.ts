import {
  buildBrandedImagePrompt,
  sanitizeVisualPromptForLogoOverlay,
} from './image-branding.util';

describe('image-branding.util', () => {
  it('strips brand name from visual prompt when logo will overlay', () => {
    const input =
      'Hero product visual for OralTrack: patient dashboard. Bold OralTrack wordmark top left.';
    const sanitized = sanitizeVisualPromptForLogoOverlay(input, 'OralTrack');

    expect(sanitized).not.toMatch(/oraltrack/i);
    expect(sanitized).toContain('la marca');
  });

  it('does not ask IA to render brand name when hasLogo is true', () => {
    const prompt = buildBrandedImagePrompt({
      productName: 'OralTrack',
      visualDescription: 'Hero visual for OralTrack with glowing title',
      hasLogo: true,
    });

    expect(prompt).toContain('NO escribas el nombre de la marca');
    expect(prompt).toContain('se superpone después por software');
    expect(prompt).not.toContain('incluye el nombre de forma legible');
    expect(prompt).not.toMatch(/Hero visual for OralTrack/i);
  });

  it('allows brand name in image when there is no logo asset', () => {
    const prompt = buildBrandedImagePrompt({
      productName: 'OralTrack',
      visualDescription: 'Hero visual',
      hasLogo: false,
    });

    expect(prompt).toContain('incluye el nombre de forma legible');
  });
});
