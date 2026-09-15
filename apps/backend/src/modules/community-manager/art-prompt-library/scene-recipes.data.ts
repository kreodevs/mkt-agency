import type { ScenePromptRecipe } from './art-prompt.types';

/**
 * Premium creative scene recipes — CM in realistic environments (lifestyle photography).
 * Real app screenshots are composited only via art-kit-compose when the post explicitly showcases the product UI.
 */
export const SCENE_PROMPT_RECIPES: ScenePromptRecipe[] = [
  {
    id: 'scene-cm-workspace-monitor',
    family: 'creative-scene',
    name: 'CM at desk',
    description: 'Professional presenter at modern desk — lifestyle, no forced app overlay.',
    template:
      'Hyper-realistic editorial advertising photo for {{productName}} ({{industry}}). ' +
      'A confident professional woman at a sleek modern desk in a bright contemporary office. ' +
      'She looks toward camera with a warm, approachable expression. Laptop closed or angled away; focus on the person and workspace atmosphere. ' +
      'Soft cinematic window light, shallow depth of field, premium SaaS campaign aesthetic, {{primaryColor}} accent decor. ' +
      'Square or vertical composition, clean negative space. No watermarks, no readable text, no device screens facing camera.',
    slots: ['productName', 'industry', 'primaryColor'],
    intents: ['educate', 'promote', 'tips', 'product'],
    industries: ['saas', 'tech', 'fintech', 'general'],
    formats: ['9:16', '4:5', '1:1'],
    platforms: ['instagram', 'linkedin', 'tiktok', 'facebook', 'twitter'],
    carouselRoles: ['hook'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 98,
    supportsMediaKitOverlay: false,
    sceneType: 'workspace',
    screenLayout: 'none',
    requiresCmReference: true,
    requiresKitScreen: false,
  },
  {
    id: 'scene-cm-hand-phone',
    family: 'creative-scene',
    name: 'CM with smartphone (lifestyle)',
    description: 'Presenter with phone at side — screen not visible, no app overlay.',
    template:
      'Premium lifestyle advertising photograph for {{productName}}. ' +
      'A professional woman in a modern clinic or office, holding a smartphone naturally at her side. ' +
      'The phone screen is NOT visible to camera (back of phone or angled away). ' +
      'Natural soft studio lighting, clean minimal background with subtle {{primaryColor}} tones, ' +
      'editorial beauty-meets-tech aesthetic, photorealistic. No watermarks, no UI.',
    slots: ['productName', 'primaryColor'],
    intents: ['promote', 'product', 'announce'],
    industries: ['saas', 'ecommerce', 'general', 'retail', 'health'],
    formats: ['9:16', '4:5', '1:1'],
    platforms: ['instagram', 'tiktok', 'facebook', 'twitter'],
    carouselRoles: ['hook'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 96,
    sceneType: 'hand-phone',
    screenLayout: 'none',
    requiresCmReference: true,
    requiresKitScreen: false,
  },
  {
    id: 'scene-cm-clinical-dental',
    family: 'creative-scene',
    name: 'Clinical workspace (dental/health)',
    description: 'Clean clinical office with CM — trust and warmth, no app composite.',
    template:
      'Hyper-realistic premium healthcare marketing photo for {{productName}} dental practice software. ' +
      'A professional female dentist or clinic manager in a pristine modern dental office, white coat, ' +
      'standing or seated confidently, warm smile toward camera. No monitors or phones facing the viewer. ' +
      'Soft clinical lighting, calming whites and {{primaryColor}} accents, trustworthy and premium. ' +
      'Cinematic depth of field. No medical procedures, no blood, no watermarks, no text.',
    slots: ['productName', 'primaryColor'],
    intents: ['educate', 'promote', 'tips'],
    industries: ['health', 'saas', 'general'],
    formats: ['9:16', '4:5', '1:1'],
    platforms: ['instagram', 'linkedin', 'facebook', 'twitter'],
    carouselRoles: ['hook', 'feature'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 97,
    sceneType: 'clinical',
    screenLayout: 'none',
    requiresCmReference: true,
    requiresKitScreen: false,
  },
  {
    id: 'scene-cm-clinical-portrait',
    family: 'creative-scene',
    name: 'Clinical portrait',
    description: 'Close portrait in clinical setting — ideal for trust/education posts.',
    template:
      'Editorial healthcare portrait for {{productName}}. ' +
      'A friendly healthcare professional in a modern bright clinic, three-quarter portrait, confident and approachable. ' +
      'Clean white environment, soft natural light, {{primaryColor}} subtle accents in clothing or decor. ' +
      'Photorealistic, shallow depth of field. No devices, no watermarks, no readable text.',
    slots: ['productName', 'primaryColor'],
    intents: ['promote', 'educate', 'brand'],
    industries: ['health', 'saas', 'general'],
    formats: ['9:16', '4:5', '1:1'],
    platforms: ['instagram', 'tiktok', 'twitter', 'facebook'],
    carouselRoles: ['hook'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 94,
    sceneType: 'clinical',
    screenLayout: 'none',
    requiresCmReference: true,
    requiresKitScreen: false,
  },
  {
    id: 'scene-brand-abstract-premium',
    family: 'creative-scene',
    name: 'Abstract premium brand scene',
    description: 'Cinematic brand atmosphere without people or devices.',
    template:
      'Cinematic abstract brand visual for {{productName}}. ' +
      '{{visualDescription}}. ' +
      'Luxury advertising atmosphere, dramatic soft lighting, {{primaryColor}} and deep charcoal palette, ' +
      'minimal objects, premium editorial mood, no people, no devices, no text, no logos. ' +
      'High-end magazine cover quality.',
    slots: ['productName', 'visualDescription', 'primaryColor'],
    intents: ['brand', 'inspire', 'announce'],
    industries: ['general', 'saas', 'luxury', 'retail'],
    formats: ['9:16', '4:5', '1:1'],
    platforms: ['instagram', 'linkedin', 'facebook', 'tiktok', 'twitter'],
    carouselRoles: ['hook', 'cta'],
    typographyInImage: false,
    requiresReferenceImage: false,
    priority: 88,
    sceneType: 'abstract-premium',
    screenLayout: 'none',
    requiresCmReference: false,
    requiresKitScreen: false,
  },
  {
    id: 'scene-cm-coworking',
    family: 'creative-scene',
    name: 'Coworking lifestyle',
    description: 'Warm coworking space, CM at work — authentic aspirational.',
    template:
      'Lifestyle tech advertising photo for {{productName}}. ' +
      'A professional woman in a trendy coworking space, candid moment of focus or a warm smile to camera. ' +
      'Warm ambient light, plants and wood textures, {{primaryColor}} accent details. ' +
      'Photorealistic, shallow depth of field. No laptop screens facing camera. No watermarks.',
    slots: ['productName', 'primaryColor'],
    intents: ['educate', 'inspire', 'promote'],
    industries: ['saas', 'tech', 'general'],
    formats: ['4:5', '9:16', '1:1'],
    platforms: ['instagram', 'linkedin', 'twitter'],
    carouselRoles: ['hook', 'feature'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 90,
    sceneType: 'workspace',
    screenLayout: 'none',
    requiresCmReference: true,
    requiresKitScreen: false,
  },
  {
    id: 'scene-cm-mobile-story',
    family: 'creative-scene',
    name: 'Mobile-first story hero',
    description: 'Vertical lifestyle for stories — person or ambiance, no forced screenshot.',
    template:
      'Vertical mobile-first hero shot for {{productName}} on {{platform}}. ' +
      'Aspirational lifestyle scene with soft bokeh background in {{primaryColor}} tones, ' +
      'optional silhouette of a professional with phone at side (screen not visible). ' +
      'Premium product launch aesthetic, cinematic rim light. 9:16. No UI, no watermarks.',
    slots: ['productName', 'platform', 'primaryColor'],
    intents: ['promote', 'announce', 'brand'],
    industries: ['saas', 'ecommerce', 'general', 'health'],
    formats: ['9:16'],
    platforms: ['instagram', 'tiktok'],
    carouselRoles: ['hook'],
    typographyInImage: false,
    requiresReferenceImage: false,
    priority: 92,
    sceneType: 'hand-phone',
    screenLayout: 'none',
    requiresCmReference: false,
    requiresKitScreen: false,
  },
  {
    id: 'scene-cm-consultation',
    family: 'creative-scene',
    name: 'Consultation moment',
    description: 'Trust-building consultation scene without device showcase.',
    template:
      'Premium consultation scene for {{productName}} ({{industry}}). ' +
      'A professional consultant in an elegant modern office, welcoming expression, seated or standing naturally. ' +
      'Warm trustworthy lighting, {{primaryColor}} accents, photorealistic editorial style. ' +
      'No tablets or screens facing camera. No watermarks.',
    slots: ['productName', 'industry', 'primaryColor'],
    intents: ['educate', 'promote'],
    industries: ['health', 'saas', 'consulting', 'general'],
    formats: ['9:16', '4:5', '1:1'],
    platforms: ['instagram', 'linkedin', 'twitter'],
    carouselRoles: ['hook', 'step'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 89,
    sceneType: 'clinical',
    screenLayout: 'none',
    requiresCmReference: true,
    requiresKitScreen: false,
  },
];
