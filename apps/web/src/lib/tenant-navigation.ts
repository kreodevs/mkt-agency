import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  ClipboardList,
  Coins,
  FileInput,
  FileSignature,
  FileText,
  FolderOpen,
  Globe,
  Inbox,
  Lightbulb,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Package,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Target,
  Users,
  AlertTriangle,
} from 'lucide-react';

/** Ruta SPA de la librería (no usar `/assets`: colisiona con chunks de Vite en nginx). */
export const LIBRARY_ROUTE = '/libreria';

export const superadminNavigation = [
  {
    title: 'Administración',
    items: [
      { label: 'Inicio', href: '/', icon: Shield },
      { label: 'Tenants', href: '/tenants', icon: Building2 },
      { label: 'Paquetes', href: '/admin/packages', icon: Package },
      { label: 'Usuarios', href: '/admin/users', icon: Users },
      { label: 'Auditoría', href: '/admin/audit-logs', icon: ScrollText },
      { label: 'Seguridad', href: '/admin/security-events', icon: AlertTriangle },
    ],
  },
  {
    title: 'Configuración IA',
    items: [
      { label: 'Proveedores LLM', href: '/admin/llm-providers', icon: Bot },
      { label: 'Modelos por tarea', href: '/admin/llm-settings', icon: Sparkles },
      { label: 'Consumo IA', href: '/admin/llm-usage', icon: Coins },
      { label: 'Integraciones', href: '/admin/integrations', icon: Globe },
    ],
  },
];

/** Menú agencia: agrupado por hábito diario → negocio → IA → herramientas → configuración. */
export const tenantAdvancedNavigation = [
  {
    title: 'Hoy',
    items: [
      { label: 'Inicio', href: '/', icon: Inbox },
      { label: 'Calendario', href: '/calendario', icon: CalendarDays },
      { label: 'Librería', href: LIBRARY_ROUTE, icon: FolderOpen },
    ],
  },
  {
    title: 'Mi negocio',
    items: [
      { label: 'Resumen', href: '/agency-overview', icon: BarChart3 },
      { label: 'Actividad agentes', href: '/agency/activity', icon: Activity },
      { label: 'Mis productos', href: '/products', icon: Package },
      { label: 'Ajustes', href: '/settings/copilot', icon: Settings },
    ],
  },
  {
    title: 'Crear con IA',
    items: [
      { label: 'Agentes IA', href: '/agents', icon: Bot },
      { label: 'Estrategia comercial', href: '/agency/strategy', icon: Lightbulb },
      { label: 'Pauta (manual)', href: '/agency/media-intents', icon: Coins },
      { label: 'Community Manager', href: '/community', icon: MessageSquare },
      { label: 'Campañas', href: '/campaigns', icon: Megaphone },
      { label: 'Estrategia', href: '/strategy', icon: Lightbulb },
    ],
  },
  {
    title: 'Herramientas',
    items: [
      { label: 'Contenidos', href: '/contents', icon: FileText },
      { label: 'Métricas', href: '/dashboard', icon: BarChart3 },
      { label: 'Leads', href: '/leads', icon: Users },
      { label: 'Inbox social', href: '/social/inbox', icon: MessagesSquare },
      { label: 'Formularios', href: '/forms', icon: FileInput },
      { label: 'Reportes', href: '/reports', icon: BarChart3 },
      { label: 'Propuestas', href: '/proposals', icon: FileSignature },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { label: 'Perfil de empresa', href: '/onboarding', icon: ClipboardList },
      { label: 'Competidores', href: '/settings/competitors', icon: Target },
      { label: 'Dominio', href: '/settings/domain', icon: Globe },
      { label: 'Calendario editorial', href: '/calendar', icon: CalendarDays },
    ],
  },
];

/** Navegación SOHO: bandeja, actividad agentes, producto y ajustes. */
export const tenantSohoNavigation = [
  {
    title: 'Copiloto',
    items: [
      { label: 'Inicio', href: '/', icon: Inbox },
      { label: 'Calendario', href: '/calendario', icon: CalendarDays },
      { label: 'Actividad agentes', href: '/agency/activity', icon: Activity },
      { label: 'Inbox social', href: '/social/inbox', icon: MessagesSquare },
      { label: 'Leads', href: '/leads', icon: Users },
      { label: 'Librería', href: LIBRARY_ROUTE, icon: FolderOpen },
      { label: 'Mi producto', href: '/products', icon: Package },
      { label: 'Ajustes', href: '/settings/copilot', icon: Settings },
    ],
  },
];

/** @deprecated Usar tenantAdvancedNavigation o tenantSohoNavigation según modo. */
export const tenantNavigation = tenantAdvancedNavigation;

export type TenantNavigationGroup = (typeof tenantAdvancedNavigation)[number];
