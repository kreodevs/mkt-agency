import { Toast as PrimeToast, type ToastMessage } from 'primereact/toast'
import { createContext, useContext, useRef, type ReactNode, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// Toast Context for global usage
interface ToastContextType {
  show: (message: ToastOptions) => void
  success: (summary: string, detail?: string) => void
  error: (summary: string, detail?: string) => void
  warn: (summary: string, detail?: string) => void
  info: (summary: string, detail?: string) => void
  clear: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export interface ToastOptions extends Omit<ToastMessage, 'content'> {
  summary: string
  detail?: string
  severity?: 'success' | 'info' | 'warn' | 'error'
  life?: number
  closable?: boolean
}

const severityConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-[var(--success)]/10 border-[var(--success)]/30',
    iconColor: 'text-[var(--success)]',
    title: 'text-[var(--success)]',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-[var(--destructive)]/10 border-[var(--destructive)]/30',
    iconColor: 'text-[var(--destructive)]',
    title: 'text-[var(--destructive)]',
  },
  warn: {
    icon: AlertTriangle,
    bgColor: 'bg-[var(--warning)]/10 border-[var(--warning)]/30',
    iconColor: 'text-[var(--warning)]',
    title: 'text-[var(--warning)]',
  },
  info: {
    icon: Info,
    bgColor: 'bg-[var(--info)]/10 border-[var(--info)]/30',
    iconColor: 'text-[var(--info)]',
    title: 'text-[var(--info)]',
  },
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const toastRef = useRef<PrimeToast>(null)

  const show = useCallback((options: ToastOptions) => {
    const { severity = 'info', summary, detail, life = 4000, closable = true, ...rest } = options
    const config = severityConfig[severity]
    const Icon = config.icon

    toastRef.current?.show({
      ...rest,
      severity,
      life,
      closable,
      content: (
        <div className={`
          flex items-start gap-3 w-full p-4
          rounded-[var(--radius)] border
          ${config.bgColor}
          bg-[var(--card)]
          shadow-lg
        `}>
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${config.title}`}>{summary}</p>
            {detail && (
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">{detail}</p>
            )}
          </div>
          {closable && (
            <button
              onClick={() => toastRef.current?.clear()}
              className="p-1 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    })
  }, [])

  const success = useCallback((summary: string, detail?: string) => {
    show({ severity: 'success', summary, detail })
  }, [show])

  const error = useCallback((summary: string, detail?: string) => {
    show({ severity: 'error', summary, detail })
  }, [show])

  const warn = useCallback((summary: string, detail?: string) => {
    show({ severity: 'warn', summary, detail })
  }, [show])

  const info = useCallback((summary: string, detail?: string) => {
    show({ severity: 'info', summary, detail })
  }, [show])

  const clear = useCallback(() => {
    toastRef.current?.clear()
  }, [])

  return (
    <ToastContext.Provider value={{ show, success, error, warn, info, clear }}>
      {children}
      <PrimeToast
        ref={toastRef}
        position="top-right"
        pt={{
          root: {
            className: 'z-[var(--z-tooltip)] fixed top-4 right-4',
          },
          message: {
            className: 'mb-2',
          },
          content: {
            className: '',
          },
        }}
      />
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Standalone Toast Component for direct usage
export interface ToastProps {
  visible: boolean
  onHide: () => void
  severity?: 'success' | 'info' | 'warn' | 'error'
  summary: string
  detail?: string
}

export const Toast = ({ visible, onHide, severity = 'info', summary, detail }: ToastProps) => {
  if (!visible) return null

  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <div className="fixed top-4 right-4 z-[var(--z-tooltip)] animate-slide-in">
      <div className={`
        flex items-start gap-3 w-80 p-4
        rounded-[var(--radius)] border
        ${config.bgColor}
        bg-[var(--card)]
        shadow-lg
      `}>
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.title}`}>{summary}</p>
          {detail && (
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{detail}</p>
          )}
        </div>
        <button
          onClick={onHide}
          className="p-1 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
