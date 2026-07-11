import { CompetitorDiscoveryContext } from '../adapters/competitor-discovery.adapter.port';

export function buildDiscoverySearchQueries(context: CompetitorDiscoveryContext): string[] {
  const intentQueries = buildCompetitorIntentQueries(context);
  const keywordQueries = buildKeywordDiscoveryQueries(context);
  const queries = [...new Set([...intentQueries, ...keywordQueries].map((query) => query.trim()).filter(Boolean))];

  if (queries.length < 2) {
    queries.push(...buildFallbackDiscoveryQueries(context));
  }

  return [...new Set(queries.map((query) => query.trim()).filter(Boolean))].slice(0, 12);
}

function buildFallbackDiscoveryQueries(context: CompetitorDiscoveryContext): string[] {
  const queries: string[] = [];
  const geo = discoveryGeoLabel(context);
  const keywords = (context.productKeywords ?? []).filter(Boolean);
  const productName = context.productName?.trim();
  const category = context.productCategory?.trim();

  if (productName) {
    queries.push(geo ? `competidores ${productName} ${geo}` : `competidores ${productName}`);
    queries.push(geo ? `alternativas a ${productName} ${geo}` : `alternativas ${productName}`);
  }

  if (category) {
    queries.push(geo ? `empresas ${category} ${geo}` : `empresas ${category} competidores`);
  }

  for (const keyword of keywords.slice(0, 3)) {
    queries.push(geo ? `${keyword} empresas ${geo}` : `${keyword} competidores`);
  }

  if (context.companyName?.trim() && context.industryLabel) {
    queries.push(
      geo
        ? `competidores ${context.companyName.trim()} ${context.industryLabel} ${geo}`
        : `competidores ${context.companyName.trim()} ${context.industryLabel}`,
    );
  }

  return queries;
}

function discoveryGeoLabel(context: CompetitorDiscoveryContext): string {
  if (context.scope === 'global') {
    return '';
  }
  if (context.scope === 'country') {
    return (context.country ?? '').trim();
  }
  return `${context.city ?? ''} ${context.country ?? ''}`.trim();
}

function discoveryCorpus(context: CompetitorDiscoveryContext): string {
  return [
    context.productName,
    context.productSummary,
    context.brandBriefExcerpt,
    context.productCategory,
    context.targetAudience,
    context.brandVoice,
    ...(context.productKeywords ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function buildCompetitorIntentQueries(context: CompetitorDiscoveryContext): string[] {
  const queries: string[] = [];
  const geo = discoveryGeoLabel(context);
  const keywords = (context.productKeywords ?? []).filter(Boolean).slice(0, 6);
  const corpus = discoveryCorpus(context);
  const primaryPhrase = keywords.slice(0, 2).join(' ').trim();

  const isEventsVertical =
    /bodas?|wedding|xv a[nñ]os|eventos?|invitaci[oó]n|fiesta|planner|wedding planner|mesas|rsvp|galer[ií]a|álbum|album|fotos invitados|\bqr\b|proyecci[oó]n en vivo|live photo|memori|recuerd|celebraci[oó]n|colaborativ/i.test(
      corpus,
    );

  if (isEventsVertical) {
    if (geo) {
      queries.push(`plataformas invitación digital bodas ${geo}`);
      queries.push(`álbum colaborativo fotos invitados evento ${geo}`);
      queries.push(`software eventos digitales planners ${geo} competidores`);
      queries.push(`apps invitación digital RSVP bodas ${geo}`);
      queries.push(`memoria digital eventos fotos invitados ${geo}`);
      queries.push(`galería colaborativa fotos boda ${geo}`);
    } else {
      queries.push('plataformas invitación digital bodas competidores');
      queries.push('álbum colaborativo fotos invitados evento software');
      queries.push('apps memoria digital eventos competidores');
    }
  }

  const isSaaSVertical = /saas|software|plataforma|app\b|digital|suscripci[oó]n/i.test(corpus);
  if (isSaaSVertical && primaryPhrase) {
    queries.push(geo ? `alternativas ${primaryPhrase} ${geo}` : `alternativas ${primaryPhrase}`);
    queries.push(geo ? `mejores ${primaryPhrase} ${geo} comparativa` : `mejores ${primaryPhrase}`);
  }

  if (context.productCategory?.trim()) {
    const category = context.productCategory.trim();
    queries.push(geo ? `${category} empresas ${geo}` : `empresas ${category} competidores`);
  }

  if (context.productName?.trim() && geo) {
    queries.push(`competidores ${context.productName.trim()} ${geo}`);
  }

  return queries;
}

function buildKeywordDiscoveryQueries(context: CompetitorDiscoveryContext): string[] {
  const queries: string[] = [];
  const keywords = (context.productKeywords ?? []).filter(Boolean).slice(0, 8);
  const geo = discoveryGeoLabel(context);

  for (const keyword of keywords.slice(0, 5)) {
    queries.push(geo ? `empresas ${keyword} ${geo}` : `alternativas a ${keyword}`);
    queries.push(geo ? `${keyword} competidores ${geo}` : `competidores ${keyword}`);
  }

  if (keywords.length >= 2) {
    queries.push(
      geo
        ? `${keywords[0]} ${keywords[1]} ${geo}`
        : `empresas como ${keywords[0]} ${keywords[1]}`,
    );
  }

  if (context.productSummary?.trim()) {
    const summaryWords = context.productSummary
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 4)
      .join(' ');
    if (summaryWords) {
      queries.push(geo ? `${summaryWords} ${geo}` : summaryWords);
    }
  }

  return queries;
}
