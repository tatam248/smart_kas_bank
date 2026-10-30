import {
  BankAccount,
  CategorizationRule,
  ChartOfAccount,
  EmailSyncLog,
  JournalEntry,
  ReconciliationRecord,
  Transaction,
  UserProfile,
} from '../types';
import { DEFAULT_CHART_OF_ACCOUNTS, generateJournalFromTransaction } from './accountingEngine';
import { maskAccountNumber } from '../utils/formatters';

const STORAGE_KEYS = {
  ACCOUNTS: 'kc_bank_accounts_v1',
  TRANSACTIONS: 'kc_transactions_v1',
  JOURNALS: 'kc_journal_entries_v1',
  COA: 'kc_chart_of_accounts_v1',
  RULES: 'kc_categorization_rules_v1',
  LOGS: 'kc_sync_logs_v1',
  RECONCILIATION: 'kc_reconciliations_v1',
  PROFILE: 'kc_user_profile_v1',
  DEMO_CLEARED: 'kc_demo_cleared_v1',
};

// Seed realistic sample bank accounts
const SEED_ACCOUNTS: BankAccount[] = [
  {
    id: 'acc_bca_1',
    bankName: 'Bank BCA',
    accountHolder: 'Rustaman - CV Berkah Mandiri',
    accountNumber: '0148927103',
    maskedNumber: maskAccountNumber('0148927103'),
    accountType: 'giro',
    startingBalance: 25000000,
    startDate: '2026-10-01',
    isActive: true,
    color: '#0066AE', // BCA Blue
    lastKnownBankBalance: 28750000,
    lastSyncAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: 'Rekening utama penerimaan transfer pelanggan & operasional',
    isDemo: true,
  },
  {
    id: 'acc_mandiri_1',
    bankName: 'Bank Mandiri',
    accountHolder: 'Rustaman',
    accountNumber: '137001491823',
    maskedNumber: maskAccountNumber('137001491823'),
    accountType: 'tabungan',
    startingBalance: 15000000,
    startDate: '2026-10-01',
    isActive: true,
    color: '#0A3B82', // Mandiri Dark Blue
    lastKnownBankBalance: 14150000,
    lastSyncAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    notes: 'Rekening pembayaran supplier & stok grosir',
    isDemo: true,
  },
  {
    id: 'acc_bri_1',
    bankName: 'Bank BRI',
    accountHolder: 'Toko Berkah Mandiri',
    accountNumber: '002101047721503',
    maskedNumber: maskAccountNumber('002101047721503'),
    accountType: 'tabungan',
    startingBalance: 10000000,
    startDate: '2026-10-01',
    isActive: true,
    color: '#00529C', // BRI Blue
    lastKnownBankBalance: 12430000,
    lastSyncAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    notes: 'Rekening penerimaan QRIS kasir toko',
    isDemo: true,
  },
  {
    id: 'acc_cash_1',
    bankName: 'Kas Tunai Toko',
    accountHolder: 'Kasir Utama',
    accountNumber: 'KAS-01',
    maskedNumber: 'KAS-01',
    accountType: 'kas_tunai',
    startingBalance: 3000000,
    startDate: '2026-10-01',
    isActive: true,
    color: '#10B981', // Emerald
    notes: 'Kas kecil operasional tunai harian',
    isDemo: true,
  },
];

// Seed realistic initial transactions
const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_seed_1',
    date: '2026-10-29T14:15:00',
    bankAccountId: 'acc_bca_1',
    type: 'income',
    direction: 'credit',
    amount: 3500000,
    balanceBefore: 25250000,
    balanceAfter: 28750000,
    description: 'PEMBAYARAN INVOICE #1042 - CV MITRA MAJU',
    partyName: 'CV MITRA MAJU',
    referenceNumber: 'BCA26102914150244',
    emailSourceId: 'seed_msg_1',
    emailSender: 'informasi@klikbca.com',
    emailSubject: 'Notifikasi Transaksi Rekening BCA - Uang Masuk',
    rawEmailSnippet: 'Informasi transaksi pada rekening BCA Anda: Kredit Rp 3.500.000,00',
    category: 'Penjualan',
    status: 'verified',
    createdMethod: 'simulator',
    isDemo: true,
    createdAt: '2026-10-29T14:16:00',
    updatedAt: '2026-10-29T14:16:00',
  },
  {
    id: 'tx_seed_2',
    date: '2026-10-29T11:30:00',
    bankAccountId: 'acc_bca_1',
    type: 'expense',
    direction: 'debit',
    amount: 450000,
    balanceBefore: 25700000,
    balanceAfter: 25250000,
    description: 'PLN POSTPAID 53719028471 LISTRIK TOKO',
    partyName: 'PT PLN (PERSERO)',
    referenceNumber: 'BCA2026102900812',
    emailSourceId: 'seed_msg_2',
    emailSender: 'informasi@klikbca.com',
    emailSubject: 'Notifikasi Transaksi BCA - Pembayaran Tagihan',
    rawEmailSnippet: 'Transaksi pembayaran listrik berhasil diproses: Debet Rp 450.000,00',
    category: 'Pembayaran Tagihan',
    status: 'verified',
    createdMethod: 'simulator',
    isDemo: true,
    createdAt: '2026-10-29T11:31:00',
    updatedAt: '2026-10-29T11:31:00',
  },
  {
    id: 'tx_seed_3',
    date: '2026-10-28T09:20:00',
    bankAccountId: 'acc_mandiri_1',
    type: 'expense',
    direction: 'debit',
    amount: 1850000,
    balanceBefore: 16000000,
    balanceAfter: 14150000,
    description: 'Belanja stok bahan baku minggu IV',
    partyName: 'PT SUPPLIER BAHAN BAKU',
    referenceNumber: 'LVM2026102898471',
    emailSourceId: 'seed_msg_3',
    emailSender: 'mandiricare@bankmandiri.co.id',
    emailSubject: 'Notifikasi Transaksi Livin\' by Mandiri - Transfer Berhasil',
    rawEmailSnippet: 'Transfer berhasil ke PT SUPPLIER BAHAN BAKU Rp 1.850.000,00',
    category: 'Pembelian Barang',
    status: 'verified',
    createdMethod: 'simulator',
    isDemo: true,
    createdAt: '2026-10-28T09:22:00',
    updatedAt: '2026-10-28T09:22:00',
  },
  {
    id: 'tx_seed_4',
    date: '2026-10-28T16:45:00',
    bankAccountId: 'acc_bri_1',
    type: 'income',
    direction: 'credit',
    amount: 780000,
    balanceBefore: 11650000,
    balanceAfter: 12430000,
    description: 'SETTLEMENT QRIS TOKO BERKAH',
    partyName: 'QRIS BANK BRI',
    referenceNumber: 'BRI78921049281',
    emailSourceId: 'seed_msg_4',
    emailSender: 'notifikasi@bri.co.id',
    emailSubject: 'Notifikasi Transaksi BRImo - Dana Masuk QRIS',
    rawEmailSnippet: 'Pemberitahuan Transaksi Finansial BRI: Setoran / Kredit QRIS Rp 780.000,00',
    category: 'Penjualan',
    status: 'verified',
    createdMethod: 'simulator',
    isDemo: true,
    createdAt: '2026-10-28T16:46:00',
    updatedAt: '2026-10-28T16:46:00',
  },
  {
    id: 'tx_seed_5',
    date: '2026-10-27T15:00:00',
    bankAccountId: 'acc_bca_1',
    destinationAccountId: 'acc_mandiri_1',
    type: 'transfer',
    direction: 'debit',
    amount: 1000000,
    balanceBefore: 26700000,
    balanceAfter: 25700000,
    description: 'Transfer antar rekening sendiri BCA ke Mandiri',
    partyName: 'Mandiri Bisnis',
    referenceNumber: 'TRF-BCA-MDR-001',
    category: 'Transfer Keluar',
    status: 'verified',
    createdMethod: 'simulator',
    isDemo: true,
    createdAt: '2026-10-27T15:01:00',
    updatedAt: '2026-10-27T15:01:00',
  },
  {
    id: 'tx_seed_6',
    date: '2026-10-27T17:30:00',
    bankAccountId: 'acc_cash_1',
    type: 'expense',
    direction: 'debit',
    amount: 125000,
    description: 'Beli kertas kasir, lakban & spidol toko',
    partyName: 'Toko Buku Gramedia',
    referenceNumber: 'KAS-20261027-02',
    category: 'Belanja Operasional',
    status: 'verified',
    createdMethod: 'simulator',
    isDemo: true,
    createdAt: '2026-10-27T17:35:00',
    updatedAt: '2026-10-27T17:35:00',
  },
];

// Seed initial categorization rules
const SEED_RULES: CategorizationRule[] = [
  { id: 'rule_1', keyword: 'PLN', category: 'Pembayaran Tagihan', matchCount: 4, createdAt: '2026-10-01' },
  { id: 'rule_2', keyword: 'QRIS', category: 'Penjualan', matchCount: 12, createdAt: '2026-10-01' },
  { id: 'rule_3', keyword: 'SUPPLIER', category: 'Pembelian Barang', matchCount: 6, createdAt: '2026-10-01' },
  { id: 'rule_4', keyword: 'BIAYA ADM', category: 'Biaya Administrasi Bank', matchCount: 2, createdAt: '2026-10-01' },
  { id: 'rule_5', keyword: 'GAJI', category: 'Gaji', matchCount: 1, createdAt: '2026-10-01' },
  { id: 'rule_6', keyword: 'INVOICE', category: 'Penjualan', matchCount: 8, createdAt: '2026-10-01' },
];

class StorageManager {
  private accounts: BankAccount[] = [];
  private transactions: Transaction[] = [];
  private journals: JournalEntry[] = [];
  private coa: ChartOfAccount[] = [];
  private rules: CategorizationRule[] = [];
  private logs: EmailSyncLog[] = [];
  private reconciliations: ReconciliationRecord[] = [];
  private profile: UserProfile = {
    name: 'Rustaman',
    email: 'tatam248@gmail.com',
    businessName: 'CV Berkah Mandiri (UMKM)',
    isConnectedGmail: true,
    lastGmailSync: new Date().toISOString(),
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const isDemoCleared = localStorage.getItem(STORAGE_KEYS.DEMO_CLEARED) === 'true';

      // Accounts
      const rawAccounts = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (rawAccounts !== null) {
        try {
          const parsed = JSON.parse(rawAccounts);
          this.accounts = isDemoCleared
            ? parsed.filter((a: BankAccount) => !a.isDemo && !['acc_bca_1', 'acc_mandiri_1', 'acc_bri_1', 'acc_cash_1'].includes(a.id))
            : parsed;
        } catch {
          this.accounts = isDemoCleared ? [] : [...SEED_ACCOUNTS];
        }
      } else {
        this.accounts = isDemoCleared ? [] : [...SEED_ACCOUNTS];
      }

      // Transactions
      const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (rawTx !== null) {
        try {
          const parsed = JSON.parse(rawTx);
          this.transactions = isDemoCleared
            ? parsed.filter((t: Transaction) => !t.isDemo && !t.id.startsWith('tx_seed_'))
            : parsed;
        } catch {
          this.transactions = isDemoCleared ? [] : [...SEED_TRANSACTIONS];
        }
      } else {
        this.transactions = isDemoCleared ? [] : [...SEED_TRANSACTIONS];
      }

      // Check if real transactions exist in loaded transactions:
      const hasRealTransactions = this.transactions.some(
        (t) => t.createdMethod === 'gmail_sync' && !t.isDemo && !t.id.startsWith('tx_seed_')
      );
      // If real transactions exist, automatically purge any leftover demo transactions!
      if (hasRealTransactions) {
        this.transactions = this.transactions.filter(
          (t) => !t.isDemo && !t.id.startsWith('tx_seed_')
        );
        localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, 'true');
      }

      // COA
      const rawCoa = localStorage.getItem(STORAGE_KEYS.COA);
      this.coa = rawCoa ? JSON.parse(rawCoa) : DEFAULT_CHART_OF_ACCOUNTS;

      // Rules
      const rawRules = localStorage.getItem(STORAGE_KEYS.RULES);
      this.rules = rawRules ? JSON.parse(rawRules) : SEED_RULES;

      // Logs
      const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      this.logs = rawLogs ? JSON.parse(rawLogs) : [];

      // Reconciliations
      const rawRecon = localStorage.getItem(STORAGE_KEYS.RECONCILIATION);
      this.reconciliations = rawRecon ? JSON.parse(rawRecon) : [];

      // Profile
      const rawProf = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (rawProf) {
        this.profile = { ...this.profile, ...JSON.parse(rawProf) };
      }

      // Rebuild or load journals
      this.rebuildJournals();
      this.persistAll();
    } catch (err) {
      console.warn('Storage initialization notice:', err);
      // NEVER overwrite user data with seed data in catch block!
      if (!this.accounts) this.accounts = [];
      if (!this.transactions) this.transactions = [];
      if (!this.coa || this.coa.length === 0) this.coa = [...DEFAULT_CHART_OF_ACCOUNTS];
      if (!this.rules) this.rules = [];
      if (!this.journals) this.journals = [];
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private persistAll() {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(this.accounts));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(this.journals));
      localStorage.setItem(STORAGE_KEYS.COA, JSON.stringify(this.coa));
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(this.rules));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs));
      localStorage.setItem(STORAGE_KEYS.RECONCILIATION, JSON.stringify(this.reconciliations));
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(this.profile));
    } catch (e) {
      console.warn('Failed to persist to localStorage:', e);
    }
  }

  public rebuildJournals() {
    this.journals = this.transactions.map((tx) =>
      generateJournalFromTransaction(tx, this.accounts, this.coa)
    );
  }

  // --- ACCOUNTS ---
  public getAccounts(): BankAccount[] {
    return [...this.accounts];
  }

  public getAccount(id: string): BankAccount | undefined {
    return this.accounts.find((a) => a.id === id);
  }

  public saveAccount(acc: BankAccount) {
    const idx = this.accounts.findIndex((a) => a.id === acc.id);
    if (idx >= 0) {
      this.accounts[idx] = acc;
    } else {
      this.accounts.push(acc);
    }
    this.rebuildJournals();
    this.persistAll();
    this.notify();
  }

  public deleteAccount(id: string) {
    this.accounts = this.accounts.filter((a) => a.id !== id);
    const hasRemainingDemo = this.accounts.some(
      (a) => a.isDemo || ['acc_bca_1', 'acc_mandiri_1', 'acc_bri_1', 'acc_cash_1'].includes(a.id)
    );
    if (!hasRemainingDemo) {
      localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, 'true');
    }
    this.rebuildJournals();
    this.persistAll();
    this.notify();
  }

  /**
   * Calculate live balance for a bank account
   */
  public getCalculatedBalance(accountId: string): number {
    const acc = this.accounts.find((a) => a.id === accountId);
    if (!acc) return 0;

    let balance = acc.startingBalance;

    for (const tx of this.transactions) {
      if (tx.status === 'unverified') continue; // only verified transactions

      if (tx.bankAccountId === accountId) {
        if (tx.type === 'income' || tx.direction === 'credit') {
          balance += tx.amount;
        } else if (tx.type === 'expense' || tx.direction === 'debit') {
          balance -= tx.amount;
        } else if (tx.type === 'transfer') {
          balance -= tx.amount;
        }
      }

      // If destination of transfer
      if (tx.type === 'transfer' && tx.destinationAccountId === accountId) {
        balance += tx.amount;
      }
    }

    return balance;
  }

  public getTotalBalance(): number {
    return this.accounts
      .filter((a) => a.isActive)
      .reduce((sum, acc) => sum + this.getCalculatedBalance(acc.id), 0);
  }

  // --- TRANSACTIONS ---
  public getTransactions(): Transaction[] {
    return [...this.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public addTransactions(newTxs: Transaction[]) {
    // If incoming transactions are from Gmail sync, auto-purge all demo seed transactions
    const hasGmailTxs = newTxs.some((t) => t.createdMethod === 'gmail_sync');
    if (hasGmailTxs) {
      this.transactions = this.transactions.filter(
        (t) => !t.isDemo && !t.id.startsWith('tx_seed_')
      );
      localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, 'true');
    }

    // Check categorization rules automatically
    for (const tx of newTxs) {
      if (tx.category === 'Belum Dikategorikan') {
        const textToTest = `${tx.description} ${tx.partyName || ''}`.toUpperCase();
        for (const rule of this.rules) {
          if (textToTest.includes(rule.keyword.toUpperCase())) {
            tx.category = rule.category;
            rule.matchCount++;
            break;
          }
        }
      }
    }

    this.transactions.push(...newTxs);
    this.rebuildJournals();
    this.persistAll();
    this.notify();
  }

  public updateTransaction(tx: Transaction) {
    const idx = this.transactions.findIndex((t) => t.id === tx.id);
    if (idx >= 0) {
      this.transactions[idx] = { ...tx, updatedAt: new Date().toISOString() };
      this.rebuildJournals();
      this.persistAll();
      this.notify();
    }
  }

  public deleteTransaction(id: string) {
    this.transactions = this.transactions.filter((t) => t.id !== id);
    const hasRemainingDemo = this.transactions.some(
      (t) => t.isDemo || t.id.startsWith('tx_seed_')
    );
    if (!hasRemainingDemo) {
      localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, 'true');
    }
    this.rebuildJournals();
    this.persistAll();
    this.notify();
  }

  public deleteTransactions(ids: string[]) {
    const idSet = new Set(ids);
    this.transactions = this.transactions.filter((t) => !idSet.has(t.id));
    const hasRemainingDemo = this.transactions.some(
      (t) => t.isDemo || t.id.startsWith('tx_seed_')
    );
    if (!hasRemainingDemo) {
      localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, 'true');
    }
    this.rebuildJournals();
    this.persistAll();
    this.notify();
  }

  /**
   * Explicitly purge all demo/dummy accounts and transactions
   */
  public clearDemoData() {
    this.transactions = this.transactions.filter(
      (t) => !t.isDemo && !t.id.startsWith('tx_seed_')
    );
    this.accounts = this.accounts.filter(
      (a) => !a.isDemo && !['acc_bca_1', 'acc_mandiri_1', 'acc_bri_1', 'acc_cash_1'].includes(a.id)
    );
    localStorage.setItem(STORAGE_KEYS.DEMO_CLEARED, 'true');
    this.rebuildJournals();
    this.persistAll();
    this.notify();
  }

  public hasDemoData(): boolean {
    return (
      this.transactions.some((t) => t.isDemo || t.id.startsWith('tx_seed_')) ||
      this.accounts.some(
        (a) => a.isDemo || ['acc_bca_1', 'acc_mandiri_1', 'acc_bri_1', 'acc_cash_1'].includes(a.id)
      )
    );
  }

  // --- JOURNALS & COA ---
  public getJournals(): JournalEntry[] {
    return [...this.journals].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public getChartOfAccounts(): ChartOfAccount[] {
    return [...this.coa];
  }

  // --- RULES ---
  public getRules(): CategorizationRule[] {
    return [...this.rules];
  }

  public addRule(keyword: string, category: string) {
    const cleanKeyword = keyword.trim();
    if (!cleanKeyword) return;

    const existing = this.rules.find(
      (r) => r.keyword.toLowerCase() === cleanKeyword.toLowerCase()
    );

    if (existing) {
      existing.category = category;
    } else {
      this.rules.push({
        id: `rule_${Date.now()}`,
        keyword: cleanKeyword,
        category,
        matchCount: 1,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    // Retroactively categorize uncategorized transactions matching this rule
    let modified = false;
    for (const tx of this.transactions) {
      if (tx.category === 'Belum Dikategorikan' || tx.category === 'Pengeluaran Lainnya' || tx.category === 'Pendapatan Lainnya') {
        const text = `${tx.description} ${tx.partyName || ''}`.toUpperCase();
        if (text.includes(cleanKeyword.toUpperCase())) {
          tx.category = category;
          modified = true;
        }
      }
    }

    if (modified) {
      this.rebuildJournals();
    }

    this.persistAll();
    this.notify();
  }

  public deleteRule(id: string) {
    this.rules = this.rules.filter((r) => r.id !== id);
    this.persistAll();
    this.notify();
  }

  // --- LOGS & RECONCILIATION ---
  public getLogs(): EmailSyncLog[] {
    return [...this.logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addLog(log: EmailSyncLog) {
    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
    this.persistAll();
    this.notify();
  }

  public getReconciliations(): ReconciliationRecord[] {
    return [...this.reconciliations];
  }

  public saveReconciliation(record: ReconciliationRecord) {
    const idx = this.reconciliations.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      this.reconciliations[idx] = record;
    } else {
      this.reconciliations.unshift(record);
    }
    this.persistAll();
    this.notify();
  }

  // --- PROFILE ---
  public getProfile(): UserProfile {
    return { ...this.profile };
  }

  public updateProfile(p: Partial<UserProfile>) {
    this.profile = { ...this.profile, ...p };
    this.persistAll();
    this.notify();
  }

  // --- BACKUP & RESTORE ---
  public exportDataJSON(): string {
    return JSON.stringify(
      {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        profile: this.profile,
        accounts: this.accounts,
        transactions: this.transactions,
        coa: this.coa,
        rules: this.rules,
        logs: this.logs,
        reconciliations: this.reconciliations,
      },
      null,
      2
    );
  }

  public importDataJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.accounts) this.accounts = data.accounts;
      if (data.transactions) this.transactions = data.transactions;
      if (data.coa) this.coa = data.coa;
      if (data.rules) this.rules = data.rules;
      if (data.logs) this.logs = data.logs;
      if (data.reconciliations) this.reconciliations = data.reconciliations;
      if (data.profile) this.profile = { ...this.profile, ...data.profile };

      this.rebuildJournals();
      this.persistAll();
      this.notify();
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  public resetToDefault() {
    this.accounts = [...SEED_ACCOUNTS];
    this.transactions = [...SEED_TRANSACTIONS];
    this.coa = [...DEFAULT_CHART_OF_ACCOUNTS];
    this.rules = [...SEED_RULES];
    this.logs = [];
    this.reconciliations = [];
    this.rebuildJournals();
    this.persistAll();
    this.notify();
  }
}

export const storage = new StorageManager();
