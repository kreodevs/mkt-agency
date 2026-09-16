import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import { resolvePostVisualScene, resolveStoredVisualScene } from './visual-scene.util';

function basePost(overrides: Partial<SocialCopyPost> = {}): SocialCopyPost {
  return {
    id: 'post-1',
    platform: 'instagram',
    title: 'Test',
    body: 'Body',
    hashtags: [],
    visualDescription: 'Scene',
    visualFormat: 'image',
    bestTime: '',
    targetAudience: '',
    callToAction: 'Ver más',
    tone: '',
    ...overrides,
  };
}

describe('visual-scene.util', () => {
  it('prefers persisted visualScene over visualIntent', () => {
    expect(
      resolvePostVisualScene(
        basePost({
          visualScene: 'clinical',
          visualIntent: { scene: 'workspace' },
        }),
      ),
    ).toBe('clinical');
  });

  it('falls back to visualIntent.scene when no persisted scene', () => {
    expect(
      resolvePostVisualScene(
        basePost({
          visualIntent: { scene: 'hand-phone' },
        }),
      ),
    ).toBe('hand-phone');
  });

  it('stores explicit scenes from CM batch', () => {
    expect(
      resolveStoredVisualScene(
        basePost({
          visualIntent: { scene: 'abstract-premium' },
        }),
      ),
    ).toBe('abstract-premium');
  });
});
