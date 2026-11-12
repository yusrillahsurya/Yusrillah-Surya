import { CurrencyCode } from '../types';

export const CURRENCY_CONFIGS: Record<CurrencyCode, { symbol: string; name: string; rateToIDR: number; decimals: number }> = {
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', rateToIDR: 1, decimals: 0 },
  USD: { symbol: '$', name: 'US Dollar', rateToIDR: 16250, decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', rateToIDR: 17400, decimals: 2 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', rateToIDR: 12100, decimals: 2 },
  JPY: { symbol: '¥', name: 'Japanese Yen', rateToIDR: 105, decimals: 0 },
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'IDR'): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.IDR;
  
  if (currency === 'IDR') {
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
  }

  return `${config.symbol} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  })}`;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Convert number to Indonesian Words (Terbilang)
export function numberToWordsIndo(num: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas'
  ];

  const roundNum = Math.floor(Math.abs(num));
  if (roundNum === 0) return 'Nol Rupiah';

  function terbilangHelper(n: number): string {
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return `${terbilangHelper(n - 10)} Belas`;
    } else if (n < 100) {
      const sisa = n % 10;
      return `${terbilangHelper(Math.floor(n / 10))} Puluh ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    } else if (n < 200) {
      return `Seratus ${terbilangHelper(n - 100)}`.trim();
    } else if (n < 1000) {
      const sisa = n % 100;
      return `${terbilangHelper(Math.floor(n / 100))} Ratus ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    } else if (n < 2000) {
      return `Seribu ${terbilangHelper(n - 1000)}`.trim();
    } else if (n < 1000000) {
      const sisa = n % 1000;
      return `${terbilangHelper(Math.floor(n / 1000))} Ribu ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    } else if (n < 1000000000) {
      const sisa = n % 1000000;
      return `${terbilangHelper(Math.floor(n / 1000000))} Juta ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    } else if (n < 1000000000000) {
      const sisa = n % 1000000000;
      return `${terbilangHelper(Math.floor(n / 1000000000))} Miliar ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    } else {
      const sisa = n % 1000000000000;
      return `${terbilangHelper(Math.floor(n / 1000000000000))} Triliun ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    }
  }

  const result = terbilangHelper(roundNum);
  return `${result} Rupiah`.replace(/\s+/g, ' ');
}

// English number to words for foreign currencies
export function numberToWordsEng(num: number, currency: CurrencyCode = 'USD'): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const roundNum = Math.floor(Math.abs(num));
  if (roundNum === 0) return 'Zero';

  function convertChunk(n: number): string {
    let str = '';
    if (n >= 100) {
      str += `${units[Math.floor(n / 100)]} Hundred `;
      n %= 100;
    }
    if (n >= 20) {
      str += `${tens[Math.floor(n / 10)]} `;
      n %= 10;
    }
    if (n > 0) {
      str += `${units[n]} `;
    }
    return str.trim();
  }

  let result = '';
  const billions = Math.floor(roundNum / 1000000000);
  const millions = Math.floor((roundNum % 1000000000) / 1000000);
  const thousands = Math.floor((roundNum % 1000000) / 1000);
  const remainder = roundNum % 1000;

  if (billions) result += `${convertChunk(billions)} Billion `;
  if (millions) result += `${convertChunk(millions)} Million `;
  if (thousands) result += `${convertChunk(thousands)} Thousand `;
  if (remainder) result += `${convertChunk(remainder)} `;

  const currencyNames: Record<CurrencyCode, string> = {
    IDR: 'Rupiah',
    USD: 'US Dollars',
    EUR: 'Euros',
    SGD: 'Singapore Dollars',
    JPY: 'Japanese Yen'
  };

  return `${result.trim()} ${currencyNames[currency] || ''}`.trim();
}

export function formatTerbilang(amount: number, currency: CurrencyCode): string {
  if (currency === 'IDR') {
    return numberToWordsIndo(amount);
  }
  return numberToWordsEng(amount, currency);
}

// Generate Roman numeral month for Indonesian formal document numbering
export function getRomanMonth(date: Date): string {
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romanMonths[date.getMonth()];
}

export function generateDocNumber(type: 'quotation' | 'proforma' | 'invoice' | 'purchase_order', seqNumber: number = 1): string {
  const now = new Date();
  const year = now.getFullYear();
  const monthRoman = getRomanMonth(now);
  const padded = String(seqNumber).padStart(3, '0');

  switch (type) {
    case 'quotation':
      return `QUO/YPS/${year}/${monthRoman}/${padded}`;
    case 'proforma':
      return `PI/YPS/${year}/${monthRoman}/${padded}`;
    case 'invoice':
      return `INV/YPS/${year}/${monthRoman}/${padded}`;
    case 'purchase_order':
      return `PO/YPS/${year}/${monthRoman}/${padded}`;
  }
}
