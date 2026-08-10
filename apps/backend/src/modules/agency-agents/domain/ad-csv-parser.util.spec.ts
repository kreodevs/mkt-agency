import { parseAdPerformanceCsv } from './ad-csv-parser.util';

describe('parseAdPerformanceCsv', () => {
  it('parses Meta Ads export headers', () => {
    const csv = `Campaign name,Amount spent,Impressions,Link clicks,Results,Day
Promo local,12.50,1000,45,3,2026-08-01
Promo local,8.00,800,30,1,2026-08-02`;

    const parsed = parseAdPerformanceCsv(csv);

    expect(parsed.sourceFormat).toBe('meta_ads');
    expect(parsed.platform).toBe('meta');
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.totals.spend).toBe(20.5);
    expect(parsed.totals.clicks).toBe(75);
    expect(parsed.periodStart).toBe('2026-08-01');
    expect(parsed.periodEnd).toBe('2026-08-02');
  });

  it('parses Google Ads export headers', () => {
    const csv = `Campaign,Cost,Impressions,Clicks,Conversions,Day
Search Brand,25.00,5000,120,4,2026-08-05`;

    const parsed = parseAdPerformanceCsv(csv, 'google');

    expect(parsed.platform).toBe('google');
    expect(parsed.totals.spend).toBe(25);
    expect(parsed.totals.conversions).toBe(4);
  });
});
