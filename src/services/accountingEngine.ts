import { BankAccount, ChartOfAccount, JournalEntry, JournalLine, Transaction } from '../types';

export const DEFAULT_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  // Aset (1-xxxx)
  { code: '1-1000', name: 'Kas Tunai / Kas Kecil', type: 'asset', normalBalance: 'debit', isSystem: true },
  { code: '1-1001', name: 'Kas Bank BCA', type: 'asset', normalBalance: 'debit', isSystem: true },
  { code: '1-1002', name: 'Kas Bank Mandiri', type: 'asset', normalBalance: 'debit', isSystem: true },
  { code: '1-1003', name: 'Kas Bank BRI', type: 'asset', normalBalance: 'debit', isSystem: true },
  { code: '1-1004', name: 'Kas Bank BNI', type: 'asset', normalBalance: 'debit', isSystem: true },
  { code: '1-1005', name: 'Kas Bank Jago', type: 'asset', normalBalance: 'debit', isSystem: true },
  { code: '1-1099', name: 'Kas Bank Lainnya', type: 'asset', normalBalance: 'debit', isSystem: true },
  { code: '1-1200', name: 'Piutang Usaha', type: 'asset', normalBalance: 'debit', isSystem: true },
  { code: '1-1300', name: 'Persediaan Barang Dagang', type: 'asset', normalBalance: 'debit', isSystem: true },

  // Kewajiban (2-xxxx)
  { code: '2-1000', name: 'Utang Usaha', type: 'liability', normalBalance: 'credit', isSystem: true },
  { code: '2-2000', name: 'Beban Akrual / Utang Tagihan', type: 'liability', normalBalance: 'credit', isSystem: true },

  // Modal (3-xxxx)
  { code: '3-1000', name: 'Modal Pemilik', type: 'equity', normalBalance: 'credit', isSystem: true },
  { code: '3-2000', name: 'Prive (Pengambilan Pemilik)', type: 'equity', normalBalance: 'debit', isSystem: true },
  { code: '3-3000', name: 'Saldo Laba Ditahan', type: 'equity', normalBalance: 'credit', isSystem: true },

  // Pendapatan (4-xxxx)
  { code: '4-1000', name: 'Pendapatan Penjualan Produk', type: 'revenue', normalBalance: 'credit', isSystem: true },
  { code: '4-1100', name: 'Pendapatan Usaha & Jasa', type: 'revenue', normalBalance: 'credit', isSystem: true },
  { code: '4-2000', name: 'Pendapatan Bunga Bank', type: 'revenue', normalBalance: 'credit', isSystem: true },
  { code: '4-9000', name: 'Pendapatan Lain-lain', type: 'revenue', normalBalance: 'credit', isSystem: true },

  // Beban Pokok & Operasional (5-xxxx & 6-xxxx)
  { code: '5-1000', name: 'Beban Pembelian Stok & Barang', type: 'expense', normalBalance: 'debit', isSystem: true },
  { code: '6-1000', name: 'Beban Operasional & Perlengkapan', type: 'expense', normalBalance: 'debit', isSystem: true },
  { code: '6-2000', name: 'Beban Gaji & Upah', type: 'expense', normalBalance: 'debit', isSystem: true },
  { code: '6-3000', name: 'Beban Tagihan & Utilitas (Listrik/Air/Internet)', type: 'expense', normalBalance: 'debit', isSystem: true },
  { code: '6-4000', name: 'Beban Transportasi & Ekspedisi', type: 'expense', normalBalance: 'debit', isSystem: true },
  { code: '6-5000', name: 'Beban Administrasi Bank & Pajak', type: 'expense', normalBalance: 'debit', isSystem: true },
  { code: '6-9000', name: 'Beban Operasional Lainnya', type: 'expense', normalBalance: 'debit', isSystem: true },
];

/**
 * Map Bank Account to Chart of Accounts asset code
 */
export function getBankAccountAssetCode(bank: BankAccount | undefined): { code: string; name: string } {
  if (!bank) return { code: '1-1000', name: 'Kas Tunai' };
  const bName = bank.bankName.toLowerCase();
  if (bName.includes('bca')) return { code: '1-1001', name: `Kas Bank BCA (${bank.maskedNumber})` };
  if (bName.includes('mandiri')) return { code: '1-1002', name: `Kas Bank Mandiri (${bank.maskedNumber})` };
  if (bName.includes('bri')) return { code: '1-1003', name: `Kas Bank BRI (${bank.maskedNumber})` };
  if (bName.includes('bni')) return { code: '1-1004', name: `Kas Bank BNI (${bank.maskedNumber})` };
  if (bName.includes('jago')) return { code: '1-1005', name: `Kas Bank Jago (${bank.maskedNumber})` };
  if (bank.accountType === 'kas_tunai') return { code: '1-1000', name: 'Kas Tunai / Kas Kecil' };
  return { code: '1-1099', name: `Kas Bank ${bank.bankName} (${bank.maskedNumber})` };
}

/**
 * Map category to revenue or expense account
 */
export function getContraAccountForCategory(
  category: string,
  type: Transaction['type'],
  coaList: ChartOfAccount[] = DEFAULT_CHART_OF_ACCOUNTS
): { code: string; name: string } {
  const cat = (category || '').toLowerCase();

  if (type === 'income') {
    if (cat.includes('penjualan')) return { code: '4-1000', name: 'Pendapatan Penjualan Produk' };
    if (cat.includes('bunga')) return { code: '4-2000', name: 'Pendapatan Bunga Bank' };
    if (cat.includes('pelanggan') || cat.includes('piutang')) return { code: '1-1200', name: 'Piutang Usaha' };
    if (cat.includes('jasa') || cat.includes('usaha')) return { code: '4-1100', name: 'Pendapatan Usaha & Jasa' };
    return { code: '4-9000', name: 'Pendapatan Lain-lain' };
  } else {
    // Expense
    if (cat.includes('barang') || cat.includes('stok') || cat.includes('bahan')) return { code: '5-1000', name: 'Beban Pembelian Stok & Barang' };
    if (cat.includes('gaji') || cat.includes('upah')) return { code: '6-2000', name: 'Beban Gaji & Upah' };
    if (cat.includes('tagihan') || cat.includes('listrik') || cat.includes('internet') || cat.includes('air')) return { code: '6-3000', name: 'Beban Tagihan & Utilitas (Listrik/Air/Internet)' };
    if (cat.includes('transportasi') || cat.includes('bensin') || cat.includes('logistik')) return { code: '6-4000', name: 'Beban Transportasi & Ekspedisi' };
    if (cat.includes('adm') || cat.includes('administrasi') || cat.includes('biaya bank')) return { code: '6-5000', name: 'Beban Administrasi Bank & Pajak' };
    if (cat.includes('operasional') || cat.includes('perlengkapan')) return { code: '6-1000', name: 'Beban Operasional & Perlengkapan' };
    return { code: '6-9000', name: 'Beban Operasional Lainnya' };
  }
}

/**
 * Automatically create a balanced Double-Entry Journal Entry from a Transaction
 */
export function generateJournalFromTransaction(
  tx: Transaction,
  accounts: BankAccount[],
  coaList: ChartOfAccount[] = DEFAULT_CHART_OF_ACCOUNTS
): JournalEntry {
  const originAccount = accounts.find((a) => a.id === tx.bankAccountId);
  const destAccount = tx.destinationAccountId ? accounts.find((a) => a.id === tx.destinationAccountId) : undefined;

  const originAsset = getBankAccountAssetCode(originAccount);
  const lines: JournalLine[] = [];

  if (tx.type === 'transfer') {
    // Inter-account transfer: Debit Destination Bank, Credit Origin Bank
    const destAsset = getBankAccountAssetCode(destAccount);
    lines.push({
      accountCode: destAsset.code,
      accountName: destAsset.name,
      debit: tx.amount,
      credit: 0,
    });
    lines.push({
      accountCode: originAsset.code,
      accountName: originAsset.name,
      debit: 0,
      credit: tx.amount,
    });
  } else if (tx.direction === 'credit' || tx.type === 'income') {
    // Money in: Debit Bank Asset, Credit Revenue/Receivable
    const contra = getContraAccountForCategory(tx.category, 'income', coaList);
    lines.push({
      accountCode: originAsset.code,
      accountName: originAsset.name,
      debit: tx.amount,
      credit: 0,
    });
    lines.push({
      accountCode: contra.code,
      accountName: contra.name,
      debit: 0,
      credit: tx.amount,
    });
  } else {
    // Money out: Debit Expense, Credit Bank Asset
    const contra = getContraAccountForCategory(tx.category, 'expense', coaList);
    lines.push({
      accountCode: contra.code,
      accountName: contra.name,
      debit: tx.amount,
      credit: 0,
    });
    lines.push({
      accountCode: originAsset.code,
      accountName: originAsset.name,
      debit: 0,
      credit: tx.amount,
    });
  }

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return {
    id: `jnl_${tx.id}`,
    transactionId: tx.id,
    date: tx.date,
    referenceNumber: tx.referenceNumber || `JNL-${tx.id.slice(-6)}`,
    description: tx.description,
    lines,
    isBalanced,
    totalDebit,
    totalCredit,
    createdAt: tx.createdAt,
  };
}

/**
 * Generate General Ledger (Buku Besar) grouped by Account Code
 */
export interface LedgerEntry {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountLedger {
  accountCode: string;
  accountName: string;
  type: ChartOfAccount['type'];
  normalBalance: ChartOfAccount['normalBalance'];
  entries: LedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  endingBalance: number;
}

export function buildGeneralLedger(
  journals: JournalEntry[],
  coaList: ChartOfAccount[] = DEFAULT_CHART_OF_ACCOUNTS
): Record<string, AccountLedger> {
  const ledgerMap: Record<string, AccountLedger> = {};

  // Initialize accounts
  for (const coa of coaList) {
    ledgerMap[coa.code] = {
      accountCode: coa.code,
      accountName: coa.name,
      type: coa.type,
      normalBalance: coa.normalBalance,
      entries: [],
      totalDebit: 0,
      totalCredit: 0,
      endingBalance: 0,
    };
  }

  // Sort journals chronologically
  const sortedJournals = [...journals].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const jnl of sortedJournals) {
    for (const line of jnl.lines) {
      if (!ledgerMap[line.accountCode]) {
        ledgerMap[line.accountCode] = {
          accountCode: line.accountCode,
          accountName: line.accountName,
          type: line.accountCode.startsWith('1')
            ? 'asset'
            : line.accountCode.startsWith('4')
            ? 'revenue'
            : 'expense',
          normalBalance: line.accountCode.startsWith('1') || line.accountCode.startsWith('5') || line.accountCode.startsWith('6') ? 'debit' : 'credit',
          entries: [],
          totalDebit: 0,
          totalCredit: 0,
          endingBalance: 0,
        };
      }

      const accLedger = ledgerMap[line.accountCode];
      accLedger.totalDebit += line.debit;
      accLedger.totalCredit += line.credit;

      const runningBalance =
        accLedger.normalBalance === 'debit'
          ? accLedger.totalDebit - accLedger.totalCredit
          : accLedger.totalCredit - accLedger.totalDebit;

      accLedger.endingBalance = runningBalance;

      accLedger.entries.push({
        date: jnl.date,
        reference: jnl.referenceNumber,
        description: jnl.description,
        debit: line.debit,
        credit: line.credit,
        balance: runningBalance,
      });
    }
  }

  return ledgerMap;
}

/**
 * Calculate Trial Balance (Neraca Saldo)
 */
export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export function buildTrialBalance(ledgerMap: Record<string, AccountLedger>): {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
} {
  const rows: TrialBalanceRow[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (const code of Object.keys(ledgerMap).sort()) {
    const item = ledgerMap[code];
    if (item.totalDebit === 0 && item.totalCredit === 0) continue;

    let balDebit = 0;
    let balCredit = 0;

    if (item.normalBalance === 'debit') {
      const net = item.totalDebit - item.totalCredit;
      if (net >= 0) balDebit = net;
      else balCredit = Math.abs(net);
    } else {
      const net = item.totalCredit - item.totalDebit;
      if (net >= 0) balCredit = net;
      else balDebit = Math.abs(net);
    }

    rows.push({
      accountCode: item.accountCode,
      accountName: item.accountName,
      debit: balDebit,
      credit: balCredit,
    });

    totalDebit += balDebit;
    totalCredit += balCredit;
  }

  return {
    rows,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
}
