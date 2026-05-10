import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, InputText, Password } from '@/components/ui';
import { useAuthStore } from '../../stores/authStore';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password, tenantName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex align-items-center justify-content-center min-h-screen" style={{ background: '#f0f2f5' }}>
      <Card title="MktAgencyOS" subtitle="Crear cuenta" className="w-full max-w-sm mx-4">
        {error && <div className="text-sm text-[var(--destructive)] bg-red-50 border border-red-200 rounded-[var(--radius-sm)] px-3 py-2 mb-3 w-full">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-column gap-3">
          <div>
            <label className="block mb-1 text-sm">Nombre</label>
            <InputText value={name} onChange={(e) => setName(e.target.value)} className="w-full" required />
          </div>
          <div>
            <label className="block mb-1 text-sm">Email</label>
            <InputText value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" type="email" required />
          </div>
          <div>
            <label className="block mb-1 text-sm">Contraseña</label>
            <Password value={password} onChange={(e) => setPassword(e.target.value)} className="w-full" required />
          </div>
          <div>
            <label className="block mb-1 text-sm">Nombre de la empresa</label>
            <InputText value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="w-full" required />
          </div>
          <Button type="submit" loading={loading} className="w-full">Crear cuenta</Button>
        </form>
        <div className="mt-3 text-center text-sm">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>
      </Card>
    </div>
  );
}
