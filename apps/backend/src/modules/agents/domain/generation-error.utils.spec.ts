import {
  formatGenerationError,
  isStaleProcessingGeneration,
  IMAGE_GENERATION_STALE_PROCESSING_MS,
  IMAGE_GENERATION_STALE_PROCESSING_MESSAGE,
} from './generation-error.utils';

describe('generation-error.utils', () => {
  describe('formatGenerationError', () => {
    it('returns message from Error instance', () => {
      expect(formatGenerationError(new Error('boom'))).toBe('boom');
    });

    it('returns default for non-Error', () => {
      expect(formatGenerationError('string error')).toBe('Generation failed');
    });

    it('returns default for null/undefined', () => {
      expect(formatGenerationError(null)).toBe('Generation failed');
      expect(formatGenerationError(undefined)).toBe('Generation failed');
    });

    it('truncates messages longer than 500 chars', () => {
      const long = 'x'.repeat(600);
      const result = formatGenerationError(new Error(long));
      expect(result.length).toBeLessThanOrEqual(500);
      expect(result).toContain('…');
    });

    it('does not truncate messages <= 500 chars', () => {
      const msg = 'x'.repeat(500);
      expect(formatGenerationError(new Error(msg))).toBe(msg);
    });
  });

  describe('isStaleProcessingGeneration', () => {
    const NOW = 1_700_000_000_000;

    it('returns false if status is not processing', () => {
      expect(
        isStaleProcessingGeneration(
          { status: 'completed', updatedAt: new Date(NOW - 999_999_999) },
          NOW,
        ),
      ).toBe(false);
    });

    it('returns false if recently updated', () => {
      const fiveMinAgo = new Date(NOW - 5 * 60 * 1000);
      expect(
        isStaleProcessingGeneration({ status: 'processing', updatedAt: fiveMinAgo }, NOW),
      ).toBe(false);
    });

    it('returns true if stale (beyond threshold)', () => {
      const thirtyMinAgo = new Date(NOW - 30 * 60 * 1000);
      expect(
        isStaleProcessingGeneration({ status: 'processing', updatedAt: thirtyMinAgo }, NOW),
      ).toBe(true);
    });

    it('returns true at exactly threshold + 1ms', () => {
      const atThreshold = new Date(NOW - IMAGE_GENERATION_STALE_PROCESSING_MS - 1);
      expect(
        isStaleProcessingGeneration({ status: 'processing', updatedAt: atThreshold }, NOW),
      ).toBe(true);
    });

    it('returns false at exactly threshold', () => {
      const atThreshold = new Date(NOW - IMAGE_GENERATION_STALE_PROCESSING_MS);
      expect(
        isStaleProcessingGeneration({ status: 'processing', updatedAt: atThreshold }, NOW),
      ).toBe(false);
    });

    it('handles string dates', () => {
      const date = new Date(NOW - 30 * 60 * 1000);
      expect(
        isStaleProcessingGeneration(
          { status: 'processing', updatedAt: date.toISOString() },
          NOW,
        ),
      ).toBe(true);
    });

    it('handles invalid date strings gracefully', () => {
      expect(
        isStaleProcessingGeneration(
          { status: 'processing', updatedAt: 'not-a-date' },
          NOW,
        ),
      ).toBe(false);
    });
  });

  describe('constants', () => {
    it('stale threshold is 20 minutes', () => {
      expect(IMAGE_GENERATION_STALE_PROCESSING_MS).toBe(20 * 60 * 1000);
    });

    it('stale message is defined', () => {
      expect(IMAGE_GENERATION_STALE_PROCESSING_MESSAGE).toBeTruthy();
    });
  });
});
