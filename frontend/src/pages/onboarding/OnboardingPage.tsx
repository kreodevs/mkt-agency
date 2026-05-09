import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, DataTable, Progress } from '@/components/ui';
import { getCurrentTenant } from '../../stores/authStore';
import { onboarding } from '../../services/api';

interface OnboardingTask {
  key: string;
  order: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

interface Onboarding {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
  tasks: OnboardingTask[];
  createdAt: string;
}

const TOTAL_TASKS = 8;

const statusTag = (status: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'bg-amber-100 text-amber-800', label: 'pending' },
    in_progress: { cls: 'bg-purple-100 text-purple-800', label: 'in_progress' },
    completed: { cls: 'bg-emerald-100 text-emerald-800', label: 'completed' },
    skipped: { cls: 'bg-gray-100 text-gray-800', label: 'skipped' },
  };
  const entry = map[status] || { cls: 'bg-amber-100 text-amber-800', label: status };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${entry.cls}`}>
      {entry.label}
    </span>
  );
};

const onboardStatusTag = (status: string) => {
  const isInProgress = status === 'in_progress';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${isInProgress ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`}>
      {status || 'pending'}
    </span>
  );
};

export default function OnboardingPage() {
  const tenant = getCurrentTenant();
  const navigate = useNavigate();
  const [data, setData] = useState<Onboarding | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingKey, setCompletingKey] = useState<string | null>(null);

  const fetchData = () => {
    if (!tenant) return;
    setLoading(true);
    onboarding
      .list(tenant.id)
      .then((r) => {
        const list = r.data || [];
        const latest: Onboarding | undefined = Array.isArray(list)
          ? list[list.length - 1]
          : list;
        setData(latest || null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [tenant?.id]);

  const handleStart = async () => {
    if (!tenant) return;
    await onboarding.create(tenant.id);
    fetchData();
  };

  const handleComplete = async (taskKey: string) => {
    if (!tenant || !data) return;
    setCompletingKey(taskKey);
    try {
      await onboarding.updateTask(tenant.id, data.id, taskKey, 'completed');
      fetchData();
    } finally {
      setCompletingKey(null);
    }
  };

  const completedCount =
    data?.tasks?.filter((t) => t.status === 'completed').length || 0;
  const progress = Math.round((completedCount / TOTAL_TASKS) * 100);
  const isCompleted = data?.status === 'completed';

  // --- States ---

  // No onboarding exists yet
  if (!data && !loading) {
    return (
      <div>
        <div className="flex justify-content-between align-items-center mb-3">
          <h2 className="mt-0">Onboarding</h2>
        </div>
        <Card>
          <div className="text-center py-5">
            <i
              className="pi pi-info-circle"
              style={{ fontSize: '3rem', color: 'var(--blue-500)' }}
            />
            <h3 className="mt-3">¡Bienvenido a MarketingOS!</h3>
            <p className="text-lg mb-4">
              Completa el onboarding para configurar tu cuenta y empezar a
              gestionar campañas.
            </p>
            <Button
              label="🚀 Iniciar Onboarding"
              icon="pi pi-play"
              onClick={handleStart}
              size="lg"
            />
          </div>
        </Card>
      </div>
    );
  }

  // Onboarding completed
  if (isCompleted) {
    return (
      <div>
        <div className="flex justify-content-between align-items-center mb-3">
          <h2 className="mt-0">Onboarding</h2>
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
            completado
          </span>
        </div>
        <Card>
          <div className="text-center py-5">
            <i
              className="pi pi-check-circle"
              style={{ fontSize: '4rem', color: 'var(--green-500)' }}
            />
            <h2 className="mt-3">¡Felicidades! 🎉</h2>
            <p className="text-lg mb-4">
              Has completado el onboarding. Ya puedes empezar a usar MarketingOS
              al máximo.
            </p>
            <Button
              label="Ir a CRM"
              icon="pi pi-arrow-right"
              onClick={() => navigate('/crm')}
            />
          </div>
        </Card>
      </div>
    );
  }

  // --- Active onboarding (pending / in_progress) ---
  const actionBody = (row: OnboardingTask) => {
    if (row.status !== 'pending' && row.status !== 'in_progress') return null;
    return (
      <Button
        label="✓ Completar"
        icon="pi pi-check"
        size="sm"
        severity="success"
        loading={completingKey === row.key}
        onClick={() => handleComplete(row.key)}
      />
    );
  };

  const columns = [
    { field: 'order', header: '#', width: '60px' },
    { field: 'title', header: 'Tarea' },
    { field: 'description', header: 'Descripción' },
    { field: 'status', header: 'Estado', width: '120px', body: (row: OnboardingTask) => statusTag(row.status) },
    { header: 'Acción', width: '140px', body: actionBody, field: '' },
  ];

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="mt-0">Onboarding</h2>
        {onboardStatusTag(data?.status || 'pending')}
      </div>

      <Card className="mb-3">
        <div className="flex align-items-center gap-3">
          <span className="font-medium">Progreso:</span>
          <Progress value={progress} className="flex-1" />
          <span className="font-bold">
            {completedCount}/{TOTAL_TASKS}
          </span>
        </div>
      </Card>

      <Card>
        <DataTable
          data={data?.tasks || []}
          loading={loading}
          dense
          striped
          columns={columns}
        />
      </Card>
    </div>
  );
}
