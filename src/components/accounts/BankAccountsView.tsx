import React, { useState } from 'react';
import {
  Plus,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Building2,
  Calendar,
  X,
  Wallet,
} from 'lucide-react';
import { BankAccount, AccountType, Transaction } from '../../types';
import { formatDate, formatIDR, maskAccountNumber, generateId } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';

interface BankAccountsViewProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  onSaveAccount: (account: BankAccount) => void;
  onDeleteAccount: (id: string) => void;
}

const BANK_COLOR_PALETTES = [
  { name: 'BCA Blue', color: '#0066AE' },
  { name: 'Mandiri Navy', color: '#0A3B82' },
  { name: 'BRI Blue', color: '#00529C' },
  { name: 'BNI Teal', color: '#006B7F' },
  { name: 'Jago Purple', color: '#884DFF' },
  { name: 'Jenius Cyan', color: '#00A3E0' },
  { name: 'Emerald Kas', color: '#10B981' },
  { name: 'Rose Red', color: '#E11D48' },
];

export const BankAccountsView: React.FC<BankAccountsViewProps> = ({
  accounts,
  transactions,
  onSaveAccount,
  onDeleteAccount,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);

  const handleConfirmDelete = () => {
    if (accountToDelete) {
      onDeleteAccount(accountToDelete.id);
      setAccountToDelete(null);
    }
  };

  // Form State
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('tabungan');
  const [startingBalance, setStartingBalance] = useState<number>(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isActive, setIsActive] = useState(true);
  const [color, setColor] = useState('#0066AE');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingAccount(null);
    setBankName('Bank BCA');
    setAccountHolder('');
    setAccountNumber('');
    setAccountType('tabungan');
    setStartingBalance(0);
    setStartDate(new Date().toISOString().split('T')[0]);
    setIsActive(true);
    setColor('#0066AE');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: BankAccount) => {
    setEditingAccount(acc);
    setBankName(acc.bankName);
    setAccountHolder(acc.accountHolder);
    setAccountNumber(acc.accountNumber);
    setAccountType(acc.accountType);
    setStartingBalance(acc.startingBalance);
    setStartDate(acc.startDate);
    setIsActive(acc.isActive);
    setColor(acc.color);
    setNotes(acc.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber) return;

    const acc: BankAccount = {
      id: editingAccount ? editingAccount.id : generateId('acc'),
      bankName,
      accountHolder: accountHolder || 'Pemilik Rekening',
      accountNumber,
      maskedNumber: maskAccountNumber(accountNumber),
      accountType,
      startingBalance: Number(startingBalance) || 0,
      startDate,
      isActive,
      color,
      notes,
      lastKnownBankBalance: editingAccount?.lastKnownBankBalance,
      lastSyncAt: editingAccount?.lastSyncAt,
    };

    onSaveAccount(acc);
    setIsModalOpen(false);
  };

  // Calculate live balance for an account
  const calculateAccountBalance = (accountId: string, startingBal: number) => {
    let bal = startingBal;
    for (const t of transactions) {
      if (t.status === 'unverified') continue;
      if (t.bankAccountId === accountId) {
        if (t.direction === 'credit' || t.type === 'income') bal += t.amount;
        else if (t.direction === 'debit' || t.type === 'expense' || t.type === 'transfer') bal -= t.amount;
      }
      if (t.type === 'transfer' && t.destinationAccountId === accountId) {
        bal += t.amount;
      }
    }
    return bal;
  };

  const totalCalculatedBalance = accounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + calculateAccountBalance(a.id, a.startingBalance), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Multi Rekening Bank
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola seluruh rekening bank bisnis dan pribadi Anda dalam satu dashboard terintegrasi.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Rekening Baru</span>
        </button>
      </div>

      {/* Total Balance Summary Box */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Seluruh Saldo Rekening Aktif
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mt-1">
            {formatIDR(totalCalculatedBalance)}
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Saldo dihitung otomatis dari saldo awal ditambah akumulasi seluruh mutasi terverifikasi.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-xs border border-white/10 text-xs">
          <Wallet className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold block text-white">
              {accounts.filter((a) => a.isActive).length} Rekening Aktif
            </span>
            <span className="text-slate-300 text-[11px]">
              {accounts.filter((a) => !a.isActive).length} Nonaktif
            </span>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const liveBalance = calculateAccountBalance(acc.id, acc.startingBalance);
          const hasDiscrepancy =
            acc.lastKnownBankBalance !== undefined &&
            Math.abs(acc.lastKnownBankBalance - liveBalance) > 100;

          return (
            <div
              key={acc.id}
              className={`bg-white rounded-2xl border ${
                acc.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'
              } shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden relative`}
            >
              {/* Colored top bar */}
              <div
                className="h-2 w-full"
                style={{ backgroundColor: acc.color || '#0066AE' }}
              />

              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                      style={{ backgroundColor: acc.color || '#0066AE' }}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {acc.bankName}
                      </h3>
                      <p className="text-xs text-slate-500">{acc.accountHolder}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      acc.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {acc.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                {/* Account Details */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Nomor Rekening:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {acc.maskedNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Jenis Rekening:</span>
                    <span className="capitalize font-medium text-slate-700">
                      {acc.accountType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Saldo Awal:</span>
                    <span className="font-mono text-slate-700">
                      {formatIDR(acc.startingBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Mulai Catat:</span>
                    <span className="font-mono text-slate-700">
                      {formatDate(acc.startDate)}
                    </span>
                  </div>
                </div>

                {/* Calculated Live Balance */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Saldo Catatan Terhitung:
                  </span>
                  <div className="text-xl font-extrabold font-mono text-slate-900">
                    {formatIDR(liveBalance)}
                  </div>
                </div>

                {/* Comparison with last bank reported balance */}
                {acc.lastKnownBankBalance !== undefined && (
                  <div className="text-xs pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Saldo Notifikasi Bank:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatIDR(acc.lastKnownBankBalance)}
                      </span>
                    </div>

                    {hasDiscrepancy ? (
                      <div className="p-2 bg-amber-50 rounded-lg text-[11px] text-amber-800 font-medium flex items-center gap-1.5 border border-amber-200/60">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Selisih {formatIDR(Math.abs(acc.lastKnownBankBalance - liveBalance))}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Sesuai dengan mutasi bank</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(acc)}
                  className="p-1.5 text-slate-500 hover:text-blue-800 hover:bg-slate-200/60 rounded-lg transition"
                  title="Edit Rekening"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAccountToDelete(acc)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition"
                  title="Hapus Rekening"
                  aria-label="Hapus Rekening"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingAccount ? 'Edit Rekening Bank' : 'Tambah Rekening Bank Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Bank / Kas *
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="misal: Bank BCA, Bank Mandiri, Kasir Toko"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pemilik Rekening *
                </label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="misal: CV Berkah Mandiri / Rustaman"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Rekening *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="misal: 0148927103"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-blue-600 transition"
                  />
                  <span className="text-[10px] text-slate-600 mt-0.5 block">
                    Akan ditampilkan: {maskAccountNumber(accountNumber)}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Rekening
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                  >
                    <option value="tabungan">Tabungan</option>
                    <option value="giro">Giro</option>
                    <option value="kas_tunai">Kas Tunai</option>
                    <option value="e_wallet">Dompet Digital / E-Wallet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Mulai Catat
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Warna Identitas Bank
                </label>
                <div className="flex flex-wrap gap-2">
                  {BANK_COLOR_PALETTES.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setColor(p.color)}
                      style={{ backgroundColor: p.color }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === p.color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="misal: Rekening operasional utama"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-slate-700 font-medium">
                  Rekening Aktif dalam Perhitungan Saldo
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  {editingAccount ? 'Simpan Perubahan' : 'Tambah Rekening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      <ConfirmModal
        isOpen={accountToDelete !== null}
        title="Hapus Rekening Bank?"
        message={
          accountToDelete
            ? `Yakin ingin menghapus rekening "${accountToDelete.bankName} (${accountToDelete.maskedNumber})"? Catatan transaksi yang sudah ada tetap tersimpan.`
            : ''
        }
        confirmLabel="Hapus Rekening"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setAccountToDelete(null)}
      />
    </div>
  );
};
