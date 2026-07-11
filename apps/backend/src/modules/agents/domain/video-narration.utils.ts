export const SPANISH_WORDS_PER_SECOND = 2.35;

export interface NarrationSegment {
  index: number;
  total: number;
  body: string;
  durationSeconds: number;
}

export function maxSpeakableWordsForDuration(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 0;
  }

  return Math.max(1, Math.floor(seconds * SPANISH_WORDS_PER_SECOND));
}

export function countSpeakableWords(text: string): number {
  return text
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/[#*_`]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function estimateSpeechDurationSeconds(text: string): number {
  const words = countSpeakableWords(text);
  if (words === 0) {
    return 0;
  }

  return Math.ceil(words / SPANISH_WORDS_PER_SECOND);
}

export function sanitizeSpanishNarrationScript(body: string): string {
  return body
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
}

export function fitNarrationBodyForDuration(body: string, maxSeconds: number): string {
  const script = sanitizeSpanishNarrationScript(body);
  if (!script || estimateSpeechDurationSeconds(script) <= maxSeconds) {
    return script;
  }

  const maxWords = maxSpeakableWordsForDuration(maxSeconds);
  const sentences = script.split(/(?<=[.!?…])\s+/).filter(Boolean);
  const kept: string[] = [];
  let wordCount = 0;

  for (const sentence of sentences) {
    const sentenceWords = countSpeakableWords(sentence);
    if (wordCount + sentenceWords <= maxWords) {
      kept.push(sentence);
      wordCount += sentenceWords;
      continue;
    }

    if (kept.length === 0) {
      const words = sentence.split(/\s+/).filter(Boolean);
      const truncated = words.slice(0, maxWords).join(' ');
      const cleaned = truncated.replace(/[,;:]+\s*$/, '').trim();
      kept.push(
        /[.!?…]$/.test(cleaned) ? cleaned : `${cleaned.replace(/…$/, '')}…`,
      );
    }

    break;
  }

  const fitted = kept.join(' ').trim();
  if (!fitted) {
    return script
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, maxWords)
      .join(' ');
  }

  return fitted;
}

export function shouldGenerateVideoAudio(prompt: string, narrationBody?: string): boolean {
  if (narrationBody?.trim()) {
    return true;
  }

  return /\b(m[uú]sica|audio|sonido|voz|narraci[oó]n|hablado|voiceover|trend|soundtrack|banda\s+sonora)\b/i.test(
    prompt,
  );
}

export function splitNarrationIntoSegments(
  body: string,
  maxDurationSeconds: number = 10,
): NarrationSegment[] {
  const script = sanitizeSpanishNarrationScript(body);
  const sentences = script.split(/(?<=[.!?…])\s+/).filter(Boolean);

  const segments: NarrationSegment[] = [];
  let currentWords: string[] = [];
  let wordCount = 0;
  const maxWords = maxSpeakableWordsForDuration(maxDurationSeconds);

  for (const sentence of sentences) {
    const sentenceWordCount = countSpeakableWords(sentence);

    if (wordCount + sentenceWordCount > maxWords && currentWords.length > 0) {
      segments.push({
        index: segments.length,
        total: 0,
        body: currentWords.join(' '),
        durationSeconds: estimateSpeechDurationSeconds(currentWords.join(' ')),
      });
      currentWords = [];
      wordCount = 0;
    }

    currentWords.push(sentence);
    wordCount += sentenceWordCount;
  }

  if (currentWords.length > 0) {
    segments.push({
      index: segments.length,
      total: 0,
      body: currentWords.join(' '),
      durationSeconds: estimateSpeechDurationSeconds(currentWords.join(' ')),
    });
  }

  const total = segments.length;
  return segments.map((s) => ({ ...s, total }));
}
