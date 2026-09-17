import { Injectable } from '@nestjs/common';
import type { ToolContext } from '../../../shared/ai/tools/tool.interface';
import type { SocialCopyContext } from '../adapters/social-copy.adapter.port';

@Injectable()
export class VisualToolContextFactory {
  fromSocialCopyContext(ctx: SocialCopyContext): ToolContext {
    return {
      tenantId: ctx.tenantId,
      productId: ctx.productId ?? null,
      userId: null,
    };
  }
}
