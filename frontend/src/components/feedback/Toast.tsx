import { FC } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const Toast: FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-900',
      icon: <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 rounded-xl border px-4 py-3 shadow-xl max-w-md transform transition-all animate-in slide-in-from-bottom-5 duration-200 ${currentStyle.bg}`}
    >
      {currentStyle.icon}
      <span className="text-sm font-medium leading-snug">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 rounded-lg p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
