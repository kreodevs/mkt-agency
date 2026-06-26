import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CompanyProfileService } from './company-profile.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Controller('company-profile')
@UseGuards(TenantGuard)
export class CompanyProfileController {
  constructor(private readonly companyProfileService: CompanyProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.companyProfileService.getOrCreateProfile(user.tenantId!);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateCompanyProfileDto,
  ) {
    return this.companyProfileService.updateProfile(user.tenantId!, body);
  }

  @Get('sections')
  listSections(@CurrentUser() user: AuthenticatedUser) {
    return this.companyProfileService.listSections(user.tenantId!);
  }

  @Patch('sections/:key')
  updateSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('key') key: string,
    @Body() body: UpdateSectionDto,
  ) {
    return this.companyProfileService.updateSection(user.tenantId!, key, body);
  }

  @Post('sections/:key/suggest')
  @HttpCode(HttpStatus.ACCEPTED)
  suggestSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('key') key: string,
  ) {
    return this.companyProfileService.requestSectionSuggestion(user.tenantId!, key);
  }

  @Get('suggestions/:assignmentId')
  getSuggestionAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.companyProfileService.getSuggestionAssignment(
      user.tenantId!,
      assignmentId,
    );
  }
}
