import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  Layers,
  Building,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { BankAccount, ChartOfAccount, JournalEntry, Transaction } from '../../types';
import {
  buildGeneralLedger,
  buildTrialBalance,
  DEFAULT_CHART_OF_ACCOUNTS,
} from '../../services/accountingEngine';
import { formatDate, formatIDR } from '../../utils/formatters';

interface JournalViewProps {
  journals: JournalEntry[];
  accounts: BankAccount[];
  transactions: Transaction[];
  coaList?: ChartOfAccount[];
}

type JournalTab = 'general' | 'ledger' | 'cashbook' | 'trial_balance' | 'coa';

export const JournalView: React.FC<JournalViewProps> = ({
  journals,
  accounts,
  transactions,
  coaList = DEFAULT_CHART_OF_ACCOUNTS,
}) => {
  const [activeTab, setActiveTab] = useState<JournalTab>('general');
  const [selectedLedgerCode, setSelectedLedgerCode] = useState<string>('1-1001');
  const [selectedCashBankAccId, setSelectedCashBankAccId] = useState<string>(accounts[0]?.id || '');

  // Build General Ledger
  const ledgerMap = buildGeneralLedger(journals, coaList);

  // Build Trial Balance
  const trialBalance = buildTrialBalance(ledgerMap);

  // Filter for Cash Book
  const activeBank = accounts.find((a) => a.id === selectedCashBankAccId) || accounts[0];
  const cashBankTransactions = transactions
    .filter((t) => t.bankAccountId === activeBank?.id || t.destinationAccountId === activeBank?.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Export CSV
  const handleExportJournalCSV = () => {
    let csv = 'Tanggal,Nomor Referensi,Keterangan,Kode Akun,Nama Akun,Debit (Rp),Kredit (Rp)\n';
    journals.forEach((j) => {
      j.lines.forEach((l) => {
        csv += `"${j.date}","${j.referenceNumber}","${j.description.replace(/"/g, '""')}","${l.accountCode}","${l.accountName}",${l.debit},${l.credit}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jurnal-umum-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Sistem Jurnal & Akuntansi Otomatis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Penjurnalan ganda (double-entry) otomatis, buku besar, buku kas/bank, dan neraca saldo berimbang.
          </p>
        </div>

        <button
          onClick={handleExportJournalCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Jurnal CSV</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl max-w-fit text-xs font-medium">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === 'general'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Jurnal Umum ({journals.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === 'ledger'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Buku Besar (Ledger)
        </button>
        <button
          onClick={() => setActiveTab('cashbook')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === 'cashbook'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Buku Kas & Bank
        </button>
        <button
          onClick={() => setActiveTab('trial_balance')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === 'trial_balance'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Neraca Saldo Sederhana
        </button>
        <button
          onClick={() => setActiveTab('coa')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeTab === 'coa'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bagan Akun (COA)
        </button>
      </div>

      {/* TAB 1: JURNAL UMUM */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Seluruh {journals.length} entri jurnal dibuat secara otomatis dan berimbang (Debit = Kredit).
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-blue-950">
              Total Debit: {formatIDR(journals.reduce((s, j) => s + j.totalDebit, 0))}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-32">Tanggal & Ref</th>
                    <th className="py-3 px-4">Keterangan / Transaksi</th>
                    <th className="py-3 px-4 w-28">Kode Akun</th>
                    <th className="py-3 px-4">Nama Akun Perkiraan</th>
                    <th className="py-3 px-4 text-right w-32">Debit (Rp)</th>
                    <th className="py-3 px-4 text-right w-32">Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {journals.map((jnl) => (
                    <React.Fragment key={jnl.id}>
                      {jnl.lines.map((line, idx) => (
                        <tr
                          key={`${jnl.id}_${idx}`}
                          className={`hover:bg-slate-50/70 transition ${
                            idx === 0 ? 'bg-slate-50/30' : ''
                          }`}
                        >
                          {/* Date & Ref (only on first line of journal) */}
                          <td className="py-2.5 px-4 align-top">
                            {idx === 0 && (
                              <div>
                                <span className="font-mono text-slate-800 font-semibold block">
                                  {formatDate(jnl.date)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {jnl.referenceNumber}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Description */}
                          <td className="py-2.5 px-4 align-top text-slate-700">
                            {idx === 0 && (
                              <span className="font-medium">{jnl.description}</span>
                            )}
                          </td>

                          {/* Account Code */}
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-600 align-top">
                            {line.accountCode}
                          </td>

                          {/* Account Name */}
                          <td
                            className={`py-2.5 px-4 align-top font-medium ${
                              line.credit > 0 ? 'pl-8 text-slate-600' : 'text-slate-900'
                            }`}
                          >
                            {line.accountName}
                          </td>

                          {/* Debit */}
                          <td className="py-2.5 px-4 text-right font-mono font-bold align-top text-slate-900">
                            {line.debit > 0 ? formatIDR(line.debit) : '-'}
                          </td>

                          {/* Credit */}
                          <td className="py-2.5 px-4 text-right font-mono font-bold align-top text-slate-900">
                            {line.credit > 0 ? formatIDR(line.credit) : '-'}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUKU BESAR (GENERAL LEDGER) */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
                Pilih Akun Buku Besar:
              </span>
              <select
                value={selectedLedgerCode}
                onChange={(e) => setSelectedLedgerCode(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-blue-600 transition min-w-[260px]"
              >
                {Object.values(ledgerMap).map((item) => (
                  <option key={item.accountCode} value={item.accountCode}>
                    {item.accountCode} - {item.accountName} ({item.entries.length} mutasi)
                  </option>
                ))}
              </select>
            </div>

            {ledgerMap[selectedLedgerCode] && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-600">
                  Total Debit: <strong>{formatIDR(ledgerMap[selectedLedgerCode].totalDebit)}</strong>
                </span>
                <span className="text-slate-600">
                  Total Kredit: <strong>{formatIDR(ledgerMap[selectedLedgerCode].totalCredit)}</strong>
                </span>
                <span className="text-blue-900 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  Saldo Akhir: {formatIDR(ledgerMap[selectedLedgerCode].endingBalance)}
                </span>
              </div>
            )}
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Nomor Ref</th>
                    <th className="py-3 px-4">Uraian / Keterangan</th>
                    <th className="py-3 px-4 text-right">Debit (Rp)</th>
                    <th className="py-3 px-4 text-right">Kredit (Rp)</th>
                    <th className="py-3 px-4 text-right">Saldo Berjalan (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerMap[selectedLedgerCode]?.entries.length ? (
                    ledgerMap[selectedLedgerCode].entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {formatDate(entry.date)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {entry.reference}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">
                          {entry.description}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                          {entry.debit > 0 ? formatIDR(entry.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                          {entry.credit > 0 ? formatIDR(entry.credit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-900">
                          {formatIDR(entry.balance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        Belum ada mutasi jurnal untuk akun ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUKU KAS & BANK */}
      {activeTab === 'cashbook' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
                Pilih Buku Kas/Bank:
              </span>
              <select
                value={selectedCashBankAccId}
                onChange={(e) => setSelectedCashBankAccId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-blue-600 transition"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} - {acc.maskedNumber} ({acc.accountHolder})
                  </option>
                ))}
              </select>
            </div>

            {activeBank && (
              <div className="text-xs">
                <span className="text-slate-500 mr-2">Saldo Awal Pembukuan:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatIDR(activeBank.startingBalance)}
                </span>
              </div>
            )}
          </div>

          {/* Cashbook Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Tanggal & Jam</th>
                    <th className="py-3 px-4">Nomor Ref</th>
                    <th className="py-3 px-4">Uraian Transaksi</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">Penerimaan / Masuk (Debit Bank)</th>
                    <th className="py-3 px-4 text-right">Pengeluaran / Keluar (Kredit Bank)</th>
                    <th className="py-3 px-4 text-right">Saldo Akhir (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Row Saldo Awal */}
                  <tr className="bg-slate-50/60 font-semibold text-slate-600">
                    <td className="py-3 px-4 font-mono">{formatDate(activeBank.startDate)}</td>
                    <td className="py-3 px-4 font-mono">-</td>
                    <td className="py-3 px-4">SALDO AWAL PEMBUKUAN</td>
                    <td className="py-3 px-4">-</td>
                    <td className="py-3 px-4 text-right font-mono">-</td>
                    <td className="py-3 px-4 text-right font-mono">-</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatIDR(activeBank.startingBalance)}
                    </td>
                  </tr>

                  {(() => {
                    let running = activeBank.startingBalance;
                    return cashBankTransactions.map((tx) => {
                      const isIncoming =
                        tx.bankAccountId === activeBank.id
                          ? tx.direction === 'credit' || tx.type === 'income'
                          : tx.type === 'transfer' && tx.destinationAccountId === activeBank.id;

                      if (isIncoming) running += tx.amount;
                      else running -= tx.amount;

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                            {formatDate(tx.date, true)}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {tx.referenceNumber || '-'}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {tx.description}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {tx.category}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            {isIncoming ? formatIDR(tx.amount) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                            {!isIncoming ? formatIDR(tx.amount) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                            {formatIDR(running)}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NERACA SALDO SEDERHANA (TRIAL BALANCE) */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
            trialBalance.isBalanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              {trialBalance.isBalanced ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {trialBalance.isBalanced ? 'Neraca Saldo Sempurna & Berimbang' : 'Perhatian: Ada Selisih Neraca'}
                </h4>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Total akumulasi saldo sisi Debit dan sisi Kredit terbukti sama persis.
                </p>
              </div>
            </div>

            <div className="font-mono text-xs text-right">
              <div>Total Debit: <strong>{formatIDR(trialBalance.totalDebit)}</strong></div>
              <div>Total Kredit: <strong>{formatIDR(trialBalance.totalCredit)}</strong></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-32">Kode Akun</th>
                    <th className="py-3 px-4">Nama Akun Perkiraan</th>
                    <th className="py-3 px-4 text-right w-44">Debit (Rp)</th>
                    <th className="py-3 px-4 text-right w-44">Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalance.rows.map((row) => (
                    <tr key={row.accountCode} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {row.accountCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {row.accountName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {row.debit > 0 ? formatIDR(row.debit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {row.credit > 0 ? formatIDR(row.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={2} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs">
                      Total Neraca Saldo:
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-emerald-800">
                      {formatIDR(trialBalance.totalDebit)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-emerald-800">
                      {formatIDR(trialBalance.totalCredit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CHART OF ACCOUNTS */}
      {activeTab === 'coa' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Bagan Akun Standar Akuntansi Keuangan (COA)
            </h2>
            <p className="text-xs text-slate-500">
              Struktur klasifikasi akun perkiraan otomatis sesuai standar PSAK / SAK EMKM Indonesia.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-32">Kode Akun</th>
                  <th className="py-3 px-4">Nama Akun</th>
                  <th className="py-3 px-4">Klasifikasi</th>
                  <th className="py-3 px-4 text-center">Saldo Normal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coaList.map((c) => (
                  <tr key={c.code} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {c.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {c.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {c.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold uppercase text-slate-600">
                      {c.normalBalance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
