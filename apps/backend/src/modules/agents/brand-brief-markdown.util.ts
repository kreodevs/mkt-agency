function asLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

function section(title: string, body: string | null): string {
  if (!body?.trim()) return '';
  return `## ${title}\n\n${body.trim()}\n`;
}

export function brandBriefToMarkdown(brief: Record<string, unknown>): string {
  const companyName = String(brief.companyName ?? 'Tu marca').trim() || 'Tu marca';
  const keyMessages = asLines(brief.keyMessages);

  const parts = [
    `# Brand Brief — ${companyName}`,
    '',
    section('Resumen', [
      brief.industry ? `**Industria:** ${String(brief.industry)}` : null,
      brief.targetAudienceDesc ? `**Audiencia:** ${String(brief.targetAudienceDesc)}` : null,
      brief.brandVoice ? `**Voz de marca:** ${String(brief.brandVoice)}` : null,
    ]
      .filter(Boolean)
      .join('\n\n')),
    section('Competencia', brief.competitors ? String(brief.competitors) : null),
    section('Objetivos de marketing', brief.objectives ? String(brief.objectives) : null),
    section('Pains del mercado', brief.marketPains ? String(brief.marketPains) : null),
    section('Dirección visual', brief.visualDirection ? String(brief.visualDirection) : null),
    keyMessages.length
      ? `## Mensajes clave\n\n${keyMessages.map((msg) => `- ${msg}`).join('\n')}\n`
      : '',
  ];

  return parts.filter(Boolean).join('\n').trim();
}
