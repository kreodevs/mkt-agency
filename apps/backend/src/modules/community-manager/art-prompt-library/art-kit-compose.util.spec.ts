import { ART_PROMPT_RECIPES } from './art-prompt-recipes.data';
import {
  buildKitOverlayPrompt,
  resolveArtKitLayout,
  stripDeviceDrawingLanguage,
  wantsProductMockupPreset,
} from './art-kit-compose.util';
import type { ArtPromptRecipe } from './art-prompt.types';

function recipeById(id: string): ArtPromptRecipe {
  const recipe = ART_PROMPT_RECIPES.find((entry) => entry.id === id);
  if (!recipe) {
    throw new Error(`Missing recipe ${id}`);
  }
  return recipe;
}

describe('art-kit-compose.util', () => {
  it('appends kit overlay instructions to base prompt', () => {
    const recipe = recipeById('product-hero-json-050');
    const result = buildKitOverlayPrompt('Hero visual for SaaS app', recipe);

    expect(result).toContain('Hero visual for SaaS app');
    expect(result).toContain('Do NOT generate fake UI');
    expect(result).toContain('mockup overlay');
    expect(result).toContain('Forbidden objects');
    expect(result).not.toMatch(/shaped like a modern smartphone/i);
    expect(result).not.toMatch(/phone silhouette/i);
  });

  it('adds logo-only rule when logo will be composited', () => {
    const recipe = recipeById('product-hero-json-050');
    const result = buildKitOverlayPrompt('Hero visual', recipe, undefined, null, {
      logoOverlay: true,
    });

    expect(result).toContain('official brand logo is added later');
    expect(result).toContain('Do NOT render the brand name');
  });

  it('uses center-panel hint for infographic recipes', () => {
    const recipe = recipeById('infographic-technical-001');
    const result = buildKitOverlayPrompt('Technical diagram', recipe);

    expect(result).toContain('centered rectangular panel');
  });

  it('uses split-bottom hint for flatlay recipes', () => {
    const recipe = recipeById('flatlay-instagram-051');
    const result = buildKitOverlayPrompt('Flatlay scene', recipe);

    expect(result).toContain('bottom 40%');
  });

  it('resolves mockup layout for product-hero family', () => {
    const recipe = recipeById('product-hero-json-050');
    expect(resolveArtKitLayout(recipe, 'instagram')).toBe('mockup');
  });

  it('resolves center-panel layout for infographic family', () => {
    const recipe = recipeById('infographic-educational-012');
    expect(resolveArtKitLayout(recipe, 'linkedin')).toBe('center-panel');
  });

  it('respects explicit kitLayout on recipe', () => {
    const recipe: ArtPromptRecipe = {
      ...recipeById('poster-editorial-475'),
      kitLayout: 'mockup',
      family: 'custom-family',
    };
    expect(resolveArtKitLayout(recipe, 'instagram')).toBe('mockup');
  });

  it('defaults to split-bottom for unknown families', () => {
    const recipe: ArtPromptRecipe = {
      ...recipeById('luxury-gradient-105'),
      kitLayout: undefined,
      family: 'unknown-family',
    };
    expect(resolveArtKitLayout(recipe, 'instagram')).toBe('split-bottom');
  });

  it('forces mockup layout for product-hero preset with device-specific IA hints', () => {
    const recipe = recipeById('infographic-educational-012');
    const post = { visualTemplateId: 'product-hero', platform: 'twitter' as const };

    expect(wantsProductMockupPreset(post)).toBe(true);
    expect(resolveArtKitLayout(recipe, 'twitter', post)).toBe('mockup');
    expect(buildKitOverlayPrompt('Hero', recipe, post, 'ios')).toContain('vertical iPhone');
    expect(buildKitOverlayPrompt('Hero', recipe, post, 'ios')).not.toMatch(
      /shaped like a modern smartphone/i,
    );
    expect(buildKitOverlayPrompt('Hero', recipe, post, 'pc')).toContain('laptop');
    expect(buildKitOverlayPrompt('Hero', recipe, post, 'pc')).not.toContain(
      'centered rectangular panel',
    );
  });

  it('strips device-drawing language from the creative brief', () => {
    expect(stripDeviceDrawingLanguage('Centered product mockup of the app')).toBe(
      'abstract brand atmosphere of the app',
    );
    const recipe = recipeById('product-hero-json-050');
    const post = { visualTemplateId: 'product-hero', platform: 'twitter' as const };
    const result = buildKitOverlayPrompt('Centered product mockup of the app', recipe, post, 'ios');
    expect(result).not.toMatch(/Centered product mockup/i);
    expect(result).toContain('BACKGROUND ONLY');
  });

  it('marks overlay-capable recipes in catalog', () => {
    const overlayIds = ART_PROMPT_RECIPES.filter((r) => r.supportsMediaKitOverlay).map(
      (r) => r.id,
    );
    expect(overlayIds.length).toBeGreaterThanOrEqual(10);
    expect(overlayIds).toContain('product-hero-json-050');
    expect(overlayIds).toContain('infographic-technical-001');
  });
});
