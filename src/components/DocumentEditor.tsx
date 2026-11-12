import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  DollarSign, 
  Calendar, 
  Building2, 
  Percent, 
  Info,
  CheckCircle,
  Clock,
  Sparkles,
  Copy,
  Truck
} from 'lucide-react';
import { 
  DocumentRecord, 
  DocumentType, 
  DocumentItem, 
  Client, 
  CurrencyCode, 
  CompanyProfile,
  DocumentStatus
} from '../types';
import { 
  CURRENCY_CONFIGS, 
  formatCurrency, 
  formatTerbilang, 
  generateDocNumber 
} from '../utils/formatters';

interface DocumentEditorProps {
  initialDocument?: DocumentRecord | null;
  defaultType?: DocumentType;
  clients: Client[];
  company: CompanyProfile;
  allDocuments?: DocumentRecord[];
  onSave: (doc: DocumentRecord) => void;
  onCancel: () => void;
  onAddNewClient: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialDocument,
  defaultType = 'invoice',
  clients,
  company,
  allDocuments = [],
  onSave,
  onCancel,
  onAddNewClient,
}) => {
  const [docType, setDocType] = useState<DocumentType>(initialDocument?.type || defaultType);
  const [docNumber, setDocNumber] = useState<string>(
    initialDocument?.documentNumber || generateDocNumber(defaultType, Math.floor(Math.random() * 800) + 10)
  );
  const [title, setTitle] = useState<string>(initialDocument?.title || '');
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialDocument?.clientId || (clients[0]?.id || '')
  );
  
  const todayStr = new Date().toISOString().split('T')[0];
  const in14DaysStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in7DaysStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [issueDate, setIssueDate] = useState<string>(initialDocument?.issueDate || todayStr);
  const [dueDate, setDueDate] = useState<string>(initialDocument?.dueDate || in14DaysStr);
  const [validUntil, setValidUntil] = useState<string>(initialDocument?.validUntil || in14DaysStr);
  
  // PO specific states
  const [poReferenceQuotationNumber, setPoReferenceQuotationNumber] = useState<string>(
    initialDocument?.poReferenceQuotationNumber || ''
  );
  const [poDeliveryDate, setPoDeliveryDate] = useState<string>(
    initialDocument?.poDeliveryDate || in7DaysStr
  );
  const [poDeliveryAddress, setPoDeliveryAddress] = useState<string>(
    initialDocument?.poDeliveryAddress || 'Gudang Workshop PT Yusra Prima Solusindo, Veteran Kavling No9c Kab. Tangerang Banten 15540'
  );
  const [poAttentionPic, setPoAttentionPic] = useState<string>(
    initialDocument?.poAttentionPic || ''
  );
  const [copySuccessMessage, setCopySuccessMessage] = useState<string>('');

  const [currency, setCurrency] = useState<CurrencyCode>(initialDocument?.currency || 'IDR');
  const [exchangeRate, setExchangeRate] = useState<number>(
    initialDocument?.exchangeRate || CURRENCY_CONFIGS[initialDocument?.currency || 'IDR'].rateToIDR
  );
  
  const [items, setItems] = useState<DocumentItem[]>(
    initialDocument?.items || [
      {
        id: 'item-1',
        description: 'Jasa Implementasi & Instalasi Jaringan',
        specification: 'Konfigurasi perangkat switch, router & testing konektivitas',
        quantity: 1,
        unit: 'Paket',
        unitPrice: 15000000,
        total: 15000000,
      },
    ]
  );

  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(initialDocument?.discountType || 'percent');
  const [discountValue, setDiscountValue] = useState<number>(initialDocument?.discountValue || 0);
  const [taxType, setTaxType] = useState<'none' | 'ppn_11' | 'ppn_12' | 'pph_23'>(initialDocument?.taxType || 'ppn_11');
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialDocument?.paymentTerms || (defaultType === 'purchase_order' ? 'Net 30 Hari' : 'Net 14 Hari')
  );
  const [notes, setNotes] = useState<string>(
    initialDocument?.notes || (defaultType === 'purchase_order' 
      ? 'Purchase Order (PO) resmi diterbitkan oleh PT Yusra Prima Solusindo.'
      : 'Pembayaran ditransfer ke rekening resmi PT Yusra Prima Solusindo.')
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string[]>(
    initialDocument?.termsAndConditions || company.defaultTerms
  );
  const [status, setStatus] = useState<DocumentStatus>(initialDocument?.status || 'sent');
  const [selectedBank, setSelectedBank] = useState<'primary' | 'secondary'>('primary');
  const [signedBy, setSignedBy] = useState<string>(initialDocument?.signedBy || company.directorName);
  const [signerRole, setSignerRole] = useState<string>(initialDocument?.signerRole || company.directorRole);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string>(
    initialDocument?.signatureImageUrl || company.defaultSignatureUrl || ''
  );

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSignatureImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // If changing document type on creation, re-suggest doc number prefix
  const handleTypeChange = (newType: DocumentType) => {
    setDocType(newType);
    if (!initialDocument) {
      setDocNumber(generateDocNumber(newType, Math.floor(Math.random() * 800) + 10));
      if (newType === 'quotation') {
        setStatus('sent');
      } else if (newType === 'proforma') {
        setStatus('pending');
      } else if (newType === 'purchase_order') {
        setStatus('sent');
        if (!title) setTitle('Surat Pesanan Pembelian Barang / Jasa (PO)');
        if (!notes || notes.includes('Pembayaran ditransfer ke rekening resmi PT Yusra')) {
          setNotes('Purchase Order (PO) resmi diterbitkan oleh PT Yusra Prima Solusindo.');
        }
      }
    }
  };

  // Handler to copy another quotation document into this PO
  const handleCopyQuotationToPo = (sourceDocId: string) => {
    const sourceDoc = allDocuments?.find(d => d.id === sourceDocId);
    if (!sourceDoc) return;

    if (sourceDoc.clientId) {
      setSelectedClientId(sourceDoc.clientId);
    }
    const cleanTitle = sourceDoc.title
      .replace(/^Surat Penawaran Harga - /i, '')
      .replace(/^Surat Penawaran /i, '')
      .replace(/^Penawaran Harga /i, '')
      .replace(/^Proforma Invoice - /i, '');
      
    setTitle(`Surat Pesanan Pembelian (PO) - ${cleanTitle}`);
    setCurrency(sourceDoc.currency);
    setExchangeRate(sourceDoc.exchangeRate || 1);
    setPoReferenceQuotationNumber(sourceDoc.documentNumber);
    setPoAttentionPic(sourceDoc.client?.picName || '');
    
    // Copy items cleanly
    setItems(sourceDoc.items.map(it => ({
      ...it,
      id: `po-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    })));

    setTaxType(sourceDoc.taxType);
    setDiscountType(sourceDoc.discountType);
    setDiscountValue(sourceDoc.discountValue);
    setPaymentTerms(sourceDoc.paymentTerms || 'Net 30 Hari');
    setNotes(`Purchase Order (PO) resmi diterbitkan oleh PT Yusra Prima Solusindo mengacu pada penawaran harga No. ${sourceDoc.documentNumber}.`);
    
    setCopySuccessMessage(`Berhasil menyalin data penawaran [${sourceDoc.documentNumber}] ke formulir PO ini!`);
    setTimeout(() => setCopySuccessMessage(''), 4000);
  };

  // Currency change handler
  const handleCurrencyChange = (newCurr: CurrencyCode) => {
    setCurrency(newCurr);
    setExchangeRate(CURRENCY_CONFIGS[newCurr].rateToIDR);
  };

  // Item modifications
  const handleItemChange = (index: number, field: keyof DocumentItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto recalculate row total
    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].unitPrice) || 0;
    updated[index].total = qty * price;

    setItems(updated);
  };

  const handleAddItem = () => {
    const newItem: DocumentItem = {
      id: `item-${Date.now()}`,
      description: '',
      specification: '',
      quantity: 1,
      unit: 'Unit',
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Financial Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = (subtotal * (Number(discountValue) || 0)) / 100;
  } else {
    discountAmount = Number(discountValue) || 0;
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  let taxPercent = 0;
  if (taxType === 'ppn_11') taxPercent = 11;
  else if (taxType === 'ppn_12') taxPercent = 12;
  else if (taxType === 'pph_23') taxPercent = 2; // PPh 23 jasa withholding

  const taxAmount = (taxableAmount * taxPercent) / 100;
  const grandTotal = Math.round(taxableAmount + taxAmount);

  // Selected Client
  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0] || {
    id: 'unknown',
    name: 'Klien Baru',
    companyName: 'PT Klien',
    picName: 'PIC',
    email: '',
    phone: '',
    address: '',
    city: 'Tangerang',
    paymentTerms: 'Net 14',
    createdAt: todayStr,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bankDetails = selectedBank === 'primary' 
      ? company.defaultBank 
      : (company.secondaryBank || company.defaultBank);

    const isPaid = status === 'paid';

    const savedDoc: DocumentRecord = {
      id: initialDocument?.id || `doc-${Date.now()}`,
      documentNumber: docNumber,
      type: docType,
      title: title || (docType === 'purchase_order' 
        ? 'Surat Pesanan Pembelian (PO)' 
        : (docType === 'quotation' ? 'Surat Penawaran Harga' : (docType === 'proforma' ? 'Proforma Invoice' : 'Invoice Tagihan'))),
      clientId: currentClient.id,
      client: currentClient,
      issueDate,
      dueDate,
      validUntil: docType === 'quotation' ? validUntil : undefined,
      poReferenceQuotationNumber: docType === 'purchase_order' ? poReferenceQuotationNumber : undefined,
      poDeliveryDate: docType === 'purchase_order' ? poDeliveryDate : undefined,
      poDeliveryAddress: docType === 'purchase_order' ? poDeliveryAddress : undefined,
      poAttentionPic: docType === 'purchase_order' ? poAttentionPic : undefined,
      currency,
      exchangeRate,
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxType,
      taxPercent,
      taxAmount,
      grandTotal,
      amountPaid: isPaid ? grandTotal : (initialDocument?.amountPaid || 0),
      balanceDue: isPaid ? 0 : Math.max(0, grandTotal - (initialDocument?.amountPaid || 0)),
      status,
      paymentTerms,
      notes,
      termsAndConditions,
      bankAccount: {
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountHolder: bankDetails.accountHolder,
      },
      paidAt: isPaid ? (initialDocument?.paidAt || todayStr) : undefined,
      paymentMethod: isPaid ? (initialDocument?.paymentMethod || 'Transfer Bank') : undefined,
      signedBy,
      signerRole,
      signatureImageUrl: signatureImageUrl || undefined,
      hasOfficialStamp: true,
      createdAt: initialDocument?.createdAt || todayStr,
      updatedAt: new Date().toISOString(),
    };

    onSave(savedDoc);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {initialDocument ? 'Edit Dokumen' : 'Buat Dokumen Baru'}
            </span>
            <span className="text-xs text-slate-400">
              PT Yusra Prima Solusindo
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            {docType === 'quotation' && 'Surat Penawaran Harga (Quotation)'}
            {docType === 'proforma' && 'Proforma Invoice (Tagihan Sementara/DP)'}
            {docType === 'invoice' && 'Invoice Final / Invoice Lunas'}
            {docType === 'purchase_order' && 'Surat Pesanan Pembelian / Purchase Order (PO)'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {docType === 'purchase_order' 
              ? 'Terbitkan surat pesanan resmi dari PT Yusra Prima Solusindo ke PT Vendor lain dengan menyalin dokumen penawaran harga.'
              : 'Lengkapi data tagihan dan barang/jasa di bawah ini. Dokumen otomatis tersimpan dan siap ekspor PDF & Word.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Dokumen
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Type Switcher */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Pilih Jenis Dokumen:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('quotation')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                docType === 'quotation'
                  ? 'bg-sky-500/15 border-sky-500 text-white shadow-md shadow-sky-500/10'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-sky-400">1. Surat Penawaran</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">QUO</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Penawaran harga resmi dengan masa berlaku & terms garansi</p>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('proforma')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                docType === 'proforma'
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-amber-400">2. Proforma Invoice</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">PI</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Tagihan DP atau pra-pengiriman sebelum pekerjaan selesai</p>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('invoice')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                docType === 'invoice'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-400">3. Invoice Final / Lunas</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">INV</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Faktur resmi pelunasan dengan watermark LUNAS & stempel digital</p>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('purchase_order')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                docType === 'purchase_order'
                  ? 'bg-purple-500/20 border-purple-500 text-white shadow-md shadow-purple-500/15'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-purple-400">4. Purchase Order (PO)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">PO</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">PO pesanan dari Yusra ke vendor dengan menyalin dokumen penawaran</p>
            </button>
          </div>

          {/* Kotak Khusus: Salin Dokumen Penawaran PT Lain ke PO */}
          {docType === 'purchase_order' && (
            <div className="mt-3 p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 shadow-inner space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-purple-200">
                    Fitur Salin Dokumen Penawaran Vendor ke Purchase Order (PO)
                  </h3>
                  <p className="text-[11px] text-purple-300/80">
                    Pilih dokumen penawaran harga untuk otomatis menyalin PT Vendor, rincian item barang/jasa, kuantitas, harga satuan, dan spesifikasi ke PO ini.
                  </p>
                </div>
              </div>

              {copySuccessMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{copySuccessMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-purple-200 mb-1">
                    Pilih Penawaran yang Ingin Disalin ke PO:
                  </label>
                  <select
                    id="source-quotation-select"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-purple-700/80 text-white text-xs cursor-pointer focus:outline-none focus:border-purple-400"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleCopyQuotationToPo(e.target.value);
                      }
                    }}
                  >
                    <option value="">-- Pilih Dokumen Penawaran untuk Disalin --</option>
                    {allDocuments?.filter(d => d.type === 'quotation' || d.type === 'purchase_order').map(d => (
                      <option key={d.id} value={d.id}>
                        [{d.documentNumber}] {d.client.companyName || d.client.name} — {d.title} ({formatCurrency(d.grandTotal, d.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const select = document.getElementById('source-quotation-select') as HTMLSelectElement;
                      if (select && select.value) {
                        handleCopyQuotationToPo(select.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Data ke PO</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Basic Information: Number, Dates, Client, Currency */}
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
            <Info className="w-4 h-4 text-cyan-400" />
            Informasi Dokumen & Klien
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Document Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nomor Dokumen <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Document Title / Subject */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Perihal / Judul Pekerjaan
              </label>
              <input
                type="text"
                placeholder="Contoh: Pengadaan Switch & Server Rack Data Center"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mata Uang & Kurs
              </label>
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                  className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>

                {currency !== 'IDR' && (
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    placeholder="Kurs ke IDR"
                    title="Nilai Tukar ke IDR"
                    className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Client Picker */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {docType === 'purchase_order' ? 'Vendor / PT Penerima PO (Supplier)' : 'Klien / Ditujukan Kepada'} <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={onAddNewClient}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  {docType === 'purchase_order' ? '+ Tambah Vendor Baru' : '+ Tambah Klien Baru'}
                </button>
              </div>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.name} — {c.picName} ({c.city})
                  </option>
                ))}
              </select>
              {currentClient && (
                <div className="mt-1 text-[11px] text-slate-400">
                  {currentClient.address} | Telp: {currentClient.phone} | NPWP: {currentClient.npwp || '-'}
                </div>
              )}
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tanggal Terbit PO
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Due Date or Valid Until */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {docType === 'purchase_order' 
                  ? 'Batas Pembayaran / Termin' 
                  : (docType === 'quotation' ? 'Masa Berlaku Hingga' : 'Tanggal Jatuh Tempo')}
              </label>
              <input
                type="date"
                value={docType === 'quotation' ? validUntil : dueDate}
                onChange={(e) => {
                  if (docType === 'quotation') setValidUntil(e.target.value);
                  else setDueDate(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Purchase Order Specific Reference & Delivery Fields */}
            {docType === 'purchase_order' && (
              <div className="sm:col-span-2 lg:col-span-4 p-4 rounded-xl bg-slate-900 border border-purple-800/40 space-y-3">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span>Rincian Pengiriman & Rujukan Dokumen Penawaran Vendor</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nomor Penawaran Vendor yang Dirujuk / Disalin:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: QUO-SMI/2026/X/8892"
                      value={poReferenceQuotationNumber}
                      onChange={(e) => setPoReferenceQuotationNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Tanggal Pengiriman Barang:
                    </label>
                    <input
                      type="date"
                      value={poDeliveryDate}
                      onChange={(e) => setPoDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Attn PIC Vendor Penerima PO:
                    </label>
                    <input
                      type="text"
                      placeholder="Nama PIC / Sales Vendor"
                      value={poAttentionPic}
                      onChange={(e) => setPoAttentionPic(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Alamat Tujuan Pengiriman Barang / Workshop:
                    </label>
                    <button
                      type="button"
                      onClick={() => setPoDeliveryAddress('Gudang Workshop PT Yusra Prima Solusindo, Veteran Kavling No9c Kab. Tangerang Banten 15540')}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                    >
                      Gunakan Alamat Kantor Yusra Tangerang
                    </button>
                  </div>
                  <input
                    type="text"
                    value={poDeliveryAddress}
                    onChange={(e) => setPoDeliveryAddress(e.target.value)}
                    placeholder="Alamat gudang / kantor penerima barang PT Yusra"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Daftar Barang & Layanan Jasa
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Masukkan deskripsi spesifikasi teknis, kuantitas, satuan, dan harga per unit.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-700/60 space-y-2 group hover:border-cyan-500/40 transition-colors"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Deskripsi / Nama Barang / Jasa <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Cisco Switch 48-Port PoE+ Managed"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Kuantitas
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-16 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs text-center"
                      />
                      <input
                        type="text"
                        placeholder="Satuan"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Harga Satuan ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs text-right font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Total
                      </label>
                      <div className="font-bold text-white text-xs font-mono">
                        {formatCurrency(item.total, currency)}
                      </div>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer mt-4"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Spesifikasi teknis tambahan / Part number / Serial / Lingkup kerja (Opsional)"
                    value={item.specification || ''}
                    onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                    className="w-full px-3 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300 text-[11px] placeholder-slate-600 focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal, Diskon, Pajak & Ringkasan Perhitungan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-700">
            {/* Left side: Notes & Terms */}
            <div className="lg:col-span-7 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Syarat & Ketentuan (Terms & Conditions)
                </label>
                <textarea
                  rows={3}
                  value={termsAndConditions.join('\n')}
                  onChange={(e) => setTermsAndConditions(e.target.value.split('\n'))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  placeholder="Setiap baris adalah satu poin syarat dan ketentuan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Pembayaran / Pesan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Terbilang Live Preview */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
                <span className="font-semibold block text-[10px] uppercase tracking-wider text-emerald-400">
                  Terbilang Otomatis:
                </span>
                <span className="italic font-medium">
                  # {formatTerbilang(grandTotal, currency)} #
                </span>
              </div>
            </div>

            {/* Right side: Calculation Breakdown Box */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Subtotal:</span>
                <span className="font-semibold text-white font-mono">{formatCurrency(subtotal, currency)}</span>
              </div>

              {/* Discount Input */}
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span>Diskon:</span>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                      className="bg-slate-800 border border-slate-700 text-[10px] rounded px-1.5 py-0.5 text-slate-200"
                    >
                      <option value="percent">Persentase (%)</option>
                      <option value="fixed">Nominal Tetap ({currency})</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-20 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-right text-xs text-white font-mono"
                  />
                </div>
                {discountAmount > 0 && (
                  <div className="text-right text-[11px] text-rose-400">
                    - {formatCurrency(discountAmount, currency)}
                  </div>
                )}
              </div>

              {/* Tax Selection */}
              <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span>Pajak (PPN):</span>
                  <select
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-slate-200 cursor-pointer"
                  >
                    <option value="none">Tanpa Pajak (0%)</option>
                    <option value="ppn_11">PPN 11%</option>
                    <option value="ppn_12">PPN 12%</option>
                    <option value="pph_23">PPh 23 (2% Potongan Jasa)</option>
                  </select>
                </div>
                <span className="font-semibold text-white font-mono">{formatCurrency(taxAmount, currency)}</span>
              </div>

              {/* Grand Total */}
              <div className="pt-2 border-t-2 border-cyan-500/50 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">TOTAL AKHIR</span>
                  <span className="text-[10px] text-slate-400">
                    {docType === 'quotation' ? 'Nilai Penawaran' : 'Total Tagihan'}
                  </span>
                </div>
                <div className="text-lg font-extrabold text-cyan-400 font-mono">
                  {formatCurrency(grandTotal, currency)}
                </div>
              </div>

              {/* Status Selector */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status Dokumen:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-semibold cursor-pointer"
                >
                  <option value="sent">Terkirim ke Klien (Sent)</option>
                  <option value="paid">LUNAS / PAID (Telah Diterima)</option>
                  <option value="pending">Menunggu Pelunasan (Pending / Overdue)</option>
                  <option value="draft">Draft (Konsep)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Banking and Signature Settings */}
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Rekening Pembayaran & Otorisasi Penandatangan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Bank Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rekening Tujuan Transfer:
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value as 'primary' | 'secondary')}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs cursor-pointer"
              >
                <option value="primary">
                  {company.defaultBank.bankName} - {company.defaultBank.accountNumber} ({company.defaultBank.accountHolder})
                </option>
                {company.secondaryBank && (
                  <option value="secondary">
                    {company.secondaryBank.bankName} - {company.secondaryBank.accountNumber} ({company.secondaryBank.accountHolder})
                  </option>
                )}
              </select>
            </div>

            {/* Signer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Penandatangan
              </label>
              <input
                type="text"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>

            {/* Signer Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Jabatan Penandatangan
              </label>
              <input
                type="text"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          {/* Custom Signature Image Uploader */}
          <div className="pt-3 border-t border-slate-700/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  Custom Gambar Tanda Tangan (TTD)
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Unggah gambar tanda tangan digital (PNG transparan/JPG) untuk disematkan di lembar cetak dokumen, PDF, dan Word.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors flex items-center gap-1.5">
                  <span>+ Unggah Gambar TTD</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </label>

                {signatureImageUrl && (
                  <button
                    type="button"
                    onClick={() => setSignatureImageUrl('')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 text-xs font-medium cursor-pointer transition-colors"
                    title="Hapus Gambar TTD"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {/* Signature Preview Box */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-900 border border-slate-700/80">
              <div className="w-36 h-20 rounded-lg bg-white p-2 border border-slate-300 flex items-center justify-center relative overflow-hidden shadow-sm shrink-0">
                {signatureImageUrl ? (
                  <img
                    src={signatureImageUrl}
                    alt="Preview Tanda Tangan"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic text-center">
                    Belum ada gambar TTD (menggunakan nama teks)
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <div className="text-slate-200 font-semibold">
                  {signatureImageUrl ? 'Gambar TTD aktif' : 'Gunakan TTD Gambar'}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tanda tangan ini akan otomatis dicetak tepat di atas nama <strong className="text-slate-300">{signedBy || company.directorName}</strong> pada lembar cetak dokumen, PDF, dan Word.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan & Selesai
          </button>
        </div>
      </form>
    </div>
  );
};
