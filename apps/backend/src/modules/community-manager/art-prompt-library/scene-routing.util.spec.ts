import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import {
  inferSceneFromIndustry,
  prefersRigidTemplate,
  resolveEffectiveScene,
  shouldSkipTemplateForCreativeScene,
  shouldUseCreativeScene,
  wantsProductScreenShowcase,
  wouldUseRigidStoryTemplate,
} from './scene-routing.util';

function basePost(overrides: Partial<SocialCopyPost> = {}): SocialCopyPost {
  return {
    id: 'post-1',
    platform: 'instagram',
    title: 'Test post',
    body: 'Body copy',
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

const kitWithScreenshots = [{ assetId: 'a1', role: 'product-screenshot' }] as any;

describe('scene-routing.util', () => {
  it('infers clinical scene from dental industry', () => {
    expect(inferSceneFromIndustry('Software dental OralTrack')).toBe('clinical');
  });

  it('infers workspace scene from SaaS industry', () => {
    expect(inferSceneFromIndustry('SaaS B2B')).toBe('workspace');
  });

  it('resolves hand-phone for TikTok stories', () => {
    const post = basePost({ platform: 'tiktok', imageDestination: 'story' });
    expect(resolveEffectiveScene(post, 'general')).toBe('hand-phone');
  });

  it('uses explicit visualIntent.scene when set', () => {
    const post = basePost({
      visualIntent: { scene: 'abstract-premium' },
    });
    expect(resolveEffectiveScene(post, 'saas')).toBe('abstract-premium');
  });

  it('detects rigid story-vertical template candidates', () => {
    expect(
      wouldUseRigidStoryTemplate(basePost({ visualTemplateId: 'story-vertical' })),
    ).toBe(true);
    expect(wouldUseRigidStoryTemplate(basePost({ platform: 'tiktok' }))).toBe(true);
    expect(wouldUseRigidStoryTemplate(basePost({ visualFormat: 'talking-head' }))).toBe(false);
  });

  it('routes stories with media kit to creative scene by default', () => {
    const post = basePost({
      platform: 'instagram',
      imageDestination: 'story',
      visualTemplateId: 'story-vertical',
    });
    expect(shouldUseCreativeScene(post, kitWithScreenshots, { postIndex: 0 })).toBe(true);
  });

  it('routes Twitter product-hero to art-kit showcase, not creative scene', () => {
    const post = basePost({
      platform: 'twitter',
      visualTemplateId: 'product-hero',
    });
    expect(wantsProductScreenShowcase(post)).toBe(true);
    expect(shouldUseCreativeScene(post, kitWithScreenshots, { postIndex: 1 })).toBe(false);
  });

  it('routes creative-scene preset to lifestyle without showcase', () => {
    const post = basePost({
      platform: 'twitter',
      visualTemplateId: 'creative-scene',
    });
    expect(wantsProductScreenShowcase(post)).toBe(false);
    expect(shouldUseCreativeScene(post, kitWithScreenshots, { postIndex: 1 })).toBe(true);
    expect(shouldSkipTemplateForCreativeScene(post, kitWithScreenshots, { postIndex: 1 })).toBe(
      true,
    );
  });

  it('uses persisted visualScene for effective scene routing', () => {
    const post = basePost({
      visualTemplateId: 'creative-scene',
      visualScene: 'clinical',
    });
    expect(resolveEffectiveScene(post, 'saas')).toBe('clinical');
  });

  it('blocks showcase and creative scene for ai-art preset', () => {
    const post = basePost({
      visualTemplateId: 'ai-art',
      visualDescription: 'Infografía abstracta',
    });
    expect(wantsProductScreenShowcase(post)).toBe(false);
    expect(shouldUseCreativeScene(post, kitWithScreenshots)).toBe(false);
  });

  it('skips creative scene for rigid stat-highlight template', () => {
    const post = basePost({
      visualTemplateId: 'stat-highlight',
      visualIntent: { preferLayout: 'template' },
    });
    expect(prefersRigidTemplate(post)).toBe(true);
    expect(shouldUseCreativeScene(post, kitWithScreenshots)).toBe(false);
  });

  it('skips creative scene for carousel format', () => {
    const post = basePost({ visualFormat: 'carousel' });
    expect(shouldUseCreativeScene(post, kitWithScreenshots)).toBe(false);
  });

  it('uses creative scene for image posts with kit when not showcasing product UI', () => {
    const post = basePost({
      platform: 'twitter',
    });
    expect(shouldUseCreativeScene(post, kitWithScreenshots, { postIndex: 0 })).toBe(true);
    expect(shouldUseCreativeScene(post, kitWithScreenshots, { postIndex: 1 })).toBe(true);
  });
});
