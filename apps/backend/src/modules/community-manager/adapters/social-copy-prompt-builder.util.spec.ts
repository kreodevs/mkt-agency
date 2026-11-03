import { buildPrompts } from './social-copy-prompt-builder.util';
import { sampleViralHooksForPrompt, VIRAL_HOOK_FORMULAS } from './social-copy-hooks.constants';

describe('social-copy-prompt-builder', () => {
  it('contains viral hook formulas catalog of at least 50 formulas across categories', () => {
    expect(VIRAL_HOOK_FORMULAS.length).toBeGreaterThanOrEqual(50);
    const categories = new Set(VIRAL_HOOK_FORMULAS.map((h) => h.category));
    expect(categories.has('pattern_interrupt')).toBe(true);
    expect(categories.has('contrarian')).toBe(true);
    expect(categories.has('negative_warning')).toBe(true);
    expect(categories.has('insider_secret')).toBe(true);
    expect(categories.has('transformation')).toBe(true);
    expect(categories.has('direct_callout')).toBe(true);
    expect(categories.has('curiosity_gap')).toBe(true);
  });

  it('samples unique viral hooks correctly', () => {
    const hooks = sampleViralHooksForPrompt(6);
    expect(hooks.length).toBe(6);
    const unique = new Set(hooks);
    expect(unique.size).toBe(6);
  });

  it('buildPrompts embeds creative director persona and viral guidelines into system and user prompts', () => {
    const { systemPrompt, userPrompt } = buildPrompts({
      tenantId: 'tenant-test-123',
      platforms: ['instagram', 'linkedin'],
      count: 2,
    });

    expect(systemPrompt).toContain('Director Creativo y Copywriter de Respuesta Directa');
    expect(systemPrompt).toContain('detiene el scroll en los primeros 3 segundos');
    expect(systemPrompt).toContain('NUNCA inicies con saludos pasivos');

    expect(userPrompt).toContain('REGLAS DE COPYWRITING VIRAL & CONVERSIÓN');
    expect(userPrompt).toContain('SCROLL-STOPPER OBLIGATORIO');
    expect(userPrompt).toContain('PAS (Problema → Agitación → Solución)');
    expect(userPrompt).toContain('BAB (Antes → Después → Puente)');
    expect(userPrompt).toContain('OPTIMIZACIÓN ALGORÍTMICA 2026 (SEO Semántico)');
  });
});
