'use client';

import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmButtonClass = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`flex-shrink-0 ${confirmVariant === 'danger' ? 'text-red-600' : 'text-blue-600'}`}>
              <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="confirm-dialog-title" className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {message}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
              aria-label="Close dialog"
            >
              <X size={18} className="text-gray-400 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm min-h-[44px]"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm min-h-[44px] ${confirmButtonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
