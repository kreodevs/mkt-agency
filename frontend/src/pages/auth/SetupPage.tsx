import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { auth } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function SetupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    auth.hasUsers().then((r) => {
      if (r.data.hasUsers) {
        navigate('/login', { replace: true });
      }
    }).catch(() => {}).finally(() => setChecking(false));
  }, []);

  const handleSubmit = async () => {
    if (!name || !email || !password || !tenantName) return;
    setLoading(true);
    setError('');
    try {
      const r = await auth.setup({ name, email, password, tenantName });
      useAuthStore.setState({ token: r.data.token, user: r.data.user });
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el administrador');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} />
      </div>
    );
  }

  return (
    <div className="flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Card style={{ width: 420 }}>
        <div className="flex flex-column align-items-center mb-4">
          <i className="pi pi-shield text-primary" style={{ fontSize: '3rem' }} />
          <h2 className="mt-2 mb-1">Configurar Administrador</h2>
          <p className="text-500 mt-0" style={{ fontSize: '0.9rem' }}>
            Primera vez en MarketingOS. Crea tu cuenta de administrador.
          </p>
        </div>

        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        <div className="flex flex-column gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Tu nombre</label>
            <InputText
              placeholder="Ej: Jorge Correa"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <InputText
              placeholder="ej: jorge@kreodevs.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full"
              type="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <InputText
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full"
              type="password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del proyecto / empresa</label>
            <InputText
              placeholder="Ej: KreoDevs"
              value={tenantName}
              onChange={e => setTenantName(e.target.value)}
              className="w-full"
            />
          </div>

          <Button
            label="Crear Administrador"
            icon="pi pi-check"
            onClick={handleSubmit}
            loading={loading}
            disabled={!name || !email || !password || !tenantName}
            className="w-full"
          />
        </div>
      </Card>
    </div>
  );
}
