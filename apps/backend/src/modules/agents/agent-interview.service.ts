import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyProfileService } from '../company-profile/company-profile.service';
import { getInterviewQuestion, getInterviewQuestions } from './adapters/interview.questions';
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
    private readonly companyProfile: CompanyProfileService,
    private readonly interviewWorker: BrandInterviewWorkerService,
  ) {}

  async listInterviews(tenantId: string): Promise<InterviewResponseDto[]> {
    const interviews = await this.interviews.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(interviews.map((i) => this.toResponse(i)));
  }

  async createInterview(
    tenantId: string,
    agentType: AgentType,
  ): Promise<InterviewResponseDto> {
    const active = await this.interviews.findOne({
      where: { tenantId, agentType, status: 'in_progress' },
    });
    if (active) {
      throw new ConflictException({
        error: `Ya tienes una entrevista de tipo "${agentType}" en progreso`,
        code: 'CONFLICT',
        interviewId: active.id,
      });
    }

    const questions = getInterviewQuestions(agentType);
    const interview = await this.interviews.save(
      this.interviews.create({
        tenantId,
        agentType,
        status: 'in_progress',
        currentStep: 0,
        totalSteps: questions.length,
        answers: {},
        brandBrief: null,
      }),
    );

    const firstQuestion = questions[0];
    await this.messages.save(
      this.messages.create({
        interviewId: interview.id,
        role: 'agent',
        content: firstQuestion.question,
        metadata: { hint: firstQuestion.hint, step: 1 },
      }),
    );

    return this.toResponse(interview);
  }

  async getInterview(tenantId: string, interviewId: string): Promise<InterviewResponseDto> {
    const interview = await this.interviews.findOne({
      where: { id: interviewId, tenantId },
    });
    if (!interview) {
      throw new NotFoundException({ error: 'Entrevista no encontrada', code: 'NOT_FOUND' });
    }
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

  private async toResponse(interview: AgentInterviewEntity): Promise<InterviewResponseDto> {
    const msgs = await this.messages.find({
      where: { interviewId: interview.id },
      order: { createdAt: 'ASC' },
    });

    return {
      id: interview.id,
      agentType: interview.agentType,
      status: interview.status,
      currentStep: interview.currentStep,
      totalSteps: interview.totalSteps,
      messages: msgs.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      brandBrief: interview.brandBrief,
      errorMessage: interview.errorMessage,
      createdAt: interview.createdAt.toISOString(),
      updatedAt: interview.updatedAt.toISOString(),
    };
  }
}