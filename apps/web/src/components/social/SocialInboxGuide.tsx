import { Link } from 'react-router-dom';
import { HelpCircle, MessageSquare, Settings, Users, Webhook } from 'lucide-react';

interface SocialInboxGuideProps {
  variant: 'soho' | 'growth';
}

export function SocialInboxGuide({ variant }: SocialInboxGuideProps) {
  const isSoho = variant === 'soho';

  return (
    <div
      className={`mb-6 rounded-[var(--radius-md)] border p-[var(--spacing-md)] text-sm ${
        isSoho
          ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5'
          : 'border-[var(--border)] bg-[var(--background-muted)]/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <HelpCircle
          className={`mt-0.5 h-5 w-5 shrink-0 ${isSoho ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              {isSoho ? '¿Qué es el inbox social?' : 'Inbox social — resumen'}
            </p>
            <p className="mt-1 text-[var(--foreground-muted)]">
              {isSoho ? (
                <>
                  Es la bandeja del agente de <strong>Comunidad y leads</strong> del copiloto. Cuando
                  alguien te escribe en redes (comentario o DM), aquí clasificamos el mensaje con IA:
                  prospecto, soporte, spam, etc. Si detecta intención comercial, crea un{' '}
                  <strong>lead en tu CRM</strong> sin que tengas que anotarlo a mano.
                </>
              ) : (
                <>
                  Clasificación de interacciones sociales y puente al CRM. Los prospectos generan lead
                  automático; el resto alimenta señales para creativo y analytics.
                </>
              )}
            </p>
          </div>

          <div>
            <p className="font-medium text-[var(--foreground)]">Para qué sirve</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[var(--foreground-muted)]">
              <li>No perder consultas de precio o “me interesa” entre comentarios.</li>
              <li>Ver historial y sugerencia de respuesta en un solo lugar.</li>
              <li>Conectar con{' '}
                <Link to="/leads" className="text-[var(--primary)] underline">Leads</Link>{' '}
                en el menú del copiloto y con la actividad de agentes en{' '}
                <Link to="/agency/activity" className="text-[var(--primary)] underline">
                  Actividad agentes
                </Link>
                .
              </li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-[var(--foreground)]">Cómo usarlo hoy</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-[var(--foreground-muted)]">
              <li>
                <MessageSquare className="mr-1 inline h-3.5 w-3.5 align-text-bottom" aria-hidden />
                Copia el comentario o DM desde Instagram, Facebook, etc.
              </li>
              <li>Pégalo en <strong>Registrar interacción</strong> y pulsa <strong>Clasificar</strong>.</li>
              <li>
                Revisa la <strong>Bandeja</strong>. Si es prospecto, verás el enlace al lead en CRM.
              </li>
              {isSoho && (
                <li>
                  <Webhook className="mr-1 inline h-3.5 w-3.5 align-text-bottom" aria-hidden />
                  Opcional: automatiza con el <strong>webhook</strong> (Make, Zapier, n8n) — datos abajo.
                </li>
              )}
            </ol>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              Aún no hay OAuth con Meta: publicas tú en la red (desde{' '}
              <Link to="/" className="text-[var(--primary)] underline">
                Inicio
              </Link>
              ) y traes aquí los mensajes entrantes.
            </p>
          </div>

          <div>
            <p className="font-medium text-[var(--foreground)]">Dónde se configura</p>
            <ul className="mt-2 space-y-2 text-[var(--foreground-muted)]">
              <li className="flex items-start gap-2">
                <Settings className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <Link to="/settings/copilot" className="font-medium text-[var(--primary)] underline">
                    Ajustes del copiloto
                  </Link>
                  {' — '}
                  redes donde generas posts (Instagram, LinkedIn…). No es la conexión del inbox, pero
                  alinea el copy que publicas con lo que clasificas aquí.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Webhook className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <strong>Webhook genérico</strong> (tarjeta de esta página) — URL y secret para enviar
                  mensajes desde automatizaciones externas. Header: <code className="text-xs">X-Webhook-Secret</code>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  <Link to="/leads" className="font-medium text-[var(--primary)] underline">
                    Leads
                  </Link>
                  {' — '}
                  visible en el menú SOHO; prospectos automáticos desde inbox y alta manual.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
