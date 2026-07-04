import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/atoms/Button';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Card } from '@/components/molecules/Card';
import { ProductMediaKitPanel } from '@/components/products/ProductMediaKitPanel';
import { getProduct } from '@/services/products';

export default function ProductMediaKitPage() {
  const { id = '' } = useParams();

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  });

  if (productQuery.isLoading) {
    return (
      <DashboardShell>
        <p className="text-sm text-[var(--foreground-muted)]">Cargando kit de medios...</p>
      </DashboardShell>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <DashboardShell>
        <Card title="Producto no encontrado">
          <Link to="/products">
            <Button variant="outline">Volver al catálogo</Button>
          </Link>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Kit de medios"
        description={`Assets reales de ${productQuery.data.name} — el Community Manager los prioriza al componer posts y reels.`}
        actions={
          <Link to={`/products/${id}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al producto
            </Button>
          </Link>
        }
      />
      <Card
        title="Assets del producto"
        subtitle="Arrastra archivos o súbelos por tipo. El Community Manager los prioriza al componer visuales."
      >
        <ProductMediaKitPanel productId={id} productName={productQuery.data.name} />
      </Card>
    </DashboardShell>
  );
}
