import { toast } from 'sonner';

type ToastType = 
  | 'success' 
  | 'error' 
  | 'failed' 
  | 'warning' 
  | 'info' 
  | 'custom' 
  | 'loading' 
  | 'default';

interface ToastOptions {
  description?: string;
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

const TOAST_VARIANTS = {
  success: "bg-green-50 border-green-400 text-green-800 dark:bg-green-900 dark:text-green-100",
  error: "bg-red-50 border-red-400 text-red-800 dark:bg-red-900 dark:text-red-100",
  warning: "bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  info: "bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  loading: "bg-gray-50 border-gray-400 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
  default: "bg-background border-border text-foreground",
} as const;

export const useToast = () => {
  const showToast = (
    type: ToastType,
    message: string,
    options?: ToastOptions
  ) => {
    const baseOptions = {
      description: options?.description,
      duration: options?.duration || 3000,
      position: options?.position || 'top-center',
    };

    // Get variant class based on type
    const variantClass = TOAST_VARIANTS[type as keyof typeof TOAST_VARIANTS] || TOAST_VARIANTS.default;

    // Use custom toast for all types to have consistent close button
    toast.custom((t) => (
      <div
        className={`group toast flex items-start gap-3 rounded-lg border p-4 shadow-lg ${variantClass}`}
      >
        <div className="flex flex-col gap-1 flex-1">
          <p className="font-medium">{message}</p>
          {baseOptions.description && (
            <p className="text-sm opacity-90">{baseOptions.description}</p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t)}
          className="ml-auto text-sm opacity-70 hover:opacity-100 transition shrink-0"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    ), {
      duration: baseOptions.duration,
      position: baseOptions.position,
    });
  };

  return {
    success: (message: string, options?: ToastOptions) =>
      showToast('success', message, options),
    failed: (message: string, options?: ToastOptions) =>
      showToast('failed', message, options),
    error: (message: string, options?: ToastOptions) =>
      showToast('error', message, options),
    warning: (message: string, options?: ToastOptions) =>
      showToast('warning', message, options),
    info: (message: string, options?: ToastOptions) =>
      showToast('info', message, options),
    loading: (message: string, options?: ToastOptions) =>
      showToast('loading', message, options),
    custom: (message: string, options?: ToastOptions) =>
      showToast('custom', message, options),
    default: (message: string, options?: ToastOptions) =>
      showToast('default', message, options),
  };
};

// Usage examples:
// const toast = useToast();
// toast.success('Operation completed!');
// toast.failed('Operation failed');
// toast.error('An error occurred');
// toast.warning('Warning message');
// toast.info('Information message');
// toast.loading('Loading...');
// toast.custom('Custom styled message', { description: 'Additional details' });
// 
// With custom options:
// toast.success('Saved!', { duration: 5000, position: 'top-right' });