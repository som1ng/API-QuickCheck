import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    error: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4">
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl ${
          bgStyles[toast.type]
        }`}
      >
        {icons[toast.type]}
        <div className="text-xs font-medium leading-normal flex-1">{toast.text}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-0.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
