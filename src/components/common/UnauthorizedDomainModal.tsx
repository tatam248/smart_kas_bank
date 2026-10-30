import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, ExternalLink, X, Globe, ArrowRight } from 'lucide-react';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: string;
  projectId?: string;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  domain,
  projectId = 'gen-lang-client-0750668339',
}) => {
  const [copied, setCopied] = useState(false);
  const currentHost = domain || (typeof window !== 'undefined' ? window.location.hostname : 'domain-anda.vercel.app');
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentHost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Domain Belum Diizinkan (OAuth)</h3>
              <p className="text-xs text-amber-100">Firebase Error: auth/unauthorized-domain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 leading-relaxed text-xs">
            Google Firebase memblokir login OAuth jika domain tempat aplikasi berjalan belum didaftarkan di daftar <strong>Authorized Domains</strong>. Hal ini adalah prosedur keamanan standar untuk melindungi aplikasi Anda.
          </p>

          {/* Detected Domain Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                Domain Website Anda Saat Ini:
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition shadow-xs"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin!' : 'Salin Domain'}</span>
              </button>
            </div>
            <div className="font-mono text-xs font-bold text-blue-900 bg-white px-3 py-2 rounded-lg border border-slate-200 select-all">
              {currentHost}
            </div>
          </div>

          {/* Quick Steps */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900">
              Langkah Cepat Mengizinkan Domain (Hanya butuh 30 detik):
            </span>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
              <li>
                Klik tombol <strong>"Buka Firebase Console"</strong> di bawah.
              </li>
              <li>
                Pilih tab <strong>Settings</strong> (di samping menu <em>Users</em>).
              </li>
              <li>
                Gulir ke bagian <strong>Authorized domains</strong> lalu klik <strong>Add domain</strong>.
              </li>
              <li>
                Tempelkan nama domain: <code className="bg-amber-100 font-bold px-1 py-0.5 rounded text-[11px] text-slate-800">{currentHost}</code>
              </li>
              <li>
                Klik <strong>Add</strong>. Selesai! Anda bisa langsung mencoba login kembali.
              </li>
            </ol>
          </div>

          {/* Action Links */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href={firebaseSettingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition shadow-sm text-center"
            >
              <span>Buka Firebase Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
