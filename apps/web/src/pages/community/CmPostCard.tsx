import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Hash,
  ImageIcon,
  Target,
} from 'lucide-react';
import { PLATFORM_ICONS, PLATFORM_COLORS, PLATFORM_LABELS } from './community-manager.constants';
import { PLATFORM_ICON_TONE } from '@/lib/semantic-ui';
import { CONTENT_VISUAL_FORMAT_LABELS } from '@/lib/visual-format';

export interface SocialPost {
  id: string;
  platform: string;
  title: string;
  body: string;
  hashtags: string[];
  visualDescription: string;
  visualFormat?: string;
  bestTime: string;
  targetAudience: string;
  callToAction: string;
  tone: string;
  contentId?: string;
}

export function CmPostCard({ post }: { post: SocialPost }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = PLATFORM_ICONS[post.platform] ?? Globe;
  const colorClass = PLATFORM_COLORS[post.platform] ?? PLATFORM_ICON_TONE;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] transition-colors hover:border-[var(--primary)]">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[var(--foreground)]">
                  {PLATFORM_LABELS[post.platform] ?? post.platform}
                </span>
                <span className="text-xs text-[var(--foreground-subtle)]">
                  {post.targetAudience}
                </span>
              </div>
              <p className="mt-1 font-medium text-[var(--foreground)]">
                {post.title}
              </p>
            </div>
          </div>

          <a
            href={`/contents/${post.contentId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`shrink-0 ${
              post.contentId
                ? 'text-[var(--primary)] hover:underline'
                : 'pointer-events-none text-[var(--foreground-subtle)]'
            }`}
          >
            {post.contentId ? (
              <span className="flex items-center gap-1 text-xs font-medium">
                <CheckCircle2 className="h-3 w-3" />
                En contenido
              </span>
            ) : (
              <span className="text-xs">Sin guardar</span>
            )}
          </a>
        </div>

        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
          {post.body}
        </div>

        {post.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--primary)]">
            <Hash className="h-3 w-3" />
            {post.hashtags.map((h, i) => (
              <span key={i}>#{h}</span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--foreground-subtle)]">
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            {post.bestTime}
          </span>
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {post.targetAudience}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] font-medium text-[var(--foreground-muted)]">
            CTA: {post.callToAction}
          </span>
        </div>

        <button
          type="button"
          className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Ocultar descripción visual
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Ver descripción visual
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-[var(--spacing-sm)] flex items-start gap-[var(--spacing-sm)] rounded-[var(--radius-md)] bg-[var(--secondary)] p-[var(--spacing-md)]">
            <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
            <div className="space-y-1">
              {post.visualFormat ? (
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--primary)]">
                  Formato:{' '}
                  {CONTENT_VISUAL_FORMAT_LABELS[
                    post.visualFormat as keyof typeof CONTENT_VISUAL_FORMAT_LABELS
                  ] ?? post.visualFormat}
                </p>
              ) : null}
              <p className="text-xs text-[var(--foreground)]">
                {post.visualDescription}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
