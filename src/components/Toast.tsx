import React, { useEffect } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // clear after 4s
    return () => clearTimeout(timer);
  }, [onClose]);

  const styleMap = {
    success: {
      bg: 'bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-100',
      icon: <Check className="w-5 h-5 text-emerald-400" />
    },
    error: {
      bg: 'bg-rose-950/80 backdrop-blur-md border border-rose-500/30 text-rose-100',
      icon: <AlertCircle className="w-5 h-5 text-rose-400" />
    },
    info: {
      bg: 'bg-zinc-900/85 backdrop-blur-md border border-gold/30 text-zinc-100',
      icon: <Info className="w-5 h-5 text-gold" />
    }
  };

  const selected = styleMap[toast.type] || styleMap.info;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 scale-100 pointer-events-auto animate-slide-in ${selected.bg}`}
      id={`toast-${toast.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-1 rounded-lg bg-white/5">
          {selected.icon}
        </div>
        <p className="text-sm font-medium tracking-wide">{toast.text}</p>
      </div>
      <button
        onClick={onClose}
        className="text-zinc-400 hover:text-white transition-colors duration-150 ml-3 p-1 rounded-lg hover:bg-white/5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
