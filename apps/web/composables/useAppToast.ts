import { MSG } from '@profiloz/shared'

type ToastColor = 'success' | 'error' | 'warning' | 'info' | 'primary' | 'neutral'

const icons: Record<ToastColor, string> = {
  success: 'i-lucide-check',
  error: 'i-lucide-circle-alert',
  warning: 'i-lucide-triangle-alert',
  info: 'i-lucide-info',
  primary: 'i-lucide-info',
  neutral: 'i-lucide-info',
}

export function useAppToast() {
  const toast = useToast()

  function notify(color: ToastColor, title: string, description?: string) {
    toast.add({
      title,
      description,
      color,
      icon: icons[color],
    })
  }

  return {
    success: (title: string, description?: string) => notify('success', title, description),
    error: (title: string, description?: string) => notify('error', title, description),
    info: (title: string, description?: string) => notify('info', title, description),
    warning: (title: string, description?: string) => notify('warning', title, description),
    saved: () => notify('success', MSG.save.success),
    pdfReady: () => notify('success', MSG.pdf.success),
    letterReady: () => notify('success', MSG.letter.success),
    uploadSuccess: () => notify('success', MSG.upload.success),
    genericError: () => notify('error', MSG.error.generic),
  }
}
