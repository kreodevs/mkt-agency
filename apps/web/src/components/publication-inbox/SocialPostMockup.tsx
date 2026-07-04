import type { ReactNode } from 'react';
import { getContentPlatformLabel, isContentPlatform } from '@/lib/content-platform';
import type { CmPlatform } from '@/services/community-manager';

interface SocialPostMockupProps {
  platform: string | null | undefined;
  children: ReactNode;
  className?: string;
}

const FRAME_HEADERS: Partial<Record<CmPlatform, string>> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'X',
};

export function SocialPostMockup({ platform, children, className = '' }: SocialPostMockupProps) {
  const label = getContentPlatformLabel(platform) ?? 'Vista previa';
  const header = isContentPlatform(platform) ? FRAME_HEADERS[platform] : null;

  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] ${className}`}
    >
      <div className="flex items-center gap-[var(--spacing-sm)] border-b border-[var(--border)] bg-[var(--secondary)] px-[var(--spacing-md)] py-[var(--spacing-sm)] text-xs font-semibold text-[var(--foreground)]">
        <span className="h-2 w-2 rounded-full bg-[var(--primary)]" aria-hidden />
        {header ?? label}
        <span className="ml-auto text-xs font-normal text-[var(--foreground-muted)]">Vista previa</span>
      </div>
      <div className="p-[var(--spacing-sm)]">{children}</div>
    </div>
  );
}

export default SocialPostMockup;
