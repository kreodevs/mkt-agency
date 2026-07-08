import {
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
  Package,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Target,
  Users,
  AlertTriangle,
} from 'lucide-react';

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
      { label: 'Librería', href: '/assets', icon: FolderOpen },
    ],
  },
  {
    title: 'Mi negocio',
    items: [
      { label: 'Resumen', href: '/agency-overview', icon: BarChart3 },
      { label: 'Mis productos', href: '/products', icon: Package },
      { label: 'Ajustes', href: '/settings/copilot', icon: Settings },
    ],
  },
  {
    title: 'Crear con IA',
    items: [
      { label: 'Agentes IA', href: '/agents', icon: Bot },
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

/** Navegación por defecto para SOHO: bandeja, producto y ajustes del copiloto. */
export const tenantSohoNavigation = [
  {
    title: 'Copiloto',
    items: [
      { label: 'Inicio', href: '/', icon: Inbox },
      { label: 'Calendario', href: '/calendario', icon: CalendarDays },
      { label: 'Librería', href: '/assets', icon: FolderOpen },
      { label: 'Mi producto', href: '/products', icon: Package },
      { label: 'Ajustes', href: '/settings/copilot', icon: Settings },
    ],
  },
];

/** @deprecated Usar tenantAdvancedNavigation o tenantSohoNavigation según modo. */
export const tenantNavigation = tenantAdvancedNavigation;

export type TenantNavigationGroup = (typeof tenantAdvancedNavigation)[number];
