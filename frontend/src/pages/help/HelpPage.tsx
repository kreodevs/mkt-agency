import { useNavigate } from 'react-router-dom';
import { Panel } from 'primereact/panel';
import { Chip } from 'primereact/chip';
import {
  HelpCircle, Users, Calendar, Megaphone, Eye, Map,
  CheckCircle, Settings, Plug, ArrowRight, Twitter, Globe, MessageCircle,
} from 'lucide-react';

const sections = [
  {
    icon: HelpCircle,
    title: '¿Qué es MarketingOS?',
    defaultExpanded: true,
    content: (navigate: any) => (
      <div className="text-sm leading-relaxed text-[var(--foreground-muted)]">
        <p className="text-[var(--foreground)] font-medium">MarketingOS es un sistema CRM + Motor de Marketing con IA.</p>
        <p>Hermes analiza datos, redacta contenido, sugiere campañas y monitorea competencia. <strong className="text-[var(--foreground)]">Tú apruebas antes de publicar.</strong></p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Chip label="Multi-producto" className="!bg-[var(--background-tertiary)] !text-[var(--foreground-muted)] !text-xs !border !border-[var(--border)]" />
          <Chip label="Multi-tenant" className="!bg-[var(--background-tertiary)] !text-[var(--foreground-muted)] !text-xs !border !border-[var(--border)]" />
          <Chip label="IA + Humano" className="!bg-[var(--background-tertiary)] !text-[var(--foreground-muted)] !text-xs !border !border-[var(--border)]" />
          <Chip label="Auto-reportes" className="!bg-[var(--background-tertiary)] !text-[var(--foreground-muted)] !text-xs !border !border-[var(--border)]" />
        </div>
      </div>
    ),
  },
  {
    icon: Plug,
    title: '1. Conexiones — Conecta tus cuentas',
    content: (navigate: any) => (
      <div className="text-sm leading-relaxed text-[var(--foreground-muted)]">
        <p>Cada <strong className="text-[var(--foreground)]">producto</strong> tiene sus propias conexiones.</p>
        <div className="flex flex-col gap-2 my-3">
          {[
            { icon: Twitter, color: '#1DA1F2', name: 'X (Twitter)', desc: 'API Key + Access Token del Developer Portal' },
            { icon: Globe, color: '#4285F4', name: 'Google Ads', desc: 'Developer Token + Client ID + Client Secret' },
            { icon: MessageCircle, color: '#25D366', name: 'WhatsApp', desc: 'Phone Number ID + Token (Cloud API)' },
          ].map(item => (
            <div key={item.name} className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-md)] bg-[var(--background-tertiary)] border border-[var(--border)]">
              <item.icon size={18} style={{ color: item.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--foreground)]">{item.name}</div>
                <div className="text-xs text-[var(--foreground-subtle)]">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <NavButton label="Ir a Conexiones" path="/settings" navigate={navigate} />
      </div>
    ),
  },
  {
    icon: Users,
    title: '2. CRM — Captura y gestiona leads',
    content: (navigate: any) => (
      <div className="text-sm leading-relaxed text-[var(--foreground-muted)]">
        <p>Pipeline de 5 etapas:</p>
        <div className="flex flex-wrap gap-1.5 my-2">
          {['Prospecto', 'Contactado', 'Interesado', 'Trial', 'Cliente'].map(s => (
            <Chip key={s} label={s} className="!bg-[var(--background-tertiary)] !text-[var(--foreground-muted)] !text-xs !border !border-[var(--border)]" />
          ))}
        </div>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Agrega leads manualmente</li>
          <li>Cambia etapa con un clic</li>
          <li>Score automático por IA (pain points, oportunidad, tamaño)</li>
          <li>Filtra por producto</li>
        </ul>
        <NavButton label="Ir a CRM" path="/crm" navigate={navigate} />
      </div>
    ),
  },
  {
    icon: Calendar,
    title: '3. Contenido — Publicaciones en X',
    content: (navigate: any) => (
      <div className="text-sm leading-relaxed text-[var(--foreground-muted)]">
        <p>Hermes redacta posts. Tú apruebas o rechazas. Luego publicas <strong className="text-[var(--foreground)]">manualmente</strong> en X.</p>
        <ol className="list-decimal pl-5 space-y-1 mt-2">
          <li>Hermes sugiere un post → aparece en <strong className="text-[var(--foreground)]">Contenido</strong></li>
          <li>Lo revisas y editas si quieres</li>
          <li><strong className="text-[var(--primary)]">Apruebas</strong> o <strong className="text-[var(--destructive)]">Rechazas</strong></li>
          <li>Si apruebas, ves el texto listo para copiar o publicar en X</li>
        </ol>
        <NavButton label="Ir a Contenido" path="/content" navigate={navigate} />
      </div>
    ),
  },
  {
    icon: Megaphone,
    title: '4. Google Ads — Campañas',
    content: (navigate: any) => (
      <div className="text-sm leading-relaxed text-[var(--foreground-muted)]">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Conecta Google Ads en <strong className="text-[var(--foreground)]">Configuración</strong></li>
          <li>Ve a <strong className="text-[var(--foreground)]">Anuncios</strong> y crea campaña (palabras clave + presupuesto)</li>
          <li>MarketingOS monitorea gasto vs presupuesto</li>
        </ol>
        <NavButton label="Ir a Campañas" path="/campaigns" navigate={navigate} />
      </div>
    ),
  },
  {
    icon: Eye,
    title: '5. Competencia — Monitoreo',
    content: (navigate: any) => (
      <div className="text-sm leading-relaxed text-[var(--foreground-muted)]">
        <ul className="list-disc pl-5 space-y-1">
          <li>Registra competidores → sistema rastrea menciones</li>
          <li>Análisis de sentimiento (positivo/neutral/negativo)</li>
          <li>Frecuencia de publicación y temas</li>
        </ul>
        <NavButton label="Ir a Competencia" path="/competitors" navigate={navigate} />
      </div>
    ),
  },
  {
    icon: Map,
    title: '6. SEO Local — Landing pages',
    content: (navigate: any) => (
      <div className="text-sm leading-relaxed text-[var(--foreground-muted)]">
        <p>Landing pages optimizadas para:</p>
        <div className="flex flex-wrap gap-1.5 my-2">
          {['CDMX', 'Monterrey', 'Guadalajara', 'Puebla', 'Querétaro', 'Mérida'].map(c => (
            <Chip key={c} label={c} className="!bg-[var(--background-tertiary)] !text-[var(--foreground-muted)] !text-xs !border !border-[var(--border)]" />
          ))}
        </div>
        <NavButton label="Ir a SEO" path="/seo" navigate={navigate} />
      </div>
    ),
  },
  {
    icon: CheckCircle,
    title: '7. Onboarding — Checklist',
    content: (navigate: any) => (
      <div className="text-sm leading-relaxed text-[var(--foreground-muted)]">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Crear perfil del negocio</li>
          <li>Conectar cuenta de X</li>
          <li>Configurar Google Ads</li>
          <li>Agregar palabras clave</li>
          <li>Registrar competidores</li>
          <li>Definir ciudades SEO</li>
          <li>Invitar miembros</li>
          <li>Revisar primer contenido sugerido</li>
        </ol>
        <NavButton label="Ir a Onboarding" path="/onboarding" navigate={navigate} />
      </div>
    ),
  },
  {
    icon: Settings,
    title: '8. Administración',
    content: (navigate: any) => (
      <div className="text-sm leading-relaxed text-[var(--foreground-muted)]">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-[var(--foreground)]">Crear tenants</strong> — nuevas empresas</li>
          <li><strong className="text-[var(--foreground)]">Agregar productos</strong> — SAAS por tenant</li>
          <li><strong className="text-[var(--foreground)]">Ver usuarios</strong> — quién accede a cada tenant</li>
        </ul>
        <NavButton label="Ir a Admin" path="/admin" navigate={navigate} />
      </div>
    ),
  },
];

function NavButton({ label, path, navigate }: { label: string; path: string; navigate: any }) {
  return (
    <button
      onClick={() => navigate(path)}
      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] hover:bg-[var(--primary-hover)] transition-colors cursor-pointer border-none"
    >
      {label}
      <ArrowRight size={14} />
    </button>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[900px] mx-auto">
      <h2 className="text-xl font-bold text-[var(--foreground)] mt-0 mb-2">Manual de Ayuda</h2>
      <p className="text-sm text-[var(--foreground-muted)] mb-5">
        Selecciona una sección para ver instrucciones paso a paso con botones de navegación directa.
      </p>

      <div className="flex flex-col gap-3">
        {sections.map((sec, i) => (
          <Panel
            key={i}
            header={
              <div className="flex items-center gap-2">
                <sec.icon size={16} className="text-[var(--primary)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">{sec.title}</span>
              </div>
            }
            toggleable
            collapsed={!sec.defaultExpanded}
            pt={{
              root: { className: '!bg-[var(--card)] !text-[var(--card-foreground)] !border !border-[var(--card-border)] !rounded-[var(--radius-lg)] overflow-hidden' },
              header: { className: '!bg-transparent !px-4 !py-3 hover:!bg-[var(--background-tertiary)] cursor-pointer' },
              headerAction: { className: '!text-[var(--foreground)] !no-underline hover:!no-underline' },
              toggleableContent: { className: '!bg-transparent' },
              content: { className: '!bg-transparent !px-4 !pb-4 !pt-0 !border-t-0' },
            }}
          >
            <div className="leading-relaxed">{sec.content(navigate)}</div>
          </Panel>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-[var(--radius-lg)] bg-[var(--background-tertiary)] border border-[var(--border)]">
        <p className="text-xs text-[var(--foreground-muted)] m-0">
          💡 <strong className="text-[var(--foreground)]">¿Dudas más específicas?</strong> Pregúntale a Hermes directamente en Telegram.
        </p>
      </div>
    </div>
  );
}
