/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AssistiveTouchWidget } from './components/layout/AssistiveTouchWidget';
import { DashboardView } from './components/dashboard/DashboardView';
import { GmailConnectionView } from './components/gmail/GmailConnectionView';
import { BankAccountsView } from './components/accounts/BankAccountsView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { JournalView } from './components/journal/JournalView';
import { FinancialReportsView } from './components/reports/FinancialReportsView';
import { ReconciliationView } from './components/reconciliation/ReconciliationView';
import { CategorizationRulesView } from './components/rules/CategorizationRulesView';
import { SettingsView } from './components/settings/SettingsView';
import { RulePromptModal } from './components/common/RulePromptModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { UnauthorizedDomainModal } from './components/common/UnauthorizedDomainModal';
import { storage } from './services/storage';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  logoutGoogle,
} from './services/firebaseAuth';
import { syncBankEmailsFromGmail } from './services/gmailService';
import { BankAccount, Transaction, ReconciliationRecord, UserProfile } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

  // App Reactive State from Storage
  const [accounts, setAccounts] = useState<BankAccount[]>(() => storage.getAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getTransactions());
  const [journals, setJournals] = useState(() => storage.getJournals());
  const [rules, setRules] = useState(() => storage.getRules());
  const [logs, setLogs] = useState(() => storage.getLogs());
  const [reconciliations, setReconciliations] = useState(() => storage.getReconciliations());
  const [profile, setProfile] = useState(() => storage.getProfile());

  // Rule Learner Prompt Modal State
  const [rulePrompt, setRulePrompt] = useState<{
    isOpen: boolean;
    keyword: string;
    category: string;
  }>({
    isOpen: false,
    keyword: '',
    category: '',
  });

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setAccounts(storage.getAccounts());
      setTransactions(storage.getTransactions());
      setJournals(storage.getJournals());
      setRules(storage.getRules());
      setLogs(storage.getLogs());
      setReconciliations(storage.getReconciliations());
      setProfile(storage.getProfile());
    });
    return () => unsubscribe();
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    initAuth(
      (user, token) => {
        if (user) {
          storage.updateProfile({
            name: user.displayName || user.email?.split('@')[0] || profile.name,
            email: user.email || profile.email,
            photoURL: user.photoURL || undefined,
            isConnectedGmail: true,
          });
        }
      },
      () => {
        // Not signed in or signed out
      }
    );
  }, []);

  // Show quick toast notification
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setSyncToast({ message, type });
    setTimeout(() => setSyncToast(null), 5000);
  };

  // Connect Google OAuth
  const handleConnectGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        storage.updateProfile({
          name: res.user.displayName || profile.name,
          email: res.user.email || profile.email,
          isConnectedGmail: true,
          lastGmailSync: new Date().toISOString(),
        });
        showToast('Koneksi Google Workspace & Gmail API berhasil dihubungkan!', 'success');
      } else {
        showToast('Proses masuk Google dibatalkan.', 'info');
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(err?.domain || (typeof window !== 'undefined' ? window.location.hostname : ''));
      } else {
        showToast(`Gagal menghubungkan Google: ${err.message || 'Izin dibatalkan'}`, 'error');
      }
    }
  };

  // Disconnect Gmail
  const handleDisconnectGmail = async () => {
    setIsDisconnectModalOpen(true);
  };

  const handleConfirmDisconnectGmail = async () => {
    await logoutGoogle();
    storage.updateProfile({ isConnectedGmail: false });
    showToast('Integrasi Gmail diputuskan dan token telah dihapus dari memori.', 'info');
    setIsDisconnectModalOpen(false);
  };

  // Run Gmail Bank Email Sync
  const handleSyncGmail = async () => {
    setIsSyncing(true);
    try {
      let token = await getAccessToken();

      // If token not present, request user sign in
      if (!token) {
        const signinRes = await googleSignIn();
        if (signinRes) {
          token = signinRes.accessToken;
          storage.updateProfile({
            name: signinRes.user.displayName || profile.name,
            email: signinRes.user.email || profile.email,
            isConnectedGmail: true,
          });
        } else {
          // User closed the popup or cancelled
          setIsSyncing(false);
          showToast('Sinkronisasi dibatalkan (jendela login ditutup). Gunakan menu "Koneksi Gmail & Parser" untuk menguji template.', 'info');
          return;
        }
      }

      if (!token) {
        showToast('Akses token Gmail belum tersedia. Silakan hubungkan akun Google.', 'info');
        setIsSyncing(false);
        return;
      }

      const result = await syncBankEmailsFromGmail(
        token,
        profile.email,
        transactions,
        accounts,
        25
      );

      if (result.newTransactions.length > 0) {
        storage.addTransactions(result.newTransactions);
      }
      storage.addLog(result.log);
      storage.updateProfile({ lastGmailSync: new Date().toISOString() });

      showToast(result.log.message, result.newTransactions.length > 0 ? 'success' : 'info');
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) {
        showToast('Proses sinkronisasi dibatalkan oleh pengguna.', 'info');
      } else if (error?.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(error?.domain || (typeof window !== 'undefined' ? window.location.hostname : ''));
      } else {
        console.error('Sync failed:', error);
        showToast(`Sinkronisasi: ${error.message || 'Periksa koneksi internet atau izin email'}`, 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Request to Save Rule from Transaction Edit
  const handleRequestSaveRule = (keyword: string, newCategory: string) => {
    setRulePrompt({
      isOpen: true,
      keyword,
      category: newCategory,
    });
  };

  const handleConfirmRulePrompt = () => {
    if (rulePrompt.keyword && rulePrompt.category) {
      storage.addRule(rulePrompt.keyword, rulePrompt.category);
      showToast(`Aturan otomatis untuk "${rulePrompt.keyword}" berhasil disimpan!`, 'success');
    }
    setRulePrompt({ isOpen: false, keyword: '', category: '' });
  };

  // Clear demo / sample dummy data permanently
  const handleClearDemoData = () => {
    storage.clearDemoData();
    showToast('Seluruh data transaksi demo & rekening sampel berhasil dibersihkan secara permanen!', 'success');
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const jsonStr = storage.exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keuangan-cerdas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Database berhasil diekspor sebagai file JSON.', 'success');
  };

  // Unverified transaction counter
  const unverifiedCount = transactions.filter(
    (t) => t.status === 'unverified' || t.status === 'needs_review'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        unverifiedTxCount={unverifiedCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header Bar */}
        <Header
          profile={profile}
          accounts={accounts}
          transactions={transactions}
          onOpenSync={handleSyncGmail}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          isSyncing={isSyncing}
          onNavigate={(view) => setCurrentTab(view as NavigationTab)}
        />

        {/* Global Toast Notification */}
        {syncToast && (
          <div className="fixed top-16 right-4 z-50 max-w-md animate-in slide-in-from-top duration-200">
            <div
              className={`p-4 rounded-xl shadow-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                syncToast.type === 'success'
                  ? 'bg-emerald-900 text-white border-emerald-700'
                  : syncToast.type === 'error'
                  ? 'bg-rose-900 text-white border-rose-700'
                  : 'bg-slate-900 text-white border-slate-700'
              }`}
            >
              <span>{syncToast.message}</span>
              <button
                onClick={() => setSyncToast(null)}
                className="text-white/70 hover:text-white font-bold text-sm"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              accounts={accounts}
              transactions={transactions}
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenSync={handleSyncGmail}
              onOpenAddAccount={() => setCurrentTab('accounts')}
              onOpenAddTx={() => setCurrentTab('transactions')}
              isSyncing={isSyncing}
            />
          )}

          {currentTab === 'gmail' && (
            <GmailConnectionView
              profile={profile}
              accounts={accounts}
              syncLogs={logs}
              isSyncing={isSyncing}
              onSyncGmail={handleSyncGmail}
              onConnectGoogle={handleConnectGoogle}
              onDisconnectGmail={handleDisconnectGmail}
              onAddTransactionFromParser={(tx) => {
                storage.addTransactions([tx]);
                showToast('Transaksi berhasil ditambahkan dari hasil ekstraksi!', 'success');
              }}
            />
          )}

          {currentTab === 'accounts' && (
            <BankAccountsView
              accounts={accounts}
              transactions={transactions}
              onSaveAccount={(acc) => {
                storage.saveAccount(acc);
                showToast(`Rekening ${acc.bankName} berhasil disimpan.`, 'success');
              }}
              onDeleteAccount={(id) => {
                storage.deleteAccount(id);
                showToast('Rekening berhasil dihapus.', 'info');
              }}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              accounts={accounts}
              onAddTransaction={(tx) => {
                storage.addTransactions([tx]);
                showToast('Transaksi baru berhasil dicatat dan dijurnal.', 'success');
              }}
              onUpdateTransaction={(tx) => {
                storage.updateTransaction(tx);
                showToast('Transaksi berhasil diperbarui.', 'success');
              }}
              onDeleteTransaction={(id) => {
                storage.deleteTransaction(id);
                showToast('Transaksi berhasil dihapus.', 'info');
              }}
              onDeleteTransactions={(ids) => {
                storage.deleteTransactions(ids);
                showToast(`${ids.length} transaksi berhasil dihapus.`, 'info');
              }}
              onClearDemoData={handleClearDemoData}
              onRequestSaveRule={handleRequestSaveRule}
            />
          )}

          {currentTab === 'journal' && (
            <JournalView
              journals={journals}
              accounts={accounts}
              transactions={transactions}
            />
          )}

          {currentTab === 'reports' && (
            <FinancialReportsView
              transactions={transactions}
              accounts={accounts}
            />
          )}

          {currentTab === 'reconciliation' && (
            <ReconciliationView
              accounts={accounts}
              transactions={transactions}
              reconciliations={reconciliations}
              onSaveReconciliation={(rec) => {
                storage.saveReconciliation(rec);
                showToast('Rekonsiliasi bank berhasil disimpan.', 'success');
              }}
            />
          )}

          {currentTab === 'rules' && (
            <CategorizationRulesView
              rules={rules}
              onAddRule={(kw, cat) => storage.addRule(kw, cat)}
              onDeleteRule={(id) => {
                storage.deleteRule(id);
                showToast('Aturan berhasil dihapus.', 'info');
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              profile={profile}
              onUpdateProfile={(p) => {
                storage.updateProfile(p);
                showToast('Profil usaha berhasil disimpan.', 'success');
              }}
              onExportJSON={handleExportJSON}
              onImportJSON={(str) => storage.importDataJSON(str)}
              onClearDemoData={handleClearDemoData}
              onResetData={() => {
                storage.resetToDefault();
                showToast('Data demo berhasil dipulihkan.', 'info');
              }}
              onDisconnectGmail={handleDisconnectGmail}
            />
          )}
        </main>
      </div>

      {/* Machine Learning / Rule Learner Prompt Modal */}
      <RulePromptModal
        isOpen={rulePrompt.isOpen}
        keyword={rulePrompt.keyword}
        category={rulePrompt.category}
        onConfirm={handleConfirmRulePrompt}
        onCancel={() => setRulePrompt({ isOpen: false, keyword: '', category: '' })}
      />

      {/* Floating iPhone AssistiveTouch Quick Orb & Menu */}
      <AssistiveTouchWidget
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        unverifiedTxCount={unverifiedCount}
        onQuickSync={handleSyncGmail}
        onQuickAddTx={() => setCurrentTab('transactions')}
        isSyncing={isSyncing}
      />

      {/* Disconnect Gmail Confirmation Modal */}
      <ConfirmModal
        isOpen={isDisconnectModalOpen}
        title="Putuskan Koneksi Gmail?"
        message="Token akses di memori akan dibersihkan dan sinkronisasi otomatis Gmail akan dinonaktifkan. Data transaksi yang telah tersimpan tidak akan terhapus."
        confirmLabel="Putuskan Sekarang"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleConfirmDisconnectGmail}
        onCancel={() => setIsDisconnectModalOpen(false)}
      />

      {/* Unauthorized Domain Helper Modal for Production Deployments */}
      <UnauthorizedDomainModal
        isOpen={Boolean(unauthorizedDomain)}
        domain={unauthorizedDomain || undefined}
        onClose={() => setUnauthorizedDomain(null)}
      />
    </div>
  );
}
