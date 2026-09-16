# Art Prompt Library

MeiGen-style curated art prompt recipes that auto-select when the Community Manager generates post visuals via IA.

## Flow

```
SocialCopyPost (+ visualIntent from CM LLM)
        │
        ▼
attachVisualForPost
  1. talking-head composer
  2. SceneKitComposer (creative scene) ◄── `SceneKitComposeService` — CM en escena + pantalla real del kit
  3. VisualTemplateComposer (media kit + templates) — skipped when `preferLayout: ai-art` or creative scene routing
  4. Art + kit compose (hybrid) ◄── `ArtKitComposeService` when kit has compose roles
  5. Art Prompt Library  ◄── pure IA (no kit overlay)
  6. ImageGenerationService (branded IA fallback)
        │
        ▼
ArtPromptSelectorService.resolveVisualPrompt()
  ├── shouldUseArtPromptLibrary() — skip if template/talking-head/media kit
  ├── filterArtPromptCandidates() — score ~30 recipes
  ├── selectRecipe() — LLM tie-break if >1 candidate
  └── fillRecipeTemplate() — inject brand kit + post slots
        │
        ▼
ImageGenerationService.attachVisualToContent({ artRecipeBasePrompt, artRecipeId })
```

## Components

| File | Role |
|------|------|
| `art-prompt.types.ts` | Types: intents, styles, recipes, selection |
| `art-prompt-recipes.data.ts` | ~30 curated MeiGen-family recipes |
| `art-prompt-slot.util.ts` | `{{slot}}` template filling from brand kit |
| `art-prompt-filter.util.ts` | Deterministic scoring by platform, format, intent |
| `art-prompt-selector.service.ts` | NestJS service: filter → select → resolve prompt |
| `visual-intent.util.ts` | Parse/infer `visualIntent`; gate library + kit-compose usage |
| `art-kit-compose.util.ts` | Kit overlay prompts, layout resolution, Sharp compositing |
| `art-kit-compose.service.ts` | Hybrid pipeline: MeiGen art background + real kit screenshot |
| `scene-recipes.data.ts` | 8 creative scene recipes (workspace, hand-phone, clinical, abstract) |
| `scene-routing.util.ts` | Route stories/kit posts to creative scene before rigid templates |
| `scene-kit-compose.util.ts` | Screen region compositing + CM identity prompt suffix |
| `scene-kit-compose.service.ts` | Premium scene IA + kit screen inpainting + CM portrait reference |

## visualIntent (CM LLM)

The social copy adapter asks the CM to fill per post:

```json
{
  "visualIntent": {
    "goal": "educar sobre feature X",
    "subject": "automatización de reportes",
    "style": "minimal",
    "preferLayout": "creative-scene",
    "scene": "clinical",
    "carouselStructure": "hook-feature-cta"
  }
}
```

- `preferLayout: "template"` → skip creative scene, art library and art-kit-compose (use Visual Studio templates)
- `preferLayout: "creative-scene"` → SceneKitComposer first (CM en escena + captura real en pantalla)
- `preferLayout: "ai-art"` → skip rigid templates; prefer art-kit-compose (when kit exists) then art library
- `scene: "clinical"` → escenas de consultorio/dental; `"hand-phone"` para stories; `"workspace"` para SaaS
- talking-head posts always skip creative scene, library and art-kit-compose

## SceneKitComposer (creative scene)

When media kit has compose roles and routing selects creative scene (stories, `preferLayout: creative-scene`, batch rotation):

1. `resolveEffectiveScene()` picks archetype (`workspace`, `hand-phone`, `clinical`, `abstract-premium`).
2. `ArtPromptSelectorService.selectSceneRecipe()` picks from `SCENE_PROMPT_RECIPES`.
3. CM portrait (if ready) is passed as `input_references` to OpenRouter image API for identity.
4. IA generates photorealistic scene with **blank device screen**.
5. By default **no kit overlay** — lifestyle photography only. Captures are composited only when `wantsProductScreenShowcase()` (explicit `product-hero` or UI-focused copy); those posts use **art-kit-compose** mockup geometry instead of fixed inpainting.
6. Generation metadata uses `pipeline: 'scene-kit-compose'` with `kitScreenComposited: false` for pure lifestyle scenes.

## Art + kit compose (hybrid)

When the product media kit has compose image roles (`product-screenshot`, etc.) and `preferLayout` is `ai-art` or `auto`:

1. `ArtPromptSelectorService.selectRecipeForKitCompose()` picks a recipe with `supportsMediaKitOverlay: true`.
2. `buildKitOverlayPrompt()` tells the image model to leave negative space for a real screenshot.
3. `ImageGenerationService.generateImageBuffer()` produces the art background (no logo yet).
4. `compositeKitOnArtBackground()` overlays the kit capture (mockup / center-panel / split-bottom). Preset `product-hero` / `promo-cta` always uses **phone mockup** (`renderDeviceFrame` iPhone) even on Twitter/LinkedIn.
5. Logo is applied via `ImageBrandingService` after compositing.
6. Generation metadata uses `pipeline: 'art-kit-compose'`.

Carousel: slide 0 always composites kit photo + art; slides 1+ use kit if enough picks, otherwise art-only.

## Recipe slots

Templates use `{{productName}}`, `{{headline}}`, `{{subject}}`, `{{primaryColor}}`, etc.
`buildDefaultSlots()` pulls from brand kit + `SocialCopyPost` fields.

## Persistence

Selected recipe id is stored on `contents.art_recipe_id` for traceability and batch de-duplication (`recentRecipeIds` penalizes repeats within a generation batch).

## Testing

```bash
npx jest art-prompt --passWithNoTests
npx jest art-kit --passWithNoTests
npx jest scene-routing --passWithNoTests
npx jest scene-kit --passWithNoTests
```
