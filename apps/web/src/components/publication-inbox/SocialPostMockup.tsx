import type { ReactNode } from 'react';
import { getContentPlatformLabel, isContentPlatform } from '@/lib/content-platform';
import type { CmPlatform } from '@/services/community-manager';

interface SocialPostMockupProps {
  platform: string | null | undefined;
  children: ReactNode;
  className?: string;
}

const FRAME_STYLES: Partial<Record<CmPlatform, { header: string; accent: string }>> = {
  instagram: { header: 'Instagram', accent: 'from-pink-500/20 to-purple-500/20' },
  facebook: { header: 'Facebook', accent: 'from-blue-600/20 to-blue-400/10' },
  linkedin: { header: 'LinkedIn', accent: 'from-blue-700/20 to-sky-500/10' },
  tiktok: { header: 'TikTok', accent: 'from-rose-500/20 to-neutral-500/10' },
  twitter: { header: 'X', accent: 'from-sky-500/20 to-slate-500/10' },
};

export function SocialPostMockup({ platform, children, className = '' }: SocialPostMockupProps) {
  const label = getContentPlatformLabel(platform) ?? 'Vista previa';
  const frame = isContentPlatform(platform) ? FRAME_STYLES[platform] : null;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] ${className}`}
    >
      <div
        className={`flex items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-xs font-semibold ${
          frame ? `bg-gradient-to-r ${frame.accent}` : 'bg-[var(--secondary)]/40'
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
        {frame?.header ?? label}
        <span className="ml-auto text-[10px] font-normal text-[var(--foreground-muted)]">
          Vista previa
        </span>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

export default SocialPostMockup;
