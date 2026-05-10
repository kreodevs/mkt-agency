import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Linkedin, Twitter, Mail, ExternalLink } from "lucide-react";

export interface TeamMember {
    /** Nombre completo */
    name: string;
    /** Cargo o especialidad */
    role: string;
    /** URL de la fotografía profesional */
    image: string;
    /** Breve biografía */
    bio?: string;
    /** Enlaces a redes sociales */
    socials?: {
        linkedin?: string;
        twitter?: string;
        email?: string;
    };
}

export interface TeamSectionProps {
    /** Título de la sección */
    title?: string;
    /** Subtítulo descriptivo */
    subtitle?: string;
    /** Lista de integrantes */
    members: TeamMember[];
    /** Clases de Tailwind adicionales */
    className?: string;
}

/**
 * TeamSection - Galería del equipo directivo o talento clave.
 * Diseño minimalista con enfoque en la fotografía y elegancia corporativa.
 */
export const TeamSection = forwardRef<HTMLElement, TeamSectionProps>(({
    title = "Nuestros Líderes",
    subtitle = "Un equipo de expertos comprometidos con la excelencia y la innovación en cada proyecto.",
    members,
    className
}, ref) => {
    return (
        <section ref={ref} className={cn("py-24 bg-[var(--background)]", className)}>
            <div className="container mx-auto px-[var(--spacing-md)] max-w-7xl">
                <header className="text-center mb-20 animate-fade-in">
                    <h2 className="text-4xl md:text-5xl font-black text-[var(--foreground)] mb-[var(--spacing-lg)] tracking-tight">
                        {title}
                    </h2>
                    <p className="text-[var(--foreground-muted)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--spacing-3xl)]">
                    {members.map((member, i) => (
                        <div
                            key={i}
                            className="group text-center animate-slide-up"
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <div className="relative mb-[var(--spacing-xl)] mx-auto w-48 h-48 lg:w-56 lg:h-56">
                                {/* Bordes decorativos animados */}
                                <div className="absolute inset-0 rounded-full border border-[var(--primary)]/10 group-hover:border-[var(--primary)]/40 transition-all duration-700 scale-110" />
                                <div className="absolute inset-0 rounded-full border border-[var(--primary)]/5 group-hover:border-[var(--primary)]/20 transition-all duration-1000 scale-125 group-hover:scale-115" />

                                {/* Contenedor de imagen circulor */}
                                <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-[var(--background-secondary)] shadow-2xl">
                                    <img
                                        src={member.image}
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-in-out"
                                        alt={member.name}
                                    />
                                </div>

                                {/* Overlay de hover con botón rápido */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--primary)]/10 backdrop-blur-[2px] rounded-full">
                                    <div className="p-[var(--spacing-md)] bg-[var(--background)] rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                        <ExternalLink className="w-5 h-5 text-[var(--primary)]" />
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <h3 className="text-2xl font-black text-[var(--foreground)] mb-[var(--spacing-xs)] tracking-tight group-hover:text-[var(--primary)] transition-colors">
                                    {member.name}
                                </h3>
                                <p className="text-[var(--primary)] text-[10px] font-black uppercase tracking-[0.3em] mb-[var(--spacing-md)]">
                                    {member.role}
                                </p>
                                {member.bio && (
                                    <p className="text-sm text-[var(--foreground-muted)] mb-[var(--spacing-lg)] leading-relaxed max-w-[240px] mx-auto px-[var(--spacing-md)] opacity-80">
                                        {member.bio}
                                    </p>
                                )}

                                {/* Redes Sociales Refinadas */}
                                <div className="flex justify-center gap-[var(--spacing-lg)]">
                                    {[
                                        { key: 'linkedin', Icon: Linkedin, href: member.socials?.linkedin },
                                        { key: 'twitter', Icon: Twitter, href: member.socials?.twitter },
                                        { key: 'email', Icon: Mail, href: member.socials?.email ? `mailto:${member.socials.email}` : undefined }
                                    ].map((social) => social.href && (
                                        <a
                                            key={social.key}
                                            href={social.href}
                                            className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-all duration-300 transform hover:scale-125"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <social.Icon className="w-4 h-4" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});

TeamSection.displayName = 'TeamSection';
