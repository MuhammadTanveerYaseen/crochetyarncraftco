'use client';

import React from 'react';
import { useCart, Toast } from '@/context/CartContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useCart();

  if (toasts.length === 0) return null;

  const getToastStyle = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200 text-red-800',
          icon: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#F5F2EB] border-[#D2BEAC] text-[#5C4033]',
          icon: <Info className="w-5 h-5 text-[#A855F7] flex-shrink-0" />,
        };
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type);
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-2xl border shadow-lg animate-slide-in transition-all duration-300 ${style.bg}`}
            role="alert"
          >
            {style.icon}
            <div className="flex-1 text-xs font-semibold leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 text-current/60 hover:text-current transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
