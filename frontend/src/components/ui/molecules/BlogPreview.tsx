import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Calendar, User } from "lucide-react";
import { Button } from "@/components";

export interface BlogPost {
    /** Título del artículo */
    title: string;
    /** Resumen corto */
    excerpt: string;
    /** Categoría (ej: "Arquitectura", "Inversión") */
    category: string;
    /** URL de la imagen de portada */
    image: string;
    /** Fecha de publicación */
    date: string;
    /** Nombre del autor */
    author: string;
    /** Enlace al artículo completo */
    href: string;
}

export interface BlogPreviewProps {
    /** Título de la sección */
    title?: string;
    /** Subtítulo */
    subtitle?: string;
    /** Lista de artículos */
    posts: BlogPost[];
    /** Texto del botón "Ver todo" */
    viewAllText?: string;
    /** Enlace a la página del blog */
    viewAllHref?: string;
    /** Clases adicionales */
    className?: string;
}

/**
 * BlogPreview - Una cuadrícula editorial para noticias o artículos.
 * Diseño sofisticado con enfoque tipográfico y transiciones suaves.
 */
export const BlogPreview = forwardRef<HTMLElement, BlogPreviewProps>(({
    title = "Perspectivas y Noticias",
    subtitle = "Explora nuestras últimas publicaciones sobre diseño, tecnología y el futuro del sector inmobiliario.",
    posts,
    viewAllText = "Explorar Blog",
    viewAllHref = "#",
    className
}, ref) => {
    return (
        <section ref={ref} className={cn("py-24 bg-[var(--background)]", className)}>
            <div className="container mx-auto px-[var(--spacing-md)] max-w-7xl">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-[var(--spacing-xl)] mb-20 animate-fade-in">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-black text-[var(--foreground)] mb-[var(--spacing-lg)] tracking-tight">
                            {title}
                        </h2>
                        <p className="text-[var(--foreground-muted)] text-lg leading-relaxed">
                            {subtitle}
                        </p>
                    </div>
                    <Button variant="outline" className="w-fit self-start md:self-auto group" onClick={() => window.location.href = viewAllHref}>
                        {viewAllText}
                        <ArrowRight className="ml-[var(--spacing-sm)] w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-2xl)]">
                    {posts.map((post, i) => (
                        <article
                            key={i}
                            className="group flex flex-col animate-slide-up"
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <a href={post.href} className="relative block overflow-hidden rounded-[var(--radius-xl)] aspect-[16/10] mb-[var(--spacing-xl)] shadow-2xl">
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                                />
                                <div className="absolute top-4 left-4 z-20">
                                    <span className="bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-black uppercase tracking-[0.2em] px-[var(--spacing-md)] py-[var(--spacing-xs)] rounded-full shadow-lg">
                                        {post.category}
                                    </span>
                                </div>
                            </a>

                            <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-[var(--spacing-lg)] text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-[var(--spacing-md)]">
                                    <div className="flex items-center gap-[var(--spacing-sm)]">
                                        <Calendar className="w-3 h-3 text-[var(--primary)]" />
                                        {post.date}
                                    </div>
                                    <div className="flex items-center gap-[var(--spacing-sm)]">
                                        <User className="w-3 h-3 text-[var(--primary)]" />
                                        {post.author}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-[var(--foreground)] mb-[var(--spacing-md)] leading-tight tracking-tight group-hover:text-[var(--primary)] transition-colors">
                                    <a href={post.href}>{post.title}</a>
                                </h3>

                                <p className="text-[var(--foreground-muted)] text-sm leading-relaxed mb-[var(--spacing-xl)] line-clamp-3">
                                    {post.excerpt}
                                </p>

                                <a
                                    href={post.href}
                                    className="mt-auto inline-flex items-center gap-[var(--spacing-sm)] text-xs font-black uppercase tracking-[0.2em] text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors"
                                >
                                    Leer Artículo
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
});

BlogPreview.displayName = 'BlogPreview';
