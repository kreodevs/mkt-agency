import { GenerationContextFacade } from './generation-context.facade';

describe('GenerationContextFacade', () => {
  let facade: GenerationContextFacade;

  const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
  });

  beforeEach(() => {
    facade = new GenerationContextFacade(
      mockRepo() as any, // profiles
      mockRepo() as any, // profileSections
      mockRepo() as any, // productEntities
      mockRepo() as any, // campaigns
      mockRepo() as any, // contents
      { resolveProfileValues: jest.fn() } as any, // profileSectionSync
      { findOwnedEntity: jest.fn(), findPrimary: jest.fn() } as any, // productService
      { getLatestCompletedAnalysis: jest.fn().mockResolvedValue(null) } as any, // competitorIntel
      { list: jest.fn().mockResolvedValue({ items: [] }) } as any, // competitorService
      { listEntitiesForProduct: jest.fn().mockResolvedValue([]), buildMediaKitContextForLlm: jest.fn() } as any, // mediaKitService
      { buildLibrarySummaryForLlm: jest.fn().mockResolvedValue([]) } as any, // assetFolderService
      { listReadyForLlm: jest.fn().mockResolvedValue([]), hasAnyReadyCharacter: jest.fn().mockResolvedValue(false) } as any, // cmCharacter
    );
  });

  describe('buildGenerationContext', () => {
    it('returns context with null productContext when no productId/campaignId and no primary product', async () => {
      const ctx = await facade.buildGenerationContext('tenant-1', {});
      expect(ctx.resolvedProfile).toBeNull();
      expect(ctx.productContext).toBeNull();
      expect(ctx.effectiveProductId).toBeUndefined();
      expect(ctx.kit).toEqual([]);
      expect(ctx.cmCharacters).toEqual([]);
      expect(ctx.cmCharacterReady).toBe(false);
    });

    it('uses productId directly when provided', async () => {
      const fakeProduct = { id: 'prod-1', name: 'Test Product', metadata: {} };
      ((facade as any).productService.findOwnedEntity as jest.Mock).mockResolvedValue(fakeProduct);

      const ctx = await facade.buildGenerationContext('tenant-1', { productId: 'prod-1' });
      expect(ctx.effectiveProductId).toBe('prod-1');
      expect((facade as any).productService.findOwnedEntity).toHaveBeenCalledWith('tenant-1', 'prod-1');
    });

    it('falls back to primary product when no productId/campaignId', async () => {
      const fakePrimary = { id: 'primary-1', name: 'Primary', metadata: {} };
      ((facade as any).productService.findPrimary as jest.Mock).mockResolvedValue(fakePrimary);

      const ctx = await facade.buildGenerationContext('tenant-1', {});
      expect(ctx.effectiveProductId).toBe('primary-1');
    });

    it('loads profile and resolves sections', async () => {
      const fakeProfile = { id: 'prof-1', tenantId: 'tenant-1' };
      const fakeSections = [{ id: 'sec-1' }];
      const resolvedValues = { mission: 'test mission' };

      ((facade as any).profiles.findOne as jest.Mock).mockResolvedValue(fakeProfile);
      ((facade as any).profileSections.find as jest.Mock).mockResolvedValue(fakeSections);
      ((facade as any).profileSectionSync.resolveProfileValues as jest.Mock).mockResolvedValue(resolvedValues);

      const ctx = await facade.buildGenerationContext('tenant-1', {});
      expect(ctx.resolvedProfile).toBe(resolvedValues);
    });

    it('loads cmCharacters when effectiveProductId exists', async () => {
      const fakeProduct = { id: 'prod-1', name: 'Test', metadata: {} };
      ((facade as any).productService.findOwnedEntity as jest.Mock).mockResolvedValue(fakeProduct);
      ((facade as any).cmCharacter.listReadyForLlm as jest.Mock).mockResolvedValue([
        { id: 'char-1', name: 'Character 1' },
      ]);
      ((facade as any).cmCharacter.hasAnyReadyCharacter as jest.Mock).mockResolvedValue(true);

      const ctx = await facade.buildGenerationContext('tenant-1', { productId: 'prod-1' });
      expect(ctx.cmCharacters).toHaveLength(1);
      expect(ctx.cmCharacterReady).toBe(true);
    });
  });

  describe('refreshCampaignLinkedContent', () => {
    it('does nothing if campaign not found', async () => {
      ((facade as any).campaigns.findOne as jest.Mock).mockResolvedValue(null);
      await facade.refreshCampaignLinkedContent('tenant-1', 'camp-1');
      expect((facade as any).campaigns.save).not.toHaveBeenCalled();
    });

    it('updates strategy.linkedContentCount', async () => {
      const campaign = { id: 'camp-1', strategy: {}, tenantId: 'tenant-1' } as any;
      ((facade as any).campaigns.findOne as jest.Mock).mockResolvedValue(campaign);
      ((facade as any).contents.count as jest.Mock).mockResolvedValue(3);

      await facade.refreshCampaignLinkedContent('tenant-1', 'camp-1');
      // strategy is reassigned on campaign, so check the saved campaign
      const savedCampaign = (facade as any).campaigns.save.mock.calls[0][0];
      expect(savedCampaign.strategy.linkedContentCount).toBe(3);
      expect(savedCampaign.strategy.timeline).toContain('3 posts');
    });

    it('uses singular when 1 linked content', async () => {
      const campaign = { id: 'camp-1', strategy: {}, tenantId: 'tenant-1' } as any;
      ((facade as any).campaigns.findOne as jest.Mock).mockResolvedValue(campaign);
      ((facade as any).contents.count as jest.Mock).mockResolvedValue(1);

      await facade.refreshCampaignLinkedContent('tenant-1', 'camp-1');
      const savedCampaign = (facade as any).campaigns.save.mock.calls[0][0];
      expect(savedCampaign.strategy.timeline).toContain('1 post programado');
    });
  });

  describe('buildRegenerationContext', () => {
    it('includes platform in context', async () => {
      const ctx = await facade.buildRegenerationContext(
        'tenant-1',
        { productId: null, campaignId: null, platform: 'instagram' },
        (v) => v ?? ['instagram'],
      );
      expect(ctx.platform).toBe('instagram');
    });
  });
});
