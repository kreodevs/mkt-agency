import { Repository } from 'typeorm';
import { AgentImageGenerationEntity } from '../../agents/domain/agent-image-generation.entity';
import { VISUAL_TEMPLATE_IDS } from '../../community-manager/domain/visual-template.constants';
import {
  CONTENT_IMAGE_DESTINATIONS,
  type ContentImageDestination,
} from './content.constants';
import type { ContentEntity } from '../infrastructure/typeorm/content.entity';

const TEMPLATE_ID_SET = new Set<string>(VISUAL_TEMPLATE_IDS);

function isKnownTemplateId(value: unknown): value is string {
  return typeof value === 'string' && TEMPLATE_ID_SET.has(value);
}

function normalizeImageDestination(value: unknown): ContentImageDestination | null {
  if (typeof value === 'string' && (CONTENT_IMAGE_DESTINATIONS as readonly string[]).includes(value)) {
    return value as ContentImageDestination;
  }
  return null;
}

/** Rellena campos de diseño visual desde la última generación con pipeline visual-template. */
export async function backfillVisualDesignFromGeneration(
  content: ContentEntity,
  generations: Repository<AgentImageGenerationEntity>,
  contents: Repository<ContentEntity>,
): Promise<ContentEntity> {
  const needsBackfill =
    !content.visualTemplateId ||
    !content.visualHeadline ||
    !content.visualSubline ||
    !content.visualCta;

  if (!needsBackfill) {
    return content;
  }

  const generation = await generations.findOne({
    where: { tenantId: content.tenantId, contentId: content.id },
    order: { createdAt: 'DESC' },
  });

  if (!generation?.metadata || typeof generation.metadata !== 'object' || Array.isArray(generation.metadata)) {
    return content;
  }

  const meta = generation.metadata as Record<string, unknown>;
  if (meta.pipeline !== 'visual-template') {
    return content;
  }

  let dirty = false;

  if (!content.visualTemplateId && isKnownTemplateId(meta.templateId)) {
    content.visualTemplateId = meta.templateId;
    dirty = true;
  }
  if (!content.visualHeadline && typeof meta.headline === 'string' && meta.headline.trim()) {
    content.visualHeadline = meta.headline.trim().slice(0, 200);
    dirty = true;
  }
  if (!content.visualSubline && typeof meta.subline === 'string' && meta.subline.trim()) {
    content.visualSubline = meta.subline.trim().slice(0, 300);
    dirty = true;
  }
  if (!content.visualCta && typeof meta.cta === 'string' && meta.cta.trim()) {
    content.visualCta = meta.cta.trim().slice(0, 80);
    dirty = true;
  }

  const storyFromMeta = normalizeImageDestination(meta.imageDestination);
  if (
    storyFromMeta &&
    content.imageDestination === 'feed' &&
    storyFromMeta === 'story'
  ) {
    content.imageDestination = storyFromMeta;
    dirty = true;
  }

  if (dirty) {
    await contents.save(content);
  }

  return content;
}
