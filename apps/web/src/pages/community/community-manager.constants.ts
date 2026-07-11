import { Instagram, Linkedin, Twitter, MessageCircle, Music2 } from 'lucide-react';
import { PLATFORM_ICON_TONE } from '@/lib/semantic-ui';
import { type CmPlatform } from '@/services/community-manager';

export type { CmPlatform };

export const PLATFORM_ICONS: Record<string, React.FC<{ className?: string }>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: MessageCircle,
  tiktok: Music2,
};

export const PLATFORM_COLORS: Record<string, string> = {
  instagram: PLATFORM_ICON_TONE,
  linkedin: PLATFORM_ICON_TONE,
  twitter: PLATFORM_ICON_TONE,
  facebook: PLATFORM_ICON_TONE,
  tiktok: PLATFORM_ICON_TONE,
};

export const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

export const PLATFORM_KEYS = Object.keys(PLATFORM_LABELS) as CmPlatform[];
