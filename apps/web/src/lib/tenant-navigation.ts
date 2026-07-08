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

export const tenantAdvancedNavigation = [
  {
    title: 'Mi negocio',
    items: [
      { label: 'Bandeja', href: '/', icon: Inbox },
      { label: 'Mis productos', href: '/products', icon: Package },
      { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
      { label: 'Perfil de empresa', href: '/onboarding', icon: ClipboardList },
    ],
  },
  {
    title: 'Agentes',
    items: [
      { label: 'Brand Analyst', href: '/agents', icon: Bot },
      { label: 'Community Manager', href: '/community', icon: MessageSquare },
      { label: 'Estrategia', href: '/strategy', icon: Lightbulb },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Campañas', href: '/campaigns', icon: Megaphone },
      { label: 'Contenidos', href: '/contents', icon: FileText },
      { label: 'Calendario', href: '/calendar', icon: CalendarDays },
      { label: 'Formularios', href: '/forms', icon: FileInput },
      { label: 'Leads', href: '/leads', icon: Users },
      { label: 'Activos', href: '/assets', icon: FolderOpen },
      { label: 'Propuestas', href: '/proposals', icon: FileSignature },
      { label: 'Reportes', href: '/reports', icon: BarChart3 },
      { label: 'Dominio', href: '/settings/domain', icon: Globe },
      { label: 'Competidores', href: '/settings/competitors', icon: Target },
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
      { label: 'Mi producto', href: '/products', icon: Package },
      { label: 'Ajustes', href: '/settings/copilot', icon: Settings },
    ],
  },
];

/** @deprecated Usar tenantAdvancedNavigation o tenantSohoNavigation según modo. */
export const tenantNavigation = tenantAdvancedNavigation;

export type TenantNavigationGroup = (typeof tenantAdvancedNavigation)[number];
