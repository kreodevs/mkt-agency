import { normalizeContentVisualFormat } from '../../content/domain/content-visual-format.util';
import type {
  ArtPromptCandidate,
  ArtPromptFilterInput,
  ArtPromptIntent,
  ArtPromptRecipe,
  VisualIntent,
} from './art-prompt.types';
import { ART_PROMPT_RECIPES } from './art-prompt-recipes.data';

const RECENT_PENALTY = 25;
const TOP_CANDIDATE_LIMIT = 8;

function resolveAspectRatio(post: ArtPromptFilterInput['post']): '1:1' | '4:5' | '9:16' {
  if (post.imageDestination === 'story') return '9:16';
  if (post.platform === 'tiktok') return '9:16';
  if (post.platform === 'instagram' && post.imageDestination !== 'feed') return '4:5';
  return '1:1';
}

function inferIntentFromPost(
  post: ArtPromptFilterInput['post'],
  visualIntent?: VisualIntent | null,
): ArtPromptIntent[] {
  const intents: ArtPromptIntent[] = [];
  const goal = visualIntent?.goal?.toLowerCase() ?? '';
  const body = post.body.toLowerCase();
  const format = normalizeContentVisualFormat(post.visualFormat);

  if (format === 'carousel') intents.push('tips', 'educate');
  if (goal.includes('vender') || goal.includes('promo')) intents.push('promote');
  if (goal.includes('dato') || goal.includes('estad')) intents.push('data');
  if (goal.includes('marca') || goal.includes('brand')) intents.push('brand');
  if (goal.includes('lanz') || goal.includes('anunc')) intents.push('announce');
  if (body.includes('?')) intents.push('educate');
  if (post.visualHeadline && /\d/.test(post.visualHeadline)) intents.push('data');
  if (!intents.length) intents.push('promote', 'educate');

  return [...new Set(intents)];
}

function industryMatches(recipe: ArtPromptRecipe, industry?: string | null): number {
  if (!industry?.trim()) return 0;
  const normalized = industry.toLowerCase().trim();
  if (recipe.industries.includes('general')) return 5;
  if (recipe.industries.some((i) => normalized.includes(i) || i.includes(normalized))) {
    return 20;
  }
  return 0;
}

function platformMatches(recipe: ArtPromptRecipe, platform: string): number {
  return recipe.platforms.includes(platform) ? 15 : -50;
}

function formatMatches(recipe: ArtPromptRecipe, aspect: '1:1' | '4:5' | '9:16'): number {
  return recipe.formats.includes(aspect) ? 12 : -40;
}

function intentMatches(recipe: ArtPromptRecipe, intents: ArtPromptIntent[]): number {
  const overlap = recipe.intents.filter((i) => intents.includes(i)).length;
  return overlap * 10;
}

function styleMatches(
  recipe: ArtPromptRecipe,
  visualIntent?: VisualIntent | null,
  brandStyle?: string,
): number {
  const style = visualIntent?.style ?? brandStyle;
  if (!style) return 0;

  const styleMap: Record<string, string[]> = {
    minimal: ['tip-card', 'quote-insight', 'brand-vi', 'thought-leadership'],
    bold: ['promo-cta', 'poster-social', 'tiktok-trend'],
    luxury: ['luxury', 'poster-editorial'],
    editorial: ['illustration-editorial', 'poster-editorial', 'quote-insight'],
    technical: ['infographic-technical', 'saas-abstract', 'stat-highlight'],
    infographic: ['infographic-educational', 'infographic-technical', 'stat-highlight'],
    flatlay: ['flatlay'],
    illustration: ['illustration-editorial', 'playful'],
    photoreal: ['product-hero', 'testimonial', 'flatlay', 'food'],
    playful: ['playful', 'tiktok-trend'],
  };

  const families = styleMap[style] ?? [];
  if (families.some((f) => recipe.family.includes(f) || recipe.id.includes(f))) {
    return 15;
  }
  return 0;
}

function carouselRoleBonus(
  recipe: ArtPromptRecipe,
  post: ArtPromptFilterInput['post'],
  visualIntent?: VisualIntent | null,
): number {
  if (normalizeContentVisualFormat(post.visualFormat) !== 'carousel') return 0;
  if (!recipe.carouselRoles.length) return -5;

  const structure = visualIntent?.carouselStructure;
  if (structure === 'hook-feature-cta' && recipe.carouselRoles.includes('hook')) return 10;
  if (structure === 'step-by-step' && recipe.carouselRoles.includes('step')) return 10;
  if (structure === 'listicle' && recipe.carouselRoles.includes('step')) return 8;
  if (structure === 'multi-stat' && recipe.carouselRoles.includes('feature')) return 8;

  return recipe.carouselRoles.length > 0 ? 5 : 0;
}

function scoreRecipe(
  recipe: ArtPromptRecipe,
  input: ArtPromptFilterInput,
  intents: ArtPromptIntent[],
  aspect: '1:1' | '4:5' | '9:16',
): number {
  let score = recipe.priority;

  score += platformMatches(recipe, input.post.platform);
  score += formatMatches(recipe, aspect);
  score += intentMatches(recipe, intents);
  score += industryMatches(recipe, input.industry);
  score += styleMatches(recipe, input.visualIntent, input.brandKit?.style);
  score += carouselRoleBonus(recipe, input.post, input.visualIntent);

  if (recipe.meigenRank != null && recipe.meigenRank <= 50) {
    score += 5;
  }

  if (input.recentRecipeIds?.includes(recipe.id)) {
    score -= RECENT_PENALTY;
  }

  return score;
}

/** Score and rank art prompt recipes for a post. Returns top candidates sorted by score. */
export function filterArtPromptCandidates(
  recipes: ArtPromptRecipe[],
  input: ArtPromptFilterInput,
): ArtPromptCandidate[] {
  const aspect = resolveAspectRatio(input.post);
  const intents = inferIntentFromPost(input.post, input.visualIntent);

  const scored = recipes
    .map((recipe) => ({
      ...recipe,
      score: scoreRecipe(recipe, input, intents, aspect),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, TOP_CANDIDATE_LIMIT);
}

/** Default entry point using the full recipe catalog. */
export function filterArtPromptCandidatesFromCatalog(
  input: ArtPromptFilterInput,
): ArtPromptCandidate[] {
  return filterArtPromptCandidates(ART_PROMPT_RECIPES, input);
}

export { resolveAspectRatio as resolveArtPromptAspectRatio };
