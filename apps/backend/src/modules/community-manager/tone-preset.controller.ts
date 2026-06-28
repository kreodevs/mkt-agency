import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { CreateTonePresetDto, UpdateTonePresetDto } from './dto/tone-preset.dto';
import { TonePresetEntity } from './infrastructure/typeorm/tone-preset.entity';

@Controller('community-manager/tone-presets')
@UseGuards(TenantGuard)
export class TonePresetController {
  constructor(
    @InjectRepository(TonePresetEntity)
    private readonly presets: Repository<TonePresetEntity>,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.presets.find({
      where: { tenantId: user.tenantId! },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTonePresetDto,
  ) {
    const saved = await this.presets.save(
      this.presets.create({
        tenantId: user.tenantId!,
        name: dto.name,
        toneText: dto.toneText,
        source: 'manual',
        isDefault: false,
      }),
    );
    return saved;
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTonePresetDto,
  ) {
    const preset = await this.presets.findOne({ where: { id, tenantId: user.tenantId! } });
    if (!preset) throw new NotFoundException();
    if (dto.name !== undefined) preset.name = dto.name;
    if (dto.toneText !== undefined) preset.toneText = dto.toneText;
    return this.presets.save(preset);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const preset = await this.presets.findOne({ where: { id, tenantId: user.tenantId! } });
    if (!preset) throw new NotFoundException();
    await this.presets.remove(preset);
  }
}