import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { InputText } from '@/components/atoms/InputText';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { toast } from '@/components/molecules/Sonner';
import { createProductFromUrl } from '@/services/products';

export default function ProductCreateWithAiPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const product = await createProductFromUrl({ url: url.trim() });
      toast.success('Producto creado con IA');
      navigate(`/products/${product.id}/onboarding`);
    } catch {
      toast.error('No se pudo crear el producto. Verifica la URL e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Crear producto con IA"
        description="Pega la URL de tu producto o servicio y nuestra IA inferirá automáticamente nombre, descripción, audiencia, propuesta de valor y tags SEO."
      />

      <Card title="URL del producto o servicio">
        <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-6">
          <InputText
            label="URL de la página web"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://mi-empresa.com/mi-producto"
            required
            type="url"
          />

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-secondary)] p-4 text-sm text-[var(--foreground-muted)]">
            <p className="font-medium text-[var(--foreground)]">La IA inferirá:</p>
            <ul className="mt-2 list-inside space-y-1">
              <li>• Nombre comercial sugerido</li>
              <li>• Descripción del producto o servicio</li>
              <li>• Propuesta de valor</li>
              <li>• Audiencia objetivo en México</li>
              <li>• Tags SEO para descubrimiento de competidores</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={loading}>
              Crear producto con IA
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/products')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </DashboardShell>
  );
}
