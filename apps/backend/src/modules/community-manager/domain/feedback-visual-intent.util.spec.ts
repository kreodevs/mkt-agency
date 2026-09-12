import {
  buildMediaKitRevisionHint,
  feedbackRequestsAiImage,
  feedbackRequestsMediaKit,
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
});
