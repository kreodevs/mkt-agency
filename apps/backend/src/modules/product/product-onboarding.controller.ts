import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  CompleteProductOnboardingResponseDto,
  ProductOnboardingStatusDto,
  SuggestProductKeywordsDto,
  SuggestProductKeywordsResponseDto,
} from './dto/product-onboarding.dto';
import { ProductOnboardingService } from './product-onboarding.service';

@Controller('products')
@UseGuards(TenantGuard)
export class ProductOnboardingController {
  constructor(private readonly productOnboarding: ProductOnboardingService) {}

  @Get(':id/onboarding')
  getOnboardingStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductOnboardingStatusDto> {
    return this.productOnboarding.getStatus(user.tenantId!, id);
  }

  @Post(':id/suggest-keywords')
  @HttpCode(HttpStatus.OK)
  suggestKeywords(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuggestProductKeywordsDto,
  ): Promise<SuggestProductKeywordsResponseDto> {
    return this.productOnboarding.suggestKeywords(user.tenantId!, id, dto.url);
  }

  @Post(':id/onboarding/complete')
  @HttpCode(HttpStatus.ACCEPTED)
  completeOnboarding(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompleteProductOnboardingResponseDto> {
    return this.productOnboarding.complete(user.tenantId!, id, user.id);
  }
}
