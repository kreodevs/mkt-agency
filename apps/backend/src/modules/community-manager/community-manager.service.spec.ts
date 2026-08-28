import { BadRequestException } from '@nestjs/common';
import { CommunityManagerService } from './community-manager.service';

describe('CommunityManagerService — extracted helpers', () => {
  let service: CommunityManagerService;

  beforeEach(() => {
    service = new CommunityManagerService(
      {} as any, // batches
      {} as any, // tenants
      {} as any, // contents
      {} as any, // adapter
      {} as any, // llmProviders
      {} as any, // contentService
      {} as any, // imageGeneration
      {} as any, // templateComposer
      {} as any, // talkingHeadComposer
      {} as any, // productService
      { ensureScreenshotsBeforeGenerate: jest.fn().mockResolvedValue(undefined) } as any,
      {} as any, // contextFacade
    );
  });

  describe('isProductReadyForCM (private)', () => {
    const check = (product: any) => (service as any).isProductReadyForCM(product);

    it('returns false for null product', () => {
      expect(check(null)).toBe(false);
    });

    it('returns false for undefined product', () => {
      expect(check(undefined)).toBe(false);
    });

    it('returns false when description and valueProposition are empty', () => {
      expect(check({ description: '', valueProposition: '', targetAudience: 'kids' })).toBe(false);
    });

    it('returns false when targetAudience is empty', () => {
      expect(check({ description: 'Great product', valueProposition: '', targetAudience: '' })).toBe(false);
    });

    it('returns true when description + targetAudience present', () => {
      expect(check({ description: 'A product', valueProposition: '', targetAudience: 'Adults' })).toBe(true);
    });

    it('returns true when valueProposition + targetAudience present (no description)', () => {
      expect(check({ description: '', valueProposition: 'Saves time', targetAudience: 'Teams' })).toBe(true);
    });

    it('trims whitespace before checking', () => {
      expect(check({ description: '   ', valueProposition: '  ', targetAudience: '  ' })).toBe(false);
    });
  });

  describe('extractErrorMessage (private)', () => {
    const extract = (error: unknown) => (service as any).extractErrorMessage(error);

    it('extracts message from BadRequestException response', () => {
      const err = new BadRequestException({ error: 'Validation failed', code: 'ERR' });
      expect(extract(err)).toBe('Validation failed');
    });

    it('extracts message from standard Error', () => {
      expect(extract(new Error('Something broke'))).toBe('Something broke');
    });

    it('returns default for unknown error types', () => {
      expect(extract('string error')).toBe('Generation failed');
      expect(extract(null)).toBe('Generation failed');
      expect(extract(42)).toBe('Generation failed');
    });

    it('handles BadRequestException without response.error', () => {
      const err = new BadRequestException('simple message');
      const response = err.getResponse();
      // When constructed with a string, getResponse() returns { statusCode: 400, message: 'simple message', error: 'Bad Request' }
      expect(extract(err)).toBe('Bad Request');
    });
  });

  describe('normalizePlatforms (private)', () => {
    const normalize = (platforms: any) => (service as any).normalizePlatforms(platforms);

    it('returns default platforms for empty input', () => {
      const result = normalize(undefined);
      expect(result).toEqual(expect.arrayContaining(['instagram', 'linkedin']));
    });

    it('filters out invalid platforms', () => {
      const result = normalize(['instagram', 'invalid_platform', 'linkedin']);
      expect(result).toContain('instagram');
      expect(result).toContain('linkedin');
      expect(result).not.toContain('invalid_platform');
    });

    it('returns defaults when all platforms are invalid', () => {
      const result = normalize(['not_a_platform', 'another_fake']);
      expect(result).toEqual(expect.arrayContaining(['instagram', 'linkedin']));
    });
  });

  describe('attachVisualForPost (private)', () => {
    const talkingHeadComposer = { attachToContent: jest.fn() };
    const templateComposer = { tryComposeFromTemplate: jest.fn() };
    const imageGeneration = { attachVisualToContent: jest.fn() };

    beforeEach(() => {
      service = new CommunityManagerService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        imageGeneration as any,
        templateComposer as any,
        talkingHeadComposer as any,
        {} as any,
        { ensureScreenshotsBeforeGenerate: jest.fn().mockResolvedValue(undefined) } as any,
        {} as any,
      );
      talkingHeadComposer.attachToContent.mockReset();
      templateComposer.tryComposeFromTemplate.mockReset();
      imageGeneration.attachVisualToContent.mockReset();
    });

    const attach = (
      post: Record<string, unknown>,
      kit: unknown[] = [{ assetId: 'asset-1', role: 'product-screenshot' }],
    ) =>
      (service as any).attachVisualForPost(
        'tenant-1',
        'user-1',
        'content-1',
        post,
        'product-1',
        kit,
        0,
        { resolvedProfile: null },
      );

    it('falls back to template compose when talking-head fails', async () => {
      talkingHeadComposer.attachToContent.mockResolvedValue(false);
      templateComposer.tryComposeFromTemplate.mockResolvedValue({
        attached: true,
        assetIds: ['rendered-1'],
      });

      const result = await attach({
        platform: 'tiktok',
        visualFormat: 'talking-head',
        body: 'Copy del post',
        title: 'Título',
      });

      expect(result).toBe(true);
      expect(talkingHeadComposer.attachToContent).toHaveBeenCalled();
      expect(templateComposer.tryComposeFromTemplate).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        'content-1',
        expect.objectContaining({ visualFormat: 'image', platform: 'tiktok' }),
        'product-1',
        expect.any(Array),
        0,
        { resolvedProfile: null },
      );
    });

    it('returns true when talking-head succeeds without template fallback', async () => {
      talkingHeadComposer.attachToContent.mockResolvedValue(true);

      const result = await attach({
        platform: 'tiktok',
        visualFormat: 'talking-head',
        body: 'Copy del post',
        title: 'Título',
      });

      expect(result).toBe(true);
      expect(templateComposer.tryComposeFromTemplate).not.toHaveBeenCalled();
    });
  });
});
