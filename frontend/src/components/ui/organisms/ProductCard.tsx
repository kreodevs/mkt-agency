import { cn } from "@/lib/utils";
import { Card } from '../molecules/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { ShoppingCart } from "lucide-react";

export interface ProductCardProps {
    /** Título del producto */
    title: string;
    /** Precio actual ("$99.00") */
    price: string | number;
    /** Precio anterior ("$120.00") (Opcional, saca línea de tachado) */
    compareAtPrice?: string | number;
    /** URL de la imagen principal */
    image: string;
    /** URL de la imagen secundaria al hacer hover (opcional) */
    hoverImage?: string;
    /** Etiqueta promocional ("Nuevo", "-20%", "Agotado") */
    badge?: string;
    /** Si true, la tarjeta está deshabilitada (ej. Agotado) */
    disabled?: boolean;
    /** Texto del botón principal */
    actionText?: string;
    /** Handler para el botón de compra */
    onAddToCart?: () => void;
    /** Clases adicionales */
    className?: string;
}

/**
 * ProductCard - Un componente de E-Commerce Premium para tiendas online y catálogos.
 * Brinda un aspecto sofisticado (estilo marcas de lujo / boutique) con hover states.
 */
export function ProductCard({
    title,
    price,
    compareAtPrice,
    image,
    hoverImage,
    badge,
    disabled = false,
    actionText = "Añadir al carrito",
    onAddToCart,
    className,
}: ProductCardProps) {
    return (
        <Card
            className={cn(
                "group relative overflow-hidden flex flex-col justify-between h-full bg-transparent border-border hover:border-gold transition-colors duration-300",
                disabled && "opacity-75 grayscale-[0.5] pointer-events-none",
                className
            )}>
            {/* Contenedor de Imagen con Efecto Hover */}
            <div className="relative aspect-[3/4] overflow-hidden bg-[var(--secondary)]">
                {badge && (
                    <Badge className="absolute top-4 left-4 z-20 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold px-[var(--spacing-md)] py-[var(--spacing-xs)] shadow-md">
                        {badge}
                    </Badge>
                )}

                <img
                    src={image}
                    alt={title}
                    className={cn(
                        "absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[800ms] group-hover:scale-110",
                        hoverImage && "group-hover:opacity-0"
                    )}
                />

                {hoverImage && (
                    <img
                        src={hoverImage}
                        alt={`${title} - alternative`}
                        className={cn(
                            "absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[800ms] scale-110 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                        )}
                    />
                )}
            </div>

            {/* Información del Producto */}
            <div className="p-[var(--spacing-lg)] flex flex-col flex-grow">
                <h3 className="font-medium text-lg text-[var(--foreground)] tracking-tight leading-tight mb-[var(--spacing-sm)] group-hover:text-gold transition-colors">
                    {title}
                </h3>

                <div className="mt-auto flex items-end justify-between pt-[var(--spacing-md)]">
                    <div className="flex flex-col">
                        {compareAtPrice && (
                            <span className="text-sm text-[var(--muted-foreground)] line-through">
                                {compareAtPrice}
                            </span>
                        )}
                        <span className="text-xl font-bold text-[var(--foreground)]">
                            {price}
                        </span>
                    </div>

                    <Button
                        size="icon"
                        variant="default"
                        disabled={disabled}
                        className="rounded-full w-10 h-10 shadow-md group-hover:scale-110 transition-transform active:scale-95 bg-[var(--primary)]"
                        onClick={(e) => {
                            e.preventDefault();
                            if (onAddToCart) onAddToCart();
                        }}
                    >
                        <ShoppingCart className="w-5 h-5 text-white" />
                        <span className="sr-only">{actionText}</span>
                    </Button>
                </div>
            </div>
        </Card>
    );
}
