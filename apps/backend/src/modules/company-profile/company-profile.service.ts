import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ALL_SECTION_KEYS,
  MANDATORY_SECTION_KEYS,
  SectionKey,
} from './domain/section-keys';
import { CompanyProfileCompletedEvent } from './events/company-profile-completed.event';
import { CompanyProfileSectionEntity } from './infrastructure/typeorm/company-profile-section.entity';
import { CompanyProfileEntity } from './infrastructure/typeorm/company-profile.entity';
import { OutboxEntity } from './infrastructure/typeorm/outbox.entity';
import { CompletionCalculatorService } from './services/completion-calculator.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class CompanyProfileService {
  constructor(
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(CompanyProfileSectionEntity)
    private readonly sections: Repository<CompanyProfileSectionEntity>,
    private readonly completionCalculator: CompletionCalculatorService,
    private readonly dataSource: DataSource,
  ) {}

  async getOrCreateProfile(tenantId: string) {
    let profile = await this.profiles.findOne({ where: { tenantId } });
    if (!profile) {
      profile = await this.profiles.save(
        this.profiles.create({ tenantId, status: 'pending' }),
      );
    }
    return this.toProfileResponse(profile);
  }

  async updateProfile(tenantId: string, dto: UpdateCompanyProfileDto) {
    const profile = await this.ensureProfile(tenantId);

    if (profile.status === 'completed') {
      throw new ConflictException({
        error: 'Company profile is already completed',
        code: 'CONFLICT',
      });
    }

    Object.assign(profile, {
      companyName: dto.companyName ?? profile.companyName,
      industry: dto.industry ?? profile.industry,
      website: dto.website ?? profile.website,
      brandVoice: dto.brandVoice ?? profile.brandVoice,
      targetAudienceDesc: dto.targetAudienceDesc ?? profile.targetAudienceDesc,
      competitors: dto.competitors ?? profile.competitors,
      objectives: dto.objectives ?? profile.objectives,
      visualPreferences: dto.visualPreferences ?? profile.visualPreferences,
    });

    const saved = await this.profiles.save(profile);
    return this.toProfileResponse(saved);
  }

  async listSections(tenantId: string) {
    const profile = await this.ensureProfile(tenantId);
    await this.ensureDefaultSections(profile.id);

    const sections = await this.sections.find({
      where: { profileId: profile.id },
      order: { sectionKey: 'ASC' },
    });

    return sections.map((section) => ({
      sectionKey: section.sectionKey,
      data: section.data,
      isCompleted: section.isCompleted,
      isMandatory: MANDATORY_SECTION_KEYS.includes(
        section.sectionKey as (typeof MANDATORY_SECTION_KEYS)[number],
      ),
      updatedAt: section.updatedAt,
    }));
  }

  async updateSection(tenantId: string, sectionKey: string, dto: UpdateSectionDto) {
    if (!ALL_SECTION_KEYS.includes(sectionKey as SectionKey)) {
      throw new BadRequestException({
        error: 'Invalid section key',
        code: 'VALIDATION_ERROR',
      });
    }

    const profile = await this.ensureProfile(tenantId);
    if (profile.status === 'completed') {
      throw new ConflictException({
        error: 'Company profile is already completed',
        code: 'CONFLICT',
      });
    }

    await this.ensureDefaultSections(profile.id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sectionRepo = queryRunner.manager.getRepository(
        CompanyProfileSectionEntity,
      );
      const profileRepo = queryRunner.manager.getRepository(CompanyProfileEntity);

      let section = await sectionRepo.findOne({
        where: { profileId: profile.id, sectionKey },
      });

      if (!section) {
        section = sectionRepo.create({
          profileId: profile.id,
          sectionKey,
          data: dto.data,
          isCompleted: this.completionCalculator.isSectionDataComplete(dto.data),
        });
      } else {
        section.data = dto.data;
        section.isCompleted =
          this.completionCalculator.isSectionDataComplete(dto.data);
      }

      const savedSection = await sectionRepo.save(section);
      const allSections = await sectionRepo.find({
        where: { profileId: profile.id },
      });

      const previousPercentage = profile.completionPercentage;
      const completionPercentage =
        this.completionCalculator.calculate(allSections);

      profile.completionPercentage = completionPercentage;
      if (completionPercentage >= 80) {
        profile.status = 'completed';
      }

      const savedProfile = await profileRepo.save(profile);

      if (
        completionPercentage >= 80 &&
        previousPercentage < 80 &&
        savedProfile.status === 'completed'
      ) {
        const outboxRepo = queryRunner.manager.getRepository(OutboxEntity);
        await outboxRepo.save(
          outboxRepo.create({
            aggregateType: 'company_profile',
            aggregateId: savedProfile.id,
            eventType: CompanyProfileCompletedEvent.eventType,
            payload: CompanyProfileCompletedEvent.createPayload({
              profileId: savedProfile.id,
              tenantId,
              completionPercentage,
            }),
            status: 'pending',
          }),
        );
      }

      await queryRunner.commitTransaction();

      return {
        sectionKey: savedSection.sectionKey,
        data: savedSection.data,
        isCompleted: savedSection.isCompleted,
        completionPercentage: savedProfile.completionPercentage,
        status: savedProfile.status,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createEmptyProfileForTenant(
    tenantId: string,
    manager?: DataSource['manager'],
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(CompanyProfileEntity)
      : this.profiles;

    const profile = await repo.save(repo.create({ tenantId, status: 'pending' }));
    const sectionRepo = manager
      ? manager.getRepository(CompanyProfileSectionEntity)
      : this.sections;

    for (const key of ALL_SECTION_KEYS) {
      await sectionRepo.save(
        sectionRepo.create({
          profileId: profile.id,
          sectionKey: key,
          data: {},
          isCompleted: false,
        }),
      );
    }
  }

  private async ensureProfile(tenantId: string): Promise<CompanyProfileEntity> {
    let profile = await this.profiles.findOne({ where: { tenantId } });
    if (!profile) {
      profile = await this.profiles.save(
        this.profiles.create({ tenantId, status: 'pending' }),
      );
    }
    return profile;
  }

  private async ensureDefaultSections(profileId: string): Promise<void> {
    const existing = await this.sections.find({ where: { profileId } });
    const existingKeys = new Set(existing.map((s) => s.sectionKey));

    for (const key of ALL_SECTION_KEYS) {
      if (!existingKeys.has(key)) {
        await this.sections.save(
          this.sections.create({
            profileId,
            sectionKey: key,
            data: {},
            isCompleted: false,
          }),
        );
      }
    }
  }

  private toProfileResponse(profile: CompanyProfileEntity) {
    return {
      id: profile.id,
      tenantId: profile.tenantId,
      companyName: profile.companyName,
      industry: profile.industry,
      website: profile.website,
      brandVoice: profile.brandVoice,
      targetAudienceDesc: profile.targetAudienceDesc,
      competitors: profile.competitors,
      objectives: profile.objectives,
      visualPreferences: profile.visualPreferences,
      completionPercentage: profile.completionPercentage,
      status: profile.status,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
