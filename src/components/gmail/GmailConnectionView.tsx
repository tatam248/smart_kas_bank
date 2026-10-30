import React, { useState } from 'react';
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  History,
  FileCode,
  ArrowRight,
  LogOut,
  Sparkles,
  Lock,
} from 'lucide-react';
import { BankAccount, EmailSyncLog, Transaction, UserProfile } from '../../types';
import { SAMPLE_BANK_EMAILS, parseBankEmail, SampleEmailTemplate } from '../../services/bankParsers';
import { formatDate, formatIDR, generateId } from '../../utils/formatters';

interface GmailConnectionViewProps {
  profile: UserProfile;
  accounts: BankAccount[];
  syncLogs: EmailSyncLog[];
  isSyncing: boolean;
  onSyncGmail: () => Promise<void>;
  onConnectGoogle: () => Promise<void>;
  onDisconnectGmail: () => Promise<void>;
  onAddTransactionFromParser: (tx: Transaction) => void;
}

export const GmailConnectionView: React.FC<GmailConnectionViewProps> = ({
  profile,
  accounts,
  syncLogs,
  isSyncing,
  onSyncGmail,
  onConnectGoogle,
  onDisconnectGmail,
  onAddTransactionFromParser,
}) => {
  // Simulator State
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [simulatorSender, setSimulatorSender] = useState<string>(SAMPLE_BANK_EMAILS[0].sender);
  const [simulatorSubject, setSimulatorSubject] = useState<string>(SAMPLE_BANK_EMAILS[0].subject);
  const [simulatorBody, setSimulatorBody] = useState<string>(SAMPLE_BANK_EMAILS[0].body);
  const [parsedResult, setParsedResult] = useState(() =>
    parseBankEmail(SAMPLE_BANK_EMAILS[0].sender, SAMPLE_BANK_EMAILS[0].subject, SAMPLE_BANK_EMAILS[0].body)
  );
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Load sample template into simulator
  const handleSelectTemplate = (index: number) => {
    setSelectedTemplateIndex(index);
    const tmpl = SAMPLE_BANK_EMAILS[index];
    setSimulatorSender(tmpl.sender);
    setSimulatorSubject(tmpl.subject);
    setSimulatorBody(tmpl.body);
    const res = parseBankEmail(tmpl.sender, tmpl.subject, tmpl.body);
    setParsedResult(res);
    setSaveSuccessMessage(null);
  };

  // Re-run parser on user edit
  const handleRunParser = () => {
    const res = parseBankEmail(simulatorSender, simulatorSubject, simulatorBody);
    setParsedResult(res);
    setSaveSuccessMessage(null);
  };

  // Save parsed result into live system
  const handleSaveToTransactions = () => {
    if (!parsedResult.isMatch || parsedResult.amount <= 0) return;

    // Find matching bank account
    let targetAcc = accounts.find((a) =>
      a.bankName.toLowerCase().includes(parsedResult.bankName.toLowerCase()) ||
      parsedResult.bankName.toLowerCase().includes(a.bankName.toLowerCase())
    );

    if (!targetAcc && accounts.length > 0) {
      targetAcc = accounts[0];
    }

    const now = new Date().toISOString();
    const newTx: Transaction = {
      id: generateId('tx_sim'),
      date: parsedResult.dateTime || now,
      bankAccountId: targetAcc ? targetAcc.id : 'acc_default',
      type: parsedResult.type,
      direction: parsedResult.direction,
      amount: parsedResult.amount,
      balanceAfter: parsedResult.balanceAfter,
      description: parsedResult.description,
      partyName: parsedResult.partyName,
      referenceNumber: parsedResult.referenceNumber,
      emailSender: simulatorSender,
      emailSubject: simulatorSubject,
      rawEmailSnippet: simulatorBody.slice(0, 300),
      category: parsedResult.suggestedCategory || 'Belum Dikategorikan',
      status: 'verified',
      createdMethod: 'simulator',
      createdAt: now,
      updatedAt: now,
    };

    onAddTransactionFromParser(newTx);
    setSaveSuccessMessage(
      `Transaksi berhasil dicatat ke rekening ${targetAcc?.bankName || 'Utama'} dan jurnal debit-kredit otomatis diseimbangkan!`
    );
    setTimeout(() => setSaveSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Koneksi Gmail & Mesin Parser Transaksi Bank
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Integrasi otomatis membaca notifikasi transaksi resmi dari bank Anda tanpa menyimpan password email.
        </p>
      </div>

      {/* Gmail OAuth Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Google Workspace & Gmail API
                </h2>
                {profile.isConnectedGmail ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Belum Terhubung
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                Akun aktif: <strong className="text-slate-800 font-mono">{profile.email}</strong>.
                Izin akses: <code className="text-blue-800 bg-blue-50 px-1 py-0.5 rounded text-[11px]">gmail.readonly</code> (Hanya membaca notifikasi perbankan).
              </p>
              {profile.lastGmailSync && (
                <p className="text-[11px] text-slate-600 mt-1">
                  Sinkronisasi terakhir: {formatDate(profile.lastGmailSync, true)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {profile.isConnectedGmail ? (
              <>
                <button
                  onClick={onSyncGmail}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sedang Membaca...' : 'Sinkronkan Sekarang'}</span>
                </button>
                <button
                  onClick={onDisconnectGmail}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium transition"
                  title="Putuskan koneksi Gmail dan hapus token dari memori"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Putuskan</span>
                </button>
              </>
            ) : (
              <button
                onClick={onConnectGoogle}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Masuk & Hubungkan Akun Gmail</span>
              </button>
            )}
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>OAuth 2.0 Resmi Google Workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Tanpa Password, PIN, atau Akses Mutasi</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Pencegahan Otomatis Duplikasi Transaksi</span>
          </div>
        </div>
      </div>

      {/* Bank Parser Simulator & Testing Suite */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider mb-1 border border-indigo-200/60">
              <FileCode className="w-3 h-3" />
              Simulator Mesin Parser
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Uji Coba Pengenalan Format Email Bank
            </h2>
            <p className="text-xs text-slate-500">
              Uji bagaimana mesin membaca format email dari BCA, Mandiri, BRI, BNI, Jago, dll. Anda juga dapat menempelkan teks email bank sendiri.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunParser}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Jalankan Parser</span>
            </button>
          </div>
        </div>

        {/* Sample Templates Quick Selector */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Pilih Template Notifikasi Bank Populer:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_BANK_EMAILS.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectTemplate(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedTemplateIndex === idx
                    ? 'bg-blue-900 text-white shadow-xs font-semibold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tmpl.bankName} - {tmpl.expectedDirection === 'credit' ? 'Uang Masuk (+)' : 'Uang Keluar (-)'}
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Grid: Email Input vs Parser Result */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column: Email Input Fields */}
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Pengirim (From)
              </label>
              <input
                type="text"
                value={simulatorSender}
                onChange={(e) => setSimulatorSender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-blue-600 transition"
                placeholder="misal: informasi@klikbca.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subjek Email (Subject)
              </label>
              <input
                type="text"
                value={simulatorSubject}
                onChange={(e) => setSimulatorSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-blue-600 transition"
                placeholder="misal: Notifikasi Transaksi Rekening BCA"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Isi Pesan Email (Body Text)
              </label>
              <textarea
                rows={9}
                value={simulatorBody}
                onChange={(e) => setSimulatorBody(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono leading-relaxed focus:bg-white focus:outline-blue-600 transition"
                placeholder="Tempel isi notifikasi email bank di sini..."
              />
            </div>
          </div>

          {/* Right Column: Live Extraction Result */}
          <div className="p-5 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Hasil Ekstraksi Finansial:
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    parsedResult.isMatch
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {parsedResult.isMatch ? 'Format Dikenali' : 'Tidak Cocok'}
                </span>
              </div>

              {parsedResult.isMatch ? (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-600 block">
                        Bank Terdeteksi
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {parsedResult.bankName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-600 block">
                        Arah Transaksi
                      </span>
                      <span
                        className={`text-sm font-bold inline-flex items-center gap-1 ${
                          parsedResult.direction === 'credit'
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {parsedResult.direction === 'credit' ? 'Uang Masuk (Kredit)' : 'Uang Keluar (Debit)'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-600 block">
                        Nominal Transaksi
                      </span>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        {formatIDR(parsedResult.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-600 block">
                        Saldo Akhir Bank
                      </span>
                      <span className="text-sm font-bold text-slate-700 font-mono">
                        {parsedResult.balanceAfter ? formatIDR(parsedResult.balanceAfter) : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">No. Rekening Masked:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {parsedResult.maskedAccount || 'Tidak tertera'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">No. Referensi / Resi:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {parsedResult.referenceNumber || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Keterangan:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[200px]">
                        {parsedResult.description}
                      </span>
                    </div>
                    {parsedResult.partyName && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Pihak Terkait:</span>
                        <span className="font-medium text-slate-800">
                          {parsedResult.partyName}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-600">Saran Kategori:</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[11px] border border-blue-100">
                        {parsedResult.suggestedCategory}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Tidak ditemukan pola transaksi pada email ini
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pastikan terdapat nominal (Rp) dan kata kunci transaksi perbankan.
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              {saveSuccessMessage && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              <button
                onClick={handleSaveToTransactions}
                disabled={!parsedResult.isMatch}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-40"
              >
                <span>Catat Transaksi Ini ke Buku Kas & Jurnal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sync History Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">
              Riwayat Proses Sinkronisasi Email
            </h2>
          </div>
          <span className="text-xs text-slate-600">
            {syncLogs.length} Riwayat Log
          </span>
        </div>

        {syncLogs.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {syncLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/70 transition flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg mt-0.5 ${log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{log.message}</p>
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                      Sumber: {log.sourceEmail} • {formatDate(log.timestamp, true)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div className="text-[11px]">
                    <span className="text-emerald-600 font-bold">+{log.transactionsCreated} dicatat</span>
                    <span className="text-slate-600 mx-1">•</span>
                    <span className="text-slate-600">{log.duplicatesSkipped} diabaikan (duplikat)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Belum ada riwayat sinkronisasi. Klik tombol "Sinkronkan Sekarang" di atas untuk memulai pencatatan otomatis dari Gmail.
          </div>
        )}
      </div>
    </div>
  );
};
