import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MANDATORY_SECTION_KEYS } from '../domain/section-keys';
import { CompanyProfileSectionEntity } from '../infrastructure/typeorm/company-profile-section.entity';

@Injectable()
export class CompletionCalculatorService {
  calculate(sections: CompanyProfileSectionEntity[]): number {
    const completedMandatory = MANDATORY_SECTION_KEYS.filter((key) =>
      sections.some(
        (section) => section.sectionKey === key && section.isCompleted,
      ),
    ).length;

    return Math.round(
      (completedMandatory / MANDATORY_SECTION_KEYS.length) * 100,
    );
  }

  isSectionDataComplete(data: Record<string, unknown>): boolean {
    return Object.values(data).some(
      (value) =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== '',
    );
  }
}
