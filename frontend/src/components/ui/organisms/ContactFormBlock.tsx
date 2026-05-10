import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button, InputText, Textarea, Card } from '@/components'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const contactSchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
    email: z.string().email({ message: "Email inválido" }),
    subject: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres" }),
    message: z.string().min(10, { message: "El mensaje debe tener al menos 10 caracteres" }),
})

type ContactFormValues = z.infer<typeof contactSchema>

export interface ContactFormBlockProps {
    title?: string
    description?: string
    onSubmit?: (data: ContactFormValues) => void
    isLoading?: boolean
    className?: string
}

export function ContactFormBlock({
    title = "Contáctanos",
    description = "Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.",
    onSubmit,
    isLoading,
    className
}: ContactFormBlockProps) {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
    })

    const handleFormSubmit = (data: ContactFormValues) => {
        onSubmit?.(data)
    }

    return (
        <Card className={cn("max-w-xl mx-auto", className)}>
            <div className="mb-[var(--spacing-lg)]">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{title}</h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-[var(--spacing-xs)]">{description}</p>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-[var(--spacing-md)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--spacing-md)]">
                    <div className="space-y-[var(--spacing-sm)]">
                        <label className="text-sm font-medium text-[var(--foreground-muted)] ml-[var(--spacing-xs)]">Nombre</label>
                        <InputText
                            {...register('name')}
                            placeholder="Juan Pérez"
                            className={cn(errors.name && "border-[var(--destructive)]")}
                            fullWidth
                        />
                        {errors.name && <p className="text-xs text-[var(--destructive)] ml-[var(--spacing-xs)]">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-[var(--spacing-sm)]">
                        <label className="text-sm font-medium text-[var(--foreground-muted)] ml-[var(--spacing-xs)]">Email</label>
                        <InputText
                            {...register('email')}
                            placeholder="juan@ejemplo.com"
                            className={cn(errors.email && "border-[var(--destructive)]")}
                            fullWidth
                        />
                        {errors.email && <p className="text-xs text-[var(--destructive)] ml-[var(--spacing-xs)]">{errors.email.message}</p>}
                    </div>
                </div>

                <div className="space-y-[var(--spacing-sm)]">
                    <label className="text-sm font-medium text-[var(--foreground-muted)] ml-[var(--spacing-xs)]">Asunto</label>
                    <InputText
                        {...register('subject')}
                        placeholder="Información sobre desarrollos"
                        className={cn(errors.subject && "border-[var(--destructive)]")}
                        fullWidth
                    />
                    {errors.subject && <p className="text-xs text-[var(--destructive)] ml-[var(--spacing-xs)]">{errors.subject.message}</p>}
                </div>

                <div className="space-y-[var(--spacing-sm)]">
                    <label className="text-sm font-medium text-[var(--foreground-muted)] ml-[var(--spacing-xs)]">Mensaje</label>
                    <Textarea
                        {...register('message')}
                        placeholder="Escribe tu mensaje aquí..."
                        rows={5}
                        className={cn("resize-none", errors.message && "border-[var(--destructive)]")}
                    />
                    {errors.message && <p className="text-xs text-[var(--destructive)] ml-[var(--spacing-xs)]">{errors.message.message}</p>}
                </div>

                <Button
                    type="submit"
                    className="w-full mt-[var(--spacing-md)] gap-[var(--spacing-sm)]"
                    loading={isLoading}
                >
                    <Send className="w-4 h-4" />
                    Enviar Mensaje
                </Button>
            </form>
        </Card>
    )
}

export default ContactFormBlock
