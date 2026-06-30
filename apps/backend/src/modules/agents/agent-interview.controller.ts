import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { AgentInterviewService } from './agent-interview.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { AgentType } from './domain/agent-interview.entity';
import { WebsiteAnalyzerService } from './website-analyzer.service';

@Controller('agents')
@UseGuards(TenantGuard)
export class AgentInterviewController {
  constructor(
    private readonly agentInterview: AgentInterviewService,
    private readonly websiteAnalyzer: WebsiteAnalyzerService,
  ) {}

  @Get('interviews')
  listInterviews(@CurrentUser() user: AuthenticatedUser) {
    return this.agentInterview.listInterviews(user.tenantId!);
  }

  @Post('interviews')
  @HttpCode(HttpStatus.CREATED)
  createInterview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateInterviewDto,
  ) {
    return this.agentInterview.createInterview(
      user.tenantId!,
      body.agentType as AgentType,
    );
  }

  @Get('interviews/:id')
  getInterview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.agentInterview.getInterview(user.tenantId!, id);
  }

  @Post('interviews/:id/answer')
  submitAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: SubmitAnswerDto,
  ) {
    return this.agentInterview.submitAnswer(user.tenantId!, id, body.answer);
  }

  @Post('interviews/:id/retry-brief')
  @HttpCode(HttpStatus.ACCEPTED)
  retryBrandBrief(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.agentInterview.retryBrandBrief(user.tenantId!, id);
  }

  @Post('analyze-website')
  async analyzeWebsite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { url: string },
  ) {
    return this.websiteAnalyzer.analyze(body.url);
  }
}