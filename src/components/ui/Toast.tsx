import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`px-6 py-4 rounded-xl shadow-card-lg animate-slide-in-right flex items-center justify-between min-w-[300px] border ${
            toast.type === 'success' ? 'bg-status-success-bg border-status-success/20 text-status-success' :
            toast.type === 'error' ? 'bg-status-danger-bg border-status-danger/20 text-status-danger' :
            toast.type === 'warning' ? 'bg-amber-50/90 border-amber-200/50 text-amber-800' :
            'bg-surface-bg border-surface-border text-text-primary'
          }`}
        >
          <span className="font-semibold">{toast.message}</span>
          <button 
            onClick={() => useToastStore.getState().removeToast(toast.id)}
            className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
