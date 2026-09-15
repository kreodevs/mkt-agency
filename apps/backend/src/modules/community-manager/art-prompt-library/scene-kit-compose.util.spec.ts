import { SCENE_PROMPT_RECIPES } from './scene-recipes.data';
import {
  buildScenePromptWithReference,
  resolveSceneScreenRegion,
  sceneRecipeRequiresKitScreen,
  shouldCompositeKitScreenIntoScene,
} from './scene-kit-compose.util';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';

function basePost(overrides: Partial<SocialCopyPost> = {}): SocialCopyPost {
  return {
    id: 'post-1',
    platform: 'instagram',
    title: 'Test',
    body: 'Body',
    hashtags: [],
    visualDescription: '',
    visualFormat: 'image',
    bestTime: '10:00',
    targetAudience: 'SMB',
    callToAction: 'Probar',
    tone: 'profesional',
    ...overrides,
  } as SocialCopyPost;
}

describe('scene-kit-compose.util', () => {
  it('appends CM identity suffix when reference portrait is used', () => {
    const result = buildScenePromptWithReference('Premium office scene', true);
    expect(result).toContain('Premium office scene');
    expect(result).toContain('reference portrait');
  });

  it('leaves prompt unchanged without reference', () => {
    expect(buildScenePromptWithReference('Scene only', false)).toBe('Scene only');
  });

  it('returns null region for abstract scenes', () => {
    expect(resolveSceneScreenRegion('none', 1080, 1920)).toBeNull();
  });

  it('does not composite kit on lifestyle clinical recipe by default', () => {
    const recipe = SCENE_PROMPT_RECIPES.find((r) => r.id === 'scene-cm-clinical-dental');
    expect(recipe).toBeDefined();
    expect(sceneRecipeRequiresKitScreen(recipe!)).toBe(false);
    expect(
      shouldCompositeKitScreenIntoScene(
        basePost({ visualTemplateId: 'creative-scene' }),
        recipe!,
      ),
    ).toBe(false);
  });

  it('composites kit only for explicit product showcase posts', () => {
    const recipe = {
      ...SCENE_PROMPT_RECIPES[0],
      requiresKitScreen: true,
      screenLayout: 'phone-hand' as const,
    };
    expect(
      shouldCompositeKitScreenIntoScene(basePost({ visualTemplateId: 'product-hero' }), recipe),
    ).toBe(true);
    expect(
      shouldCompositeKitScreenIntoScene(basePost({ visualTemplateId: 'creative-scene' }), recipe),
    ).toBe(false);
  });
});
