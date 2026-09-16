import { validateVisualTemplateText } from './visual-template-text.util';

const LONG_HEADLINE = 'Digitaliza tu consultorio en 3 pasos';
const LONG_SUBLINE =
  'Una frase muy larga que supera el límite recomendado de palabras para subtítulos en piezas visuales del producto';

describe('visual-template-text.util', () => {
  it('skips typographic truncation checks for creative-scene preset', () => {
    const warnings = validateVisualTemplateText({
      templateId: 'creative-scene',
      headline: LONG_HEADLINE,
      subline: 'Con Oraltrack, todo es más simple',
      cta: 'Prueba gratis',
    });

    expect(warnings).toEqual([]);
  });

  it('skips typographic truncation checks for automatic preset', () => {
    const warnings = validateVisualTemplateText({
      templateId: null,
      headline: LONG_HEADLINE,
    });

    expect(warnings.some((warning) => warning.kind === 'truncation')).toBe(false);
  });

  it('warns about truncation on typographic templates only', () => {
    const warnings = validateVisualTemplateText({
      templateId: 'tip-card',
      headline: LONG_HEADLINE,
    });

    expect(warnings).toEqual([
      {
        field: 'headline',
        kind: 'truncation',
        message: 'El titular ocupará más de 2 líneas y puede truncarse en la plantilla.',
      },
    ]);
  });

  it('keeps soft recommendations for long sublines on creative-scene', () => {
    const warnings = validateVisualTemplateText({
      templateId: 'creative-scene',
      subline: LONG_SUBLINE,
    });

    expect(warnings).toEqual([
      {
        field: 'subline',
        kind: 'recommendation',
        message: 'Subtítulo recomendado: máx. 14 palabras.',
      },
    ]);
  });

  it('validates all typographic template ids consistently', () => {
    for (const templateId of [
      'product-hero',
      'tip-card',
      'quote-insight',
      'promo-cta',
      'stat-highlight',
      'story-vertical',
    ]) {
      const warnings = validateVisualTemplateText({
        templateId,
        headline: LONG_HEADLINE,
      });
      expect(warnings.some((warning) => warning.kind === 'truncation')).toBe(true);
    }
  });
});
