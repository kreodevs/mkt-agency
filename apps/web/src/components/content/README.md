# Componentes — contenido (US-010/011)

| Componente | Uso |
|------------|-----|
| `ApprovalActions.tsx` | Aprobar / rechazar / solicitar cambios |
| `SignatureBadge.tsx` | Hash SHA-256 visible |
| `StatusBadge.tsx` | Estado con color semáforo |
| `DownloadKit.tsx` | Kit diario "Copiar y Llevar" (solo aprobado+firmado) |
| `VersionHistory.tsx` | Historial y revertir |
| `ContentVisualPanel.tsx` | Preview visual IA + generar / ver detalle / regenerar; usa `visualPrompt` del contenido (no el copy). Recupera generaciones atascadas en `processing` (>20 min) |
| `ContentPlatformBadge.tsx` | Badge con icono y color por red social (Instagram, Facebook, LinkedIn, TikTok, X) |
| `ContentPublishPanel.tsx` | Copiar copy, descargar texto (.txt) y descargar visuales; selector de red destino |
