# Art Prompt Library

MeiGen-style curated art prompt recipes that auto-select when the Community Manager generates post visuals via IA.

## Flow

```
SocialCopyPost (+ visualIntent from CM LLM)
        │
        ▼
attachVisualForPost
  1. talking-head composer
  2. VisualTemplateComposer (media kit + templates)
  3. Art Prompt Library  ◄── this module
  4. ImageGenerationService (branded IA fallback)
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
| `visual-intent.util.ts` | Parse/infer `visualIntent`; gate library usage |

## visualIntent (CM LLM)

The social copy adapter asks the CM to fill per post:

```json
{
  "visualIntent": {
    "goal": "educar sobre feature X",
    "subject": "automatización de reportes",
    "style": "minimal",
    "preferLayout": "ai-art",
    "carouselStructure": "hook-feature-cta"
  }
}
```

- `preferLayout: "template"` → skip art library (use Visual Studio templates)
- `preferLayout: "ai-art"` → prefer art library over generic enrichment
- talking-head posts always skip the library

## Recipe slots

Templates use `{{productName}}`, `{{headline}}`, `{{subject}}`, `{{primaryColor}}`, etc.
`buildDefaultSlots()` pulls from brand kit + `SocialCopyPost` fields.

## Persistence

Selected recipe id is stored on `contents.art_recipe_id` for traceability and batch de-duplication (`recentRecipeIds` penalizes repeats within a generation batch).

## Testing

```bash
npx jest art-prompt --passWithNoTests
```
