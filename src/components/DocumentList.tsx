import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Plus, 
  Eye, 
  Download, 
  FileCode, 
  Mail, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ArrowRightLeft, 
  Trash2, 
  Printer, 
  Copy, 
  MoreVertical,
  Check,
  Building2,
  FileCheck2,
  Receipt,
  ShoppingBag
} from 'lucide-react';
import { DocumentRecord, DocumentType, DocumentStatus, CompanyProfile } from '../types';
import { formatCurrency, formatDateIndo } from '../utils/formatters';
import { exportDocumentToWord } from '../utils/exportDocx';
import { exportDocumentToPdf } from '../utils/exportPdf';

interface DocumentListProps {
  documents: DocumentRecord[];
  company: CompanyProfile;
  onViewDocument: (doc: DocumentRecord) => void;
  onEditDocument: (doc: DocumentRecord) => void;
  onDeleteDocument: (id: string) => void;
  onDuplicateDocument: (doc: DocumentRecord) => void;
  onConvertDocument: (doc: DocumentRecord, targetType: DocumentType) => void;
  onPayDocument: (doc: DocumentRecord) => void;
  onEmailDocument: (doc: DocumentRecord) => void;
  onNewDocument: (type?: DocumentType) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  company,
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  onDuplicateDocument,
  onConvertDocument,
  onPayDocument,
  onEmailDocument,
  onNewDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType | 'unpaid' | 'paid'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    // Type filter
    if (typeFilter === 'quotation' && doc.type !== 'quotation') return false;
    if (typeFilter === 'proforma' && doc.type !== 'proforma') return false;
    if (typeFilter === 'invoice' && doc.type !== 'invoice') return false;
    if (typeFilter === 'purchase_order' && doc.type !== 'purchase_order') return false;
    if (typeFilter === 'paid' && doc.status !== 'paid') return false;
    if (typeFilter === 'unpaid' && (doc.status === 'paid' || doc.type === 'quotation' || doc.type === 'purchase_order')) return false;

    // Currency filter
    if (currencyFilter !== 'all' && doc.currency !== currencyFilter) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchNum = doc.documentNumber.toLowerCase().includes(q);
      const matchClient = (doc.client.companyName || doc.client.name).toLowerCase().includes(q);
      const matchPic = (doc.client.picName || '').toLowerCase().includes(q);
      const matchTitle = (doc.title || '').toLowerCase().includes(q);
      const matchRefPo = (doc.poReferenceQuotationNumber || '').toLowerCase().includes(q);
      const matchItems = doc.items.some(i => i.description.toLowerCase().includes(q));
      if (!matchNum && !matchClient && !matchPic && !matchTitle && !matchRefPo && !matchItems) return false;
    }

    return true;
  });

  // Calculate sum of currently filtered items
  const totalAmountFiltered = filteredDocuments.reduce((sum, d) => sum + (d.grandTotal * (d.exchangeRate || 1)), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            Penawaran, Proforma, Invoice &amp; PO
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Buat, cetak PDF/Word, kirim via email, terbitkan PO ke vendor dengan menyalin penawaran, dan pantau arus kas.
          </p>
        </div>

        {/* Action button with dropdown choices */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNewDocument('quotation')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            + Penawaran
          </button>
          <button
            onClick={() => onNewDocument('proforma')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/50 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            + Proforma
          </button>
          <button
            onClick={() => onNewDocument('invoice')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500/50 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            + Invoice Lunas
          </button>
          <button
            onClick={() => onNewDocument('purchase_order')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-semibold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
            title="Buat Surat Pesanan Pembelian (PO) ke Vendor lain"
          >
            <Plus className="w-4 h-4" />
            + Buat PO (Beli ke Vendor)
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-4">
        {/* Document Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            Semua Dokumen ({documents.length})
          </button>

          <button
            onClick={() => setTypeFilter('quotation')}
            className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === 'quotation'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            Penawaran Harga ({documents.filter(d => d.type === 'quotation').length})
          </button>

          <button
            onClick={() => setTypeFilter('proforma')}
            className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === 'proforma'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Proforma Invoice ({documents.filter(d => d.type === 'proforma').length})
          </button>

          <button
            onClick={() => setTypeFilter('purchase_order')}
            className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === 'purchase_order'
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            Purchase Order / PO ({documents.filter(d => d.type === 'purchase_order').length})
          </button>

          <button
            onClick={() => setTypeFilter('paid')}
            className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === 'paid'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Invoice Lunas ({documents.filter(d => d.status === 'paid').length})
          </button>

          <button
            onClick={() => setTypeFilter('unpaid')}
            className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === 'unpaid'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            Belum Lunas ({documents.filter(d => d.status !== 'paid' && d.type !== 'quotation' && d.type !== 'purchase_order').length})
          </button>
        </div>

        {/* Search & Currency Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor dokumen, nama klien, perihal, atau item produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mata Uang:</span>
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Semua (All)</option>
                <option value="IDR" className="bg-slate-900">IDR (Rupiah)</option>
                <option value="USD" className="bg-slate-900">USD ($)</option>
                <option value="EUR" className="bg-slate-900">EUR (€)</option>
                <option value="SGD" className="bg-slate-900">SGD (S$)</option>
              </select>
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-400 hidden md:block">
              Total Filter: <strong className="text-cyan-400 font-bold">{formatCurrency(totalAmountFiltered, 'IDR')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Table / Card List */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">Tidak ada dokumen yang ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau buat surat penawaran / invoice baru sekarang.
            </p>
            <button
              onClick={() => onNewDocument('invoice')}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              Buat Dokumen Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Tipe & No. Dokumen</th>
                  <th className="py-3 px-3">Klien & Proyek</th>
                  <th className="py-3 px-3">Tanggal & Tempo</th>
                  <th className="py-3 px-3 text-right">Nilai Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Aksi & Ekspor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredDocuments.map((doc) => {
                  const isPaid = doc.status === 'paid';
                  const isQuo = doc.type === 'quotation';
                  const isProforma = doc.type === 'proforma';
                  const isPO = doc.type === 'purchase_order';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/60 transition-colors group">
                      {/* Column 1: Type & Document Number */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            isPO ? 'bg-purple-400' : (isPaid ? 'bg-emerald-400' : (isProforma ? 'bg-amber-400' : (isQuo ? 'bg-sky-400' : 'bg-rose-400')))
                          }`} />
                          <span className="font-bold text-white text-sm tracking-tight">{doc.documentNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isPO
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : (isQuo 
                                ? 'bg-sky-950 text-sky-300 border border-sky-800' 
                                : (isProforma 
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'))
                          }`}>
                            {isPO ? 'PO Pembelian' : (isQuo ? 'Penawaran' : (isProforma ? 'Proforma' : 'Invoice'))}
                          </span>
                          {doc.currency !== 'IDR' && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 text-[10px] font-mono">
                              {doc.currency}
                            </span>
                          )}
                          {doc.poReferenceQuotationNumber && (
                            <span className="text-purple-300/90 text-[10px] bg-purple-950/60 px-1 rounded border border-purple-800/50">
                              Ref Quo: {doc.poReferenceQuotationNumber}
                            </span>
                          )}
                          {doc.convertedFromNumber && !doc.poReferenceQuotationNumber && (
                            <span className="text-slate-500 text-[10px]">
                              ref: {doc.convertedFromNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Client or Vendor */}
                      <td className="py-3.5 px-3">
                        {isPO && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 block mb-0.5">
                            Vendor / Supplier:
                          </span>
                        )}
                        <div className="font-semibold text-slate-200">
                          {doc.client.companyName || doc.client.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="text-slate-300">{doc.poAttentionPic || doc.client.picName}</span>
                          {doc.title && <span className="text-slate-500">• {doc.title}</span>}
                        </div>
                      </td>

                      {/* Column 3: Dates */}
                      <td className="py-3.5 px-3 text-slate-300">
                        <div>{formatDateIndo(doc.issueDate)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isPO 
                            ? `Kirim: ${formatDateIndo(doc.poDeliveryDate || doc.dueDate)}`
                            : (isQuo 
                              ? `Berlaku: ${formatDateIndo(doc.validUntil || doc.dueDate)}` 
                              : `Tempo: ${formatDateIndo(doc.dueDate)}`)}
                        </div>
                      </td>

                      {/* Column 4: Total & Currency */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-extrabold text-white text-sm">
                          {formatCurrency(doc.grandTotal, doc.currency)}
                        </div>
                        {doc.taxAmount > 0 && (
                          <div className="text-[10px] text-slate-400">
                            Termasuk PPN {doc.taxPercent}%
                          </div>
                        )}
                        {doc.currency !== 'IDR' && (
                          <div className="text-[10px] text-slate-500">
                            ≈ {formatCurrency(doc.grandTotal * doc.exchangeRate, 'IDR')}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Status Badge */}
                      <td className="py-3.5 px-3 text-center">
                        {isPO ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
                            <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                            PO PEMBELIAN
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            LUNAS
                          </span>
                        ) : isProforma ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            PROFORMA
                          </span>
                        ) : isQuo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[11px] font-bold">
                            <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
                            PENAWARAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-rose-400" />
                            BELUM LUNAS
                          </span>
                        )}
                      </td>

                      {/* Column 6: Actions Toolbar */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 0. Shortcut for Quotation -> Salin ke PO ke vendor */}
                          {isQuo && (
                            <button
                              onClick={() => onConvertDocument(doc, 'purchase_order')}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-600 text-purple-200 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer border border-purple-700/60 shadow-sm"
                              title="Salin Dokumen Penawaran Ini Menjadi Purchase Order (PO) ke Vendor"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-purple-300" />
                              <span className="hidden lg:inline">Salin ke PO</span>
                            </button>
                          )}

                          {/* 1. Preview Button */}
                          <button
                            onClick={() => onViewDocument(doc)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-cyan-600 text-slate-200 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Pratinjau Dokumen Lengkap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Lihat</span>
                          </button>

                          {/* 2. Download Word (.doc) */}
                          <button
                            onClick={() => exportDocumentToWord(doc, company)}
                            className="p-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-600 text-blue-300 hover:text-white transition-all cursor-pointer border border-blue-700/40"
                            title="Download Format Word (.doc)"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Download PDF */}
                          <button
                            onClick={() => exportDocumentToPdf(doc, company)}
                            className="p-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-600 text-rose-300 hover:text-white transition-all cursor-pointer border border-rose-700/40"
                            title="Download Format PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Send Email / WA */}
                          <button
                            onClick={() => onEmailDocument(doc)}
                            className="p-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-all cursor-pointer border border-emerald-700/40"
                            title="Kirim via Email & WhatsApp Otomatis"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Payment Gateway Button if not paid */}
                          {!isPaid && !isQuo && (
                            <button
                              onClick={() => onPayDocument(doc)}
                              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                              title="Buka Payment Gateway untuk Klien"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Bayar</span>
                            </button>
                          )}

                          {/* 6. Context Dropdown for Convert / Edit / Delete */}
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id)}
                              className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {activeMenuDocId === doc.id && (
                              <div className="absolute right-0 top-8 z-30 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 space-y-1 text-left">
                                <button
                                  onClick={() => {
                                    setActiveMenuDocId(null);
                                    onEditDocument(doc);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                                  Edit Dokumen
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveMenuDocId(null);
                                    onDuplicateDocument(doc);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  Duplikasi Dokumen
                                </button>

                                {isQuo && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setActiveMenuDocId(null);
                                        onConvertDocument(doc, 'proforma');
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-amber-300 text-xs flex items-center gap-2 cursor-pointer"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                                      Ubah ke Proforma Invoice
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveMenuDocId(null);
                                        onConvertDocument(doc, 'invoice');
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-300 text-xs flex items-center gap-2 cursor-pointer"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                                      Ubah ke Invoice Lunas
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveMenuDocId(null);
                                        onConvertDocument(doc, 'purchase_order');
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg hover:bg-purple-950/60 text-purple-300 text-xs flex items-center gap-2 cursor-pointer"
                                    >
                                      <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                                      Salin ke Purchase Order (PO)
                                    </button>
                                  </>
                                )}

                                {isProforma && (
                                  <button
                                    onClick={() => {
                                      setActiveMenuDocId(null);
                                      onConvertDocument(doc, 'invoice');
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-300 text-xs flex items-center gap-2 cursor-pointer"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                                    Ubah ke Invoice Final/Lunas
                                  </button>
                                )}

                                <div className="border-t border-slate-800 my-1" />

                                <button
                                  onClick={() => {
                                    setActiveMenuDocId(null);
                                    if (confirm(`Yakin ingin menghapus ${doc.documentNumber}?`)) {
                                      onDeleteDocument(doc.id);
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-rose-950/60 text-rose-400 text-xs flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  Hapus Dokumen
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
