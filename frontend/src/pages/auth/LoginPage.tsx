import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, InputText, Password } from '@/components/ui';
import { useAuthStore } from '../../stores/authStore';
import { auth } from '../../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    auth.hasUsers().then((r) => {
      if (!r.data.hasUsers) {
        navigate('/setup', { replace: true });
      }
    }).catch(() => {}).finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (checking) {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen" style={{ background: '#f0f2f5' }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} />
      </div>
    );
  }

  return (
    <div className="flex align-items-center justify-content-center min-h-screen" style={{ background: '#f0f2f5' }}>
      <Card title="MktAgencyOS" subtitle="Iniciar sesión" className="w-full max-w-sm mx-4">
        {error && <div className="text-sm text-[var(--destructive)] bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-3 py-2 mb-3 w-full">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-column gap-3">
          <div>
            <label className="block mb-1 text-sm">Email</label>
            <InputText value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" type="email" required />
          </div>
          <div>
            <label className="block mb-1 text-sm">Contraseña</label>
            <Password value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" required />
          </div>
          <Button type="submit" loading={loading} className="w-full">Entrar</Button>
        </form>
        <div className="mt-3 text-center text-sm">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </div>
      </Card>
    </div>
  );
}
