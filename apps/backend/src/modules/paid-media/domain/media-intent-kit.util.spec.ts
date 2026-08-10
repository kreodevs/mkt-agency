import type { MediaCampaignIntentEntity } from '../infrastructure/typeorm/media-campaign-intent.entity';
import { buildMediaIntentKitMarkdown } from './media-intent-kit.util';

describe('buildMediaIntentKitMarkdown', () => {
  const baseIntent = {
    id: 'intent-1',
    tenantId: 'tenant-1',
    planId: null,
    creativePackId: null,
    productId: null,
    platform: 'meta',
    name: 'Intent meta — plan abc',
    structure: {
      adSets: [
        {
          name: 'Ad Set 1',
          copy: {
            headline: 'Oferta local',
            primaryText: 'Texto del anuncio',
            cta: 'Más información',
          },
        },
      ],
    },
    dailyBudget: '10.5',
    totalBudget: '300',
    status: 'pending_approval',
    requiresApproval: true,
    approvedAt: null,
    approvedBy: null,
    launchedAt: null,
    metadata: {},
    createdAt: new Date('2026-08-10T12:00:00.000Z'),
    updatedAt: new Date('2026-08-10T12:00:00.000Z'),
  } satisfies MediaCampaignIntentEntity;

  it('generates markdown with budget and checklist', () => {
    const kit = buildMediaIntentKitMarkdown(baseIntent);

    expect(kit.filename).toBe('kit-pauta-meta-2026-08-10.md');
    expect(kit.markdown).toContain('Oferta local');
    expect(kit.markdown).toContain('$10.50');
    expect(kit.checklist.length).toBeGreaterThan(3);
    expect(kit.checklist.some((item) => item.includes('lanzado manual'))).toBe(true);
  });
});
