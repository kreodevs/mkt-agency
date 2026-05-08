import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
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

const STATUS_SEVERITY: Record<string, 'success' | 'warning' | 'info' | 'secondary'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  skipped: 'secondary',
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
              size="large"
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
          <Tag severity="success" value="completado" />
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
        size="small"
        severity="success"
        loading={completingKey === row.key}
        onClick={() => handleComplete(row.key)}
      />
    );
  };

  const statusBody = (row: OnboardingTask) => (
    <Tag severity={STATUS_SEVERITY[row.status] || 'warning'} value={row.status} />
  );

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="mt-0">Onboarding</h2>
        <Tag
          severity={data?.status === 'in_progress' ? 'info' : 'warning'}
          value={data?.status || 'pending'}
        />
      </div>

      <Card className="mb-3">
        <div className="flex align-items-center gap-3">
          <span className="font-medium">Progreso:</span>
          <ProgressBar value={progress} style={{ flex: 1, height: '1.5rem' }} />
          <span className="font-bold">
            {completedCount}/{TOTAL_TASKS}
          </span>
        </div>
      </Card>

      <Card>
        <DataTable
          value={data?.tasks || []}
          loading={loading}
          size="small"
          stripedRows
        >
          <Column field="order" header="#" style={{ width: '60px' }} />
          <Column field="title" header="Tarea" />
          <Column field="description" header="Descripción" />
          <Column
            field="status"
            header="Estado"
            body={statusBody}
            style={{ width: '120px' }}
          />
          <Column
            header="Acción"
            body={actionBody}
            style={{ width: '140px' }}
          />
        </DataTable>
      </Card>
    </div>
  );
}
