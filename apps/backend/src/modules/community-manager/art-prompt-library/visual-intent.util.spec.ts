import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import {
  resolveVisualIntent,
  shouldUseArtKitCompose,
  shouldUseArtPromptLibrary,
} from './visual-intent.util';

function basePost(overrides: Partial<SocialCopyPost> = {}): SocialCopyPost {
  return {
    id: 'post-1',
    platform: 'instagram',
    title: 'Test',
    body: 'Body',
    hashtags: [],
    visualDescription: 'Visual brief',
    visualFormat: 'image',
    bestTime: '',
    targetAudience: '',
    callToAction: 'Ver más',
    tone: '',
    ...overrides,
  };
}

const kitWithScreenshots = [{ assetId: 'a1', role: 'product-screenshot' }] as any;

describe('visual-intent.util', () => {
  it('maps ai-art preset to preferLayout ai-art', () => {
    const intent = resolveVisualIntent(basePost({ visualTemplateId: 'ai-art' }));
    expect(intent.preferLayout).toBe('ai-art');
  });

  it('allows art prompt library with media kit when ai-art preset is set', () => {
    expect(
      shouldUseArtPromptLibrary(
        basePost({ visualTemplateId: 'ai-art', visualDescription: 'Infografía' }),
        kitWithScreenshots,
      ),
    ).toBe(true);
  });

  it('skips art-kit compose for ai-art preset even with media kit', () => {
    expect(
      shouldUseArtKitCompose(
        basePost({ visualTemplateId: 'ai-art' }),
        kitWithScreenshots,
      ),
    ).toBe(false);
  });
});
