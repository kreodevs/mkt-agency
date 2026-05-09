import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
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
      <Card title="MktAgencyOS" subTitle="Iniciar sesión" className="w-25rem">
        {error && <Message severity="error" text={error} className="mb-2 w-full" />}
        <form onSubmit={handleSubmit} className="flex flex-column gap-3">
          <div>
            <label className="block mb-1 text-sm">Email</label>
            <InputText value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" type="email" required />
          </div>
          <div>
            <label className="block mb-1 text-sm">Contraseña</label>
            <Password value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" feedback={false} toggleMask required />
          </div>
          <Button type="submit" label="Entrar" loading={loading} className="w-full" />
        </form>
        <div className="mt-3 text-center text-sm">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </div>
      </Card>
    </div>
  );
}
