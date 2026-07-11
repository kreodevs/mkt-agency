import { BadRequestException } from '@nestjs/common';
import { ContentService } from './content.service';
import { UpdateContentDto } from './dto/content.request.dto';

describe('ContentService — validation & routing', () => {
  let service: ContentService;

  beforeEach(() => {
    service = new ContentService(
      {} as any, // contents repo
      {} as any, // versions repo
      {} as any, // approvals repo
      {} as any, // campaigns repo
      {} as any, // productService
      {} as any, // dataSource
      {} as any, // signatureService
      {} as any, // eventSourcing
    );
  });

  function setupDataSourceTransactionMock(): void {
    const mockRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockImplementation((v: any) => Promise.resolve(v)),
      count: jest.fn().mockResolvedValue(0),
    };
    (service as any).versions = {
      findOne: jest.fn().mockResolvedValue({ id: 'v1', body: '', title: '' }),
    };
    (service as any).dataSource = {
      transaction: jest.fn().mockImplementation(
        async (fn: any) => fn({ getRepository: () => mockRepo }),
      ),
    };
    (service as any).findOwnedContent = jest.fn().mockResolvedValue({
      id: 'id', currentVersionId: 'v1', status: 'draft', productId: null, platform: null,
      visualFormat: null, visualPrompt: null, scheduledDate: null,
    });
    (service as any).toContentResponse = jest.fn().mockReturnValue({});
    (service as any).eventSourcing = { append: jest.fn().mockResolvedValue(undefined) };
  }

  describe('validateUpdateDto (via update)', () => {
    it('throws BadRequestException when dto is empty', async () => {
      await expect(
        service.update('tenant', 'author', 'id', {} as UpdateContentDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when only scheduledDate is undefined', async () => {
      const dto: UpdateContentDto = { scheduledDate: undefined };
      await expect(
        service.update('tenant', 'author', 'id', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts dto with title (version field)', async () => {
      setupDataSourceTransactionMock();
      const dto: UpdateContentDto = { title: 'New title' };
      const result = await service.update('tenant', 'author', 'id', dto);
      expect(result).toBeDefined();
    });

    it('accepts dto with body (version field)', async () => {
      setupDataSourceTransactionMock();
      const dto: UpdateContentDto = { body: 'content body' };
      const result = await service.update('tenant', 'author', 'id', dto);
      expect(result).toBeDefined();
    });

    it('accepts dto with only visualFormat (metadata-only)', async () => {
      const dto: UpdateContentDto = { visualFormat: 'story' };
      (service as any).findOwnedContent = jest.fn().mockResolvedValue({
        id: 'id', scheduledDate: null, visualFormat: null, platform: null, visualPrompt: null,
      });
      (service as any).toContentResponse = jest.fn().mockReturnValue({});
      (service as any).contents = { save: jest.fn().mockResolvedValue({}) };

      const result = await service.update('tenant', 'author', 'id', dto);
      expect(result).toBeDefined();
    });

    it('accepts dto with assets (version field)', async () => {
      setupDataSourceTransactionMock();
      const dto: UpdateContentDto = { assets: [] };
      const result = await service.update('tenant', 'author', 'id', dto);
      expect(result).toBeDefined();
    });
  });

  describe('isMetadataOnlyUpdate (via update routing)', () => {
    it('routes to metadata-only when only scheduledDate is set', async () => {
      const dto: UpdateContentDto = { scheduledDate: '2025-06-01' };
      (service as any).findOwnedContent = jest.fn().mockResolvedValue({
        id: 'id', scheduledDate: null, visualFormat: null, platform: null, visualPrompt: null,
      });
      (service as any).toContentResponse = jest.fn().mockReturnValue({});
      (service as any).contents = { save: jest.fn().mockResolvedValue({}) };

      await service.update('tenant', 'author', 'id', dto);
      expect((service as any).findOwnedContent).toHaveBeenCalled();
    });

    it('routes to updateWithVersion when title + scheduledDate are set', async () => {
      setupDataSourceTransactionMock();
      const dto: UpdateContentDto = { title: 'New', scheduledDate: '2025-06-01' };
      await service.update('tenant', 'author', 'id', dto);
      expect((service as any).dataSource.transaction).toHaveBeenCalled();
    });
  });
});
