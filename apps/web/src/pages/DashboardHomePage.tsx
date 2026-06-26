import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { Progress } from '@/components/molecules/Progress';
import { Button } from '@/components/atoms/Button';
import { getCompanyProfile } from '@/services/company-profile';
import { useAuthStore } from '@/store/auth';

export default function DashboardHomePage() {
  const user = useAuthStore((s) => s.user);

  const profileQuery = useQuery({
    queryKey: ['company-profile'],
    queryFn: getCompanyProfile,
    enabled: !!user?.tenantId && !user.isSuperadmin,
  });

  return (
    <DashboardShell>
      <PageHeader
        title={`Hola, ${user?.name ?? 'usuario'}`}
        description="Panel principal de Mkt Agency OS"
      />

      {user?.isSuperadmin ? (
        <Card title="Administración" subtitle="Accesos rápidos del superadmin">
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            Gestiona las organizaciones registradas en la plataforma.
          </p>
          <Link to="/tenants">
            <Button>Ver listado de tenants</Button>
          </Link>
        </Card>
      ) : (
        <Card title="Onboarding" subtitle="Perfil de empresa">
          {profileQuery.isLoading && (
            <p className="text-sm text-[var(--foreground-muted)]">Cargando progreso...</p>
          )}

          {profileQuery.data && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Completitud</span>
                  <span className="font-semibold text-[var(--primary)]">
                    {profileQuery.data.completionPercentage}%
                  </span>
                </div>
                <Progress value={profileQuery.data.completionPercentage} />
              </div>

              <p className="text-sm text-[var(--foreground-muted)]">
                {profileQuery.data.status === 'completed'
                  ? 'Tu perfil está activo. Puedes revisarlo cuando quieras.'
                  : 'Completa las secciones obligatorias para activar tu perfil (80%).'}
              </p>

              <div className="flex flex-wrap gap-2">
                <Link to="/onboarding">
                  <Button variant="outline">
                    {profileQuery.data.status === 'completed'
                      ? 'Ver cuestionario'
                      : 'Continuar onboarding'}
                  </Button>
                </Link>
                <Link to="/campaigns">
                  <Button>Ver campañas</Button>
                </Link>
              </div>
            </div>
          )}

          {!user?.tenantId && (
            <p className="text-sm text-[var(--foreground-muted)]">
              Tu usuario no tiene tenant asignado.
            </p>
          )}
        </Card>
      )}
    </DashboardShell>
  );
}
