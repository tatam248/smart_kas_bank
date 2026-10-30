import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  Building2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { BankAccount, ReconciliationRecord, Transaction } from '../../types';
import { formatDate, formatIDR, generateId } from '../../utils/formatters';

interface ReconciliationViewProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  reconciliations: ReconciliationRecord[];
  onSaveReconciliation: (record: ReconciliationRecord) => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  accounts,
  transactions,
  reconciliations,
  onSaveReconciliation,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [reconNote, setReconNote] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Calculate live balance for this account
  let calculatedBalance = activeAccount?.startingBalance || 0;
  for (const t of transactions) {
    if (t.status === 'unverified') continue;
    if (t.bankAccountId === activeAccount?.id) {
      if (t.direction === 'credit' || t.type === 'income') calculatedBalance += t.amount;
      else if (t.direction === 'debit' || t.type === 'expense' || t.type === 'transfer') calculatedBalance -= t.amount;
    }
    if (t.type === 'transfer' && t.destinationAccountId === activeAccount?.id) {
      calculatedBalance += t.amount;
    }
  }

  const reportedBalance = activeAccount?.lastKnownBankBalance ?? calculatedBalance;
  const variance = calculatedBalance - reportedBalance;
  const isMatched = Math.abs(variance) < 1;

  // Unverified transactions on this account
  const accountUnverifiedTxs = transactions.filter(
    (t) => (t.bankAccountId === activeAccount?.id || t.destinationAccountId === activeAccount?.id) &&
      (t.status === 'unverified' || t.status === 'needs_review')
  );

  // Handle Mark Reconciled
  const handleConfirmReconciliation = () => {
    if (!activeAccount) return;

    const record: ReconciliationRecord = {
      id: generateId('recon'),
      bankAccountId: activeAccount.id,
      reconciliationDate: new Date().toISOString(),
      calculatedBalance,
      reportedBankBalance: reportedBalance,
      variance,
      status: isMatched ? 'matched' : 'discrepancy',
      notes: reconNote || (isMatched ? 'Saldo cocok sempurna dengan mutasi bank' : 'Terdapat penyesuaian catatan'),
      resolvedAt: new Date().toISOString(),
    };

    onSaveReconciliation(record);
    setReconNote('');
    setSuccessMsg(`Status rekonsiliasi ${activeAccount.bankName} berhasil disimpan.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const accountRecons = reconciliations.filter((r) => r.bankAccountId === activeAccount?.id);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Rekonsiliasi Saldo Bank
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Bandingkan saldo hasil perhitungan catatan aplikasi dengan saldo mutasi resmi bank untuk memastikan keakuratan 100%.
        </p>
      </div>

      {/* Account Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {accounts.map((acc) => (
          <button
            key={acc.id}
            onClick={() => setSelectedAccountId(acc.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              selectedAccountId === acc.id
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{acc.bankName} ({acc.maskedNumber})</span>
          </button>
        ))}
      </div>

      {/* Main Reconciliation Comparison Card */}
      {activeAccount && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Status Rekonsiliasi: {activeAccount.bankName}
              </h2>
              <p className="text-xs text-slate-500">
                Pemilik: {activeAccount.accountHolder} • Rekening: {activeAccount.maskedNumber}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isMatched
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {isMatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Saldo Cocok (Reconciled)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Terdapat Selisih</span>
                </>
              )}
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Box 1: Calculated Balance */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                1. Saldo Catatan Aplikasi
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {formatIDR(calculatedBalance)}
              </div>
              <p className="text-[11px] text-slate-600">
                Dihitung dari saldo awal pembukuan ({formatIDR(activeAccount.startingBalance)}) + seluruh transaksi terverifikasi.
              </p>
            </div>

            {/* Box 2: Bank Reported Balance */}
            <div className="md:pl-6 space-y-2 pt-4 md:pt-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                2. Saldo Notifikasi Bank Terakhir
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {formatIDR(reportedBalance)}
              </div>
              <p className="text-[11px] text-slate-600">
                Diperoleh dari data "Saldo Akhir / Sisa Saldo" pada notifikasi email bank terbaru.
              </p>
            </div>

            {/* Box 3: Variance */}
            <div className="md:pl-6 space-y-2 pt-4 md:pt-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                3. Selisih Rekonsiliasi (Variance)
              </span>
              <div
                className={`text-2xl font-extrabold font-mono ${
                  isMatched ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {formatIDR(variance)}
              </div>
              <p className="text-[11px] text-slate-600">
                {isMatched
                  ? 'Tidak ada perbedaan saldo antara aplikasi dan mutasi bank.'
                  : `Ada selisih sebesar ${formatIDR(Math.abs(variance))}. Periksa transaksi yang belum terverifikasi di bawah.`}
              </p>
            </div>
          </div>

          {/* Action Checkpoint Bar */}
          <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={reconNote}
                onChange={(e) => setReconNote(e.target.value)}
                placeholder="Catatan rekonsiliasi (opsional, misal: 'Rekonsiliasi akhir bulan Oktober 2026')"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-blue-600 transition"
              />
            </div>

            <div className="flex items-center gap-3">
              {successMsg && (
                <span className="text-xs text-emerald-600 font-medium">
                  {successMsg}
                </span>
              )}
              <button
                onClick={handleConfirmReconciliation}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Tandai Sudah Sesuai & Rekonsiliasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unverified Alerts for this Account */}
      {accountUnverifiedTxs.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-900">
              Ada {accountUnverifiedTxs.length} Transaksi yang Belum Diverifikasi pada Rekening Ini
            </h4>
            <p className="text-amber-700 mt-0.5">
              Transaksi yang belum diverifikasi tidak dihitung ke saldo catatan untuk menjaga integritas data. Silakan verifikasi di menu Transaksi jika mutasi tersebut sudah valid.
            </p>
          </div>
        </div>
      )}

      {/* Historical Reconciliation Records */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">
              Riwayat Titik Rekonsiliasi
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {accountRecons.length} Pemeriksaan Tercatat
          </span>
        </div>

        {accountRecons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Waktu Pemeriksaan</th>
                  <th className="py-3 px-4">Saldo Catatan</th>
                  <th className="py-3 px-4">Saldo Notifikasi Bank</th>
                  <th className="py-3 px-4">Selisih</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accountRecons.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {formatDate(r.reconciliationDate, true)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {formatIDR(r.calculatedBalance)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {formatIDR(r.reportedBankBalance)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {formatIDR(r.variance)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {r.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Cocok
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada riwayat rekonsiliasi untuk rekening ini. Klik tombol "Tandai Sudah Sesuai & Rekonsiliasi" di atas setelah mencocokkan saldo.
          </div>
        )}
      </div>
    </div>
  );
};
