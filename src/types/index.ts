export type DocumentType = 'quotation' | 'proforma' | 'invoice' | 'purchase_order';

export type DocumentStatus = 
  | 'draft' 
  | 'sent' 
  | 'accepted' 
  | 'rejected' 
  | 'pending' 
  | 'partial' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled';

export type CurrencyCode = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToIDR: number; // 1 Foreign Currency = X IDR
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  picName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  npwp?: string;
  paymentTerms: string; // e.g. "Net 14", "Net 30", "DP 50%, Pelunasan 50%"
  notes?: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  description: string;
  specification?: string;
  quantity: number;
  unit: string; // e.g., "Unit", "Bulan", "Paket", "Pcs", "Lot", "Jam"
  unitPrice: number;
  discountPercent?: number;
  total: number;
}

export interface PaymentSchedule {
  terminName: string; // e.g., "Termin 1 (DP 50%)"
  percentage: number;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidAt?: string;
}

export interface DocumentRecord {
  id: string;
  documentNumber: string; // e.g. "QUO/YPS/2026/XI/001" or "INV/YPS/2026/XI/001"
  type: DocumentType;
  title: string; // e.g. "Pengadaan Perangkat Jaringan & Maintenance"
  clientId: string;
  client: Client;
  issueDate: string;
  dueDate: string;
  validUntil?: string; // Khusus Penawaran (masa berlaku)
  currency: CurrencyCode;
  exchangeRate: number; // terhadap IDR
  items: DocumentItem[];
  subtotal: number;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxType: 'none' | 'ppn_11' | 'ppn_12' | 'pph_23';
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  status: DocumentStatus;
  paymentTerms: string;
  notes: string;
  termsAndConditions: string[];
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    swiftCode?: string;
  };
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  convertedFromId?: string; // jika diubah dari quotation -> proforma -> invoice
  convertedFromNumber?: string;
  proformaTerminSchedule?: PaymentSchedule[];
  signedBy: string;
  signerRole: string;
  signatureImageUrl?: string; // Custom uploaded signature (base64 or URL)
  poReferenceQuotationNumber?: string; // Nomor penawaran vendor yang disalin/dirujuk
  poDeliveryDate?: string; // Target tanggal pengiriman pesanan
  poDeliveryAddress?: string; // Alamat tujuan pengiriman gudang/workshop Yusra
  poAttentionPic?: string; // PIC vendor penerima PO
  hasOfficialStamp: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'Gaji & Honor' | 'Operasional Kantor' | 'Bahan / Vendor' | 'Transport & Logistik' | 'Pemasaran' | 'Utilitas & Internet' | 'Pajak & Legal' | 'Lainnya';
  title: string;
  amount: number;
  currency: CurrencyCode;
  paymentMethod: string;
  notes?: string;
  receiptUrl?: string;
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  npwp: string;
  nib?: string;
  defaultBank: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    qrisUrl?: string;
  };
  secondaryBank?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  directorName: string;
  directorRole: string;
  defaultSignatureUrl?: string; // Default signature image (base64 or URL)
  defaultTerms: string[];
}
