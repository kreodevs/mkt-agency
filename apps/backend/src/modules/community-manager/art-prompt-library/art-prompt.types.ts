import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import type { ResolvedVisualBrandKit } from '../domain/visual-brand-kit.util';

/** Marketing goal the visual should achieve. */
export type ArtPromptIntent =
  | 'educate'
  | 'promote'
  | 'announce'
  | 'inspire'
  | 'compare'
  | 'story'
  | 'tips'
  | 'data'
  | 'brand'
  | 'product';

/** Aesthetic direction for AI art generation. */
export type ArtPromptStyle =
  | 'minimal'
  | 'bold'
  | 'luxury'
  | 'editorial'
  | 'playful'
  | 'technical'
  | 'photoreal'
  | 'illustration'
  | 'flatlay'
  | 'infographic';

/** Carousel narrative structure when visualFormat is carousel. */
export type ArtPromptCarouselStructure =
  | 'hook-feature-cta'
  | 'listicle'
  | 'before-after'
  | 'step-by-step'
  | 'multi-stat';

/** Whether CM prefers template composition vs raw AI art. */
export type ArtPromptPreferLayout = 'template' | 'ai-art' | 'auto';

/** Structured visual intent filled by the CM LLM per post. */
export interface VisualIntent {
  goal?: string;
  subject?: string;
  style?: ArtPromptStyle;
  preferLayout?: ArtPromptPreferLayout;
  carouselStructure?: ArtPromptCarouselStructure;
}

/** Curated MeiGen-style art prompt recipe. */
export interface ArtPromptRecipe {
  id: string;
  family: string;
  name: string;
  description: string;
  /** Prompt template with {{slot}} placeholders. */
  template: string;
  slots: string[];
  intents: ArtPromptIntent[];
  industries: string[];
  formats: Array<'1:1' | '4:5' | '9:16'>;
  platforms: string[];
  /** Carousel slide roles this recipe supports (e.g. hook, feature, cta). */
  carouselRoles: string[];
  typographyInImage: boolean;
  requiresReferenceImage: boolean;
  priority: number;
  meigenRank?: number;
}

export interface ArtPromptSelection {
  recipeId: string;
  recipe: ArtPromptRecipe;
  filledPrompt: string;
  aspectRatioHint: '1:1' | '4:5' | '9:16';
  score: number;
  selectionMethod: 'deterministic' | 'llm';
}

export interface ArtPromptSlotContext {
  productName: string;
  industry?: string;
  headline?: string;
  subline?: string;
  cta?: string;
  subject?: string;
  goal?: string;
  primaryColor?: string;
  secondaryColor?: string;
  style?: string;
  visualDescription?: string;
  platform?: string;
}

export interface ArtPromptFilterInput {
  post: SocialCopyPost;
  brandKit?: Pick<
    ResolvedVisualBrandKit,
    'style' | 'primaryColor' | 'productName'
  > | null;
  industry?: string | null;
  recentRecipeIds?: string[];
  visualIntent?: VisualIntent | null;
}

export interface ArtPromptCandidate extends ArtPromptRecipe {
  score: number;
}

export interface ResolvedArtVisualPrompt {
  visualDescription: string;
  recipeId: string | null;
  aspectRatioHint: '1:1' | '4:5' | '9:16';
  /** Filled recipe template before brand enrichment — passed to image branding. */
  artRecipeBasePrompt?: string;
  skipped?: boolean;
  skipReason?: string;
}
