import { Panel } from 'primereact/panel';

const sections = [
  {
    icon: 'pi-question-circle',
    title: '¿Qué es MarketingOS?',
    content: (
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
      </div>
    ),
  },
  {
    icon: 'pi-users',
    title: 'CRM — Gestión de Leads',
    content: (
      <div>
        <p>
          El CRM organiza tus prospectos en un <strong>pipeline</strong> de
          cinco etapas:
        </p>
        <ol>
          <li><strong>Prospecto</strong> — Contacto inicial captado.</li>
          <li><strong>Contactado</strong> — Se ha establecido comunicación.</li>
          <li><strong>Interesado</strong> — Muestra interés en el producto.</li>
          <li><strong>Trial</strong> — Está en período de prueba.</li>
          <li><strong>Cliente</strong> — Conversión completada.</li>
        </ol>
        <p>
          Cada lead recibe un <strong>Score</strong> calculado
          automáticamente con base en cuatro factores:
        </p>
        <ul>
          <li><strong>Pain Points</strong> — 40%</li>
          <li><strong>Oportunidad</strong> — 30%</li>
          <li><strong>Tamaño</strong> — 20%</li>
          <li><strong>Accesibilidad</strong> — 10%</li>
        </ul>
        <p>
          Los leads con score ≥ 80 se consideran <em>calientes</em> y
          aparecen destacados en el Dashboard.
        </p>
      </div>
    ),
  },
  {
    icon: 'pi-calendar',
    title: 'Contenido — Calendario X/Twitter',
    content: (
      <div>
        <p>
          <strong>Hermes</strong> redacta publicaciones para X (antes
          Twitter) con base en tu calendario editorial. Cada post incluye
          texto y arte generado por IA.
        </p>
        <p>
          Tú revisas cada publicación en el panel de contenido y decides si
          <strong>apruebas</strong> o <strong>rechazas</strong>. Solo los
          posts aprobados se publican automáticamente en la fecha
          programada.
        </p>
        <p><strong>Brand Safety — Reglas de oro:</strong></p>
        <ol>
          <li>Siempre mantener un tono profesional y respetuoso.</li>
          <li>No hacer comentarios políticos ni religiosos.</li>
          <li>No menospreciar a competidores, clientes o personas.</li>
          <li>No usar lenguaje ofensivo o contenido sensible.</li>
          <li>Verificar datos y estadísticas antes de publicar.</li>
          <li>Incluir llamado a la acción claro cuando aplique.</li>
          <li>Respetar la identidad visual de la marca.</li>
        </ol>
      </div>
    ),
  },
  {
    icon: 'pi-megaphone',
    title: 'Google Ads — Campañas',
    content: (
      <div>
        <p>
          Desde MarketingOS puedes <strong>crear campañas de
          búsqueda (Search)</strong> en Google Ads. El sistema te guía
          para definir:
        </p>
        <ul>
          <li><strong>Palabras clave</strong> con su CPC estimado.</li>
          <li><strong>Presupuesto diario</strong> y duración de la campaña.</li>
          <li><strong>Segmentación</strong> por ubicación geográfica.</li>
        </ul>
        <p>
          Una vez activa, la campaña se monitorea en tiempo real. Puedes
          consultar el <strong>gasto acumulado vs. presupuesto</strong> y
          ajustar pausas o montos desde el panel de campañas.
        </p>
        <p>
          Recibirás alertas cuando el gasto alcance el 80% y 100% del
          presupuesto asignado.
        </p>
      </div>
    ),
  },
  {
    icon: 'pi-eye',
    title: 'Competencia — Monitoreo',
    content: (
      <div>
        <p>
          Registra a tus <strong>competidores</strong> en el panel
          correspondiente para que el sistema rastree automáticamente:
        </p>
        <ul>
          <li>
            <strong>Menciones</strong> en redes sociales y medios
            digitales.
          </li>
          <li>
            <strong>Análisis de sentimiento</strong> (positivo, neutral,
            negativo).
          </li>
          <li>
            <strong>Frecuencia de publicación</strong> y temas
            recurrentes.
          </li>
        </ul>
        <p>
          Cada semana recibirás un <strong>brief automático</strong>
          con un resumen ejecutivo de la actividad de tus competidores,
          tendencias detectadas y recomendaciones de acción.
        </p>
      </div>
    ),
  },
  {
    icon: 'pi-map',
    title: 'SEO Local — Páginas por Ciudad',
    content: (
      <div>
        <p>
          MarketingOS genera <strong>landing pages</strong> optimizadas
          para SEO local en las siguientes ciudades:
        </p>
        <ul>
          <li>Ciudad de México (CDMX)</li>
          <li>Monterrey (MTY)</li>
          <li>Guadalajara (GDL)</li>
          <li>Puebla</li>
          <li>Querétaro (Qro)</li>
          <li>Mérida</li>
        </ul>
        <p>
          Cada página incluye contenido adaptado a la localidad, datos de
          contacto y mapa interactivo. El sistema monitorea
          <strong>posiciones en Google</strong> para las palabras clave
          objetivo en cada ciudad.
        </p>
        <p>
          Recibirás alertas cuando alguna página baje de posición para que
          tomes acción.
        </p>
      </div>
    ),
  },
  {
    icon: 'pi-check-circle',
    title: 'Onboarding — Checklist',
    content: (
      <div>
        <p>
          Para cada nuevo <strong>tenant</strong> o <strong>producto</strong>,
          el sistema presenta un checklist de 8 pasos:
        </p>
        <ol>
          <li>Crear perfil del negocio</li>
          <li>Conectar cuenta de X (Twitter)</li>
          <li>Configurar Google Ads (opcional)</li>
          <li>Agregar palabras clave objetivo</li>
          <li>Registrar competidores</li>
          <li>Definir ciudades para SEO Local</li>
          <li>Invitar miembros del equipo</li>
          <li>Revisar y aprobar primer contenido sugerido</li>
        </ol>
        <p>
          Puedes dar seguimiento al progreso desde el panel de
          administración. Cada paso completado se marca con un visto.
        </p>
      </div>
    ),
  },
  {
    icon: 'pi-info-circle',
    title: 'Preguntas Frecuentes',
    content: (
      <div>
        <dl>
          <dt><strong>¿Cómo agrego un producto?</strong></dt>
          <dd>
            Ve al panel de administración, selecciona "Productos" y da clic
            en "Agregar producto". Ingresa el nombre, descripción y
            configuración inicial.
          </dd>

          <dt><strong>¿Cómo invito a mi equipo?</strong></dt>
          <dd>
            En la sección de administración, elige "Miembros" y usa el botón
            "Invitar". Ingresa el correo electrónico y selecciona el rol
            (admin, editor, lector).
          </dd>

          <dt><strong>¿Cómo rechazo un post sugerido?</strong></dt>
          <dd>
            En el calendario de contenido, cada post tiene botones de
            "Aprobar" y "Rechazar". Al rechazar, puedes agregar un comentario
            para que Hermes ajuste la propuesta.
          </dd>

          <dt><strong>¿Cuánto cuestan los anuncios de Google Ads?</strong></dt>
          <dd>
            Tú defines el presupuesto diario al crear la campaña. MarketingOS
            no cobra comisión sobre el gasto publicitario; solo pagas lo que
            inviertas en Google Ads.
          </dd>

          <dt><strong>¿Cómo configuro las credenciales de X?</strong></dt>
          <dd>
            En la sección de administración, ve a "Conexiones" y selecciona
            X/Twitter. Sigue el flujo de autorización de OAuth para conectar
            tu cuenta. Solo los administradores pueden realizar esta
            configuración.
          </dd>
        </dl>
      </div>
    ),
  },
];

export default function HelpPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="mt-0">Manual de Ayuda</h2>

      <div className="flex flex-column gap-3">
        {sections.map((sec, i) => (
          <Panel
            key={i}
            header={
              <span>
                <i
                  className={`pi ${sec.icon}`}
                  style={{ marginRight: 10 }}
                />
                {sec.title}
              </span>
            }
            toggleable
            collapsed
          >
            <div style={{ lineHeight: 1.7 }}>{sec.content}</div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
