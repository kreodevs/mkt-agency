import { Facebook, Globe, Instagram, Linkedin, Music2, Twitter } from 'lucide-react';
import { getContentPlatformLabel, isContentPlatform } from '@/lib/content-platform';

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: Music2,
} as const;

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'text-pink-600 bg-pink-500/10 border-pink-500/20',
  linkedin: 'text-blue-700 bg-blue-500/10 border-blue-500/20',
  twitter: 'text-sky-600 bg-sky-500/10 border-sky-500/20',
  facebook: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  tiktok: 'text-rose-500 bg-rose-400/10 border-rose-400/20',
};

type ContentPlatformBadgeProps = {
  platform: string | null | undefined;
  size?: 'sm' | 'md';
  showUnset?: boolean;
};

export function ContentPlatformBadge({
  platform,
  size = 'md',
  showUnset = false,
}: ContentPlatformBadgeProps) {
  const label = getContentPlatformLabel(platform);

  if (!label) {
    if (!showUnset) {
      return null;
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] font-medium text-[var(--foreground-muted)] ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        }`}
      >
        <Globe className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
        Red sin asignar
      </span>
    );
  }

  const Icon = isContentPlatform(platform) ? PLATFORM_ICONS[platform] : Globe;
  const colorClass = isContentPlatform(platform)
    ? PLATFORM_COLORS[platform]
    : 'text-[var(--foreground-muted)] bg-[var(--background-secondary)] border-[var(--border)]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colorClass} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      title={`Destino: ${label}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {label}
    </span>
  );
}
