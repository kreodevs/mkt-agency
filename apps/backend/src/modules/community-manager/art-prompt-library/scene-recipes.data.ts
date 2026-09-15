import type { ScenePromptRecipe } from './art-prompt.types';

/**
 * Premium creative scene recipes — CM in realistic environments with blank device screens
 * for compositing real media-kit app screenshots (SceneKitComposer).
 */
export const SCENE_PROMPT_RECIPES: ScenePromptRecipe[] = [
  {
    id: 'scene-cm-workspace-monitor',
    family: 'creative-scene',
    name: 'CM at desk with laptop',
    description: 'Professional presenter at modern desk, blank laptop screen for app overlay.',
    template:
      'Hyper-realistic editorial advertising photo for {{productName}} ({{industry}}). ' +
      'A confident professional woman at a sleek modern desk in a bright contemporary office. ' +
      'She looks toward camera with a warm, approachable expression. ' +
      'An open laptop on the desk shows a completely blank neutral grey screen (no UI, no icons, no text on screen). ' +
      'Soft cinematic window light, shallow depth of field, premium SaaS campaign aesthetic, {{primaryColor}} accent decor. ' +
      'Vertical 9:16 composition, upper area clean for headline overlay. No watermarks.',
    slots: ['productName', 'industry', 'primaryColor'],
    intents: ['educate', 'promote', 'tips', 'product'],
    industries: ['saas', 'tech', 'fintech', 'general'],
    formats: ['9:16', '4:5', '1:1'],
    platforms: ['instagram', 'linkedin', 'tiktok', 'facebook'],
    carouselRoles: ['hook'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 98,
    supportsMediaKitOverlay: true,
    sceneType: 'workspace',
    screenLayout: 'laptop',
    requiresCmReference: true,
    requiresKitScreen: true,
  },
  {
    id: 'scene-cm-hand-phone',
    family: 'creative-scene',
    name: 'CM holding smartphone',
    description: 'Presenter holding phone toward camera with blank screen for app.',
    template:
      'Premium lifestyle advertising photograph for {{productName}}. ' +
      'A professional woman holding a modern smartphone toward the camera at chest height. ' +
      'The phone screen is completely blank flat neutral grey (no app UI, no icons, no text). ' +
      'Natural soft studio lighting, clean minimal background with subtle {{primaryColor}} tones, ' +
      'editorial beauty-meets-tech aesthetic, photorealistic, 9:16 vertical. No watermarks.',
    slots: ['productName', 'primaryColor'],
    intents: ['promote', 'product', 'announce'],
    industries: ['saas', 'ecommerce', 'general', 'retail'],
    formats: ['9:16', '4:5'],
    platforms: ['instagram', 'tiktok', 'facebook'],
    carouselRoles: ['hook'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 96,
    sceneType: 'hand-phone',
    screenLayout: 'phone-hand',
    requiresCmReference: true,
    requiresKitScreen: true,
  },
  {
    id: 'scene-cm-clinical-dental',
    family: 'creative-scene',
    name: 'Clinical workspace (dental/health)',
    description: 'Clean clinical office, CM at desk with blank monitor — ideal for OralTrack.',
    template:
      'Hyper-realistic premium healthcare marketing photo for {{productName}} dental practice software. ' +
      'A professional female dentist or clinic manager in a pristine modern dental office, white coat, ' +
      'sitting at a minimalist desk. A large monitor displays a blank neutral grey screen (no UI). ' +
      'Soft clinical lighting, calming whites and {{primaryColor}} accents, trustworthy and premium. ' +
      '9:16 vertical, cinematic depth of field. No medical procedures, no blood, no watermarks.',
    slots: ['productName', 'primaryColor'],
    intents: ['educate', 'promote', 'tips'],
    industries: ['health', 'saas', 'general'],
    formats: ['9:16', '4:5', '1:1'],
    platforms: ['instagram', 'linkedin', 'facebook'],
    carouselRoles: ['hook', 'feature'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 97,
    sceneType: 'clinical',
    screenLayout: 'laptop',
    requiresCmReference: true,
    requiresKitScreen: true,
  },
  {
    id: 'scene-cm-clinical-phone',
    family: 'creative-scene',
    name: 'Clinical setting with mobile',
    description: 'Healthcare professional showing phone with blank screen in clinic.',
    template:
      'Editorial healthcare advertising photo for {{productName}}. ' +
      'A friendly healthcare professional in a modern bright clinic, holding a smartphone with a blank grey screen toward camera. ' +
      'Clean white environment, soft natural light, {{primaryColor}} subtle accents, trustworthy premium feel. ' +
      '9:16 vertical composition. No watermarks, no readable text.',
    slots: ['productName', 'primaryColor'],
    intents: ['promote', 'educate', 'product'],
    industries: ['health', 'saas', 'general'],
    formats: ['9:16', '4:5'],
    platforms: ['instagram', 'tiktok'],
    carouselRoles: ['hook'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 94,
    sceneType: 'clinical',
    screenLayout: 'phone-hand',
    requiresCmReference: true,
    requiresKitScreen: true,
  },
  {
    id: 'scene-brand-abstract-premium',
    family: 'creative-scene',
    name: 'Abstract premium brand scene',
    description: 'Cinematic brand atmosphere without device — wow factor, no app overlay.',
    template:
      'Cinematic abstract brand visual for {{productName}}. ' +
      '{{visualDescription}}. ' +
      'Luxury advertising atmosphere, dramatic soft lighting, {{primaryColor}} and deep charcoal palette, ' +
      'minimal objects, premium editorial mood, no people, no devices, no text, no logos. ' +
      'High-end magazine cover quality, 9:16 vertical.',
    slots: ['productName', 'visualDescription', 'primaryColor'],
    intents: ['brand', 'inspire', 'announce'],
    industries: ['general', 'saas', 'luxury', 'retail'],
    formats: ['9:16', '4:5', '1:1'],
    platforms: ['instagram', 'linkedin', 'facebook', 'tiktok'],
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
    id: 'scene-cm-coworking-laptop',
    family: 'creative-scene',
    name: 'Coworking laptop scene',
    description: 'Warm coworking space, CM working with blank laptop screen.',
    template:
      'Lifestyle tech advertising photo for {{productName}}. ' +
      'A professional woman working in a trendy coworking space, laptop open with blank neutral grey screen. ' +
      'Warm ambient light, plants and wood textures, {{primaryColor}} accent details, authentic and aspirational. ' +
      'Photorealistic, shallow depth of field, 4:5 or 9:16. No watermarks.',
    slots: ['productName', 'primaryColor'],
    intents: ['educate', 'inspire', 'promote'],
    industries: ['saas', 'tech', 'general'],
    formats: ['4:5', '9:16', '1:1'],
    platforms: ['instagram', 'linkedin'],
    carouselRoles: ['hook', 'feature'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 90,
    sceneType: 'workspace',
    screenLayout: 'laptop',
    requiresCmReference: true,
    requiresKitScreen: true,
  },
  {
    id: 'scene-cm-mobile-story',
    family: 'creative-scene',
    name: 'Mobile-first story hero',
    description: 'Close-up hand with phone, optimized for IG/TikTok stories.',
    template:
      'Vertical mobile-first hero shot for {{productName}} on {{platform}}. ' +
      'Close-up of a hand holding a smartphone with blank grey screen, soft bokeh background in {{primaryColor}} tones. ' +
      'Premium product launch aesthetic, crisp focus on device, cinematic rim light. 9:16. No UI on screen.',
    slots: ['productName', 'platform', 'primaryColor'],
    intents: ['promote', 'announce', 'product'],
    industries: ['saas', 'ecommerce', 'general'],
    formats: ['9:16'],
    platforms: ['instagram', 'tiktok'],
    carouselRoles: ['hook'],
    typographyInImage: false,
    requiresReferenceImage: false,
    priority: 92,
    sceneType: 'hand-phone',
    screenLayout: 'phone-hand',
    requiresCmReference: false,
    requiresKitScreen: true,
  },
  {
    id: 'scene-cm-consultation-desk',
    family: 'creative-scene',
    name: 'Consultation desk with tablet',
    description: 'Consultation setting with tablet showing blank screen.',
    template:
      'Premium consultation scene for {{productName}} ({{industry}}). ' +
      'A professional consultant at an elegant desk, presenting a tablet with completely blank grey screen to camera. ' +
      'Warm trustworthy lighting, modern office, {{primaryColor}} accents, photorealistic editorial style. ' +
      '9:16 vertical. No watermarks.',
    slots: ['productName', 'industry', 'primaryColor'],
    intents: ['educate', 'promote'],
    industries: ['health', 'saas', 'consulting', 'general'],
    formats: ['9:16', '4:5'],
    platforms: ['instagram', 'linkedin'],
    carouselRoles: ['hook', 'step'],
    typographyInImage: false,
    requiresReferenceImage: true,
    priority: 89,
    sceneType: 'clinical',
    screenLayout: 'phone-table',
    requiresCmReference: true,
    requiresKitScreen: true,
  },
];
