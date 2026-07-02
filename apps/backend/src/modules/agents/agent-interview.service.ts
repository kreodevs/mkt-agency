import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { ProductService } from '../product/product.service';
import { getInterviewQuestion, getInterviewQuestions } from './adapters/interview.questions';
import { brandBriefToMarkdown } from './brand-brief-markdown.util';
import { buildBrandInterviewAnswersFromOnboarding } from './domain/brand-interview-prefill.util';
import {
  isProductOnboardingCompleted,
  isProductOnboardingReady,
} from '../product/domain/product-onboarding.util';
import { AgentInterviewMessageEntity } from './domain/agent-interview-message.entity';
import { AgentInterviewEntity, AgentType } from './domain/agent-interview.entity';
import { InterviewResponseDto } from './dto/interview-response.dto';
import { BrandInterviewWorkerService } from './workers/brand-interview.worker';

@Injectable()
export class AgentInterviewService {
  private readonly logger = new Logger(AgentInterviewService.name);

  constructor(
    @InjectRepository(AgentInterviewEntity)
    private readonly interviews: Repository<AgentInterviewEntity>,
    @InjectRepository(AgentInterviewMessageEntity)
    private readonly messages: Repository<AgentInterviewMessageEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly companyProfiles: Repository<CompanyProfileEntity>,
    private readonly productService: ProductService,
    private readonly interviewWorker: BrandInterviewWorkerService,
  ) {}

  async listInterviews(tenantId: string): Promise<InterviewResponseDto[]> {
    const interviews = await this.interviews.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(interviews.map((i) => this.toResponse(i)));
  }

  async findCompletedBrandInterview(
    tenantId: string,
    productId: string,
  ): Promise<AgentInterviewEntity | null> {
    return this.interviews.findOne({
      where: {
        tenantId,
        productId,
        agentType: 'brand_interview',
        status: 'completed',
      },
      order: { createdAt: 'DESC' },
    });
  }

  async createInterview(
    tenantId: string,
    agentType: AgentType,
    productId?: string,
  ): Promise<InterviewResponseDto> {
    const active = await this.interviews.findOne({
      where: { tenantId, agentType, status: 'in_progress' },
    });
    if (active) {
      const upgraded = await this.tryUpgradeLegacyInterview(tenantId, active, productId);
      if (upgraded) {
        return upgraded;
      }

      throw new ConflictException({
        error: `Ya tienes una entrevista de tipo "${agentType}" en progreso`,
        code: 'CONFLICT',
        interviewId: active.id,
      });
    }

    let productName: string | null = null;
    if (productId) {
      const product = await this.productService.findOwnedEntity(tenantId, productId);
      productName = product.name;

      if (agentType === 'brand_interview') {
        if (isProductOnboardingCompleted(product) || isProductOnboardingReady(product)) {
          return this.createBrandBriefFromOnboarding(tenantId, product, productName);
        }
      }
    }

    const questions = getInterviewQuestions(agentType);
    const interview = await this.interviews.save(
      this.interviews.create({
        tenantId,
        agentType,
        productId: productId ?? null,
        status: 'in_progress',
        currentStep: 0,
        totalSteps: questions.length,
        answers: {},
        brandBrief: null,
      }),
    );

    const firstQuestion = questions[0];
    const firstContent = productName
      ? `Enfoque de esta entrevista: **${productName}**. ${firstQuestion.question}`
      : firstQuestion.question;

    await this.messages.save(
      this.messages.create({
        interviewId: interview.id,
        role: 'agent',
        content: firstContent,
        metadata: { hint: firstQuestion.hint, step: 1, productId: productId ?? null },
      }),
    );

    return this.toResponse(interview, productName);
  }

  private async createBrandBriefFromOnboarding(
    tenantId: string,
    product: ProductEntity,
    productName: string,
  ): Promise<InterviewResponseDto> {
    const existing = await this.findCompletedBrandInterview(tenantId, product.id);
    if (existing) {
      return this.toResponse(existing, productName);
    }

    const profile =
      (await this.companyProfiles.findOne({ where: { tenantId } })) ??
      (await this.companyProfiles.save(this.companyProfiles.create({ tenantId, status: 'pending' })));
    const answers = buildBrandInterviewAnswersFromOnboarding(product, profile);
    const questions = getInterviewQuestions('brand_interview');

    const interview = await this.interviews.save(
      this.interviews.create({
        tenantId,
        agentType: 'brand_interview',
        productId: product.id,
        status: 'in_progress',
        currentStep: questions.length,
        totalSteps: questions.length,
        answers,
        brandBrief: null,
      }),
    );

    await this.messages.save(
      this.messages.create({
        interviewId: interview.id,
        role: 'agent',
        content: `Ya tengo el contexto de **${productName}** desde el onboarding del producto (descripción, propuesta de valor, audiencia y tags). No hace falta repetir esas preguntas: estoy generando tu Brand Brief con esa información.`,
        metadata: { type: 'onboarding_skip', step: questions.length, productId: product.id },
      }),
    );

    await this.messages.save(
      this.messages.create({
        interviewId: interview.id,
        role: 'agent',
        content:
          'Analizando los datos del onboarding para redactar tu Brand Brief. Esto tomará solo unos segundos...',
        metadata: { step: questions.length, type: 'processing' },
      }),
    );

    this.interviewWorker.enqueue(interview.id);
    return this.toResponse(interview, productName);
  }

  async getInterview(tenantId: string, interviewId: string): Promise<InterviewResponseDto> {
    let interview = await this.interviews.findOne({
      where: { id: interviewId, tenantId },
    });
    if (!interview) {
      throw new NotFoundException({ error: 'Entrevista no encontrada', code: 'NOT_FOUND' });
    }

    interview = await this.reconcileLegacyManualInterview(tenantId, interview);
    return this.toResponse(interview);
  }

  async submitAnswer(
    tenantId: string,
    interviewId: string,
    answer: string,
  ): Promise<InterviewResponseDto> {
    const interview = await this.interviews.findOne({
      where: { id: interviewId, tenantId },
    });
    if (!interview) {
      throw new NotFoundException({ error: 'Entrevista no encontrada', code: 'NOT_FOUND' });
    }
    if (interview.status !== 'in_progress') {
      throw new BadRequestException({
        error: 'La entrevista ya está completada',
        code: 'BAD_REQUEST',
      });
    }

    const question = getInterviewQuestion(interview.agentType, interview.currentStep + 1);
    if (!question) {
      throw new BadRequestException({
        error: 'No hay más preguntas en esta entrevista',
        code: 'BAD_REQUEST',
      });
    }

    // Save user answer
    await this.messages.save(
      this.messages.create({
        interviewId,
        role: 'user',
        content: answer,
      }),
    );

    // Update answers in interview
    const updatedAnswers = { ...interview.answers, [question.key]: answer };
    interview.answers = updatedAnswers;
    interview.currentStep += 1;

    const isLastStep = interview.currentStep >= interview.totalSteps;

    if (isLastStep) {
      // All questions answered — add processing message and enqueue analysis
      interview.status = 'in_progress'; // stays in_progress while processing
      await this.interviews.save(interview);

      await this.messages.save(
        this.messages.create({
          interviewId,
          role: 'agent',
          content:
            '¡Gracias! He reunido toda la información necesaria. Ahora estoy analizando tus respuestas para generar el Brand Brief de tu marca. Esto tomará solo unos segundos... 🤖',
          metadata: { step: interview.currentStep, type: 'processing' },
        }),
      );

      // Enqueue async brand brief generation
      this.interviewWorker.enqueue(interview.id);
    } else {
      // More questions — save and generate next
      const nextQuestion = getInterviewQuestion(interview.agentType, interview.currentStep + 1);
      interview.answers = updatedAnswers;
      await this.interviews.save(interview);

      await this.messages.save(
        this.messages.create({
          interviewId,
          role: 'agent',
          content: nextQuestion!.question,
          metadata: { hint: nextQuestion!.hint, step: interview.currentStep + 1 },
        }),
      );
    }

    // Reload with messages
    const reloaded = await this.interviews.findOne({
      where: { id: interviewId, tenantId },
    });
    return this.toResponse(reloaded!);
  }

  async retryBrandBrief(tenantId: string, interviewId: string): Promise<InterviewResponseDto> {
    const interview = await this.interviews.findOne({
      where: { id: interviewId, tenantId },
    });
    if (!interview) {
      throw new NotFoundException({ error: 'Entrevista no encontrada', code: 'NOT_FOUND' });
    }
    if (interview.status !== 'failed') {
      throw new BadRequestException({
        error: 'Solo puedes reintentar entrevistas fallidas',
        code: 'BAD_REQUEST',
      });
    }
    if (interview.currentStep < interview.totalSteps) {
      throw new BadRequestException({
        error: 'Completa todas las preguntas antes de reintentar',
        code: 'BAD_REQUEST',
      });
    }

    interview.status = 'in_progress';
    interview.errorMessage = null;
    await this.interviews.save(interview);
    this.interviewWorker.enqueue(interviewId);

    return this.toResponse(interview);
  }

  private isLegacyManualInterview(interview: AgentInterviewEntity): boolean {
    return (
      interview.agentType === 'brand_interview' &&
      interview.status === 'in_progress' &&
      interview.currentStep < interview.totalSteps
    );
  }

  private async tryUpgradeLegacyInterview(
    tenantId: string,
    interview: AgentInterviewEntity,
    requestedProductId?: string,
  ): Promise<InterviewResponseDto | null> {
    if (!this.isLegacyManualInterview(interview) || !interview.productId) {
      return null;
    }
    if (requestedProductId && interview.productId !== requestedProductId) {
      return null;
    }

    const product = await this.productService.findOwnedEntity(tenantId, interview.productId);
    if (!isProductOnboardingCompleted(product) && !isProductOnboardingReady(product)) {
      return null;
    }

    const reconciled = await this.reconcileLegacyManualInterview(tenantId, interview);
    return this.toResponse(reconciled);
  }

  private async reconcileLegacyManualInterview(
    tenantId: string,
    interview: AgentInterviewEntity,
  ): Promise<AgentInterviewEntity> {
    if (!this.isLegacyManualInterview(interview) || !interview.productId) {
      return interview;
    }

    const product = await this.productService.findOwnedEntity(tenantId, interview.productId);
    if (!isProductOnboardingCompleted(product) && !isProductOnboardingReady(product)) {
      return interview;
    }

    const existing = await this.findCompletedBrandInterview(tenantId, product.id);
    if (existing) {
      await this.interviews.delete(interview.id);
      this.logger.log(
        `Removed stale manual interview ${interview.id}; product ${product.id} already has brief`,
      );
      return existing;
    }

    return this.upgradeManualInterviewToOnboardingBrief(tenantId, interview, product);
  }

  private async upgradeManualInterviewToOnboardingBrief(
    tenantId: string,
    interview: AgentInterviewEntity,
    product: ProductEntity,
  ): Promise<AgentInterviewEntity> {
    const profile =
      (await this.companyProfiles.findOne({ where: { tenantId } })) ??
      (await this.companyProfiles.save(this.companyProfiles.create({ tenantId, status: 'pending' })));
    const answers = buildBrandInterviewAnswersFromOnboarding(product, profile);
    const questions = getInterviewQuestions('brand_interview');

    interview.answers = answers;
    interview.currentStep = questions.length;
    interview.totalSteps = questions.length;
    interview.errorMessage = null;
    await this.interviews.save(interview);

    await this.messages.delete({ interviewId: interview.id });

    await this.messages.save(
      this.messages.create({
        interviewId: interview.id,
        role: 'agent',
        content: `Ya tengo el contexto de **${product.name}** desde el onboarding del producto. Cancelé la entrevista manual y estoy generando tu Brand Brief con esos datos.`,
        metadata: { type: 'onboarding_skip', step: questions.length, productId: product.id },
      }),
    );

    await this.messages.save(
      this.messages.create({
        interviewId: interview.id,
        role: 'agent',
        content:
          'Analizando los datos del onboarding para redactar tu Brand Brief. Esto tomará solo unos segundos...',
        metadata: { step: questions.length, type: 'processing' },
      }),
    );

    this.interviewWorker.enqueue(interview.id);
    this.logger.log(`Upgraded legacy manual interview ${interview.id} to onboarding brief`);
    return interview;
  }

  private async reconcileStaleFailure(interview: AgentInterviewEntity): Promise<void> {
    if (interview.status !== 'failed') {
      return;
    }
    if (!this.resolveBrandBriefMarkdown(interview)) {
      return;
    }

    interview.status = 'completed';
    interview.errorMessage = null;
    await this.interviews.save(interview);
    this.logger.log(`Reconciled interview ${interview.id}: brief exists, status set to completed`);
  }

  private async toResponse(
    interview: AgentInterviewEntity,
    productNameOverride?: string | null,
  ): Promise<InterviewResponseDto> {
    await this.reconcileStaleFailure(interview);

    const msgs = await this.messages.find({
      where: { interviewId: interview.id },
      order: { createdAt: 'ASC' },
    });

    let productName = productNameOverride ?? null;
    if (!productName && interview.productId) {
      try {
        const product = await this.productService.findOne(interview.tenantId, interview.productId);
        productName = product.name;
      } catch {
        productName = null;
      }
    }

    return {
      id: interview.id,
      agentType: interview.agentType,
      productId: interview.productId,
      productName,
      status: interview.status,
      currentStep: interview.currentStep,
      totalSteps: interview.totalSteps,
      messages: msgs.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata,
        createdAt: m.createdAt.toISOString(),
      })),
      brandBrief: interview.brandBrief,
      brandBriefMarkdown: this.resolveBrandBriefMarkdown(interview),
      errorMessage: interview.errorMessage,
      createdAt: interview.createdAt.toISOString(),
      updatedAt: interview.updatedAt.toISOString(),
    };
  }

  private resolveBrandBriefMarkdown(interview: AgentInterviewEntity): string | null {
    if (interview.brandBriefMarkdown?.trim()) {
      return interview.brandBriefMarkdown.trim();
    }
    if (!interview.brandBrief) {
      return null;
    }
    return brandBriefToMarkdown(interview.brandBrief);
  }
}