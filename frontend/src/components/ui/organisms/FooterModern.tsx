import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export interface FooterModernLink {
    /** Texto a mostrar */
    label: string;
    /** URL de destino */
    href: string;
}

export interface FooterColumn {
    /** Título de la columna */
    title: string;
    /** Lista de enlaces */
    links: FooterModernLink[];
}

export interface FooterModernProps {
    /** Columnas de enlaces */
    columns: FooterColumn[];
    /** Logo personalizado (JSX) o nombre de la marca */
    brand?: ReactNode;
    /** Breve descripción bajo el logo */
    tagline?: string;
    /** Información de contacto (opcional) */
    contact?: {
        email?: string;
        phone?: string;
        address?: string;
    };
    /** Clases adicionales */
    className?: string;
}

/**
 * FooterModern - Un pie de página institucional completo y elegante.
 * Incluye secciones de marca, enlaces jerárquicos y barra legal.
 */
export const FooterModern = forwardRef<HTMLElement, FooterModernProps>(({
    columns,
    brand,
    tagline,
    contact,
    className
}, ref) => {
    return (
        <footer ref={ref} className={cn("bg-[var(--background)] border-t border-[var(--border)] pt-20 pb-[var(--spacing-2xl)]", className)}>
            <div className="container mx-auto px-[var(--spacing-md)] max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-[var(--spacing-3xl)] mb-20">
                    {/* Columna de Marca */}
                    <div className="lg:col-span-2">
                        <div className="mb-[var(--spacing-xl)]">
                            {brand || (
                                <div className="text-3xl font-black text-[var(--foreground)] tracking-tighter">
                                    KREO<span className="text-[var(--primary)]">.</span>
                                </div>
                            )}
                        </div>

                        <p className="text-[var(--foreground-muted)] text-base mb-[var(--spacing-2xl)] max-w-sm leading-relaxed">
                            {tagline || "Redefiniendo el estándar del desarrollo inmobiliario y el diseño premium con tecnología de vanguardia y acabados de lujo."}
                        </p>

                        {/* Redes Sociales */}
                        <div className="flex gap-[var(--spacing-md)]">
                            {[
                                { Icon: Facebook, href: "#" },
                                { Icon: Instagram, href: "#" },
                                { Icon: Twitter, href: "#" },
                                { Icon: Linkedin, href: "#" }
                            ].map(({ Icon, href }, i) => (
                                <a
                                    key={i}
                                    href={href}
                                    className="w-11 h-11 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all duration-300 hover:scale-110 shadow-sm"
                                    aria-label={`Siguenos en una red social`}
                                >
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Columnas de Enlaces Dinámicas */}
                    {columns.map((col, i) => (
                        <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                            <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-[0.25em] mb-[var(--spacing-xl)]">
                                {col.title}
                            </h4>
                            <ul className="space-y-[var(--spacing-lg)]">
                                {col.links.map((link, j) => (
                                    <li key={j}>
                                        <a
                                            href={link.href}
                                            className="text-[var(--foreground-muted)] text-sm hover:text-[var(--primary)] transition-colors duration-200 flex items-center group"
                                        >
                                            <span className="w-0 h-px bg-[var(--primary)] transition-all duration-300 group-hover:w-4 group-hover:mr-2"></span>
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Columna de Contacto / Info */}
                    {contact && (
                        <div>
                            <h4 className="text-xs font-black text-[var(--foreground)] uppercase tracking-[0.25em] mb-[var(--spacing-xl)]">Contacto</h4>
                            <ul className="space-y-[var(--spacing-lg)]">
                                {contact.address && (
                                    <li className="flex gap-[var(--spacing-md)] text-sm text-[var(--foreground-muted)]">
                                        <MapPin className="w-5 h-5 text-[var(--primary)] shrink-0" />
                                        <span>{contact.address}</span>
                                    </li>
                                )}
                                {contact.phone && (
                                    <li className="flex gap-[var(--spacing-md)] text-sm text-[var(--foreground-muted)]">
                                        <Phone className="w-5 h-5 text-[var(--primary)] shrink-0" />
                                        <span>{contact.phone}</span>
                                    </li>
                                )}
                                {contact.email && (
                                    <li className="flex gap-[var(--spacing-md)] text-sm text-[var(--foreground-muted)]">
                                        <Mail className="w-5 h-5 text-[var(--primary)] shrink-0" />
                                        <span className="hover:text-[var(--primary)] cursor-pointer transition-colors">{contact.email}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Barra Legal Inferior */}
                <div className="pt-[var(--spacing-2xl)] border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-[var(--spacing-lg)]">
                    <div className="text-[var(--foreground-subtle)] text-[11px] font-medium tracking-wide">
                        © {new Date().getFullYear()} KREO UI COMPONENTS. DESARROLLADO PARA EL MERCADO EXCLUSIVO.
                    </div>

                    <div className="flex gap-[var(--spacing-2xl)]">
                        {["Términos de Servicio", "Privacidad", "Cookies"].map((text, i) => (
                            <a
                                key={i}
                                href="#"
                                className="text-[var(--foreground-subtle)] text-[11px] font-bold uppercase tracking-widest hover:text-[var(--primary)] transition-colors"
                            >
                                {text}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
});

FooterModern.displayName = 'FooterModern';
