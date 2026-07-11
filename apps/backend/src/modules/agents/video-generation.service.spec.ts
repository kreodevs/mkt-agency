import { VideoGenerationService } from './video-generation.service';

describe('VideoGenerationService', () => {
  let service: VideoGenerationService;

  beforeEach(() => {
    service = new VideoGenerationService(
      {} as any, // generations repo
      {} as any, // videoAdapter
      {} as any, // assetService
      {} as any, // contentService
      {} as any, // llmConfig
      {} as any, // llmUsage
    );
  });

  describe('resolveClipBuffer (private)', () => {
    const resolve = (result: any) =>
      (service as any).resolveClipBuffer(result);

    it('returns videoBuffer directly if present', async () => {
      const buf = Buffer.from('video-data');
      const result = await resolve({ videoBuffer: buf });
      expect(result).toBe(buf);
    });

    it('returns null if no videoBuffer and no videoUrl', async () => {
      const result = await resolve({});
      expect(result).toBeNull();
    });

    it('fetches from videoUrl when videoBuffer is absent', async () => {
      const fakeData = new Uint8Array([1, 2, 3]);
      const fakeArrayBuffer = fakeData.buffer;

      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(fakeArrayBuffer),
      });

      const result = await resolve({ videoUrl: 'https://example.com/video.mp4' });
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/video.mp4');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result).toEqual(Buffer.from(fakeData));
    });

    it('prefers videoBuffer over videoUrl', async () => {
      const buf = Buffer.from('direct');
      global.fetch = jest.fn();

      const result = await resolve({ videoBuffer: buf, videoUrl: 'https://example.com/video.mp4' });
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toBe(buf);
    });
  });

  describe('resolveVideoPayload (private)', () => {
    const resolve = (result: any) =>
      (service as any).resolveVideoPayload(result);

    it('returns buffer with contentType from mimeType', async () => {
      const buf = Buffer.from('vid');
      const result = await resolve({ videoBuffer: buf, mimeType: 'video/webm' });
      expect(result).toEqual({ buffer: buf, contentType: 'video/webm' });
    });

    it('defaults contentType to video/mp4 if mimeType missing', async () => {
      const buf = Buffer.from('vid');
      const result = await resolve({ videoBuffer: buf });
      expect(result).toEqual({ buffer: buf, contentType: 'video/mp4' });
    });

    it('skips empty videoBuffer and fetches from URL', async () => {
      const rawBytes = new Uint8Array([102, 101, 116, 99, 104, 101, 100]);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(rawBytes.buffer),
        headers: { get: () => 'video/mp4' },
      });

      const result = await resolve({ videoBuffer: undefined, videoUrl: 'https://x.com/v.mp4' });
      expect(result.buffer.length).toBe(7);
      expect(result.contentType).toBe('video/mp4');
    });
  });

  describe('concatVideoClips', () => {
    it('returns single result directly without processing', async () => {
      const single = { videoBuffer: Buffer.from('v'), duration: 10 };
      const result = await service.concatVideoClips([single]);
      expect(result).toBe(single);
    });
  });
});
