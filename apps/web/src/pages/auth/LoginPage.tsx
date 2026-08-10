import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/components/molecules/Sonner';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Password } from '@/components/atoms/Password';
import { Card } from '@/components/molecules/Card';
import { AuthShell } from '@/components/layout/AuthShell';
import { ApiError } from '@/services/api';
import { login } from '@/services/auth';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Sesión iniciada');
      const user = useAuthStore.getState().user;
      navigate(user?.isSuperadmin ? '/' : '/');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo iniciar sesión';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Iniciar sesión"
      tagline="Tu copiloto de marketing — aprueba, publica y mide resultados."
    >
      <Card title="Accede a tu cuenta" variant="elevated" className="w-full">
        <form className="flex flex-col gap-[var(--spacing-md)]" onSubmit={onSubmit} noValidate>
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
            <label htmlFor="login-password" className="text-sm font-medium text-[var(--foreground)]">
              Contraseña
            </label>
            <Password
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" variant="brand" loading={loading} className="w-full">
            Entrar
          </Button>
          <p className="text-center text-sm text-[var(--foreground-muted)]">
            ¿Primera instalación?{' '}
            <Link
              to="/setup"
              className="font-medium text-[var(--primary)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Configurar superadmin
            </Link>
          </p>
        </form>
      </Card>
    </AuthShell>
  );
}
