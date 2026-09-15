import { ART_PROMPT_RECIPES } from './art-prompt-recipes.data';
import {
  buildKitOverlayPrompt,
  resolveArtKitLayout,
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

  it('marks overlay-capable recipes in catalog', () => {
    const overlayIds = ART_PROMPT_RECIPES.filter((r) => r.supportsMediaKitOverlay).map(
      (r) => r.id,
    );
    expect(overlayIds.length).toBeGreaterThanOrEqual(10);
    expect(overlayIds).toContain('product-hero-json-050');
    expect(overlayIds).toContain('infographic-technical-001');
  });
});
