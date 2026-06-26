# DomainsModule

Whitelabel custom domains: CNAME/TXT verification, SSL provisioning worker.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/domains` | List tenant domains |
| POST | `/api/v1/domains` | Register domain |
| GET | `/api/v1/domains/:id` | Domain status |
| POST | `/api/v1/domains/:id/verify-dns` | Verify DNS |
| DELETE | `/api/v1/domains/:id` | Remove (not if active) |

## Env

- `DOMAIN_CNAME_TARGET` — CNAME target shown to tenants (default `dashboard.mktagency.app`)
- `DOMAIN_DNS_STUB=true` — skip real DNS lookup in dev

## Workers

- Queue `ssl-provision` — after DNS verified, provisions SSL (stub adapter; ACME in production)

## Migration

`1730000000003-CreateDomains.ts` — `custom_domains`, `dns_verifications`
