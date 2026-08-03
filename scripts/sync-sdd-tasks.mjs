#!/usr/bin/env node
/**
 * Marks SDD task checkboxes [x] when implementation evidence exists in the repo.
 * Updates specs/001-mkt-agency-os/tasks.md, docs/sdd/tasks.md, and docs/sdd/PROGRESO.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Task line must match pattern AND all files must exist (relative to repo root). */
const EVIDENCE = [
  {
    pattern: /company_profiles|company_profile_sections/,
    files: [
      'apps/backend/src/modules/company-profile/infrastructure/typeorm/company-profile.entity.ts',
      'apps/backend/src/modules/company-profile/infrastructure/typeorm/company-profile-section.entity.ts',
    ],
  },
  {
    pattern: /POST \/api\/v1\/assets\/upload|assets\/upload/,
    files: ['apps/backend/src/modules/assets/asset.controller.ts'],
  },
  {
    pattern: /CRUD de assets|GET\/:id, PATCH\/:id, DELETE\/:id/,
    files: ['apps/backend/src/modules/assets/asset.service.ts'],
  },
  {
    pattern: /download-url|URL firmada/,
    files: ['apps/backend/src/modules/assets/asset.controller.ts'],
  },
  {
    pattern: /assets\/:id\/duplicate/,
    files: ['apps/backend/src/modules/assets/asset.controller.ts'],
  },
  {
    pattern: /asset-folders|carpetas/,
    files: ['apps/backend/src/modules/assets/asset-folder.controller.ts'],
  },
  {
    pattern: /asset-tags|etiquetas/,
    files: ['apps/backend/src/modules/assets/asset-tag.controller.ts'],
  },
  {
    pattern: /adaptador S3|S3StorageAdapter/,
    files: ['apps/backend/src/modules/assets/infrastructure/adapters/s3-storage.adapter.ts'],
  },
  {
    pattern: /tablas `assets`|asset_tag_assignments/,
    files: ['apps/backend/src/modules/assets/infrastructure/typeorm/asset.entity.ts'],
  },
  {
    pattern: /librería multimedia|AssetLibraryPage/,
    files: ['apps/web/src/pages/assets/AssetLibraryPage.tsx'],
  },
  {
    pattern: /dominios personalizados|custom_domains/,
    files: ['apps/backend/src/modules/domains/domains.module.ts'],
  },
  {
    pattern: /verify-dns|verificación DNS/,
    files: ['apps/backend/src/modules/domains/adapters/node-dns.adapter.ts'],
  },
  {
    pattern: /dns_verifications/,
    files: ['apps/backend/src/modules/domains/infrastructure/typeorm/dns-verification.entity.ts'],
  },
  {
    pattern: /POST \/api\/v1\/proposals|propuesta IA/,
    files: ['apps/backend/src/modules/proposals/proposals.module.ts'],
  },
  {
    pattern: /proposals\/:id\/sign|firma digital/,
    files: ['apps/backend/src/modules/proposals/proposals.module.ts'],
  },
  {
    pattern: /tabla `proposals`/,
    files: ['apps/backend/src/modules/proposals/infrastructure/typeorm/proposal.entity.ts'],
  },
  {
    pattern: /CRUD de reportes|reportes \(POST/,
    files: ['apps/backend/src/modules/reports/reports.module.ts'],
  },
  {
    pattern: /tabla `reports`/,
    files: ['apps/backend/src/modules/reports/infrastructure/typeorm/report.entity.ts'],
  },
  {
    pattern: /CRUD de competidores/,
    files: ['apps/backend/src/modules/competitors/competitors.module.ts'],
  },
  {
    pattern: /competitor_mentions/,
    files: ['apps/backend/src/modules/competitors/infrastructure/typeorm/competitor-mention.entity.ts'],
  },
  {
    pattern: /GET \/api\/v1\/audit-logs|audit-logs/,
    files: ['apps/backend/src/modules/audit/audit.module.ts'],
  },
  {
    pattern: /tabla `audit_logs`/,
    files: ['apps/backend/src/modules/users/infrastructure/typeorm/audit-log.entity.ts'],
  },
  {
    pattern: /página de login|LoginPage/,
    files: ['apps/web/src/pages/auth/LoginPage.tsx'],
  },
  {
    pattern: /setup inicial|SetupPage/,
    files: ['apps/web/src/pages/setup/SetupPage.tsx'],
  },
  {
    pattern: /onboarding progresivo|OnboardingWizardPage/,
    files: ['apps/web/src/pages/onboarding/OnboardingWizardPage.tsx'],
  },
  {
    pattern: /listado de formularios|FormListPage/,
    files: ['apps/web/src/pages/forms/FormListPage.tsx'],
  },
  {
    pattern: /propuestas comerciales|ProposalListPage/,
    files: ['apps/web/src/pages/proposals/ProposalListPage.tsx'],
  },
  {
    pattern: /página de reportes|ReportListPage/,
    files: ['apps/web/src/pages/reports/ReportListPage.tsx'],
  },
  {
    pattern: /competidores|CompetitorsPage/,
    files: ['apps/web/src/pages/settings/CompetitorsPage.tsx'],
  },
  {
    pattern: /logs de auditoría|AuditLogsPage/,
    files: ['apps/web/src/pages/admin/AuditLogsPage.tsx'],
  },
  {
    pattern: /eventos de seguridad|SecurityEventsPage/,
    files: ['apps/web/src/pages/admin/SecurityEventsPage.tsx'],
  },
  {
    pattern: /banner de impersonación|ImpersonationContextBar/,
    files: ['apps/web/src/components/layout/ImpersonationContextBar.tsx'],
  },
  {
    pattern: /Dockerfile\.api/,
    files: ['Dockerfile.api'],
  },
  {
    pattern: /Dockerfile\.frontend/,
    files: ['Dockerfile.frontend'],
  },
  {
    pattern: /docker-compose\.yml/,
    files: ['docker-compose.yml'],
  },
  {
    pattern: /\.env\.example/,
    files: ['.env.example'],
  },
  {
    pattern: /React Router|lazy loading/,
    files: ['apps/web/src/router/index.tsx'],
  },
  {
    pattern: /TanStack Query|React Query/,
    files: ['apps/web/package.json'],
  },
  {
    pattern: /Zustand/,
    files: ['apps/web/package.json'],
  },
  {
    pattern: /layout con sidebar|AppLayout|DashboardShell/,
    files: ['apps/web/src/components/organisms/AppLayout.tsx'],
  },
  {
    pattern: /protección de rutas|AuthGuard/,
    files: ['apps/web/src/guards/AuthGuard.tsx'],
  },
  {
    pattern: /OpenRouter|openrouter-/,
    files: ['apps/backend/src/shared/ai/llm-provider-bootstrap.service.ts'],
  },
  {
    pattern: /adaptadores para APIs externas|Replicate|ElevenLabs/,
    files: [
      'apps/backend/src/modules/agents/adapters/replicate-talking-head.adapter.ts',
      'apps/backend/src/modules/agents/adapters/tts-generation.adapters.ts',
    ],
  },
  {
    pattern: /CommandBus|QueryBus|CQRS/,
    files: ['apps/backend/src/modules/setup/setup.service.ts'],
  },
  {
    pattern: /tabla `outbox`/,
    files: ['apps/backend/src/modules/company-profile/infrastructure/typeorm/outbox.entity.ts'],
  },
  {
    pattern: /worker de outbox|outbox-publisher|OutboxDispatcher/,
    files: [
      'apps/backend/src/modules/outbox/outbox-dispatcher.service.ts',
      'apps/backend/src/modules/outbox/workers/outbox-dispatcher.worker.ts',
    ],
  },
  {
    pattern: /Circuit Breaker en adaptadores de IA|circuit-breaker/,
    files: [
      'apps/backend/src/shared/ai/llm-circuit-breaker.service.ts',
      'apps/backend/src/shared/ai/llm.client.ts',
    ],
  },
  {
    pattern: /tabla `events`/,
    files: ['apps/backend/src/modules/content/infrastructure/typeorm/event.entity.ts'],
  },
  {
    pattern: /rate limiting/,
    files: ['apps/backend/src/modules/auth/guards/rate-limit.guard.ts'],
  },
  {
    pattern: /tenant_id desde JWT|TenantGuard/,
    files: ['apps/backend/src/shared/guards/tenant.guard.ts'],
  },
];

function fileExists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function evidenceMatches(line) {
  for (const rule of EVIDENCE) {
    if (!rule.pattern.test(line)) continue;
    if (rule.files.every(fileExists)) return true;
  }
  return false;
}

function syncFile(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    console.warn(`Skip missing: ${relPath}`);
    return 0;
  }
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  let changed = 0;
  const next = lines.map((line) => {
    if (!line.includes('- [ ]')) return line;
    if (!evidenceMatches(line)) return line;
    changed += 1;
    return line.replace('- [ ]', '- [x]');
  });
  if (changed > 0) {
    fs.writeFileSync(abs, next.join('\n'));
    console.log(`${relPath}: marked ${changed} task(s) done`);
  }
  return changed;
}

const targets = [
  'specs/001-mkt-agency-os/tasks.md',
  'docs/sdd/tasks.md',
  'docs/sdd/PROGRESO.md',
];

let total = 0;
for (const t of targets) total += syncFile(t);
console.log(`Total tasks marked: ${total}`);
