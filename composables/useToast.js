import { toast } from 'vue-sonner'

export const useToast = () => {
  return {
    success: (message, opts) => toast.success(message, { duration: 4000, ...opts }),
    error: (message, opts) => toast.error(message, { duration: 6000, ...opts }),
    info: (message, opts) => toast.info(message, { duration: 4000, ...opts }),
    warning: (message, opts) => toast.warning(message, { duration: 5000, ...opts }),
  }
}
