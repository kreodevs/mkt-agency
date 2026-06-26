import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/molecules/Sonner';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { Password } from '@/components/atoms/Password';
import { Card } from '@/components/molecules/Card';
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
      <div className="flex min-h-screen items-center justify-center text-[var(--foreground-muted)]">
        Verificando instalación...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card
        title="Bootstrap"
        subtitle="Crea el primer superadmin de la plataforma"
        className="w-full max-w-md"
      >
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <InputText
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
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
              minLength={12}
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Crear superadmin
          </Button>
        </form>
      </Card>
    </div>
  );
}
