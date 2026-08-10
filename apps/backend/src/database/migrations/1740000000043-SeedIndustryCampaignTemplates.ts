import { MigrationInterface, QueryRunner } from 'typeorm';

const INDUSTRY_TEMPLATES = [
  {
    name: 'Restaurante — llenar mesas entre semana',
    description: 'Promociones de almuerzo, menú del día y reservas por DM.',
    objective: 'leads',
    platforms: ['instagram', 'facebook'],
    industry: 'restaurants',
    copilotHint: 'Destaca plato estrella, horario feliz y CTA a reservar por WhatsApp.',
    budgetDistribution: { instagram: 60, facebook: 40 },
  },
  {
    name: 'E-commerce — lanzamiento de colección',
    description: 'Carrusel de producto, oferta limitada y retargeting manual.',
    objective: 'sales',
    platforms: ['instagram', 'facebook'],
    industry: 'retail',
    copilotHint: 'Urgencia + prueba social + enlace a checkout con UTM.',
    budgetDistribution: { instagram: 70, facebook: 30 },
  },
  {
    name: 'Servicios B2B — generación de leads',
    description: 'Autoridad, caso de éxito y formulario de diagnóstico.',
    objective: 'leads',
    platforms: ['linkedin', 'instagram'],
    industry: 'professional_services',
    copilotHint: 'Problema del cliente → método propio → llamada a la acción a agendar.',
    budgetDistribution: { linkedin: 55, instagram: 45 },
  },
  {
    name: 'Salud y bienestar — agenda de citas',
    description: 'Educación + testimonios + promoción de primera visita.',
    objective: 'leads',
    platforms: ['instagram', 'facebook'],
    industry: 'health_wellness',
    copilotHint: 'Beneficio tangible, antes/después permitido y CTA a agendar cita.',
    budgetDistribution: { instagram: 65, facebook: 35 },
  },
  {
    name: 'Inmobiliaria — captación de compradores',
    description: 'Tour virtual, ubicación y financiamiento.',
    objective: 'leads',
    platforms: ['instagram', 'facebook'],
    industry: 'real_estate',
    copilotHint: 'Ubicación, precio desde, amenidades y visita guiada.',
    budgetDistribution: { instagram: 50, facebook: 50 },
  },
  {
    name: 'Educación — inscripciones',
    description: 'Webinar gratuito, temario y becas limitadas.',
    objective: 'leads',
    platforms: ['instagram', 'facebook', 'linkedin'],
    industry: 'education',
    copilotHint: 'Resultado del alumno, fecha de inicio y cupos limitados.',
    budgetDistribution: { instagram: 40, facebook: 30, linkedin: 30 },
  },
];

export class SeedIndustryCampaignTemplates1740000000043 implements MigrationInterface {
  name = 'SeedIndustryCampaignTemplates1740000000043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const template of INDUSTRY_TEMPLATES) {
      const existing = await queryRunner.query(
        `SELECT id FROM campaign_templates
         WHERE is_predefined = true AND name = $1
         LIMIT 1`,
        [template.name],
      );

      if (existing.length > 0) {
        continue;
      }

      await queryRunner.query(
        `INSERT INTO campaign_templates (
          tenant_id, name, description, objective, platforms,
          budget_distribution, agent_config, is_predefined
        ) VALUES (
          NULL, $1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, true
        )`,
        [
          template.name,
          template.description,
          template.objective,
          JSON.stringify(template.platforms),
          JSON.stringify(template.budgetDistribution),
          JSON.stringify({
            industry: template.industry,
            copilotHint: template.copilotHint,
            suggestedAngles: [template.copilotHint],
          }),
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const names = INDUSTRY_TEMPLATES.map((item) => item.name);
    await queryRunner.query(
      `DELETE FROM campaign_templates
       WHERE is_predefined = true AND name = ANY($1::text[])`,
      [names],
    );
  }
}
