export interface NormalizedAdRow {
  date: string | null;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface AdCsvTotals {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface ParsedAdCsv {
  sourceFormat: 'meta_ads' | 'google_ads' | 'generic';
  platform: 'meta' | 'google' | 'unknown';
  rows: NormalizedAdRow[];
  totals: AdCsvTotals;
  periodStart: string | null;
  periodEnd: string | null;
}

const HEADER_ALIASES: Record<string, string[]> = {
  campaignName: [
    'campaign name',
    'nombre de la campaña',
    'nombre de la campana',
    'campaign',
    'campaña',
    'campana',
    'campaign_name',
  ],
  date: ['day', 'día', 'dia', 'date', 'fecha', 'reporting starts', 'inicio del informe'],
  spend: [
    'amount spent',
    'importe gastado',
    'spend',
    'cost',
    'coste',
    'cost (usd)',
    'costo',
  ],
  impressions: ['impressions', 'impresiones'],
  clicks: ['link clicks', 'clics en el enlace', 'clicks', 'clics', 'clicos'],
  conversions: ['results', 'resultados', 'conversions', 'conversiones', 'leads'],
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function resolveColumnIndex(headers: string[], field: keyof typeof HEADER_ALIASES): number {
  const aliases = HEADER_ALIASES[field];
  return headers.findIndex((header) => aliases.includes(header));
}

function parseNumber(value: string): number {
  const cleaned = value
    .trim()
    .replace(/[^\d,.-]/g, '')
    .replace(/,(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function parseAdPerformanceCsv(
  raw: string,
  platformHint?: 'meta' | 'google' | 'auto',
): ParsedAdCsv {
  const lines = raw
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('El CSV debe incluir encabezados y al menos una fila de datos');
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const campaignIdx = resolveColumnIndex(headers, 'campaignName');
  const dateIdx = resolveColumnIndex(headers, 'date');
  const spendIdx = resolveColumnIndex(headers, 'spend');
  const impressionsIdx = resolveColumnIndex(headers, 'impressions');
  const clicksIdx = resolveColumnIndex(headers, 'clicks');
  const conversionsIdx = resolveColumnIndex(headers, 'conversions');

  if (campaignIdx < 0 && spendIdx < 0) {
    throw new Error(
      'No se reconocieron columnas de campaña o gasto. Exporta desde Meta o Google Ads con encabezados estándar.',
    );
  }

  const headerBlob = headers.join(' ');
  let sourceFormat: ParsedAdCsv['sourceFormat'] = 'generic';
  let platform: ParsedAdCsv['platform'] = 'unknown';

  if (/importe gastado|amount spent|link clicks|nombre de la campaña/.test(headerBlob)) {
    sourceFormat = 'meta_ads';
    platform = 'meta';
  } else if (/coste|cost\b|google ads|clics|conversiones/.test(headerBlob)) {
    sourceFormat = 'google_ads';
    platform = 'google';
  }

  if (platformHint && platformHint !== 'auto') {
    platform = platformHint;
    sourceFormat = platformHint === 'meta' ? 'meta_ads' : 'google_ads';
  }

  const rows: NormalizedAdRow[] = [];
  const dates: string[] = [];

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    if (cells.every((cell) => !cell.trim())) continue;

    const campaignName =
      campaignIdx >= 0 ? cells[campaignIdx]?.trim() || 'Sin nombre' : 'Campaña importada';
    const dateRaw = dateIdx >= 0 ? cells[dateIdx]?.trim() : '';
    const date = dateRaw ? normalizeDate(dateRaw) : null;
    if (date) dates.push(date);

    rows.push({
      date,
      campaignName,
      spend: spendIdx >= 0 ? parseNumber(cells[spendIdx] ?? '0') : 0,
      impressions: impressionsIdx >= 0 ? parseNumber(cells[impressionsIdx] ?? '0') : 0,
      clicks: clicksIdx >= 0 ? parseNumber(cells[clicksIdx] ?? '0') : 0,
      conversions: conversionsIdx >= 0 ? parseNumber(cells[conversionsIdx] ?? '0') : 0,
    });
  }

  if (rows.length === 0) {
    throw new Error('No se encontraron filas válidas en el CSV');
  }

  const totals = rows.reduce<AdCsvTotals>(
    (acc, row) => ({
      spend: acc.spend + row.spend,
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      conversions: acc.conversions + row.conversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
  );

  const sortedDates = [...dates].sort();

  return {
    sourceFormat,
    platform,
    rows,
    totals,
    periodStart: sortedDates[0] ?? null,
    periodEnd: sortedDates[sortedDates.length - 1] ?? null,
  };
}

function normalizeDate(value: string): string | null {
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    return `${slashMatch[3]}-${month}-${day}`;
  }

  return null;
}
