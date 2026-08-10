import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/molecules/Sonner';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Password } from '@/components/atoms/Password';
import { Card } from '@/components/molecules/Card';
import { AuthShell } from '@/components/layout/AuthShell';
import { SkeletonBlock } from '@/components/molecules/PageSkeleton';
import { ApiError } from '@/services/api';
import { getSetupStatus, initSetup } from '@/services/auth';

export default function SetupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSetupStatus()
      .then((status) => {
        if (status.isConfigured) {
          navigate('/login', { replace: true });
        }
      })
      .catch(() => toast.error('No se pudo verificar el estado de instalación'))
      .finally(() => setChecking(false));
  }, [navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await initSetup({ name, email, password });
      toast.success('Superadmin creado. Inicia sesión.');
      navigate('/login');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo completar el setup';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <AuthShell headline="Preparando instalación" tagline="Verificando estado de la plataforma…">
        <div className="space-y-[var(--spacing-md)]" aria-busy="true" aria-label="Verificando instalación">
          <SkeletonBlock className="h-48 w-full" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      headline="Primera configuración"
      tagline="Crea el superadmin que administrará tenants, IA y seguridad."
    >
      <Card variant="elevated" title="Cuenta superadmin" className="w-full">
        <form className="flex flex-col gap-[var(--spacing-md)]" onSubmit={onSubmit} noValidate>
          <InputText
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            fullWidth
          />
          <InputText
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            fullWidth
          />
          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label htmlFor="setup-password" className="text-sm font-medium text-[var(--foreground)]">
              Contraseña
            </label>
            <Password
              id="setup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={12}
            />
            <p className="text-xs text-[var(--foreground-muted)]">Mínimo 12 caracteres.</p>
          </div>
          <Button type="submit" variant="brand" loading={loading} className="w-full">
            Crear superadmin
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}
