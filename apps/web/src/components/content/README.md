# Componentes — contenido (US-010/011)

| Componente | Uso |
|------------|-----|
| `ApprovalActions.tsx` | Aprobar / rechazar / solicitar cambios |
| `SignatureBadge.tsx` | Hash SHA-256 visible |
| `StatusBadge.tsx` | Estado con color semáforo |
| `DownloadKit.tsx` | Kit diario "Copiar y Llevar" (solo aprobado+firmado) |
| `VersionHistory.tsx` | Historial y revertir |
| `ContentVisualPanel.tsx` | Preview imagen/carrusel — **Regenerar escena** (nuevo render según estilo visual guardado) vs **Recomponer plantilla** (solo textos/colores en plantilla tipográfica existente) |
| `ContentVisualDesignPanel.tsx` | Modos agrupados: Automática, Escena CM (sin app), Mockup (con captura), Arte IA y plantillas tipográficas. Incluye guía «¿Cuál elegir?» |
| `ContentPlatformBadge.tsx` | Badge con icono y color por red social (Instagram, Facebook, LinkedIn, TikTok, X) |
| `ContentPublishPanel.tsx` | Copiar copy, descargar texto (.txt) y descargar visuales; selector de red destino |
| `ContentListCard.tsx` | Tarjeta mobile para listado en `/contents` (&lt; md) |
