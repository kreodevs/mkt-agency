import { buildPublishUtmQuery, buildPublishUtmTags } from './publish-utm.util';

describe('publish-utm.util', () => {
  it('builds tags from platform and content', () => {
    const tags = buildPublishUtmTags({
      tenantId: 'tenant-1',
      productId: '550e8400-e29b-41d4-a716-446655440000',
      contentId: 'content-abc',
      platform: 'instagram',
      campaignId: '660e8400-e29b-41d4-a716-446655440001',
    });

    expect(tags).toEqual({
      source: 'instagram',
      medium: 'social',
      campaign: '660e8400',
      content: 'content-abc',
    });
  });

  it('serializes query string for n8n', () => {
    const query = buildPublishUtmQuery({
      source: 'instagram',
      medium: 'social',
      campaign: 'lanzamiento',
      content: 'post-1',
    });

    expect(query).toContain('utm_source=instagram');
    expect(query).toContain('utm_content=post-1');
  });
});
