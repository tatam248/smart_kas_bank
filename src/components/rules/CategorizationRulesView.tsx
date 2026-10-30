import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Zap,
  Tag,
  ArrowRight,
  Info,
} from 'lucide-react';
import { CategorizationRule } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

interface CategorizationRulesViewProps {
  rules: CategorizationRule[];
  onAddRule: (keyword: string, category: string) => void;
  onDeleteRule: (id: string) => void;
}

const CATEGORY_LIST = [
  'Penjualan',
  'Pendapatan Usaha',
  'Pembayaran Pelanggan',
  'Transfer Masuk',
  'Bunga Bank',
  'Pendapatan Lainnya',
  'Belanja Operasional',
  'Pembelian Barang',
  'Pembayaran Tagihan',
  'Gaji',
  'Transportasi',
  'Biaya Administrasi Bank',
  'Transfer Keluar',
  'Pengeluaran Lainnya',
];

export const CategorizationRulesView: React.FC<CategorizationRulesViewProps> = ({
  rules,
  onAddRule,
  onDeleteRule,
}) => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState(CATEGORY_LIST[0]);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<CategorizationRule | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    onAddRule(keyword.trim(), category);
    setSuccessNotice(`Aturan otomatis untuk kata kunci "${keyword.trim()}" berhasil disimpan dan diterapkan.`);
    setKeyword('');
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleConfirmDelete = () => {
    if (ruleToDelete) {
      onDeleteRule(ruleToDelete.id);
      setRuleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Aturan Kategorisasi Pintar & Pembelajaran Mesin
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Sistem secara otomatis mengenali deskripsi transaksi dan pihak lawan dari email bank untuk memetakan akun akuntansi yang sesuai.
        </p>
      </div>

      {/* Add New Rule Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Tambah Aturan Kata Kunci Baru
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kata Kunci dalam Deskripsi / Pengirim *
            </label>
            <input
              type="text"
              required
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="misal: PLN, INDOMARET, QRIS, TOKOPEDIA"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Target Kategori Akuntansi *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-blue-600 transition"
            >
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan & Terapkan Aturan</span>
            </button>
          </div>
        </form>

        {successNotice && (
          <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">
              Daftar Aturan Otomatis Aktif
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {rules.length} Aturan Tersimpan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Kata Kunci (Keyword)</th>
                <th className="py-3 px-4">Kategori Akuntansi Terpetakan</th>
                <th className="py-3 px-4 text-center">Frekuensi Kecocokan</th>
                <th className="py-3 px-4">Tanggal Dibuat</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      "{rule.keyword}"
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {rule.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-600">
                    <span className="font-bold text-slate-900">{rule.matchCount}</span> kali diterapkan
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {rule.createdAt}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setRuleToDelete(rule)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition"
                      title="Hapus Aturan"
                      aria-label="Hapus Aturan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Rule Confirmation Modal */}
      <ConfirmModal
        isOpen={ruleToDelete !== null}
        title="Hapus Aturan Kategorisasi?"
        message={
          ruleToDelete
            ? `Yakin ingin menghapus aturan otomatis untuk kata kunci "${ruleToDelete.keyword}"? Transaksi yang sudah tercatat sebelumnya tidak akan berubah.`
            : ''
        }
        confirmLabel="Hapus Aturan"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRuleToDelete(null)}
      />
    </div>
  );
};
