import { toast, Toaster } from 'sonner'
import { useEffect } from 'react'

export { Toaster as ToastContainer }

export interface ToastProps {
  show?: boolean
  message: string
  severity?: 'success' | 'error' | 'warning' | 'info'
  life?: number
}

export const Toast = ({ show, message, severity = 'info', life = 4000 }: ToastProps) => {
  useEffect(() => {
    if (show) {
      toast[severity](message, { duration: life })
    }
  }, [show, message, severity, life])

  return null
}

export default Toast
