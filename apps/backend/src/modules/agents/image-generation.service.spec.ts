import { ImageGenerationService } from './image-generation.service';
import { isStaleProcessingGeneration } from './domain/generation-error.utils';

describe('ImageGenerationService', () => {
  let service: ImageGenerationService;

  beforeEach(() => {
    service = new ImageGenerationService(
      {} as any, // generations repo
      {} as any, // adapter
      {} as any, // videoAdapter
      {} as any, // assetService
      {} as any, // contentService
      {} as any, // productService
      {} as any, // imageBranding
      {} as any, // llmConfig
      {} as any, // llmUsage
      {} as any, // imageWorker
      {} as any, // videoGeneration
    );
  });

  describe('handleExistingGeneration (private)', () => {
    const handle = (
      tenantId: string,
      userId: string,
      existing: any,
    ) => (service as any).handleExistingGeneration(tenantId, userId, existing);

    it('returns toResult for fresh processing record', () => {
      const freshDate = new Date();
      const record = {
        id: 'gen-1',
        status: 'processing',
        updatedAt: freshDate,
        imageUrl: null,
        assetId: null,
      };

      // mock toResult
      (service as any).toResult = jest.fn().mockReturnValue({ id: 'gen-1', status: 'processing' });

      const result = handle('t', 'u', record);
      expect((service as any).toResult).toHaveBeenCalledWith(record);
      expect(result.id).toBe('gen-1');
    });

    it('retries stale processing record', () => {
      const staleDate = new Date(Date.now() - 30 * 60 * 1000);
      const record = {
        id: 'gen-stale',
        status: 'processing',
        updatedAt: staleDate,
      };

      (service as any).retry = jest.fn().mockResolvedValue({ id: 'gen-stale', status: 'queued' });

      const result = handle('t', 'u', record);
      expect((service as any).retry).toHaveBeenCalledWith('t', 'u', 'gen-stale', { background: true });
    });

    it('returns toResult for completed record with visual', () => {
      const record = {
        id: 'gen-ok',
        status: 'completed',
        imageUrl: '/api/v1/assets/abc/file',
        assetId: 'abc',
      };

      (service as any).toResult = jest.fn().mockReturnValue({ id: 'gen-ok', status: 'completed' });
      (service as any).generationHasVisual = jest.fn().mockReturnValue(true);

      const result = handle('t', 'u', record);
      expect(result.status).toBe('completed');
    });

    it('retries completed record without visual', () => {
      const record = {
        id: 'gen-novis',
        status: 'completed',
        imageUrl: null,
        assetId: null,
      };

      (service as any).retry = jest.fn().mockResolvedValue({ id: 'gen-novis', status: 'queued' });
      (service as any).generationHasVisual = jest.fn().mockReturnValue(false);

      handle('t', 'u', record);
      expect((service as any).retry).toHaveBeenCalledWith('t', 'u', 'gen-novis', { background: true });
    });

    it('retries failed record', () => {
      const record = {
        id: 'gen-fail',
        status: 'failed',
      };

      (service as any).retry = jest.fn().mockResolvedValue({ id: 'gen-fail', status: 'queued' });

      handle('t', 'u', record);
      expect((service as any).retry).toHaveBeenCalledWith('t', 'u', 'gen-fail', { background: true });
    });
  });

  describe('applyLogoOverlay (private)', () => {
    const apply = (tenantId: string, productId: string, buf: Buffer) =>
      (service as any).applyLogoOverlay(tenantId, productId, buf);

    it('returns original buffer when no logoAssetId', async () => {
      const buf = Buffer.from('image');
      (service as any).resolveProductBranding = jest.fn().mockResolvedValue({
        productName: 'Test',
        logoAssetId: null,
      });

      const result = await apply('t', 'p1', buf);
      expect(result).toBe(buf);
    });

    it('applies logo when logoAssetId exists', async () => {
      const buf = Buffer.from('image');
      const branded = Buffer.from('branded');
      (service as any).resolveProductBranding = jest.fn().mockResolvedValue({
        productName: 'Test',
        logoAssetId: 'logo-asset-1',
      });
      (service as any).imageBranding = {
        applyProductLogo: jest.fn().mockResolvedValue(branded),
      };

      const result = await apply('t', 'p1', buf);
      expect(result).toBe(branded);
      expect((service as any).imageBranding.applyProductLogo).toHaveBeenCalledWith(
        't', buf, 'logo-asset-1',
      );
    });

    it('returns original buffer on branding error', async () => {
      const buf = Buffer.from('image');
      (service as any).resolveProductBranding = jest.fn().mockResolvedValue({
        productName: 'Test',
        logoAssetId: 'logo-asset-1',
      });
      (service as any).imageBranding = {
        applyProductLogo: jest.fn().mockRejectedValue(new Error('branding failed')),
      };

      const result = await apply('t', 'p1', buf);
      expect(result).toBe(buf);
    });
  });

  describe('generationHasVisual', () => {
    it('returns true when assetId present', () => {
      const record = { assetId: '1', metadata: null } as any;
      expect((service as any).generationHasVisual(record)).toBe(true);
    });

    it('returns true when metadata has frames', () => {
      const record = {
        assetId: null,
        metadata: { mediaType: 'video', frames: [{ assetId: 'a', index: 0 }] },
      } as any;
      expect((service as any).generationHasVisual(record)).toBe(true);
    });

    it('returns false when no assetId and no valid metadata frames', () => {
      const record = { assetId: null, imageUrl: '/img', metadata: null } as any;
      expect((service as any).generationHasVisual(record)).toBe(false);
    });
  });

  describe('toResult', () => {
    it('maps entity fields to result shape', () => {
      const record = {
        id: 'g1',
        tenantId: 't1',
        prompt: 'test prompt',
        assetId: 'a1',
        imageUrl: '/img',
        status: 'completed',
        contentId: 'c1',
        productId: 'p1',
        errorMessage: null,
        metadata: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      } as any;

      const result = (service as any).toResult(record);
      expect(result).toEqual({
        id: 'g1',
        tenantId: 't1',
        prompt: 'test prompt',
        assetId: 'a1',
        imageUrl: '/img',
        status: 'completed',
        contentId: 'c1',
        productId: 'p1',
        errorMessage: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      });
      // metadata is undefined (not null) when not valid
      expect(result.metadata).toBeUndefined();
    });
  });
});
