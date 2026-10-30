export type AccountType = 'tabungan' | 'giro' | 'kas_tunai' | 'e_wallet';

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  maskedNumber: string;
  accountType: AccountType;
  startingBalance: number;
  startDate: string; // YYYY-MM-DD
  isActive: boolean;
  color: string;
  lastKnownBankBalance?: number;
  lastSyncAt?: string;
  notes?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionDirection = 'debit' | 'credit';
export type VerificationStatus = 'verified' | 'unverified' | 'needs_review';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DDTHH:mm:ss
  bankAccountId: string;
  destinationAccountId?: string; // used for transfer between own accounts
  type: TransactionType;
  direction: TransactionDirection; // 'credit' = masuk, 'debit' = keluar
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  description: string;
  partyName?: string; // pengirim atau penerima
  referenceNumber?: string;
  emailSourceId?: string;
  emailSender?: string;
  emailSubject?: string;
  rawEmailSnippet?: string;
  category: string;
  status: VerificationStatus;
  createdMethod: 'gmail_sync' | 'manual' | 'simulator';
  createdAt: string;
  updatedAt: string;
}

export type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface ChartOfAccount {
  code: string;
  name: string;
  type: AccountCategory;
  normalBalance: 'debit' | 'credit';
  description?: string;
  isSystem?: boolean;
  linkedBankAccountId?: string;
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  transactionId: string;
  date: string;
  referenceNumber: string;
  description: string;
  lines: JournalLine[];
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
}

export interface CategorizationRule {
  id: string;
  keyword: string; // matches description or partyName case-insensitively
  category: string;
  targetAccountCode?: string;
  transactionType?: TransactionType;
  matchCount: number;
  createdAt: string;
}

export interface EmailSyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'partial' | 'error';
  messagesScanned: number;
  transactionsCreated: number;
  duplicatesSkipped: number;
  message: string;
  sourceEmail: string;
}

export interface ReconciliationRecord {
  id: string;
  bankAccountId: string;
  reconciliationDate: string;
  calculatedBalance: number;
  reportedBankBalance: number;
  variance: number;
  status: 'matched' | 'discrepancy' | 'resolved';
  lastReferenceNumber?: string;
  notes?: string;
  resolvedAt?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  businessName: string;
  photoURL?: string;
  isConnectedGmail: boolean;
  lastGmailSync?: string;
}

export interface BankParserResult {
  isMatch: boolean;
  bankName: string;
  direction: TransactionDirection;
  type: TransactionType;
  amount: number;
  dateTime: string;
  maskedAccount?: string;
  balanceAfter?: number;
  description: string;
  partyName?: string;
  referenceNumber?: string;
  rawSnippet?: string;
  confidence: number;
  suggestedCategory?: string;
}
