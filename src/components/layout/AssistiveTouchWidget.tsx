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
  RefreshCw,
  Plus,
} from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface AssistiveTouchWidgetProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  unverifiedTxCount: number;
  onQuickSync?: () => void;
  onQuickAddTx?: () => void;
  isSyncing?: boolean;
}

export const AssistiveTouchWidget: React.FC<AssistiveTouchWidgetProps> = ({
  currentTab,
  onSelectTab,
  unverifiedTxCount,
  onQuickSync,
  onQuickAddTx,
  isSyncing = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/30',
    },
    {
      id: 'gmail' as NavigationTab,
      label: 'Gmail Sync',
      icon: Mail,
      gradient: 'from-rose-500 to-red-600',
      shadow: 'shadow-rose-500/30',
      badge: 'Auto',
    },
    {
      id: 'accounts' as NavigationTab,
      label: 'Rekening',
      icon: CreditCard,
      gradient: 'from-teal-400 to-emerald-600',
      shadow: 'shadow-teal-500/30',
    },
    {
      id: 'transactions' as NavigationTab,
      label: 'Transaksi',
      icon: Receipt,
      gradient: 'from-emerald-400 to-green-600',
      shadow: 'shadow-emerald-500/30',
      badge: unverifiedTxCount > 0 ? `${unverifiedTxCount}` : null,
    },
    {
      id: 'journal' as NavigationTab,
      label: 'Jurnal',
      icon: BookOpen,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-purple-500/30',
    },
    {
      id: 'reports' as NavigationTab,
      label: 'Laporan',
      icon: BarChart3,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-orange-500/30',
    },
    {
      id: 'reconciliation' as NavigationTab,
      label: 'Rekonsiliasi',
      icon: Scale,
      gradient: 'from-sky-400 to-blue-600',
      shadow: 'shadow-sky-500/30',
    },
    {
      id: 'rules' as NavigationTab,
      label: 'Aturan Pintar',
      icon: Sparkles,
      gradient: 'from-pink-500 to-rose-500',
      shadow: 'shadow-pink-500/30',
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Pengaturan',
      icon: Settings,
      gradient: 'from-slate-400 to-slate-600',
      shadow: 'shadow-slate-500/30',
    },
  ];

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating iPhone AssistiveTouch Button */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="AssistiveTouch Menu"
          title="Buka Menu AssistiveTouch"
          className="group relative w-14 h-14 rounded-full bg-slate-900/60 hover:bg-slate-900/80 active:scale-90 backdrop-blur-xl border border-white/25 shadow-2xl transition-all duration-300 flex items-center justify-center p-1.5 focus:outline-none"
        >
          {/* Inner concentric soft glowing ring (iPhone style) */}
          <div className="w-11 h-11 rounded-full bg-white/20 group-hover:bg-white/30 border border-white/40 flex items-center justify-center transition-all duration-300 shadow-inner">
            <div className="w-6 h-6 rounded-full bg-white/90 group-hover:bg-white shadow-md transition-all duration-200 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900/40" />
            </div>
          </div>

          {/* Badge for unverified transactions */}
          {unverifiedTxCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-md animate-pulse">
              {unverifiedTxCount}
            </span>
          )}
        </button>
      </div>

      {/* AssistiveTouch Modal Menu Overlay (Authentic iOS Style) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-[340px] rounded-[36px] bg-slate-900/90 text-white border border-white/20 shadow-2xl p-6 backdrop-blur-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  AssistiveTouch Keuangan
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3x3 AssistiveTouch Icon Grid */}
            <div className="grid grid-cols-3 gap-3.5 py-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 group active:scale-95 ${
                      isActive
                        ? 'bg-white/15 ring-2 ring-white/40 shadow-lg'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`relative w-12 h-12 rounded-[18px] bg-gradient-to-br ${item.gradient} ${item.shadow} shadow-md flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-105 group-active:scale-95`}
                    >
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                      {item.badge && (
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-bold border-2 border-slate-900 shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium mt-1.5 text-center truncate max-w-full tracking-tight ${
                        isActive ? 'text-white font-bold' : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer Bar */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              {onQuickSync && (
                <button
                  onClick={() => {
                    onQuickSync();
                    setIsOpen(false);
                  }}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Bank</span>
                </button>
              )}

              {onQuickAddTx && (
                <button
                  onClick={() => {
                    onQuickAddTx();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Cepat</span>
                </button>
              )}

              <span className="text-[10px] text-slate-400 font-mono ml-auto">
                iOS Touch
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
