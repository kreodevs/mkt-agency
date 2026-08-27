export interface VisualTextLimits {
  headlineMaxCharsPerLine: number;
  headlineMaxLines: number;
  sublineMaxCharsPerLine: number;
  sublineMaxLines: number;
  ctaMaxWords: number;
}

export const DEFAULT_VISUAL_TEXT_LIMITS: VisualTextLimits = {
  headlineMaxCharsPerLine: 18,
  headlineMaxLines: 2,
  sublineMaxCharsPerLine: 30,
  sublineMaxLines: 3,
  ctaMaxWords: 4,
};

export interface VisualTextWarning {
  field: 'headline' | 'subline' | 'cta';
  message: string;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateWrappedLines(text: string, maxCharsPerLine: number, maxLines: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return 0;
  }
  let lines = 1;
  let currentLen = 0;
  for (const word of words) {
    const next = currentLen ? currentLen + 1 + word.length : word.length;
    if (next > maxCharsPerLine && currentLen > 0) {
      lines += 1;
      currentLen = word.length;
    } else {
      currentLen = next;
    }
    if (lines > maxLines) {
      return lines;
    }
  }
  return lines;
}

export function validateVisualTemplateText(
  input: {
    headline?: string | null;
    subline?: string | null;
    cta?: string | null;
    templateId?: string | null;
  },
  limits: VisualTextLimits = DEFAULT_VISUAL_TEXT_LIMITS,
): VisualTextWarning[] {
  const warnings: VisualTextWarning[] = [];
  const isQuote = input.templateId === 'quote-insight';
  const headlineLimits = {
    maxChars: isQuote ? 22 : limits.headlineMaxCharsPerLine,
    maxLines: isQuote ? 4 : limits.headlineMaxLines,
  };

  const headline = input.headline?.trim() ?? '';
  if (headline) {
    const lines = estimateWrappedLines(headline, headlineLimits.maxChars, headlineLimits.maxLines);
    if (lines > headlineLimits.maxLines) {
      warnings.push({
        field: 'headline',
        message: `El titular ocupará más de ${headlineLimits.maxLines} líneas y puede truncarse en la imagen.`,
      });
    }
    if (headline.length > headlineLimits.maxChars * headlineLimits.maxLines) {
      warnings.push({
        field: 'headline',
        message: 'Titular muy largo para el marco de la plantilla.',
      });
    }
  }

  const subline = input.subline?.trim() ?? '';
  if (subline) {
    const words = countWords(subline);
    if (words > 14) {
      warnings.push({
        field: 'subline',
        message: 'Subtítulo recomendado: máx. 14 palabras.',
      });
    }
    const lines = estimateWrappedLines(subline, limits.sublineMaxCharsPerLine, limits.sublineMaxLines);
    if (lines > limits.sublineMaxLines) {
      warnings.push({
        field: 'subline',
        message: 'El subtítulo puede cortarse en la composición.',
      });
    }
  }

  const cta = input.cta?.trim() ?? '';
  if (cta) {
    const words = countWords(cta);
    if (words > limits.ctaMaxWords) {
      warnings.push({
        field: 'cta',
        message: `CTA recomendado: ${limits.ctaMaxWords} palabras o menos.`,
      });
    }
  }

  return warnings;
}
