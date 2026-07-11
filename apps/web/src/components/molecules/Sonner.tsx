import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="system"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          'group toast group-[.toaster]:border-[var(--border)]/60 group-[.toaster]:bg-[var(--card)] group-[.toaster]:text-[var(--foreground)] group-[.toaster]:shadow-lg group-[.toaster]:material-sheet',
        description: 'group-[.toast]:text-[var(--foreground-muted)]',
        closeButton:
          'group-[.toast]:press-subtle',
      },
    }}
    {...props}
  />
);

export { Toaster, toast };
