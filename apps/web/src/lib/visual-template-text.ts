export interface VisualTextWarning {
  field: 'headline' | 'subline' | 'cta';
  message: string;
}

const HEADLINE_MAX_CHARS = 18;
const HEADLINE_MAX_LINES = 2;
const QUOTE_HEADLINE_MAX_CHARS = 22;
const QUOTE_HEADLINE_MAX_LINES = 4;
const SUBLINE_MAX_CHARS = 30;
const SUBLINE_MAX_LINES = 3;
const SUBLINE_MAX_WORDS = 14;
const CTA_MAX_WORDS = 4;

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

export function validateVisualTemplateText(input: {
  headline?: string | null;
  subline?: string | null;
  cta?: string | null;
  templateId?: string | null;
}): VisualTextWarning[] {
  const warnings: VisualTextWarning[] = [];
  const isQuote = input.templateId === 'quote-insight';
  const headlineMaxChars = isQuote ? QUOTE_HEADLINE_MAX_CHARS : HEADLINE_MAX_CHARS;
  const headlineMaxLines = isQuote ? QUOTE_HEADLINE_MAX_LINES : HEADLINE_MAX_LINES;

  const headline = input.headline?.trim() ?? '';
  if (headline) {
    const lines = estimateWrappedLines(headline, headlineMaxChars, headlineMaxLines);
    if (lines > headlineMaxLines) {
      warnings.push({
        field: 'headline',
        message: `El titular ocupará más de ${headlineMaxLines} líneas y puede truncarse en la imagen.`,
      });
    }
  }

  const subline = input.subline?.trim() ?? '';
  if (subline) {
    if (countWords(subline) > SUBLINE_MAX_WORDS) {
      warnings.push({
        field: 'subline',
        message: `Subtítulo recomendado: máx. ${SUBLINE_MAX_WORDS} palabras.`,
      });
    }
    if (estimateWrappedLines(subline, SUBLINE_MAX_CHARS, SUBLINE_MAX_LINES) > SUBLINE_MAX_LINES) {
      warnings.push({
        field: 'subline',
        message: 'El subtítulo puede cortarse en la composición.',
      });
    }
  }

  const cta = input.cta?.trim() ?? '';
  if (cta && countWords(cta) > CTA_MAX_WORDS) {
    warnings.push({
      field: 'cta',
      message: `CTA recomendado: ${CTA_MAX_WORDS} palabras o menos.`,
    });
  }

  return warnings;
}
