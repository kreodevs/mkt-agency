import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/components/molecules/Sonner';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Password } from '@/components/atoms/Password';
import { Card } from '@/components/molecules/Card';
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
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card title="Iniciar sesión" subtitle="Mkt Agency OS" className="w-full max-w-md">
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <InputText
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <div className="flex flex-col gap-[var(--spacing-xs)]">
            <label className="text-sm font-medium text-[var(--foreground)]">Contraseña</label>
            <Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>
          <p className="text-center text-sm text-[var(--foreground-muted)]">
            ¿Primera instalación?{' '}
            <Link to="/setup" className="text-[var(--primary)] hover:underline">
              Configurar superadmin
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
