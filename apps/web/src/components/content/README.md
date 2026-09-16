# Componentes — contenido (US-010/011)

| Componente | Uso |
|------------|-----|
| `ApprovalActions.tsx` | Aprobar / rechazar / solicitar cambios |
| `SignatureBadge.tsx` | Hash SHA-256 visible |
| `StatusBadge.tsx` | Estado con color semáforo |
| `DownloadKit.tsx` | Kit diario "Copiar y Llevar" (solo aprobado+firmado) |
| `VersionHistory.tsx` | Historial y revertir |
| `ContentVisualPanel.tsx` | Preview imagen/carrusel — **Regenerar escena** (nuevo render según estilo visual guardado) vs **Recomponer plantilla** (solo textos/colores en plantilla tipográfica existente) |
| `ContentVisualDesignPanel.tsx` | Preset visual (`creative-scene`, mockup con captura, plantillas tipográficas), titular, subtítulo y CTA. Avisos de longitud solo en plantillas tipográficas SVG; escena creativa usa tokens `--warning` legibles |
| `ContentPlatformBadge.tsx` | Badge con icono y color por red social (Instagram, Facebook, LinkedIn, TikTok, X) |
| `ContentPublishPanel.tsx` | Copiar copy, descargar texto (.txt) y descargar visuales; selector de red destino |
| `ContentListCard.tsx` | Tarjeta mobile para listado en `/contents` (&lt; md) |
