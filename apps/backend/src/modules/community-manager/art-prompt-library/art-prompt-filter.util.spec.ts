import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import { ART_PROMPT_RECIPES } from './art-prompt-recipes.data';
import { filterArtPromptCandidates } from './art-prompt-filter.util';

function basePost(overrides: Partial<SocialCopyPost> = {}): SocialCopyPost {
  return {
    id: 'post-1',
    platform: 'instagram',
    title: 'Test post',
    body: 'Body copy for testing.',
    hashtags: ['test'],
    visualDescription: 'Modern SaaS dashboard abstract visualization',
    visualFormat: 'image',
    bestTime: '09:00',
    targetAudience: 'Founders',
    callToAction: 'Prueba gratis',
    tone: 'profesional',
    ...overrides,
  };
}

describe('art-prompt-filter.util', () => {
  it('returns candidates matching platform and format', () => {
    const candidates = filterArtPromptCandidates(ART_PROMPT_RECIPES, {
      post: basePost({ platform: 'linkedin' }),
      industry: 'saas',
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((c) => c.platforms.includes('linkedin'))).toBe(true);
  });

  it('penalizes recently used recipe ids', () => {
    const post = basePost({ platform: 'instagram', visualFormat: 'carousel' });
    const withoutRecent = filterArtPromptCandidates(ART_PROMPT_RECIPES, {
      post,
      industry: 'saas',
    });
    const topId = withoutRecent[0]?.id;
    expect(topId).toBeDefined();

    const withRecent = filterArtPromptCandidates(ART_PROMPT_RECIPES, {
      post,
      industry: 'saas',
      recentRecipeIds: [topId!],
    });

    expect(withRecent[0]?.id).not.toBe(topId);
  });

  it('prefers vertical recipes for tiktok', () => {
    const candidates = filterArtPromptCandidates(ART_PROMPT_RECIPES, {
      post: basePost({ platform: 'tiktok', imageDestination: 'story' }),
      industry: 'general',
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.some((c) => c.formats.includes('9:16'))).toBe(true);
  });

  it('boosts infographic intents for carousel educational posts', () => {
    const candidates = filterArtPromptCandidates(ART_PROMPT_RECIPES, {
      post: basePost({
        visualFormat: 'carousel',
        visualIntent: {
          goal: 'educar',
          preferLayout: 'ai-art',
          carouselStructure: 'step-by-step',
        },
      }),
      industry: 'saas',
      visualIntent: {
        goal: 'educar',
        preferLayout: 'ai-art',
        carouselStructure: 'step-by-step',
      },
    });

    expect(candidates.some((c) => c.intents.includes('educate') || c.intents.includes('tips'))).toBe(
      true,
    );
  });
});
