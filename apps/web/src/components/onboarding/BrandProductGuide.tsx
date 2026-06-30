import { Building2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

type BrandProductGuideVariant = 'company' | 'product';

interface BrandProductGuideProps {
  variant: BrandProductGuideVariant;
  productId?: string;
}

export function BrandProductGuide({ variant, productId }: BrandProductGuideProps) {
  if (variant === 'company') {
    return (
      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-4 text-sm">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
          <div>
            <p className="font-semibold text-[var(--foreground)]">Perfil de empresa (marca ligera)</p>
            <p className="mt-1 text-[var(--foreground-muted)]">
              Aquí defines el contexto global de tu negocio: nombre, tono y audiencia general. Para
              que la agencia genere publicaciones sobre una oferta concreta, activa el{' '}
              <strong>onboarding de producto</strong> en Mis productos.
            </p>
            <Link to="/products" className="mt-2 inline-block text-[var(--primary)] underline">
              Ir a Mis productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 text-sm">
      <div className="flex items-start gap-3">
        <Package className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
        <div>
          <p className="font-semibold text-[var(--foreground)]">Activación del producto</p>
          <p className="mt-1 text-[var(--foreground-muted)]">
            Este wizard configura la oferta que la agencia promociona: propuesta de valor, tags SEO y
            disparo de agentes. El perfil de empresa aporta tono y contexto de marca; no lo
            reemplaza.
          </p>
          <Link to="/onboarding" className="mt-2 mr-4 inline-block text-[var(--primary)] underline">
            Editar perfil de empresa
          </Link>
          {productId && (
            <Link
              to={`/products/${productId}`}
              className="mt-2 inline-block text-[var(--primary)] underline"
            >
              Ver ficha del producto
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default BrandProductGuide;
