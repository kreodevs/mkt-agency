import { SCENE_PROMPT_RECIPES } from './scene-recipes.data';
import {
  buildScenePromptWithReference,
  resolveSceneScreenRegion,
  sceneRecipeRequiresKitScreen,
} from './scene-kit-compose.util';

describe('scene-kit-compose.util', () => {
  it('appends CM identity suffix when reference portrait is used', () => {
    const result = buildScenePromptWithReference('Premium office scene', true);
    expect(result).toContain('Premium office scene');
    expect(result).toContain('reference portrait');
  });

  it('leaves prompt unchanged without reference', () => {
    expect(buildScenePromptWithReference('Scene only', false)).toBe('Scene only');
  });

  it('resolves laptop screen region in pixels', () => {
    const region = resolveSceneScreenRegion('laptop', 1080, 1920);
    expect(region).not.toBeNull();
    expect(region!.width).toBeGreaterThan(400);
    expect(region!.top).toBeGreaterThan(500);
  });

  it('returns null region for abstract scenes', () => {
    expect(resolveSceneScreenRegion('none', 1080, 1920)).toBeNull();
  });

  it('detects kit screen requirement on workspace recipes', () => {
    const recipe = SCENE_PROMPT_RECIPES.find((r) => r.id === 'scene-cm-workspace-monitor');
    expect(recipe).toBeDefined();
    expect(sceneRecipeRequiresKitScreen(recipe!)).toBe(true);
  });

  it('skips kit screen for abstract-premium recipe', () => {
    const recipe = SCENE_PROMPT_RECIPES.find((r) => r.id === 'scene-brand-abstract-premium');
    expect(recipe).toBeDefined();
    expect(sceneRecipeRequiresKitScreen(recipe!)).toBe(false);
  });
});
