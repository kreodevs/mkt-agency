import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../shared/decorators/public.decorator';
import { SetupInitRequestDto } from './dto/setup-init.request.dto';
import { SetupInitResponseDto } from './dto/setup-init.response.dto';
import { SetupStatusResponseDto } from './dto/setup-status.response.dto';
import { NoSuperadminExistsGuard } from './guards/no-superadmin-exists.guard';
import { SetupService } from './setup.service';

@Controller('setup')
@Public()
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  getStatus(): Promise<SetupStatusResponseDto> {
    return this.setupService.getStatus();
  }

  @Post('init')
  @UseGuards(NoSuperadminExistsGuard)
  @HttpCode(HttpStatus.CREATED)
  init(@Body() body: SetupInitRequestDto): Promise<SetupInitResponseDto> {
    return this.setupService.init(body);
  }
}
