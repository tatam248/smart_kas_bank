import { BankParserResult, TransactionDirection, TransactionType } from '../types';
import { parseIndonesianCurrency } from '../utils/formatters';

export interface SampleEmailTemplate {
  bankName: string;
  sender: string;
  subject: string;
  body: string;
  expectedDirection: TransactionDirection;
  expectedType: TransactionType;
}

/**
 * Built-in Indonesian Bank Email Samples for Demo & Testing
 */
export const SAMPLE_BANK_EMAILS: SampleEmailTemplate[] = [
  {
    bankName: 'BCA',
    sender: 'informasi@klikbca.com',
    subject: 'Notifikasi Transaksi Rekening BCA - Uang Masuk',
    body: `Yth. Bapak/Ibu,
Informasi transaksi pada rekening BCA Anda:
Tanggal/Waktu : 29/10/2026 14:15:02 WIB
No. Rekening  : 014****892
Jenis         : KREDIT (Uang Masuk)
Nominal       : Rp 3.500.000,00
Keterangan    : PEMBAYARAN INVOICE #1042 - CV MITRA MAJU
Pengirim      : CV MITRA MAJU
No. Referensi : BCA26102914150244
Saldo Akhir   : Rp 28.750.000,00

Terima kasih telah menggunakan layanan perbankan PT Bank Central Asia Tbk.`,
    expectedDirection: 'credit',
    expectedType: 'income',
  },
  {
    bankName: 'BCA',
    sender: 'informasi@klikbca.com',
    subject: 'Notifikasi Transaksi BCA - Pembayaran Tagihan',
    body: `Yth. Nasabah BCA,
Transaksi pembayaran Anda berhasil diproses:
Tanggal/Waktu : 29/10/2026 11:30:10 WIB
No. Rekening  : 014****892
Jenis         : DEBET (Uang Keluar)
Nominal       : Rp 450.000,00
Keterangan    : PLN POSTPAID 53719028471 LISTRIK TOKO
No. Referensi : 2026102900812937
Saldo Akhir   : Rp 25.250.000,00

PT Bank Central Asia Tbk berizin dan diawasi oleh OJK.`,
    expectedDirection: 'debit',
    expectedType: 'expense',
  },
  {
    bankName: 'Bank Mandiri',
    sender: 'mandiricare@bankmandiri.co.id',
    subject: 'Notifikasi Transaksi Livin\' by Mandiri - Transfer Berhasil',
    body: `Halo RUSTAMAN,
Transaksi transfer melalui Livin' by Mandiri telah berhasil:
Waktu Transaksi : 29 Okt 2026 09:22 WIB
Rekening Sumber : 137****491 (Mandiri Bisnis)
Rekening Tujuan : 8291039481 (PT SUPPLIER BAHAN BAKU)
Jumlah Transfer : Rp 1.850.000,00
Biaya Admin     : Rp 2.500,00
Catatan         : Belanja stok bahan baku minggu IV
Nomor Resi      : LVM2026102998471
Sisa Saldo      : Rp 14.150.000,00

Terima kasih atas kepercayaan Anda pada Bank Mandiri.`,
    expectedDirection: 'debit',
    expectedType: 'expense',
  },
  {
    bankName: 'Bank BRI',
    sender: 'notifikasi@bri.co.id',
    subject: 'Notifikasi Transaksi BRImo - Dana Masuk QRIS',
    body: `Pemberitahuan Transaksi Finansial BRI:
Tanggal : 29/10/2026 16:45:18
Nomor Kartu/Rek : 0021****772
Jenis Transaksi : Setoran / Kredit QRIS
Nominal Transaksi : Rp 780.000,00
Keterangan : SETTLEMENT QRIS TOKO BERKAH
No Ref : BRI78921049281
Saldo : Rp 12.430.000,00

Simpan bukti transaksi ini. PT Bank Rakyat Indonesia (Persero) Tbk.`,
    expectedDirection: 'credit',
    expectedType: 'income',
  },
  {
    bankName: 'Bank BNI',
    sender: 'notifikasi@bni.co.id',
    subject: 'BNI Mobile Banking - Notifikasi Transaksi Debit',
    body: `Yth. Nasabah BNI,
Telah dilakukan pendebetan rekening BNI Anda:
Waktu : 29/10/2026 13:05
No Rekening : 023****441
Nominal : Rp 175.000
Keterangan : DEBET BIAYA ADMINISTRASI BULANAN & KARTU DEBIT
Ref : BNI90218310
Saldo Tersedia : Rp 8.825.000

Hubungi BNI Call 1500046 jika transaksi ini tidak dilakukan oleh Anda.`,
    expectedDirection: 'debit',
    expectedType: 'expense',
  },
  {
    bankName: 'Bank Jago',
    sender: 'notifikasi@jago.com',
    subject: 'Uang Keluar dari Kantong Utama',
    body: `Hei, transaksi kamu berhasil!
Uang sebesar Rp 65.000 telah keluar dari Kantong Utama kamu ke KOPI KENANGAN SENOPATI.
Tanggal: 29 Oktober 2026, 15:10 WIB
Kantong: Kantong Utama (1029****391)
No. Transaksi: JAGO-20261029-77192
Saldo setelah transaksi: Rp 4.250.000`,
    expectedDirection: 'debit',
    expectedType: 'expense',
  },
];

/**
 * Clean HTML tags and decode entities from email body
 */
export function sanitizeEmailBody(rawContent: string): string {
  if (!rawContent) return '';
  return rawContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent categorization based on keywords
 */
export function guessCategory(
  description: string,
  partyName: string = '',
  direction: TransactionDirection
): string {
  const combined = `${description} ${partyName}`.toLowerCase();

  if (direction === 'credit') {
    if (combined.includes('qris') || combined.includes('penjualan') || combined.includes('invoice') || combined.includes('toko') || combined.includes('order')) {
      return 'Penjualan';
    }
    if (combined.includes('pelanggan') || combined.includes('customer') || combined.includes('pembayaran')) {
      return 'Pembayaran Pelanggan';
    }
    if (combined.includes('bunga') || combined.includes('interest')) {
      return 'Bunga Bank';
    }
    if (combined.includes('transfer') || combined.includes('tf masuk')) {
      return 'Transfer Masuk';
    }
    return 'Pendapatan Usaha';
  } else {
    // Debit
    if (combined.includes('pln') || combined.includes('listrik') || combined.includes('pdam') || combined.includes('air') || combined.includes('telkom') || combined.includes('indihome') || combined.includes('internet') || combined.includes('bpjs')) {
      return 'Pembayaran Tagihan';
    }
    if (combined.includes('gaji') || combined.includes('salary') || combined.includes('honor') || combined.includes('upah')) {
      return 'Gaji';
    }
    if (combined.includes('bensin') || combined.includes('pertamina') || combined.includes('spbu') || combined.includes('grab') || combined.includes('gojek') || combined.includes('ongkir') || combined.includes('tol') || combined.includes('jnt') || combined.includes('jne')) {
      return 'Transportasi';
    }
    if (combined.includes('adm') || combined.includes('administrasi') || combined.includes('pajak bunga') || combined.includes('biaya kartu') || combined.includes('fee')) {
      return 'Biaya Administrasi Bank';
    }
    if (combined.includes('bahan') || combined.includes('stok') || combined.includes('supplier') || combined.includes('pembelian barang') || combined.includes('tokopedia') || combined.includes('shopee') || combined.includes('grosir')) {
      return 'Pembelian Barang';
    }
    if (combined.includes('kopi') || combined.includes('makan') || combined.includes('resto') || combined.includes('atk') || combined.includes('perlengkapan') || combined.includes('operasional')) {
      return 'Belanja Operasional';
    }
    if (combined.includes('transfer keluar') || combined.includes('tf keluar')) {
      return 'Transfer Keluar';
    }
    return 'Pengeluaran Lainnya';
  }
}

/**
 * Universal Indonesian Bank Transaction Parser
 */
export function parseBankEmail(
  sender: string = '',
  subject: string = '',
  body: string = ''
): BankParserResult {
  const fullText = `${subject}\n${sender}\n${body}`;
  const lowerText = fullText.toLowerCase();

  // 1. Detect Bank
  let bankName = 'Bank Umum';
  if (lowerText.includes('bca') || lowerText.includes('klikbca') || lowerText.includes('bank central asia') || lowerText.includes('bcadigital')) {
    bankName = lowerText.includes('bcadigital') || lowerText.includes('blu') ? 'Blu BCA Digital' : 'Bank BCA';
  } else if (lowerText.includes('mandiri') || lowerText.includes('livin')) {
    bankName = 'Bank Mandiri';
  } else if (lowerText.includes('bri') || lowerText.includes('brimo') || lowerText.includes('bank rakyat indonesia')) {
    bankName = 'Bank BRI';
  } else if (lowerText.includes('bni') || lowerText.includes('bank negara indonesia')) {
    bankName = 'Bank BNI';
  } else if (lowerText.includes('jago')) {
    bankName = 'Bank Jago';
  } else if (lowerText.includes('jenius') || lowerText.includes('btpn')) {
    bankName = 'Bank BTPN / Jenius';
  } else if (lowerText.includes('cimb') || lowerText.includes('octo')) {
    bankName = 'CIMB Niaga';
  } else if (lowerText.includes('seabank')) {
    bankName = 'SeaBank';
  } else if (lowerText.includes('permata')) {
    bankName = 'Bank Permata';
  }

  // 2. Detect Direction & Type (Debit vs Credit)
  const creditKeywords = [
    'kredit', 'uang masuk', 'telah dikredit', 'dana masuk', 'transfer masuk',
    'cr', 'setoran tunai', 'terima uang', 'penerimaan dana', 'qris settlement',
    'settlement qris', 'money in'
  ];
  const debitKeywords = [
    'debet', 'debit', 'uang keluar', 'telah didebet', 'pengurangan saldo',
    'transfer keluar', 'pembayaran', 'pembelian', 'tarik tunai', 'db',
    'biaya admin', 'biaya administrasi', 'money out', 'keluar dari kantong'
  ];

  let direction: TransactionDirection = 'debit';
  let type: TransactionType = 'expense';

  let creditScore = 0;
  let debitScore = 0;

  for (const kw of creditKeywords) {
    if (lowerText.includes(kw)) creditScore += 2;
  }
  for (const kw of debitKeywords) {
    if (lowerText.includes(kw)) debitScore += 2;
  }

  // Check explicit transaction tags
  if (/\bjenis\s*:\s*kredit\b/i.test(fullText) || /\b(cr)\b/i.test(fullText)) {
    creditScore += 10;
  }
  if (/\bjenis\s*:\s*debet\b/i.test(fullText) || /\bjenis\s*:\s*debit\b/i.test(fullText) || /\b(db)\b/i.test(fullText)) {
    debitScore += 10;
  }

  if (creditScore > debitScore) {
    direction = 'credit';
    type = 'income';
  } else {
    direction = 'debit';
    type = 'expense';
  }

  // Check if it's an inter-account or own transfer
  if (lowerText.includes('transfer antar rekening sendiri') || lowerText.includes('pindah kantong') || lowerText.includes('rekening sendiri')) {
    type = 'transfer';
  }

  // 3. Extract Nominal / Amount
  let amount = 0;
  // Match patterns like:
  // Nominal : Rp 3.500.000,00
  // Jumlah : Rp 450.000
  // Uang sebesar Rp 65.000
  // Nominal Transaksi : Rp 780.000,00
  const amountPatterns = [
    /(?:nominal|jumlah|sebesar|nominal transaksi|nilai transaksi|amount)\s*(?:transaksi)?\s*[:=]?\s*(?:Rp|IDR)?\s*([\d.,]+)/i,
    /(?:Rp|IDR)\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i,
    /(?:Rp|IDR)\.?\s*([\d.,]+)/i,
    /(?:sebesar|jumlah)\s*([\d.,]+)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const parsed = parseIndonesianCurrency(match[1]);
      if (parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // 4. Extract Saldo Akhir / Balance After
  let balanceAfter: number | undefined;
  const balancePatterns = [
    /(?:sisa saldo|saldo akhir|saldo setelah transaksi|saldo tersedia|saldo)\s*[:=]?\s*(?:Rp|IDR)?\s*([\d.,]+)/i,
    /(?:saldo)\s*:\s*(?:Rp|IDR)?\s*([\d.,]+)/i,
  ];
  for (const pattern of balancePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const parsed = parseIndonesianCurrency(match[1]);
      if (parsed > 0 && parsed !== amount) {
        balanceAfter = parsed;
        break;
      }
    }
  }

  // 5. Extract Masked Account Number
  let maskedAccount: string | undefined;
  const accountPatterns = [
    /(?:no\.?\s*rekening|rekening|no\.?\s*kartu|rekening sumber|kantong)\s*[:=]?\s*([0-9*X\-]+)/i,
    /(\d{2,4}[*X]{2,6}\d{2,4})/,
    /([*X]{3,6}\d{3,4})/,
  ];
  for (const pattern of accountPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const acc = match[1].trim();
      if (acc.length >= 4) {
        maskedAccount = acc;
        break;
      }
    }
  }

  // 6. Extract Reference Number
  let referenceNumber: string | undefined;
  const refPatterns = [
    /(?:no\.?\s*referensi|nomor resi|no\s*ref|no\.?\s*transaksi|reference no|journal no)\s*[:=]?\s*([A-Za-z0-9\-_]+)/i,
    /(?:ref|resi|trx)\s*[:=]\s*([A-Za-z0-9\-_]+)/i,
  ];
  for (const pattern of refPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      referenceNumber = match[1].trim();
      break;
    }
  }

  // 7. Extract Description & Party (Keterangan & Pengirim/Penerima)
  let description = '';
  let partyName: string | undefined;

  const descPatterns = [
    /(?:keterangan|berita|catatan|tujuan|uraian)\s*[:=]?\s*([^\n\r<]+)/i,
  ];
  for (const pattern of descPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      description = match[1].trim();
      break;
    }
  }

  const partyPatterns = [
    /(?:pengirim|penerima|rekening tujuan|dari|kepada)\s*[:=]?\s*([^\n\r<]+)/i,
  ];
  for (const pattern of partyPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      partyName = match[1].trim();
      break;
    }
  }

  if (!description) {
    if (partyName) {
      description = `${direction === 'credit' ? 'Terima dana dari' : 'Transfer ke'} ${partyName}`;
    } else if (subject) {
      description = subject.replace(/^(fwd:|re:)/i, '').trim();
    } else {
      description = `Transaksi ${bankName} (${direction === 'credit' ? 'Uang Masuk' : 'Uang Keluar'})`;
    }
  }

  // 8. Extract Date & Time
  let dateTime = new Date().toISOString();
  // Look for Indonesian date pattern: DD/MM/YYYY or DD-MM-YYYY or DD Month YYYY
  const dateMatch1 = fullText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2})[:.](\d{1,2})(?:[:.](\d{1,2}))?)?/);
  const monthNames = '(jan(?:uari)?|feb(?:ruari)?|mar(?:et)?|apr(?:il)?|mei|may|jun(?:i)?|jul(?:i)?|ag(?:u)?st(?:us)?|ags|agu|sep(?:tember)?|okt(?:ober)?|nov(?:ember)?|des(?:ember)?)';
  const dateMatch2 = fullText.match(new RegExp(`(\\d{1,2})\\s+${monthNames}\\s+(\\d{4})(?:[\\s,]+(\\d{1,2})[:.](\\d{1,2})(?:[:.](\\d{1,2}))?)?`, 'i'));

  if (dateMatch1) {
    const day = dateMatch1[1].padStart(2, '0');
    const month = dateMatch1[2].padStart(2, '0');
    const year = dateMatch1[3];
    const hour = (dateMatch1[4] || '12').padStart(2, '0');
    const minute = (dateMatch1[5] || '00').padStart(2, '0');
    const second = (dateMatch1[6] || '00').padStart(2, '0');
    dateTime = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  } else if (dateMatch2) {
    const day = dateMatch2[1].padStart(2, '0');
    const mStr = dateMatch2[2].toLowerCase();
    const monthMap: Record<string, string> = {
      jan: '01', februari: '02', feb: '02', maret: '03', mar: '03', april: '04', apr: '04',
      mei: '05', may: '05', juni: '06', jun: '06', juli: '07', jul: '07', agustus: '08', agu: '08', ags: '08',
      september: '09', sep: '09', oktober: '10', okt: '10', november: '11', nov: '11', desember: '12', des: '12'
    };
    const month = monthMap[mStr] || monthMap[mStr.substring(0, 3)] || '01';
    const year = dateMatch2[3];
    const hour = (dateMatch2[4] || '12').padStart(2, '0');
    const minute = (dateMatch2[5] || '00').padStart(2, '0');
    const second = (dateMatch2[6] || '00').padStart(2, '0');
    dateTime = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  const suggestedCategory = guessCategory(description, partyName, direction);

  // Confidence check
  let confidence = 0.5;
  if (bankName !== 'Bank Umum') confidence += 0.2;
  if (amount > 0) confidence += 0.2;
  if (referenceNumber) confidence += 0.1;

  const isMatch = amount > 0;

  return {
    isMatch,
    bankName,
    direction,
    type,
    amount,
    dateTime,
    maskedAccount,
    balanceAfter,
    description,
    partyName,
    referenceNumber: referenceNumber || `REF-${Date.now().toString(36).toUpperCase()}`,
    rawSnippet: body.substring(0, 300),
    confidence,
    suggestedCategory,
  };
}
