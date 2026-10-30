import React, { useState } from 'react';
import {
  Bell,
  RefreshCw,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Menu,
} from 'lucide-react';
import { BankAccount, Transaction, UserProfile } from '../../types';
import { formatIDR } from '../../utils/formatters';

interface HeaderProps {
  profile: UserProfile;
  accounts: BankAccount[];
  transactions: Transaction[];
  onOpenSync: () => void;
  onOpenMobileMenu: () => void;
  isSyncing: boolean;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  accounts,
  transactions,
  onOpenSync,
  onOpenMobileMenu,
  isSyncing,
  onNavigate,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const unverifiedCount = transactions.filter((t) => t.status === 'unverified' || t.status === 'needs_review').length;
  const totalBalance = accounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + (a.lastKnownBankBalance ?? a.startingBalance), 0);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & App identifier */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 via-blue-900 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-blue-900/20 font-extrabold text-sm tracking-wider">
              KC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  KEUANGAN CERDAS
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  AUTO BANK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {profile.businessName || 'Sistem Pencatatan Finansial Otomatis'}
              </p>
            </div>
          </div>
        </div>

        {/* Right actions: Total balance pill, Gmail status, Notifications, Sync Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Balance Preview */}
          <div className="hidden lg:flex flex-col items-end px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-lg">
            <span className="text-[10px] uppercase font-semibold text-slate-600 tracking-wider">
              Total Likuiditas Bank
            </span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {formatIDR(totalBalance)}
            </span>
          </div>

          {/* Gmail Status Badge */}
          <button
            onClick={() => onNavigate('gmail')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              profile.isConnectedGmail
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title="Pengaturan Koneksi Gmail"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{profile.isConnectedGmail ? 'Gmail Terhubung' : 'Hubungkan Gmail'}</span>
            {profile.isConnectedGmail && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          </button>

          {/* Quick Sync Button */}
          <button
            onClick={onOpenSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sinkronkan Email</span>
            <span className="sm:hidden">Sinkron</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unverifiedCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                  {unverifiedCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Pemberitahuan Sistem
                  </h4>
                  <span className="text-[11px] text-slate-600">
                    {unverifiedCount} butuh perhatian
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {unverifiedCount > 0 ? (
                    <div
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate('transactions');
                      }}
                      className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg text-xs cursor-pointer hover:bg-amber-100/70 transition"
                    >
                      <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Transaksi Menunggu Verifikasi</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Terdapat {unverifiedCount} transaksi baru dari email yang siap Anda periksa kategorinya.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-slate-500 text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      Semua transaksi telah terverifikasi dan seimbang.
                    </div>
                  )}

                  <div
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('reconciliation');
                    }}
                    className="p-2.5 bg-blue-50/60 border border-blue-200/60 rounded-lg text-xs cursor-pointer hover:bg-blue-100/60 transition"
                  >
                    <div className="flex items-center gap-1.5 text-blue-900 font-semibold mb-0.5">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span>Rekonsiliasi Bank Tersedia</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Bandingkan saldo catatan dengan mutasi bank Anda.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
