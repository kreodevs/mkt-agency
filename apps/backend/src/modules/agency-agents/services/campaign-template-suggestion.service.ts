import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyProfileSectionEntity } from '../../company-profile/infrastructure/typeorm/company-profile-section.entity';
import { CompanyProfileEntity } from '../../company-profile/infrastructure/typeorm/company-profile.entity';
import { ProfileSectionSyncService } from '../../company-profile/services/profile-section-sync.service';
import { ProductService } from '../../product/product.service';
import { CampaignTemplateEntity } from '../../campaign/infrastructure/typeorm/campaign-template.entity';

export interface CampaignTemplateSuggestion {
  templateId: string;
  name: string;
  description: string | null;
  objective: string | null;
  platforms: string[];
  industry: string;
  copilotHint: string;
  matchScore: number;
}

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  restaurants: ['restaur', 'comida', 'food', 'café', 'cafe', 'bar', 'cocina', 'gastronom'],
  retail: ['retail', 'tienda', 'ecommerce', 'e-commerce', 'moda', 'shop', 'venta online'],
  professional_services: [
    'consult',
    'b2b',
    'servicio',
    'agencia',
    'software',
    'saas',
    'legal',
    'contab',
  ],
  health_wellness: ['salud', 'wellness', 'clínica', 'clinica', 'spa', 'fitness', 'nutri'],
  real_estate: ['inmobil', 'real estate', 'propiedad', 'vivienda', 'departamento'],
  education: ['educ', 'curso', 'academia', 'capacit', 'formación', 'formacion', 'bootcamp'],
};

@Injectable()
export class CampaignTemplateSuggestionService {
  constructor(
    @InjectRepository(CampaignTemplateEntity)
    private readonly templates: Repository<CampaignTemplateEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(CompanyProfileSectionEntity)
    private readonly profileSections: Repository<CompanyProfileSectionEntity>,
    private readonly profileSectionSync: ProfileSectionSyncService,
    private readonly productService: ProductService,
  ) {}

  async suggestForProduct(
    tenantId: string,
    productId?: string,
    limit = 3,
  ): Promise<CampaignTemplateSuggestion[]> {
    const industryHint = await this.resolveIndustryHint(tenantId, productId);
    const predefined = await this.templates.find({
      where: { isPredefined: true },
      order: { createdAt: 'ASC' },
    });

    const scored = predefined
      .map((template) => {
        const agentConfig = template.agentConfig as Record<string, unknown>;
        const industry = String(agentConfig.industry ?? 'general');
        const copilotHint = String(agentConfig.copilotHint ?? template.description ?? '');
        const matchScore = this.scoreIndustryMatch(industry, industryHint);

        return {
          templateId: template.id,
          name: template.name,
          description: template.description,
          objective: template.objective,
          platforms: template.platforms,
          industry,
          copilotHint,
          matchScore,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return scored.slice(0, limit);
  }

  private async resolveIndustryHint(tenantId: string, productId?: string): Promise<string> {
    const profile = await this.profiles.findOne({ where: { tenantId } });
    const sections = profile
      ? await this.profileSections.find({ where: { profileId: profile.id } })
      : [];
    const resolved = this.profileSectionSync.resolveProfileValues(profile, sections);
    const parts = [
      resolved.industry ?? '',
      resolved.companyName ?? '',
      resolved.targetAudienceDesc ?? '',
    ];

    if (productId) {
      try {
        const product = await this.productService.findOwnedEntity(tenantId, productId);
        parts.push(
          product.name,
          product.category ?? '',
          product.targetAudience ?? '',
          product.description ?? '',
          ...(Array.isArray(product.keywords) ? product.keywords.map(String) : []),
        );
      } catch {
        // product optional
      }
    }

    return parts.join(' ').toLowerCase();
  }

  private scoreIndustryMatch(templateIndustry: string, hint: string): number {
    const keywords = INDUSTRY_KEYWORDS[templateIndustry] ?? [];
    let score = templateIndustry === 'general' ? 1 : 0;

    for (const keyword of keywords) {
      if (hint.includes(keyword)) {
        score += 10;
      }
    }

    if (hint.includes(templateIndustry.replace('_', ' '))) {
      score += 8;
    }

    return score;
  }
}
