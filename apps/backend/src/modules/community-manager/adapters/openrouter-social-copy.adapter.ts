import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import {
  SocialCopyAdapterPort,
  SocialCopyBatch,
  SocialCopyContext,
} from './social-copy.adapter.port';
import { normalizeSocialCopyBatch } from './social-copy-normalizer.util';
import { buildPrompts, buildSystemPromptWithTools, buildToolAwarePrompt } from './social-copy-prompt-builder.util';
import { SocialCopyToolOrchestratorService } from './social-copy-tool-orchestrator.service';

@Injectable()
export class OpenRouterSocialCopyAdapter implements SocialCopyAdapterPort {
  constructor(
    private readonly llm: LlmClient,
    private readonly toolOrchestrator: SocialCopyToolOrchestratorService,
  ) {}

  async generate(context: SocialCopyContext): Promise<SocialCopyBatch> {
    const { systemPrompt, userPrompt, temperature } = buildPrompts(context);
    const useTools = context.enableVisualTools !== false;

    let finalSystemPrompt = systemPrompt;
    let finalUserPrompt = userPrompt;

    if (useTools) {
      const toolResults = await this.toolOrchestrator.executeTools(
        systemPrompt, userPrompt, 'social_copy',
        { tenantId: context.tenantId, productId: context.productId },
      );
      if (toolResults) {
        finalSystemPrompt = buildSystemPromptWithTools(systemPrompt, toolResults);
        finalUserPrompt = buildToolAwarePrompt(userPrompt, toolResults);
      }
    }

    const result = await this.llm.chatJson<Record<string, unknown>>(
      finalSystemPrompt, finalUserPrompt,
      { taskType: 'social_copy', maxTokens: 8192, temperature },
    );

    const normalized = normalizeSocialCopyBatch(result, {
      count: context.count,
      platforms: context.platforms,
    });

    if (!normalized.posts.length) {
      throw new Error('Invalid social copy response from LLM');
    }

    return {
      summary: normalized.summary,
      posts: normalized.posts,
      publishingGuide: normalized.publishingGuide,
      generatedAt: normalized.generatedAt ?? new Date().toISOString(),
    };
  }
}
