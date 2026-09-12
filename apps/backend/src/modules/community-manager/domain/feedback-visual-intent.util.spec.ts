import {
  buildMediaKitRevisionHint,
  feedbackRequestsAiImage,
  feedbackRequestsMediaKit,
  parseFeedbackTargetFrames,
} from './feedback-visual-intent.util';

describe('feedback-visual-intent.util', () => {
  it('detects media kit intent in Spanish feedback', () => {
    expect(feedbackRequestsMediaKit('usa imágenes de mi media kit')).toBe(true);
    expect(feedbackRequestsMediaKit('usa capturas del producto')).toBe(true);
    expect(feedbackRequestsMediaKit('quiero fotos reales del producto')).toBe(true);
    expect(feedbackRequestsMediaKit('no generes un logo ficticio')).toBe(true);
  });

  it('does not flag generic copy feedback as media kit', () => {
    expect(feedbackRequestsMediaKit('haz el tono más cercano')).toBe(false);
    expect(feedbackRequestsMediaKit(undefined)).toBe(false);
  });

  it('detects explicit AI image requests', () => {
    expect(feedbackRequestsAiImage('genera una nueva imagen con IA')).toBe(true);
    expect(feedbackRequestsAiImage('usa el media kit')).toBe(false);
  });

  it('builds revision hint when media kit is requested', () => {
    const hint = buildMediaKitRevisionHint('usa capturas del kit');
    expect(hint).toContain('PRIORIDAD MEDIA KIT');
    expect(hint).toContain('NO inventes');
  });

  it('parses target frame numbers from feedback (1-based)', () => {
    expect(parseFeedbackTargetFrames('regenera frame 1 y frame 3', 3)).toEqual([0, 2]);
    expect(parseFeedbackTargetFrames('slide 2 con media kit', 3)).toEqual([1]);
    expect(parseFeedbackTargetFrames('haz el tono más cercano', 3)).toBeNull();
  });

  it('includes frame hint in media kit revision brief', () => {
    const hint = buildMediaKitRevisionHint('usa media kit en frame 1 y frame 3');
    expect(hint).toContain('frames 1, 3');
  });
});
