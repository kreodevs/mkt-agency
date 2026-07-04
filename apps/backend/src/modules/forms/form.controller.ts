import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import {
  CreateFormDto,
  SubmitFormDto,
  UpdateFormDto,
} from './dto/form.request.dto';
import {
  FormResponseDto,
  FormSnippetResponseDto,
  PaginatedFormSubmissionsResponseDto,
  PaginatedFormsResponseDto,
  PublicFormResponseDto,
  SubmitFormResponseDto,
} from './dto/form.response.dto';
import { FormService } from './form.service';

@Controller('forms')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Get()
  @UseGuards(TenantGuard)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PaginatedFormsResponseDto> {
    return this.formService.list(user.tenantId!, page, limit);
  }

  @Post()
  @UseGuards(TenantGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateFormDto,
  ): Promise<FormResponseDto> {
    return this.formService.create(user.tenantId!, body);
  }

  @Get('capture')
  @UseGuards(TenantGuard)
  ensureCapture(
    @CurrentUser() user: AuthenticatedUser,
    @Query('productId') productId?: string,
  ): Promise<FormResponseDto> {
    return this.formService.ensureCaptureForm(user.tenantId!, productId);
  }

  @Public()
  @Post(':id/submit')
  @HttpCode(HttpStatus.CREATED)
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SubmitFormDto,
  ): Promise<SubmitFormResponseDto> {
    return this.formService.submit(id, body);
  }

  @Get(':id/snippet')
  @UseGuards(TenantGuard)
  snippet(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FormSnippetResponseDto> {
    return this.formService.getSnippet(user.tenantId!, id);
  }

  @Public()
  @Get(':id/public')
  publicForm(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PublicFormResponseDto> {
    return this.formService.findPublicForm(id);
  }

  @Get(':id/submissions')
  @UseGuards(TenantGuard)
  submissions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PaginatedFormSubmissionsResponseDto> {
    return this.formService.listSubmissions(user.tenantId!, id, page, limit);
  }

  @Get(':id')
  @UseGuards(TenantGuard)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FormResponseDto> {
    return this.formService.findOne(user.tenantId!, id);
  }

  @Patch(':id')
  @UseGuards(TenantGuard)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFormDto,
  ): Promise<FormResponseDto> {
    return this.formService.update(user.tenantId!, id, body);
  }

  @Delete(':id')
  @UseGuards(TenantGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.formService.remove(user.tenantId!, id);
  }
}
