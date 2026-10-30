import { BankAccount, EmailSyncLog, Transaction } from '../types';
import { parseBankEmail, sanitizeEmailBody } from './bankParsers';
import { generateId } from '../utils/formatters';

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailPart {
  mimeType: string;
  body: {
    data?: string;
  };
  parts?: GmailPart[];
}

interface GmailMessageDetail {
  id: string;
  snippet: string;
  internalDate: string;
  payload: {
    headers: GmailMessageHeader[];
    body?: {
      data?: string;
    };
    parts?: GmailPart[];
  };
}

/**
 * Decode Base64URL string from Gmail API
 */
function decodeBase64Url(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const binStr = atob(base64);
    // decode utf-8 properly
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    try {
      return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

/**
 * Recursively find text/plain or text/html body in email payload
 */
function extractBodyFromParts(parts: GmailPart[] = []): string {
  let plain = '';
  let html = '';

  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      plain += decodeBase64Url(part.body.data) + '\n';
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      html += decodeBase64Url(part.body.data) + '\n';
    } else if (part.parts && part.parts.length > 0) {
      const nested = extractBodyFromParts(part.parts);
      plain += nested + '\n';
    }
  }

  return plain || sanitizeEmailBody(html);
}

/**
 * Fetch and process bank emails using Gmail API
 */
export async function syncBankEmailsFromGmail(
  accessToken: string,
  userEmail: string,
  existingTransactions: Transaction[],
  bankAccounts: BankAccount[],
  maxResults: number = 20
): Promise<{
  newTransactions: Transaction[];
  log: EmailSyncLog;
}> {
  const query = '(from:(bca.co.id OR bankmandiri.co.id OR bri.co.id OR bni.co.id OR cimbniaga.co.id OR jago.com OR btpn.com OR bcadigital.co.id OR seabank.co.id OR permata.co.id) OR subject:("Notifikasi Transaksi" OR "Informasi Transaksi" OR "Transaksi Berhasil" OR "Uang Masuk" OR "Uang Keluar" OR "QRIS" OR "Debit" OR "Kredit"))';

  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`;

  const res = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Gagal mengambil email dari Gmail (Status: ${res.status})`
    );
  }

  const listData = await res.json();
  const messages: { id: string; threadId: string }[] = listData.messages || [];

  let scannedCount = 0;
  let createdCount = 0;
  let duplicateCount = 0;
  const newTransactions: Transaction[] = [];

  // Existing deduplication maps
  const existingEmailIds = new Set(
    existingTransactions.filter((t) => t.emailSourceId).map((t) => t.emailSourceId)
  );
  const existingRefs = new Set(
    existingTransactions.filter((t) => t.referenceNumber).map((t) => t.referenceNumber)
  );

  for (const msg of messages) {
    scannedCount++;

    // Fast skip if already processed
    if (existingEmailIds.has(msg.id)) {
      duplicateCount++;
      continue;
    }

    // Fetch individual email content
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!msgRes.ok) continue;

    const detail: GmailMessageDetail = await msgRes.json();
    const headers = detail.payload?.headers || [];

    const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '';
    const from = headers.find((h) => h.name.toLowerCase() === 'from')?.value || '';
    const dateHeader = headers.find((h) => h.name.toLowerCase() === 'date')?.value || '';

    let bodyText = '';
    if (detail.payload?.body?.data) {
      bodyText = decodeBase64Url(detail.payload.body.data);
    } else if (detail.payload?.parts) {
      bodyText = extractBodyFromParts(detail.payload.parts);
    }
    if (!bodyText) {
      bodyText = detail.snippet || '';
    }

    const parsed = parseBankEmail(from, subject, bodyText);

    // If valid bank transaction parsed
    if (parsed.isMatch && parsed.amount > 0) {
      // Check ref duplicate
      if (parsed.referenceNumber && existingRefs.has(parsed.referenceNumber)) {
        duplicateCount++;
        continue;
      }

      // Match target bank account
      let targetAccount = bankAccounts.find((a) =>
        a.bankName.toLowerCase().includes(parsed.bankName.toLowerCase()) ||
        parsed.bankName.toLowerCase().includes(a.bankName.toLowerCase())
      );

      // If matched by masked number
      if (parsed.maskedAccount) {
        const cleanMask = parsed.maskedAccount.replace(/[^0-9]/g, '');
        if (cleanMask) {
          const accMatch = bankAccounts.find((a) => a.accountNumber.endsWith(cleanMask));
          if (accMatch) targetAccount = accMatch;
        }
      }

      const accountId = targetAccount?.id || (bankAccounts[0]?.id ?? 'default_acc');

      const now = new Date().toISOString();
      const newTx: Transaction = {
        id: generateId('tx_gmail'),
        date: parsed.dateTime || (dateHeader ? new Date(dateHeader).toISOString() : now),
        bankAccountId: accountId,
        type: parsed.type,
        direction: parsed.direction,
        amount: parsed.amount,
        balanceAfter: parsed.balanceAfter,
        description: parsed.description,
        partyName: parsed.partyName,
        referenceNumber: parsed.referenceNumber,
        emailSourceId: msg.id,
        emailSender: from,
        emailSubject: subject,
        rawEmailSnippet: (bodyText || detail.snippet).substring(0, 300),
        category: parsed.suggestedCategory || 'Belum Dikategorikan',
        status: parsed.confidence > 0.7 ? 'verified' : 'unverified',
        createdMethod: 'gmail_sync',
        createdAt: now,
        updatedAt: now,
      };

      newTransactions.push(newTx);
      existingEmailIds.add(msg.id);
      if (parsed.referenceNumber) existingRefs.add(parsed.referenceNumber);
      createdCount++;
    }
  }

  const log: EmailSyncLog = {
    id: generateId('log'),
    timestamp: new Date().toISOString(),
    status: createdCount > 0 ? 'success' : 'partial',
    messagesScanned: scannedCount,
    transactionsCreated: createdCount,
    duplicatesSkipped: duplicateCount,
    message: `Sinkronisasi selesai. ${scannedCount} email diperiksa, ${createdCount} transaksi baru dicatat, ${duplicateCount} transaksi duplikat diabaikan.`,
    sourceEmail: userEmail,
  };

  return { newTransactions, log };
}
