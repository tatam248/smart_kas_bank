import React, { useState } from 'react';
import {
  LayoutDashboard,
  Mail,
  CreditCard,
  Receipt,
  BookOpen,
  BarChart3,
  Scale,
  Sparkles,
  Settings,
  X,
  Shield,
  LayoutGrid,
  List,
  ChevronRight,
  Sparkle,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'gmail'
  | 'accounts'
  | 'transactions'
  | 'journal'
  | 'reports'
  | 'reconciliation'
  | 'rules'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  unverifiedTxCount: number;
}

interface NavItemConfig {
  id: NavigationTab;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  shadow: string;
  badge?: string | null;
  badgeColor?: string;
  category: 'utama' | 'akuntansi' | 'sistem';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  unverifiedTxCount,
}) => {
  // Toggle between AssistiveTouch Grid Mode and List Mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Dashboard',
      description: 'Ringkasan & Arus Kas',
      icon: LayoutDashboard,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
      category: 'utama',
    },
    {
      id: 'gmail',
      label: 'Koneksi Gmail',
      shortLabel: 'Gmail Bank',
      description: 'Auto Parser Notifikasi',
      icon: Mail,
      gradient: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/25',
      badge: 'Auto',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      category: 'utama',
    },
    {
      id: 'accounts',
      label: 'Rekening Bank',
      shortLabel: 'Rekening',
      description: 'Multi Akun & Saldo',
      icon: CreditCard,
      gradient: 'from-teal-400 to-emerald-600',
      shadow: 'shadow-teal-500/25',
      category: 'utama',
    },
    {
      id: 'transactions',
      label: 'Daftar Transaksi',
      shortLabel: 'Transaksi',
      description: 'Mutasi & Verifikasi',
      icon: Receipt,
      gradient: 'from-emerald-400 to-green-600',
      shadow: 'shadow-emerald-500/25',
      badge: unverifiedTxCount > 0 ? `${unverifiedTxCount}` : null,
      badgeColor: 'bg-amber-400 text-amber-950 font-bold',
      category: 'utama',
    },
    {
      id: 'journal',
      label: 'Jurnal & Akuntansi',
      shortLabel: 'Jurnal',
      description: 'Buku Besar & Neraca',
      icon: BookOpen,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-purple-500/25',
      category: 'akuntansi',
    },
    {
      id: 'reports',
      label: 'Laporan Keuangan',
      shortLabel: 'Laporan',
      description: 'Harian, Mingguan, P&L',
      icon: BarChart3,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-orange-500/25',
      category: 'akuntansi',
    },
    {
      id: 'reconciliation',
      label: 'Rekonsiliasi Bank',
      shortLabel: 'Rekonsiliasi',
      description: 'Pencocokan Saldo',
      icon: Scale,
      gradient: 'from-sky-400 to-blue-600',
      shadow: 'shadow-sky-500/25',
      category: 'akuntansi',
    },
    {
      id: 'rules',
      label: 'Aturan Pintar',
      shortLabel: 'Aturan Cerdas',
      description: 'Otomatisasi Kategori',
      icon: Sparkles,
      gradient: 'from-pink-500 to-rose-500',
      shadow: 'shadow-pink-500/25',
      category: 'sistem',
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      shortLabel: 'Pengaturan',
      description: 'Profil & Cadangan Data',
      icon: Settings,
      gradient: 'from-slate-400 to-slate-600',
      shadow: 'shadow-slate-500/25',
      category: 'sistem',
    },
  ];

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900/95 text-slate-200 backdrop-blur-2xl border-r border-slate-800/80">
      {/* iPhone AssistiveTouch Header Card */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          {/* Brand with AssistiveTouch Badge */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 p-0.5">
              <div className="w-full h-full rounded-[14px] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center font-extrabold text-xs tracking-wider">
                KC
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-sm tracking-tight">
                  KEUANGAN
                </span>
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 text-sm">
                  CERDAS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                AssistiveTouch Menu
              </p>
            </div>
          </div>

          {/* Close for mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Switcher (Grid AssistiveTouch vs List Touch) */}
        <div className="flex items-center justify-between p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider">
            Tampilan Menu
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan Grid AssistiveTouch"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilan List AssistiveTouch"
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Area */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {/* GRID VIEW: The True iPhone AssistiveTouch Squircle Tiles */}
        {viewMode === 'grid' ? (
          <div className="space-y-4">
            <div>
              <div className="px-1.5 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Tombol Menu Cepat</span>
                <span className="text-[9px] font-normal text-slate-500">Sentuh untuk buka</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-[22px] transition-all duration-200 group active:scale-[0.94] text-center select-none ${
                        isActive
                          ? 'bg-gradient-to-b from-white/18 to-white/8 border border-white/25 ring-2 ring-white/25 shadow-xl shadow-black/20'
                          : 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/8 hover:border-white/15'
                      }`}
                    >
                      {/* Active Indicator Top Glow */}
                      {isActive && (
                        <div className="absolute top-2 w-4 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
                      )}

                      {/* iPhone AssistiveTouch Squircle Icon */}
                      <div
                        className={`relative w-12 h-12 rounded-[18px] bg-gradient-to-br ${item.gradient} ${item.shadow} shadow-md flex items-center justify-center text-white transition-all duration-200 group-hover:scale-105 group-active:scale-95 mt-1`}
                      >
                        <Icon className="w-6 h-6 stroke-[2.2]" />

                        {/* Unverified / Status Badge */}
                        {item.badge && (
                          <span
                            className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold border-2 border-slate-900 shadow-md ${
                              item.badgeColor || 'bg-rose-500 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Clean Text Label */}
                      <span
                        className={`text-xs font-semibold mt-2 truncate w-full tracking-tight ${
                          isActive
                            ? 'text-white font-bold'
                            : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {item.shortLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate w-full scale-90 -mt-0.5">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* LIST VIEW: Soft iPhone AssistiveTouch Squircle List */
          <div className="space-y-2">
            <div className="px-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Daftar Menu AssistiveTouch
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-[20px] transition-all duration-200 group active:scale-[0.97] text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-white/18 to-white/8 border border-white/25 ring-1 ring-white/25 shadow-lg shadow-black/20'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/6 hover:border-white/12'
                  }`}
                >
                  {/* AssistiveTouch Squircle Pod */}
                  <div
                    className={`relative w-10 h-10 rounded-[14px] bg-gradient-to-br ${item.gradient} ${item.shadow} shadow-md flex items-center justify-center text-white shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-95`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold truncate ${
                          isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border border-white/10 ${
                            item.badgeColor || 'bg-rose-500/80 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.description}
                    </p>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-white translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* AssistiveTouch Soft iOS Footer Card */}
      <div className="p-3 m-3 bg-gradient-to-b from-white/8 to-white/4 border border-white/10 rounded-[24px] backdrop-blur-xl space-y-1.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>Aman & Terenkripsi</span>
          </div>
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            OAuth 2.0
          </span>
        </div>
        <p className="text-[10px] text-slate-300 leading-relaxed">
          Notifikasi bank dibaca otomatis secara aman via Gmail API tanpa meminta PIN atau password bank.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block w-72 h-screen sticky top-0 shrink-0 z-20">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-[88vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
