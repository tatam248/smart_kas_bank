import React from 'react';
import { Sparkles, X, Check } from 'lucide-react';

interface RulePromptModalProps {
  isOpen: boolean;
  keyword: string;
  category: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RulePromptModal: React.FC<RulePromptModalProps> = ({
  isOpen,
  keyword,
  category,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>

          <h3 className="font-bold text-slate-900 text-base">
            Pelajari Aturan Otomatis?
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Anda mengkategorikan transaksi ini sebagai{' '}
            <strong className="text-blue-900 font-semibold">{category}</strong>.
            Apakah Anda ingin sistem otomatis mengkategorikan transaksi berikutnya yang mengandung kata kunci{' '}
            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">
              "{keyword}"
            </code>{' '}
            ke kategori ini?
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={onConfirm}
              className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Ya, Simpan Aturan Otomatis</span>
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2 px-4 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-medium transition"
            >
              Hanya untuk Transaksi Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
