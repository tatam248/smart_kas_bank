import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Mail,
  Info,
  X,
  Sparkles,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react';
import { BankAccount, Transaction, TransactionType } from '../../types';
import { formatDate, formatIDR, generateId } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  onAddTransaction: (tx: Transaction) => void;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteTransactions?: (ids: string[]) => void;
  onClearDemoData?: () => void;
  onRequestSaveRule: (keyword: string, newCategory: string) => void;
  isAddModalOpenInitially?: boolean;
}

const CATEGORY_OPTIONS = {
  income: [
    'Penjualan',
    'Pendapatan Usaha',
    'Pembayaran Pelanggan',
    'Transfer Masuk',
    'Bunga Bank',
    'Pendapatan Lainnya',
  ],
  expense: [
    'Belanja Operasional',
    'Pembelian Barang',
    'Pembayaran Tagihan',
    'Gaji',
    'Transportasi',
    'Biaya Administrasi Bank',
    'Transfer Keluar',
    'Pengeluaran Lainnya',
  ],
  transfer: ['Transfer Keluar', 'Transfer Masuk'],
};

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onDeleteTransactions,
  onClearDemoData,
  onRequestSaveRule,
  isAddModalOpenInitially = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(isAddModalOpenInitially);
  const [detailModalTx, setDetailModalTx] = useState<Transaction | null>(null);

  // In-app Delete Confirmation State (No window.confirm!)
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Multi-selection for bulk actions
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Form State for Manual Add
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    bankAccountId: accounts[0]?.id || '',
    destinationAccountId: accounts[1]?.id || '',
    type: 'income' as TransactionType,
    amount: '',
    category: 'Penjualan',
    description: '',
    partyName: '',
    referenceNumber: '',
  });

  // Filter logic
  const filtered = transactions.filter((t) => {
    // Search
    const matchSearch =
      !searchTerm ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.partyName && t.partyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.referenceNumber && t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.amount.toString().includes(searchTerm);

    // Bank
    const matchBank = selectedBankId === 'all' || t.bankAccountId === selectedBankId;

    // Type
    const matchType = selectedType === 'all' || t.type === selectedType;

    // Category
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;

    // Status
    const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;

    return matchSearch && matchBank && matchType && matchCategory && matchStatus;
  });

  const totalFilteredIn = filtered
    .filter((t) => t.type === 'income' || t.direction === 'credit')
    .reduce((s, t) => s + t.amount, 0);

  const totalFilteredOut = filtered
    .filter((t) => t.type === 'expense' || t.direction === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  // Bulk selection toggles
  const handleToggleSelectAll = () => {
    if (selectedTxIds.size === filtered.length && filtered.length > 0) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(filtered.map((t) => t.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedTxIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTxIds(next);
  };

  const handleConfirmSingleDelete = () => {
    if (txToDelete) {
      onDeleteTransaction(txToDelete.id);
      selectedTxIds.delete(txToDelete.id);
      setSelectedTxIds(new Set(selectedTxIds));
      setTxToDelete(null);
    }
  };

  const handleConfirmBulkDelete = () => {
    if (onDeleteTransactions) {
      onDeleteTransactions(Array.from(selectedTxIds));
    } else {
      selectedTxIds.forEach((id) => {
        onDeleteTransaction(id);
      });
    }
    setSelectedTxIds(new Set());
    setIsBulkDeleteModalOpen(false);
  };

  // Handle category change with rule recommendation
  const handleCategoryChange = (tx: Transaction, newCategory: string) => {
    if (tx.category === newCategory) return;

    const updated = {
      ...tx,
      category: newCategory,
      status: 'verified' as const,
    };
    onUpdateTransaction(updated);

    const candidateKeyword = (tx.partyName || tx.description.split(' ')[0] || '').trim();
    if (candidateKeyword.length >= 3) {
      onRequestSaveRule(candidateKeyword, newCategory);
    }
  };

  // Toggle verification status
  const handleToggleVerification = (tx: Transaction) => {
    const nextStatus = tx.status === 'verified' ? 'unverified' : 'verified';
    onUpdateTransaction({ ...tx, status: nextStatus });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0 || !formData.bankAccountId) return;

    const isCredit = formData.type === 'income';
    const direction = isCredit ? 'credit' : 'debit';
    const now = new Date().toISOString();

    const newTx: Transaction = {
      id: generateId('tx_man'),
      date: formData.date ? new Date(formData.date).toISOString() : now,
      bankAccountId: formData.bankAccountId,
      destinationAccountId: formData.type === 'transfer' ? formData.destinationAccountId : undefined,
      type: formData.type,
      direction,
      amount: amt,
      description: formData.description || `Transaksi ${formData.type}`,
      partyName: formData.partyName,
      referenceNumber: formData.referenceNumber || `REF-${Date.now().toString(36).toUpperCase()}`,
      category: formData.type === 'transfer' ? 'Transfer Keluar' : formData.category,
      status: 'verified',
      createdMethod: 'manual',
      createdAt: now,
      updatedAt: now,
    };

    onAddTransaction(newTx);
    setIsAddModalOpen(false);
    setFormData({
      date: new Date().toISOString().slice(0, 16),
      bankAccountId: accounts[0]?.id || '',
      destinationAccountId: accounts[1]?.id || '',
      type: 'income',
      amount: '',
      category: 'Penjualan',
      description: '',
      partyName: '',
      referenceNumber: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Daftar Catatan Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data mutasi bank yang otomatis diolah dari notifikasi email, berpasangan dengan kategori dan status verifikasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedTxIds.size > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition animate-in fade-in"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus ({selectedTxIds.size}) Terpilih</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi Manual</span>
          </button>
        </div>
      </div>

      {/* Demo / Sample Data Notification Banner */}
      {transactions.some((t) => t.isDemo || t.id.startsWith('tx_seed_')) && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300/40 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 sm:mt-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-950 block">
                Terdeteksi Data Sampel / Demo UMKM ({transactions.filter((t) => t.isDemo || t.id.startsWith('tx_seed_')).length} Transaksi)
              </span>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                Data simulasi ini dapat dibersihkan permanen agar jurnal & laporan keuangan hanya menampilkan mutasi riil hasil sinkronisasi Gmail Anda.
              </p>
            </div>
          </div>
          {onClearDemoData && (
            <button
              type="button"
              onClick={onClearDemoData}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Data Demo</span>
            </button>
          )}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari deskripsi, pengirim, referensi, nominal..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-blue-600 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Bank */}
          <div>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-blue-600 transition"
            >
              <option value="all">Semua Rekening Bank</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} ({acc.maskedNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Type */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-blue-600 transition"
            >
              <option value="all">Semua Jenis</option>
              <option value="income">Uang Masuk (Kredit)</option>
              <option value="expense">Uang Keluar (Debit)</option>
              <option value="transfer">Transfer Antar Rekening</option>
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-blue-600 transition"
            >
              <option value="all">Semua Status</option>
              <option value="verified">Terverifikasi</option>
              <option value="unverified">Perlu Review</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Metrics */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Menampilkan <strong className="text-slate-800">{filtered.length}</strong> dari {transactions.length} transaksi
            {selectedTxIds.size > 0 && (
              <span className="ml-2 font-semibold text-rose-600">
                ({selectedTxIds.size} dipilih)
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-mono">
              Total Masuk: <strong>+{formatIDR(totalFilteredIn)}</strong>
            </span>
            <span className="text-rose-700 font-mono">
              Total Keluar: <strong>-{formatIDR(totalFilteredOut)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedTxIds.size === filtered.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-900"
                    title="Pilih Semua"
                  />
                </th>
                <th className="py-3 px-4">Tanggal & Ref</th>
                <th className="py-3 px-4">Rekening</th>
                <th className="py-3 px-4">Deskripsi & Pihak Terkait</th>
                <th className="py-3 px-4">Kategori Akuntansi</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.bankAccountId);
                  const isCredit = tx.direction === 'credit' || tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  const isSelected = selectedTxIds.has(tx.id);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/80 transition group ${
                        isSelected ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(tx.id)}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-900"
                        />
                      </td>

                      {/* Date & Ref */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-800 font-medium block">
                          {formatDate(tx.date, true)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {tx.createdMethod === 'gmail_sync' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold" title="Dari Gmail">
                              <Mail className="w-2.5 h-2.5" /> Gmail
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {tx.referenceNumber || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Account */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">
                          {acc?.bankName || 'Bank'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {acc?.maskedNumber || ''}
                        </span>
                      </td>

                      {/* Description & Party */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {tx.description}
                        </div>
                        {tx.partyName && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="text-slate-400">{isCredit ? 'Dari:' : 'Ke:'}</span>
                            <span className="font-semibold text-slate-700">{tx.partyName}</span>
                          </div>
                        )}
                        {tx.balanceAfter && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Saldo sesudah: {formatIDR(tx.balanceAfter)}
                          </div>
                        )}
                      </td>

                      {/* Category selector */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={tx.category}
                          onChange={(e) => handleCategoryChange(tx, e.target.value)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-blue-600 transition"
                        >
                          <option value="Belum Dikategorikan">⚠️ Belum Dikategorikan</option>
                          <optgroup label="Pemasukan">
                            {CATEGORY_OPTIONS.income.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Pengeluaran">
                            {CATEGORY_OPTIONS.expense.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-extrabold text-sm">
                        <div
                          className={`flex items-center justify-end gap-1 ${
                            isTransfer
                              ? 'text-blue-800'
                              : isCredit
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {isTransfer ? (
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          ) : isCredit ? (
                            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span>{formatIDR(tx.amount)}</span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleVerification(tx)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${
                            tx.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Klik untuk mengubah status verifikasi"
                        >
                          {tx.status === 'verified' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              <span>Verified</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Review</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailModalTx(tx)}
                            className="p-1.5 text-slate-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Detail Transaksi & Raw Email"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTxToDelete(tx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition"
                            title="Hapus Transaksi Ini"
                            aria-label="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ditemukan transaksi yang cocok dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Single Transaction Delete */}
      <ConfirmModal
        isOpen={txToDelete !== null}
        title="Hapus Transaksi?"
        message={
          txToDelete
            ? `Yakin ingin menghapus transaksi "${txToDelete.description}" sebesar ${formatIDR(
                txToDelete.amount
              )}? Transaksi dan jurnal akuntansi terkait akan dihapus secara permanen.`
            : ''
        }
        confirmLabel="Hapus Transaksi"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setTxToDelete(null)}
      />

      {/* Confirmation Modal for Bulk Delete */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title={`Hapus ${selectedTxIds.size} Transaksi Terpilih?`}
        message={`Tindakan ini akan menghapus ${selectedTxIds.size} transaksi yang Anda centang beserta seluruh jurnal akuntansi debit-kredit terkait. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={`Hapus Semua (${selectedTxIds.size})`}
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />

      {/* Modal Detail & Raw Email */}
      {detailModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-800" />
                <span>Detail Transaksi & Sumber Data</span>
              </h3>
              <button
                onClick={() => setDetailModalTx(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">ID Transaksi:</span>
                  <span className="font-mono font-bold text-slate-800">{detailModalTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Nomor Referensi Bank:</span>
                  <span className="font-mono font-bold text-slate-800">{detailModalTx.referenceNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Metode Input:</span>
                  <span className="capitalize font-medium text-slate-700">{detailModalTx.createdMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Waktu Catat:</span>
                  <span className="font-mono text-slate-700">{formatDate(detailModalTx.createdAt, true)}</span>
                </div>
              </div>

              {detailModalTx.emailSender && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Informasi Notifikasi Email</h4>
                  <div className="p-3 bg-blue-50/60 rounded-xl space-y-1.5 border border-blue-100 text-[11px]">
                    <div>
                      <strong className="text-slate-600">Pengirim:</strong> {detailModalTx.emailSender}
                    </div>
                    {detailModalTx.emailSubject && (
                      <div>
                        <strong className="text-slate-600">Subjek:</strong> {detailModalTx.emailSubject}
                      </div>
                    )}
                    {detailModalTx.rawEmailSnippet && (
                      <div className="mt-2 pt-2 border-t border-blue-200/60">
                        <strong className="text-slate-600 block mb-1">Kutipan Email:</strong>
                        <p className="font-mono text-slate-700 text-[10px] leading-relaxed bg-white/70 p-2 rounded">
                          {detailModalTx.rawEmailSnippet}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setDetailModalTx(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Manual Transaction */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Catat Transaksi Manual
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-5 space-y-4 text-xs">
              {/* Type selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income', category: 'Penjualan' })}
                    className={`py-2 px-3 rounded-lg font-semibold text-xs border transition ${
                      formData.type === 'income'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Uang Masuk (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense', category: 'Belanja Operasional' })}
                    className={`py-2 px-3 rounded-lg font-semibold text-xs border transition ${
                      formData.type === 'expense'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Uang Keluar (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'transfer' })}
                    className={`py-2 px-3 rounded-lg font-semibold text-xs border transition ${
                      formData.type === 'transfer'
                        ? 'bg-blue-50 border-blue-500 text-blue-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Transfer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nominal Transaksi (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="misal: 500000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal & Waktu
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {formData.type === 'transfer' ? 'Rekening Sumber (Keluar)' : 'Rekening Bank Terkait *'}
                </label>
                <select
                  value={formData.bankAccountId}
                  onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.maskedNumber}
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === 'transfer' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rekening Tujuan (Masuk) *
                  </label>
                  <select
                    value={formData.destinationAccountId}
                    onChange={(e) => setFormData({ ...formData, destinationAccountId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.maskedNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.type !== 'transfer' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Transaksi
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                  >
                    {(formData.type === 'income' ? CATEGORY_OPTIONS.income : CATEGORY_OPTIONS.expense).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan / Berita Transaksi *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="misal: Pembayaran stok bahan minggu ke-4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pihak Lawan Transaksi
                  </label>
                  <input
                    type="text"
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                    placeholder="misal: CV Maju Bersama"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Referensi
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    placeholder="misal: TRX-20261029-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-blue-600 transition"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
