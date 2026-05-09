import { Panel } from 'primereact/panel';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';

const sections = [
  {
    icon: 'pi-question-circle',
    title: '¿Qué es MarketingOS?',
    defaultExpanded: true,
    content: (navigate: any) => (
      <div>
        <p>
          <strong>MarketingOS</strong> es un sistema CRM combinado con un
          Motor de Marketing impulsado por inteligencia artificial.
        </p>
        <p>
          Nuestro agente <strong>Hermes</strong> analiza tus datos, redacta
          contenido para redes sociales, sugiere campañas de Google Ads y
          monitorea a la competencia. Sin embargo, tú mantienes el control
          total: <strong>Hermes propone, tú apruebas</strong>. Nada se publica
          ni se ejecuta sin tu confirmación explícita.
        </p>
        <p>
          El flujo de trabajo es simple: revisa las sugerencias en el
          panel de aprobación, haz ajustes si es necesario, y confirma para
          que se ejecuten.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Chip label="Multi-producto" icon="pi pi-box" />
          <Chip label="Multi-tenant" icon="pi pi-building" />
          <Chip label="IA + Humano" icon="pi pi-robot" />
          <Chip label="Auto-reportes" icon="pi pi-file" />
        </div>
      </div>
    ),
  },
  {
    icon: 'pi-plug',
    title: '1. Conexiones — Conecta tus cuentas',
    content: (navigate: any) => (
      <div>
        <p>
          Antes de empezar, necesitas conectar las plataformas que MarketingOS usará.
          Cada <strong>producto</strong> tiene sus propias conexiones.
        </p>
        <div className="flex flex-column gap-2 mb-3">
          <div className="flex align-items-center gap-2 p-2 border-1 border-round" style={{ background: '#f8f9fa' }}>
            <i className="pi pi-twitter text-xl" style={{ color: '#1DA1F2' }} />
            <div className="flex-1">
              <strong>X (Twitter)</strong>
              <div className="text-sm text-500">API Key + API Secret + Access Token + Access Secret del Developer Portal</div>
            </div>
          </div>
          <div className="flex align-items-center gap-2 p-2 border-1 border-round" style={{ background: '#f8f9fa' }}>
            <i className="pi pi-google text-xl" style={{ color: '#4285F4' }} />
            <div className="flex-1">
              <strong>Google Ads</strong>
              <div className="text-sm text-500">Developer Token + Client ID + Client Secret</div>
            </div>
          </div>
          <div className="flex align-items-center gap-2 p-2 border-1 border-round" style={{ background: '#f8f9fa' }}>
            <i className="pi pi-whatsapp text-xl" style={{ color: '#25D366' }} />
            <div className="flex-1">
              <strong>WhatsApp</strong>
              <div className="text-sm text-500">Phone Number ID + Token (Cloud API)</div>
            </div>
          </div>
        </div>
        <Button label="Ir a Conexiones" icon="pi pi-arrow-right" onClick={() => navigate('/settings')} size="small" />
      </div>
    ),
  },
  {
    icon: 'pi-users',
    title: '2. CRM — Captura y gestiona leads',
    content: (navigate: any) => (
      <div>
        <p>
          El CRM organiza tus prospectos en un <strong>pipeline</strong> de
          cinco etapas:
        </p>
        <div className="flex flex-wrap gap-1 mb-3">
          <Chip label="🟣 Prospecto" />
          <Chip label="🔵 Contactado" />
          <Chip label="🟡 Interesado" />
          <Chip label="🟠 Trial" />
          <Chip label="🟢 Cliente" />
        </div>
        <p>Puedes:</p>
        <ul>
          <li><strong>Agregar leads manualmente</strong> — datos del prospecto</li>
          <li><strong>Cambiar etapa</strong> — arrastra o selecciona la etapa actual</li>
          <li><strong>Ver score automático</strong> — IA calcula calidad del lead</li>
          <li><strong>Filtrar por producto</strong> — leads de OralTrack vs NutriTrack</li>
        </ul>
        <Button label="Ir a CRM" icon="pi pi-arrow-right" onClick={() => navigate('/crm')} size="small" />
      </div>
    ),
  },
  {
    icon: 'pi-calendar',
    title: '3. Contenido — Publicaciones en X/Twitter',
    content: (navigate: any) => (
      <div>
        <p>
          <strong>Hermes</strong> redacta publicaciones para X con base en tu calendario editorial.
          Cada post incluye texto y arte generado por IA.
        </p>
        <p><strong>Flujo de aprobación:</strong></p>
        <ol>
          <li>Hermes te sugiere un post → aparece en <strong>Contenido</strong></li>
          <li>Lo revisas, editas si quieres</li>
          <li><strong>Apruebas</strong> o <strong>Rechazas</strong></li>
          <li>Si apruebas, se publica automáticamente en la fecha programada</li>
        </ol>
        <p className="text-sm text-500 mt-2">
          ⚡ Necesitas tener configurada tu cuenta de X en Conexiones para que funcione.
        </p>
        <Button label="Ir a Contenido" icon="pi pi-arrow-right" onClick={() => navigate('/content')} size="small" />
      </div>
    ),
  },
  {
    icon: 'pi-megaphone',
    title: '4. Google Ads — Campañas de pago',
    content: (navigate: any) => (
      <div>
        <p>
          Crea campañas de <strong>búsqueda (Search)</strong> en Google Ads.
        </p>
        <p><strong>¿Qué necesitas?</strong></p>
        <ol>
          <li>Conectar Google Ads en <strong>Configuración → Google Ads</strong></li>
          <li>Ir a <strong>Campañas</strong></li>
          <li>Crear campaña: palabras clave + presupuesto diario + duración</li>
          <li>MarketingOS monitorea gasto vs presupuesto y te alerta al 80% y 100%</li>
        </ol>
        <Button label="Ir a Campañas" icon="pi pi-arrow-right" onClick={() => navigate('/campaigns')} size="small" />
      </div>
    ),
  },
  {
    icon: 'pi-eye',
    title: '5. Competencia — Monitoreo automático',
    content: (navigate: any) => (
      <div>
        <p>
          Registra a tus <strong>competidores</strong> y el sistema rastrea:
        </p>
        <ul>
          <li><strong>Menciones</strong> en redes sociales y medios digitales</li>
          <li><strong>Análisis de sentimiento</strong> (positivo, neutral, negativo)</li>
          <li><strong>Frecuencia de publicación</strong> y temas recurrentes</li>
        </ul>
        <p className="text-sm text-500">
          ⚡ Esta función requiere que Hermes esté activo (conexión webhook configurada).
        </p>
        <Button label="Ir a Competencia" icon="pi pi-arrow-right" onClick={() => navigate('/competitors')} size="small" />
      </div>
    ),
  },
  {
    icon: 'pi-map',
    title: '6. SEO Local — Landing pages por ciudad',
    content: (navigate: any) => (
      <div>
        <p>
          MarketingOS genera <strong>landing pages</strong> optimizadas
          para SEO local en ciudades clave:
        </p>
        <div className="flex flex-wrap gap-1 mb-3">
          <Chip label="CDMX" />
          <Chip label="Monterrey" />
          <Chip label="Guadalajara" />
          <Chip label="Puebla" />
          <Chip label="Querétaro" />
          <Chip label="Mérida" />
        </div>
        <p>
          El sistema monitorea <strong>posiciones en Google</strong> para palabras clave
          y te alerta si alguna página baja de ranking.
        </p>
        <Button label="Ir a SEO" icon="pi pi-arrow-right" onClick={() => navigate('/seo')} size="small" />
      </div>
    ),
  },
  {
    icon: 'pi-check-circle',
    title: '7. Onboarding — Checklist de configuración',
    content: (navigate: any) => (
      <div>
        <p>
          Por cada nuevo producto, el sistema tiene un checklist de 8 pasos
          para asegurar que no te saltes nada importante:
        </p>
        <ol>
          <li>Crear perfil del negocio</li>
          <li>Conectar cuenta de X</li>
          <li>Configurar Google Ads</li>
          <li>Agregar palabras clave objetivo</li>
          <li>Registrar competidores</li>
          <li>Definir ciudades para SEO Local</li>
          <li>Invitar miembros del equipo</li>
          <li>Revisar y aprobar primer contenido sugerido</li>
        </ol>
        <Button label="Ir a Onboarding" icon="pi pi-arrow-right" onClick={() => navigate('/onboarding')} size="small" />
      </div>
    ),
  },
  {
    icon: 'pi-cog',
    title: '8. Administración — Gestión general',
    content: (navigate: any) => (
      <div>
        <p>Desde el panel de Admin puedes:</p>
        <ul>
          <li><strong>Crear tenants</strong> — nuevas empresas/clientes</li>
          <li><strong>Agregar productos</strong> — SAAS dentro de cada tenant</li>
          <li><strong>Ver usuarios</strong> — quién tiene acceso a cada tenant</li>
          <li><strong>Eliminar tenants</strong> — borrado completo con todos sus datos</li>
        </ul>
        <Button label="Ir a Admin" icon="pi pi-arrow-right" onClick={() => navigate('/admin')} size="small" />
      </div>
    ),
  },
];

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="flex align-items-center gap-2 mb-3">
        <h2 className="mt-0">Manual de Ayuda</h2>
      </div>

      <p className="text-600 mb-4">
        Selecciona una sección para ver instrucciones paso a paso.
        Cada sección tiene un botón para ir directamente a la página correspondiente.
      </p>

      <div className="flex flex-column gap-3">
        {sections.map((sec, i) => (
          <Panel
            key={i}
            header={
              <span>
                <i className={`pi ${sec.icon}`} style={{ marginRight: 10 }} />
                {sec.title}
              </span>
            }
            toggleable
            collapsed={!sec.defaultExpanded}
          >
            <div style={{ lineHeight: 1.7 }}>{sec.content(navigate)}</div>
          </Panel>
        ))}
      </div>

      <div className="mt-5 p-3 border-round" style={{ background: 'var(--highlight-bg)' }}>
        <p className="text-sm m-0">
          💡 <strong>¿Dudas más específicas?</strong> Pregúntale a Hermes directamente en el chat de Telegram.
          Hermes conoce toda la arquitectura de MarketingOS.
        </p>
      </div>
    </div>
  );
}
