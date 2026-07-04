import { Facebook, Globe, Instagram, Linkedin, Music2, Twitter } from 'lucide-react';
import { getContentPlatformLabel, isContentPlatform } from '@/lib/content-platform';

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: Music2,
} as const;

const PLATFORM_STYLE = 'text-[var(--foreground-muted)] bg-[var(--secondary)] border-[var(--border)]';

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
    ? PLATFORM_STYLE
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
