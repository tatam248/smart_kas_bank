import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 text-center space-y-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
              isDestructive
                ? 'bg-rose-100 text-rose-600 border border-rose-200'
                : 'bg-amber-100 text-amber-600 border border-amber-200'
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-6 h-6 text-rose-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            )}
          </div>

          <h3 className="font-bold text-slate-900 text-base">{title}</h3>

          <p className="text-xs text-slate-600 leading-relaxed">{message}</p>

          <div className="pt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 py-2 px-4 text-white rounded-xl text-xs font-semibold shadow-xs transition ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-900 hover:bg-blue-800'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
