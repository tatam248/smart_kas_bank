import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Download,
  Upload,
  RotateCcw,
  BookOpen,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Server,
  Key,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (p: Partial<UserProfile>) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => boolean;
  onResetData: () => void;
  onDisconnectGmail: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onExportJSON,
  onImportJSON,
  onResetData,
  onDisconnectGmail,
}) => {
  const [name, setName] = useState(profile.name);
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ name, businessName });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = onImportJSON(content);
        if (ok) {
          setImportStatus('Data keuangan berhasil dipulihkan dari file backup!');
        } else {
          setImportStatus('Gagal membaca file backup JSON. Format tidak valid.');
        }
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Pengaturan & Panduan Sistem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola profil usaha, cadangan database permanen, keamanan OAuth Gmail, dan panduan konfigurasi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-blue-800" />
            <h2 className="text-base font-bold text-slate-900">
              Profil Pengguna & Identitas Usaha
            </h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Pengguna / Pemilik Akun *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Bisnis / Toko / UMKM *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="misal: CV Berkah Mandiri"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Terdaftar (Google OAuth)
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess && (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Profil berhasil diperbarui!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold shadow-xs transition"
              >
                Simpan Perubahan Profil
              </button>
            </div>
          </form>
        </div>

        {/* Database Backup & Restore Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Server className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Cadangan Data & Pemulihan (Backup & Restore)
            </h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Seluruh data mutasi, rekening, jurnal, dan aturan otomatis tersimpan secara persisten. Anda dapat mengunduh salinan database sewaktu-waktu.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Ekspor Cadangan Database</span>
                <span className="text-slate-500 text-[11px]">Unduh file JSON berisi seluruh tabel data Anda</span>
              </div>
              <button
                onClick={onExportJSON}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh JSON</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Pulihkan Data (Import)</span>
                <span className="text-slate-500 text-[11px]">Pulihkan data dari file backup JSON sebelumnya</span>
              </div>
              <label className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium">
                {importStatus}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Reset Data Demo</span>
                <span className="text-[10px] text-slate-400">Kembalikan ke akun & mutasi sampel UMKM awal</span>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Integration Guides & Documentation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Panduan Integrasi Gmail API & Petunjuk Deployment
            </h2>
            <p className="text-xs text-slate-500">
              Dokumentasi teknis resmi untuk konfigurasi OAuth, cakupan izin, dan deployment online.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Guide 1 */}
          <div className="space-y-2 p-4 bg-slate-50/70 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <Key className="w-4 h-4 text-blue-700" />
              <h3>1. Konfigurasi Google OAuth 2.0</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Aplikasi ini menggunakan cakupan minimal (least privilege):
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1 font-mono">
              <li>https://www.googleapis.com/auth/gmail.readonly</li>
            </ul>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Kredensial disimpan hanya di memori browser pengguna saat sesi aktif. Tidak pernah mengakses email pribadi di luar notifikasi bank.
            </p>
          </div>

          {/* Guide 2 */}
          <div className="space-y-2 p-4 bg-slate-50/70 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <Mail className="w-4 h-4 text-emerald-700" />
              <h3>2. Format Email Bank yang Didukung</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Mesin parser otomatis mengenali notifikasi resmi dari:
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
              <li>Bank BCA (KlikBCA & m-BCA)</li>
              <li>Bank Mandiri (Livin' by Mandiri)</li>
              <li>Bank BRI (BRImo & QRIS)</li>
              <li>Bank BNI (BNI Mobile Banking)</li>
              <li>Bank Jago (Kantong Utama & Saku)</li>
              <li>Jenius BTPN & CIMB Niaga OCTO</li>
            </ul>
          </div>

          {/* Guide 3 */}
          <div className="space-y-2 p-4 bg-slate-50/70 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <Server className="w-4 h-4 text-indigo-700" />
              <h3>3. Petunjuk Deployment Online</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Aplikasi dibangun dengan arsitektur Vite + React SPA yang dapat di-deploy ke:
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
              <li><strong>Vercel / Netlify:</strong> Cukup jalankan perintah <code className="bg-slate-200 px-1 rounded">npm run build</code></li>
              <li><strong>Google Cloud Run:</strong> Terintegrasi langsung dengan GCP Service URL</li>
              <li><strong>Database:</strong> Kompatibel dengan PostgreSQL / Supabase untuk multi-user enterprise</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset Data ke Sampel Awal?"
        message="Tindakan ini akan mengembalikan rekening dan transaksi ke setelan sampel UMKM default. Seluruh data baru Anda akan digantikan."
        confirmLabel="Reset Sekarang"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          onResetData();
          setIsResetModalOpen(false);
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
