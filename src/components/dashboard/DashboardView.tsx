import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Plus,
  RefreshCw,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { BankAccount, Transaction } from '../../types';
import { formatDate, formatIDR } from '../../utils/formatters';

interface DashboardViewProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  onNavigate: (tab: any) => void;
  onOpenSync: () => void;
  onOpenAddAccount: () => void;
  onOpenAddTx: () => void;
  isSyncing: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  transactions,
  onNavigate,
  onOpenSync,
  onOpenAddAccount,
  onOpenAddTx,
  isSyncing,
}) => {
  const [timeframe, setTimeframe] = useState<'7days' | '30days'>('7days');

  // Compute Today's Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.date.startsWith(todayStr));

  const todayIncome = todayTransactions
    .filter((t) => t.type === 'income' || t.direction === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = todayTransactions
    .filter((t) => t.type === 'expense' || t.direction === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayNet = todayIncome - todayExpense;

  // Unverified count
  const unverifiedTxs = transactions.filter(
    (t) => t.status === 'unverified' || t.status === 'needs_review'
  );

  // Total balance across active accounts
  const totalBalance = accounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => {
      // Calculate from starting balance + transactions
      let bal = a.startingBalance;
      for (const t of transactions) {
        if (t.status === 'unverified') continue;
        if (t.bankAccountId === a.id) {
          if (t.direction === 'credit' || t.type === 'income') bal += t.amount;
          else if (t.direction === 'debit' || t.type === 'expense' || t.type === 'transfer') bal -= t.amount;
        }
        if (t.type === 'transfer' && t.destinationAccountId === a.id) {
          bal += t.amount;
        }
      }
      return sum + bal;
    }, 0);

  // Calculate cashflow data for past 7 days
  const daysCount = timeframe === '7days' ? 7 : 14;
  const chartDays = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysCount - 1 - i));
    const dStr = d.toISOString().split('T')[0];
    const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);
    const dayDate = d.getDate();

    const dayTxs = transactions.filter((t) => t.date.startsWith(dStr));
    const inc = dayTxs
      .filter((t) => t.type === 'income' || t.direction === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const exp = dayTxs
      .filter((t) => t.type === 'expense' || t.direction === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      date: dStr,
      label: `${dayName} ${dayDate}`,
      income: inc,
      expense: exp,
      net: inc - exp,
    };
  });

  const maxVal = Math.max(...chartDays.map((d) => Math.max(d.income, d.expense)), 1000000);

  // Category expense breakdown (this month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = transactions.filter(
    (t) => t.date.startsWith(currentMonth) && (t.type === 'expense' || t.direction === 'debit')
  );
  const totalMonthExpense = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap: Record<string, number> = {};
  for (const t of monthExpenses) {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  }
  const categoryRanking = Object.entries(categoryMap)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percent: totalMonthExpense > 0 ? (amt / totalMonthExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 rounded-2xl text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Aktif & Terhubung
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Ringkasan Keuangan Otomatis
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Data transaksi otomatis dari email perbankan & penjurnalan real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sinkronkan Email</span>
          </button>
          <button
            onClick={onOpenAddTx}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition border border-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Manual</span>
          </button>
        </div>
      </div>

      {/* Unverified Transaction Alert Banner */}
      {unverifiedTxs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-900">
                {unverifiedTxs.length} Transaksi Baru Perlu Verifikasi Kategori
              </h2>
              <p className="text-xs text-amber-700 mt-0.5">
                Email transaksi terbaru telah berhasil dibaca. Silakan periksa atau sesuaikan kategori agar jurnal akuntansi tepat sasaran.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition shrink-0"
          >
            <span>Tinjau Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Seluruh Saldo</span>
            <div className="p-2 bg-blue-50 text-blue-800 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {formatIDR(totalBalance)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>{accounts.filter((a) => a.isActive).length} Rekening Aktif</span>
            <button
              onClick={() => onNavigate('accounts')}
              className="text-blue-800 hover:text-blue-900 font-semibold inline-flex items-center gap-0.5"
            >
              Detail <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Pemasukan Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pemasukan Hari Ini</span>
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono tracking-tight">
            {formatIDR(todayIncome)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">
              +{todayTransactions.filter((t) => t.direction === 'credit' || t.type === 'income').length}
            </span>
            <span>transaksi uang masuk</span>
          </div>
        </div>

        {/* Pengeluaran Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pengeluaran Hari Ini</span>
            <div className="p-2 bg-rose-50 text-rose-800 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono tracking-tight">
            {formatIDR(todayExpense)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="font-semibold text-rose-600">
              -{todayTransactions.filter((t) => t.direction === 'debit' || t.type === 'expense').length}
            </span>
            <span>transaksi uang keluar</span>
          </div>
        </div>

        {/* Arus Kas Bersih Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Arus Kas Bersih Hari Ini</span>
            <div className={`p-2 rounded-xl ${todayNet >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              {todayNet >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl font-extrabold font-mono tracking-tight ${todayNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatIDR(todayNet)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Total {todayTransactions.length} mutasi tercatat hari ini
          </div>
        </div>
      </div>

      {/* Bank Accounts Overview Horizontal Carousel / Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Saldo Rekening Bank</span>
            <span className="text-xs font-normal text-slate-500">
              (Dihitung dari saldo awal & transaksi verified)
            </span>
          </h2>
          <button
            onClick={onOpenAddAccount}
            className="text-xs font-semibold text-blue-800 hover:text-blue-900 inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Rekening</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc) => {
            // Calculate live balance
            let bal = acc.startingBalance;
            for (const t of transactions) {
              if (t.status === 'unverified') continue;
              if (t.bankAccountId === acc.id) {
                if (t.direction === 'credit' || t.type === 'income') bal += t.amount;
                else if (t.direction === 'debit' || t.type === 'expense' || t.type === 'transfer') bal -= t.amount;
              }
              if (t.type === 'transfer' && t.destinationAccountId === acc.id) {
                bal += t.amount;
              }
            }

            const hasDiscrepancy =
              acc.lastKnownBankBalance !== undefined &&
              Math.abs(acc.lastKnownBankBalance - bal) > 100;

            return (
              <div
                key={acc.id}
                className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:shadow-md transition"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: acc.color || '#1e3a8a' }}
                />
                <div className="flex items-start justify-between mb-3 pt-1">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                      {acc.bankName}
                    </h3>
                    <p className="text-[11px] text-slate-600 font-mono">
                      {acc.maskedNumber}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {acc.accountType}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">
                    Saldo Catatan Aplikasi
                  </span>
                  <div className="text-lg font-extrabold text-slate-900 font-mono">
                    {formatIDR(bal)}
                  </div>
                </div>

                {acc.lastKnownBankBalance !== undefined && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Notifikasi Bank:</span>
                    <span className={`font-mono font-semibold ${hasDiscrepancy ? 'text-amber-600' : 'text-slate-700'}`}>
                      {formatIDR(acc.lastKnownBankBalance)}
                    </span>
                  </div>
                )}

                {hasDiscrepancy && (
                  <div className="mt-2 p-1.5 bg-amber-50 rounded text-[10px] text-amber-800 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Ada selisih {formatIDR(Math.abs((acc.lastKnownBankBalance || 0) - bal))}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Charts Section: Cashflow Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tren Arus Kas (Pemasukan vs Pengeluaran)
              </h2>
              <p className="text-xs text-slate-500">
                Aktivitas mutasi perbankan harian yang terverifikasi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs mr-2">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Masuk
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Keluar
                </span>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  onClick={() => setTimeframe('7days')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    timeframe === '7days' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setTimeframe('30days')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    timeframe === '30days' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  14 Hari
                </button>
              </div>
            </div>
          </div>

          {/* SVG Responsive Chart */}
          <div className="h-64 flex items-end gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-100">
            {chartDays.map((day, idx) => {
              const incHeight = maxVal > 0 ? (day.income / maxVal) * 100 : 0;
              const expHeight = maxVal > 0 ? (day.expense / maxVal) * 100 : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip hover */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20 shadow-lg">
                    <p className="font-bold text-slate-200">{day.label}</p>
                    <p className="text-emerald-400">Masuk: {formatIDR(day.income)}</p>
                    <p className="text-rose-400">Keluar: {formatIDR(day.expense)}</p>
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 h-44">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${Math.max(incHeight, 4)}%` }}
                      className="w-1/2 max-w-[18px] bg-emerald-500 rounded-t-sm group-hover:bg-emerald-400 transition"
                    />
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${Math.max(expHeight, 4)}%` }}
                      className="w-1/2 max-w-[18px] bg-rose-500 rounded-t-sm group-hover:bg-rose-400 transition"
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 font-medium mt-2 truncate w-full text-center">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3">
            <span>Grafik diperbarui secara otomatis setiap ada email transaksi baru</span>
            <button
              onClick={() => onNavigate('reports')}
              className="text-blue-800 hover:text-blue-900 font-semibold inline-flex items-center gap-1"
            >
              Lihat Laporan Lengkap <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top Expense Categories (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Pengeluaran per Kategori
              </h2>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Bulan Ini
              </span>
            </div>

            <div className="space-y-4">
              {categoryRanking.length > 0 ? (
                categoryRanking.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.category}</span>
                      <span className="font-mono text-slate-600 font-medium">
                        {formatIDR(cat.amount)} ({cat.percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(cat.percent, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada transaksi pengeluaran bulan ini.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Pengeluaran Bulan Ini</span>
                <span className="text-sm font-bold text-rose-600 font-mono">
                  {formatIDR(totalMonthExpense)}
                </span>
              </div>
              <button
                onClick={() => onNavigate('rules')}
                className="text-xs text-blue-800 font-semibold hover:underline"
              >
                Kelola Aturan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Transaksi Terkini
            </h2>
            <p className="text-xs text-slate-500">
              Mutasi bank dan pencatatan terbaru
            </p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-blue-800 hover:text-blue-900 inline-flex items-center gap-1"
          >
            Lihat Semua Transaksi <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Rekening Bank</th>
                <th className="py-3 px-4">Keterangan / Lawan Transaksi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 6).map((tx) => {
                const acc = accounts.find((a) => a.id === tx.bankAccountId);
                const isCredit = tx.direction === 'credit' || tx.type === 'income';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono">
                      {formatDate(tx.date, true)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">
                        {acc?.bankName || 'Bank'}
                      </span>
                      <span className="text-slate-400 text-[11px] block font-mono">
                        {acc?.maskedNumber || ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <span className="font-medium text-slate-800 block truncate">
                        {tx.description}
                      </span>
                      {tx.referenceNumber && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ref: {tx.referenceNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold">
                      <span className={isCredit ? 'text-emerald-600' : 'text-rose-600'}>
                        {isCredit ? '+' : '-'} {formatIDR(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {tx.status === 'verified' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Terverifikasi</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Perlu Review</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
