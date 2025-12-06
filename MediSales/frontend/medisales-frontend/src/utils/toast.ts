import toast from 'react-hot-toast';

const toastOptions = {
  duration: 4000,
  position: 'top-center' as const,
};

type ToastOptions = {
  cooldownMs?: number;
  force?: boolean;
  id?: string;
};

const DEFAULT_COOLDOWN_MS = 3000;
const lastToastByMessage = new Map<string, number>();

// Skips emitting a toast when the same message fired recently.
const shouldShow = (message: string, cooldownMs: number, force: boolean) => {
  if (force) return true;
  const now = Date.now();
  const lastShownAt = lastToastByMessage.get(message) ?? 0;
  if (now - lastShownAt < cooldownMs) return false;
  lastToastByMessage.set(message, now);
  return true;
};

export const successToast = (message: string, options?: ToastOptions) => {
  const { cooldownMs = DEFAULT_COOLDOWN_MS, force = false, id } = options || {};
  if (!shouldShow(message, cooldownMs, force)) return;

  toast.success(message, {
    id: id ?? message,
    ...toastOptions,
    style: {
      border: '1px solid #28a745',
      padding: '16px',
      color: '#155724',
      backgroundColor: '#d4edda',
    },
    iconTheme: {
      primary: '#28a745',
      secondary: '#d4edda',
    },
  });
};

export const errorToast = (message: string, options?: ToastOptions) => {
  const { cooldownMs = DEFAULT_COOLDOWN_MS, force = false, id } = options || {};
  if (!shouldShow(message, cooldownMs, force)) return;

  toast.error(message, {
    id: id ?? message,
    ...toastOptions,
    style: {
      border: '1px solid #dc3545',
      padding: '16px',
      color: '#721c24',
      backgroundColor: '#f8d7da',
    },
    iconTheme: {
      primary: '#dc3545',
      secondary: '#f8d7da',
    },
  });
};

export const warningToast = (message: string, options?: ToastOptions) => {
  const { cooldownMs = DEFAULT_COOLDOWN_MS, force = false, id } = options || {};
  if (!shouldShow(message, cooldownMs, force)) return;

  toast(message, {
    id: id ?? message,
    ...toastOptions,
    style: {
      border: '1px solid #ffc107',
      padding: '16px',
      color: '#856404',
      backgroundColor: '#fff3cd',
    },
    icon: '⚠️',
  });
};

export const infoToast = (message: string, options?: ToastOptions) => {
  const { cooldownMs = DEFAULT_COOLDOWN_MS, force = false, id } = options || {};
  if (!shouldShow(message, cooldownMs, force)) return;

  toast(message, {
    id: id ?? message,
    ...toastOptions,
    style: {
      border: '1px solid #17a2b8',
      padding: '16px',
      color: '#0c5460',
      backgroundColor: '#d1ecf1',
    },
    icon: 'ℹ️',
  });
};
