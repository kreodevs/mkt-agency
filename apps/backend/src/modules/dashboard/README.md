# dashboard

- `GET /dashboard/metrics` — KPIs agregados del tenant.
- `GET /dashboard/agency-home` — escritorio Inicio (próximo contenido, estrategia, leads). La consulta de contenidos programados no usa `leftJoinAndMapOne` (rompe `orderBy` en TypeORM).
