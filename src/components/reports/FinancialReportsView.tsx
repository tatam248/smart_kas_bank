import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { BankAccount, Transaction } from '../../types';
import { formatDate, formatIDR } from '../../utils/formatters';

interface FinancialReportsViewProps {
  transactions: Transaction[];
  accounts: BankAccount[];
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'profit_loss';

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  transactions,
  accounts,
}) => {
  const [reportType, setReportType] = useState<ReportPeriod>('monthly');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Dates
  const today = new Date().toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState<string>(today); // for daily
  const [targetMonth, setTargetMonth] = useState<string>(today.slice(0, 7)); // for monthly (YYYY-MM)

  // Filter transactions by account if specified
  const baseTxs = transactions.filter((t) => {
    if (selectedAccountId === 'all') return true;
    return t.bankAccountId === selectedAccountId || t.destinationAccountId === selectedAccountId;
  });

  // Calculate based on report type
  let filteredTxs: Transaction[] = [];
  let periodTitle = '';

  if (reportType === 'daily') {
    periodTitle = `Laporan Harian: ${formatDate(targetDate)}`;
    filteredTxs = baseTxs.filter((t) => t.date.startsWith(targetDate));
  } else if (reportType === 'weekly') {
    // 7 days ending at targetDate
    const endDate = new Date(targetDate);
    const startDate = new Date(targetDate);
    startDate.setDate(endDate.getDate() - 6);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = targetDate;
    periodTitle = `Laporan Mingguan: ${formatDate(startStr)} - ${formatDate(endStr)}`;

    filteredTxs = baseTxs.filter((t) => {
      const d = t.date.split('T')[0];
      return d >= startStr && d <= endStr;
    });
  } else if (reportType === 'monthly' || reportType === 'profit_loss') {
    const [y, m] = targetMonth.split('-');
    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
      new Date(Number(y), Number(m) - 1, 1)
    );
    periodTitle = reportType === 'profit_loss'
      ? `Laporan Laba Rugi Usaha (Income Statement): ${monthName}`
      : `Laporan Keuangan Bulanan: ${monthName}`;

    filteredTxs = baseTxs.filter((t) => t.date.startsWith(targetMonth));
  }

  // Financial Computations
  const totalIncome = filteredTxs
    .filter((t) => t.type === 'income' || t.direction === 'credit')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = filteredTxs
    .filter((t) => t.type === 'expense' || t.direction === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  // Breakdown by category
  const expenseByCategory: Record<string, number> = {};
  filteredTxs
    .filter((t) => t.type === 'expense' || t.direction === 'debit')
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const incomeByCategory: Record<string, number> = {};
  filteredTxs
    .filter((t) => t.type === 'income' || t.direction === 'credit')
    .forEach((t) => {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
    });

  // Export to CSV
  const handleExportCSV = () => {
    let csv = 'Tanggal,Rekening,Tipe,Kategori,Deskripsi,Ref,Nominal Masuk (Rp),Nominal Keluar (Rp)\n';
    filteredTxs.forEach((t) => {
      const acc = accounts.find((a) => a.id === t.bankAccountId);
      const isCredit = t.direction === 'credit' || t.type === 'income';
      const inAmt = isCredit ? t.amount : 0;
      const outAmt = !isCredit ? t.amount : 0;
      csv += `"${t.date}","${acc?.bankName || ''}","${t.type}","${t.category}","${t.description.replace(/"/g, '""')}","${t.referenceNumber || ''}",${inAmt},${outAmt}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan-keuangan-${reportType}-${targetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel HTML format
  const handleExportExcel = () => {
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"></head>
      <body>
        <h2>${periodTitle}</h2>
        <p>Total Pemasukan: ${formatIDR(totalIncome)} | Total Pengeluaran: ${formatIDR(totalExpense)} | Arus Kas Bersih: ${formatIDR(netCashflow)}</p>
        <table border="1">
          <tr style="background:#0F172A; color:#FFF;">
            <th>Tanggal</th><th>Rekening</th><th>Kategori</th><th>Keterangan</th><th>Nomor Ref</th><th>Pemasukan (Rp)</th><th>Pengeluaran (Rp)</th>
          </tr>
          ${filteredTxs
            .map((t) => {
              const acc = accounts.find((a) => a.id === t.bankAccountId);
              const isCredit = t.direction === 'credit' || t.type === 'income';
              return `<tr>
                <td>${t.date}</td>
                <td>${acc?.bankName || ''}</td>
                <td>${t.category}</td>
                <td>${t.description}</td>
                <td>${t.referenceNumber || ''}</td>
                <td>${isCredit ? t.amount : 0}</td>
                <td>${!isCredit ? t.amount : 0}</td>
              </tr>`;
            })
            .join('')}
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan-keuangan-${targetMonth}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header - Hidden on Print */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Laporan Keuangan Otomatis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analisis arus kas berkala, laporan laba rugi, dan ringkasan mutasi bank siap ekspor & cetak.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xls)</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Control Filters Bar - Hidden on Print */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Period Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setReportType('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              reportType === 'daily'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Laporan Harian
          </button>
          <button
            onClick={() => setReportType('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              reportType === 'weekly'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Laporan Mingguan
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              reportType === 'monthly'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Laporan Bulanan
          </button>
          <button
            onClick={() => setReportType('profit_loss')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              reportType === 'profit_loss'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Laba / Rugi Usaha (P&L)
          </button>
        </div>

        {/* Date & Account selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {reportType === 'daily' || reportType === 'weekly' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {reportType === 'daily' ? 'Tanggal Laporan' : 'Tanggal Akhir Periode Mingguan'}
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
              />
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bulan & Tahun Laporan
              </label>
              <input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Filter Rekening Bank
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
            >
              <option value="all">Semua Rekening</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName} ({a.maskedNumber})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Report Container (Printable Paper Sheet) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Report Official Letterhead */}
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-xl">
                KEUANGAN CERDAS
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold uppercase">
                Official Report
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-800 mt-1">
              {periodTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dicetak pada: {formatDate(new Date().toISOString(), true)}
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-500 block">Cakupan Rekening:</span>
            <span className="font-bold text-slate-800">
              {selectedAccountId === 'all'
                ? `Seluruh Rekening Bank (${accounts.length} Akun)`
                : accounts.find((a) => a.id === selectedAccountId)?.bankName}
            </span>
          </div>
        </div>

        {/* Financial Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
            <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider block">
              Total Uang Masuk / Pendapatan
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
              +{formatIDR(totalIncome)}
            </div>
            <span className="text-[11px] text-emerald-600 mt-1 block">
              {filteredTxs.filter((t) => t.direction === 'credit' || t.type === 'income').length} transaksi penerimaan
            </span>
          </div>

          <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl">
            <span className="text-xs font-bold uppercase text-rose-800 tracking-wider block">
              Total Uang Keluar / Beban Usaha
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-700 font-mono mt-1">
              -{formatIDR(totalExpense)}
            </div>
            <span className="text-[11px] text-rose-600 mt-1 block">
              {filteredTxs.filter((t) => t.direction === 'debit' || t.type === 'expense').length} transaksi pengeluaran
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${netCashflow >= 0 ? 'bg-blue-50/70 border-blue-200/80' : 'bg-amber-50/70 border-amber-200/80'}`}>
            <span className="text-xs font-bold uppercase tracking-wider block text-slate-700">
              {reportType === 'profit_loss' ? 'Laba (Rugi) Bersih Usaha' : 'Arus Kas Bersih (Net Cashflow)'}
            </span>
            <div className={`text-xl sm:text-2xl font-extrabold font-mono mt-1 ${netCashflow >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>
              {formatIDR(netCashflow)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {netCashflow >= 0 ? 'Surplus Operasional' : 'Defisit Pengeluaran'}
            </span>
          </div>
        </div>

        {/* LABA RUGI STATEMENT STRUCTURE (IF P&L MODE) */}
        {reportType === 'profit_loss' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 p-3 font-bold text-slate-800 uppercase tracking-wider">
              Rincian Laporan Laba Rugi Sederhana
            </div>
            <div className="p-4 space-y-4">
              {/* Revenue */}
              <div>
                <h4 className="font-bold text-emerald-800 uppercase text-[11px] mb-2">
                  1. Pendapatan & Pemasukan Usaha
                </h4>
                <div className="space-y-1.5 pl-3 border-l-2 border-emerald-500">
                  {Object.entries(incomeByCategory).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-700">{cat}</span>
                      <span className="font-mono font-semibold text-slate-900">{formatIDR(amt)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-bold text-emerald-800">
                    <span>Total Pendapatan Usaha:</span>
                    <span className="font-mono">{formatIDR(totalIncome)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <h4 className="font-bold text-rose-800 uppercase text-[11px] mb-2">
                  2. Beban & Biaya Operasional
                </h4>
                <div className="space-y-1.5 pl-3 border-l-2 border-rose-500">
                  {Object.entries(expenseByCategory).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-700">{cat}</span>
                      <span className="font-mono font-semibold text-slate-900">{formatIDR(amt)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-bold text-rose-800">
                    <span>Total Beban Usaha:</span>
                    <span className="font-mono">{formatIDR(totalExpense)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Result */}
              <div className="p-3 bg-slate-900 text-white rounded-lg flex justify-between items-center font-bold text-sm">
                <span>LABA / (RUGI) BERSIH:</span>
                <span className="font-mono text-emerald-400">{formatIDR(netCashflow)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Transactions Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">
            Rincian Seluruh Transaksi Periode Ini ({filteredTxs.length} Mutasi)
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Rekening Bank</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Uraian / Deskripsi</th>
                  <th className="py-2.5 px-3">Ref</th>
                  <th className="py-2.5 px-3 text-right">Pemasukan</th>
                  <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxs.length > 0 ? (
                  filteredTxs.map((t) => {
                    const acc = accounts.find((a) => a.id === t.bankAccountId);
                    const isCredit = t.direction === 'credit' || t.type === 'income';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {formatDate(t.date)}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {acc?.bankName || 'Bank'}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-900 max-w-xs truncate">
                          {t.description}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 text-[10px]">
                          {t.referenceNumber || '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                          {isCredit ? formatIDR(t.amount) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                          {!isCredit ? formatIDR(t.amount) : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada catatan transaksi pada periode yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
