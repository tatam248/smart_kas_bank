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
  Copy,
  Check,
  ExternalLink,
  Globe,
  Terminal,
  Cloud,
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
  const [deployTab, setDeployTab] = useState<'vercel' | 'netlify'>('vercel');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

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

          {/* Guide 3 - Interactive Deployment */}
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 md:col-span-1">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <Server className="w-4 h-4 text-indigo-700" />
              <h3>3. Siap Deploy Cloud (100% Gratis)</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Telah dilengkapi file konfigurasi bawaan <code className="font-mono bg-slate-200 px-1 rounded text-[10px]">vercel.json</code>, <code className="font-mono bg-slate-200 px-1 rounded text-[10px]">netlify.toml</code>, dan <code className="font-mono bg-slate-200 px-1 rounded text-[10px]">_redirects</code> untuk mencegah error 404 pada rute SPA.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-700">
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md">Vercel: Vite Preset</span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md">Netlify: dist/ 200</span>
            </div>
          </div>
        </div>

        {/* Dedicated Interactive Deploy Guide Card */}
        <div className="mt-4 p-5 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl text-white shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Panduan Deploy ke Vercel & Netlify
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Siap Pakai
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Langkah praktis mempublikasikan KEUANGAN CERDAS ke internet dengan domain gratis atau custom domain.
                </p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setDeployTab('vercel')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  deployTab === 'vercel'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>▲ Vercel</span>
              </button>
              <button
                type="button"
                onClick={() => setDeployTab('netlify')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  deployTab === 'netlify'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>◆ Netlify</span>
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Step 1: Git Repo */}
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-indigo-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> 1. Push ke GitHub
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      'git init\ngit add .\ngit commit -m "Initial commit"\ngit branch -M main\ngit remote add origin https://github.com/USERNAME/keuangan-cerdas.git\ngit push -u origin main',
                      'git'
                    )
                  }
                  className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded flex items-center gap-1 transition"
                >
                  {copiedKey === 'git' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'git' ? 'Tersalin' : 'Salin Git Script'}
                </button>
              </div>
              <p className="text-[11px] text-slate-300">
                Buat repositori di GitHub, lalu jalankan perintah terminal berikut di folder proyek:
              </p>
              <pre className="p-2.5 bg-black/40 rounded-lg text-[10px] font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-white/5">
git init{'\n'}git add .{'\n'}git commit -m "Deploy Keuangan Cerdas"{'\n'}git branch -M main{'\n'}git push -u origin main
              </pre>
            </div>

            {/* Step 2: Platform Specific */}
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-indigo-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> 2. Import di {deployTab === 'vercel' ? 'Vercel' : 'Netlify'}
                </span>
                <span className="text-[10px] text-slate-400">Otomatis Terdeteksi</span>
              </div>
              {deployTab === 'vercel' ? (
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <p>1. Buka <strong>vercel.com</strong> &rarr; Add New Project &rarr; Import repo GitHub.</p>
                  <p>2. Setelan otomatis menggunakan file <strong>vercel.json</strong>:</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 text-[10px] text-slate-300 font-mono">
                    <li>Framework: Vite</li>
                    <li>Build Command: npm run build</li>
                    <li>Output Directory: dist</li>
                  </ul>
                  <p>3. Klik <strong>Deploy</strong>. Website aktif dalam 40 detik!</p>
                </div>
              ) : (
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <p>1. Buka <strong>netlify.com</strong> &rarr; Add new site &rarr; Import existing repo.</p>
                  <p>2. Setelan otomatis menggunakan file <strong>netlify.toml</strong>:</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 text-[10px] text-slate-300 font-mono">
                    <li>Build Command: npm run build</li>
                    <li>Publish Directory: dist</li>
                    <li>SPA Redirects: /* &rarr; /index.html 200</li>
                  </ul>
                  <p>3. Klik <strong>Deploy site</strong>. Siap online seketika!</p>
                </div>
              )}
            </div>
          </div>

          {/* Critical Step 3: Firebase Authorized Domain */}
          <div className="mt-3.5 p-3.5 bg-amber-500/10 border border-amber-400/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] space-y-1">
              <span className="font-bold text-amber-200">
                PENTING: Tambahkan Domain Produksi ke Firebase Authorized Domains
              </span>
              <p className="text-amber-100/90 leading-relaxed">
                Agar Google OAuth & Gmail API dapat diakses tanpa hambatan di URL Vercel/Netlify Anda: Buka{' '}
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white"
                >
                  Firebase Console
                </a>{' '}
                &rarr; <strong>Authentication</strong> &rarr; <strong>Settings</strong> &rarr;{' '}
                <strong>Authorized domains</strong> &rarr; Masukkan domain Anda (misal:{' '}
                <code className="bg-black/30 px-1 py-0.5 rounded text-[10px] font-mono">
                  {deployTab === 'vercel' ? 'keuangan-cerdas.vercel.app' : 'keuangan-cerdas.netlify.app'}
                </code>
                ).
              </p>
            </div>
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
