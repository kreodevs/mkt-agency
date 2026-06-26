# AI agents module

Adaptadores de IA (Strategy pattern) para tareas asíncronas.

- `StubSuggestionAdapter` — generador determinista sin API key.
- `OpenRouterSuggestionAdapter` — LLM vía `LlmClient` cuando `AI_API_KEY` está definida.
- Variables: `AI_API_URL`, `AI_API_KEY`, `AI_MODEL` (ver `.env.example`).
