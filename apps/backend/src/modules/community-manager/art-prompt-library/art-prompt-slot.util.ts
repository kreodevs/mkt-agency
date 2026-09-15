import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { ResolvedVisualBrandKit } from '../domain/visual-brand-kit.util';
import type { ArtPromptSlotContext } from './art-prompt.types';

const SLOT_PATTERN = /\{\{(\w+)\}\}/g;

/** Replace {{slot}} placeholders in a recipe template. Missing slots become empty strings. */
export function fillRecipeTemplate(
  template: string,
  slots: Record<string, string>,
): string {
  return template.replace(SLOT_PATTERN, (_match, key: string) => slots[key]?.trim() ?? '');
}

export function buildDefaultSlots(
  ctx: ArtPromptSlotContext,
  post: SocialCopyPost,
): Record<string, string> {
  const subject =
    ctx.subject?.trim() ||
    post.visualHeadline?.trim() ||
    post.title?.trim() ||
    ctx.productName;

  const goal =
    ctx.goal?.trim() ||
    post.callToAction?.trim() ||
    post.visualCta?.trim() ||
    'generar engagement';

  return {
    productName: ctx.productName,
    industry: ctx.industry ?? 'general',
    headline: post.visualHeadline?.trim() || post.title?.trim() || ctx.productName,
    subline: post.visualSubline?.trim() || post.body.slice(0, 120).trim(),
    cta: post.visualCta?.trim() || post.callToAction?.trim() || 'Conoce más',
    subject,
    goal,
    primaryColor: ctx.primaryColor ?? '#2563EB',
    secondaryColor: ctx.secondaryColor ?? '#64748B',
    style: ctx.style ?? 'modern professional',
    visualDescription: post.visualDescription?.trim() || ctx.visualDescription?.trim() || subject,
    platform: post.platform,
    audience: post.targetAudience?.trim() || 'audiencia objetivo',
    tone: post.tone?.trim() || 'profesional',
  };
}

export function mergeSlotContextFromBrandKit(
  brandKit: Pick<
    ResolvedVisualBrandKit,
    'style' | 'primaryColor' | 'secondaryColor' | 'productName'
  >,
  industry?: string | null,
): ArtPromptSlotContext {
  return {
    productName: brandKit.productName,
    industry: industry ?? undefined,
    primaryColor: brandKit.primaryColor,
    secondaryColor: brandKit.secondaryColor,
    style: brandKit.style,
  };
}
