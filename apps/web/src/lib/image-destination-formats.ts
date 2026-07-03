import type { CmPlatform } from '@/services/community-manager';

/** Tamaños soportados por el Image Generator (OpenRouter). */
export type ImageGenerationSize = '1024x1024' | '1792x1024' | '1024x1792';

export interface ImageDestinationFormat {
  id: string;
  /** Red donde se publicará (alineado a Community Manager). */
  platform: CmPlatform | 'general';
  /** Nombre corto del formato: Post, Story, Reel, etc. */
  format: string;
  /** Etiqueta legible en el selector. */
  label: string;
  /** Proporción orientativa para el usuario. */
  aspectLabel: string;
  size: ImageGenerationSize;
}

export const IMAGE_DESTINATION_GROUPS: Array<{
  platform: CmPlatform | 'general';
  label: string;
  formats: ImageDestinationFormat[];
}> = [
  {
    platform: 'instagram',
    label: 'Instagram',
    formats: [
      {
        id: 'instagram-feed',
        platform: 'instagram',
        format: 'Post en feed',
        label: 'Post en feed',
        aspectLabel: 'Cuadrado 1:1',
        size: '1024x1024',
      },
      {
        id: 'instagram-portrait',
        platform: 'instagram',
        format: 'Post vertical',
        label: 'Post vertical en feed',
        aspectLabel: 'Vertical 4:5',
        size: '1024x1792',
      },
      {
        id: 'instagram-story',
        platform: 'instagram',
        format: 'Story / Reel',
        label: 'Story o Reel',
        aspectLabel: 'Vertical 9:16',
        size: '1024x1792',
      },
    ],
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    formats: [
      {
        id: 'facebook-feed',
        platform: 'facebook',
        format: 'Post en feed',
        label: 'Post en feed',
        aspectLabel: 'Cuadrado 1:1',
        size: '1024x1024',
      },
      {
        id: 'facebook-story',
        platform: 'facebook',
        format: 'Story',
        label: 'Story',
        aspectLabel: 'Vertical 9:16',
        size: '1024x1792',
      },
      {
        id: 'facebook-cover',
        platform: 'facebook',
        format: 'Portada',
        label: 'Portada de página',
        aspectLabel: 'Horizontal 16:9',
        size: '1792x1024',
      },
    ],
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    formats: [
      {
        id: 'linkedin-post',
        platform: 'linkedin',
        format: 'Publicación',
        label: 'Publicación',
        aspectLabel: 'Cuadrado 1:1',
        size: '1024x1024',
      },
      {
        id: 'linkedin-banner',
        platform: 'linkedin',
        format: 'Imagen ancha',
        label: 'Artículo o imagen ancha',
        aspectLabel: 'Horizontal 16:9',
        size: '1792x1024',
      },
    ],
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    formats: [
      {
        id: 'tiktok-vertical',
        platform: 'tiktok',
        format: 'Video / portada',
        label: 'Video o portada vertical',
        aspectLabel: 'Vertical 9:16',
        size: '1024x1792',
      },
    ],
  },
  {
    platform: 'twitter',
    label: 'X / Twitter',
    formats: [
      {
        id: 'twitter-post',
        platform: 'twitter',
        format: 'Publicación',
        label: 'Publicación',
        aspectLabel: 'Cuadrado 1:1',
        size: '1024x1024',
      },
      {
        id: 'twitter-header',
        platform: 'twitter',
        format: 'Encabezado',
        label: 'Encabezado de perfil',
        aspectLabel: 'Horizontal 16:9',
        size: '1792x1024',
      },
    ],
  },
  {
    platform: 'general',
    label: 'Varias redes',
    formats: [
      {
        id: 'general-square',
        platform: 'general',
        format: 'Cuadrado universal',
        label: 'Cuadrado universal',
        aspectLabel: '1:1 · feed en la mayoría de redes',
        size: '1024x1024',
      },
      {
        id: 'general-vertical',
        platform: 'general',
        format: 'Vertical universal',
        label: 'Vertical (Stories / Reels)',
        aspectLabel: '9:16 · Stories y Reels',
        size: '1024x1792',
      },
      {
        id: 'general-horizontal',
        platform: 'general',
        format: 'Horizontal universal',
        label: 'Horizontal (portadas / banners)',
        aspectLabel: '16:9 · portadas y banners',
        size: '1792x1024',
      },
    ],
  },
];

export const IMAGE_DESTINATION_FORMATS: ImageDestinationFormat[] =
  IMAGE_DESTINATION_GROUPS.flatMap((group) => group.formats);

export const DEFAULT_IMAGE_DESTINATION_ID = 'instagram-feed';

const formatById = new Map(IMAGE_DESTINATION_FORMATS.map((item) => [item.id, item]));

export function getImageDestinationFormat(id: string): ImageDestinationFormat {
  return formatById.get(id) ?? formatById.get(DEFAULT_IMAGE_DESTINATION_ID)!;
}

export function formatDestinationOptionLabel(item: ImageDestinationFormat): string {
  return `${item.label} · ${item.aspectLabel}`;
}

const PLATFORM_LABELS: Record<CmPlatform | 'general', string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
  general: 'varias redes',
};

export function destinationPlatformLabel(platform: CmPlatform | 'general'): string {
  return PLATFORM_LABELS[platform];
}
