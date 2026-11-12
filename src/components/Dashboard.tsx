import React from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  FileCheck, 
  Send, 
  Plus, 
  Eye, 
  CreditCard,
  Building,
  DollarSign,
  Calendar,
  Sparkles,
  ShoppingBag,
  Cloud
} from 'lucide-react';
import { DocumentRecord, DocumentType, ExpenseRecord, Client, CompanyProfile } from '../types';
import { formatCurrency, formatDateIndo } from '../utils/formatters';

interface DashboardProps {
  documents: DocumentRecord[];
  expenses: ExpenseRecord[];
  clients: Client[];
  company: CompanyProfile;
  onViewDocument: (doc: DocumentRecord) => void;
  onPayDocument: (doc: DocumentRecord) => void;
  onNewDocument: (type: DocumentType) => void;
  onNavigateTab: (tab: 'documents' | 'clients' | 'finance' | 'settings' | 'drive') => void;
  onOpenExpenseModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  documents,
  expenses,
  clients,
  onViewDocument,
  onPayDocument,
  onNewDocument,
  onNavigateTab,
  onOpenExpenseModal,
}) => {
  // Financial Calculations
  const paidInvoices = documents.filter(d => (d.type === 'invoice' || d.type === 'proforma') && d.status === 'paid');
  const unpaidInvoices = documents.filter(d => (d.type === 'invoice' || d.type === 'proforma') && d.status !== 'paid' && d.status !== 'cancelled');
  const quotations = documents.filter(d => d.type === 'quotation');

  // Convert all to IDR equivalent for unified dashboard metrics
  const totalPaidRevenueIDR = paidInvoices.reduce((acc, doc) => acc + (doc.grandTotal * (doc.exchangeRate || 1)), 0);
  const totalUnpaidReceivableIDR = unpaidInvoices.reduce((acc, doc) => acc + (doc.balanceDue * (doc.exchangeRate || 1)), 0);
  const totalQuotationPipelineIDR = quotations.reduce((acc, doc) => acc + (doc.grandTotal * (doc.exchangeRate || 1)), 0);
  const totalExpensesIDR = expenses.reduce((acc, exp) => acc + (exp.amount * (exp.currency === 'USD' ? 16250 : 1)), 0);
  const netCashFlowIDR = totalPaidRevenueIDR - totalExpensesIDR;

  // Check overdue invoices
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueInvoices = unpaidInvoices.filter(d => d.dueDate < todayStr);

  // Cash flow chart data (Last 6 months simulated aggregate)
  const monthlyData = [
    { month: 'Jun', income: 45000000, expense: 28000000 },
    { month: 'Jul', income: 62000000, expense: 31000000 },
    { month: 'Agu', income: 78000000, expense: 42000000 },
    { month: 'Sep', income: 95000000, expense: 48000000 },
    { month: 'Okt', income: 133200000, expense: 57900000 },
    { month: 'Nov', income: totalPaidRevenueIDR > 133200000 ? totalPaidRevenueIDR : 85000000, expense: totalExpensesIDR },
  ];

  const maxChartVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense))) * 1.15 || 100000000;

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800/90 to-cyan-950/40 border border-slate-700/60 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Sistem Otomatis Aktif
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateIndo(new Date().toISOString())}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Dasbor Arus Kas & Tagihan
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Kelola penawaran harga, terbitkan invoice performance, dan terima pelunasan klien secara real-time.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNewDocument('quotation')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            + Penawaran
          </button>
          <button
            onClick={() => onNewDocument('proforma')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/50 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            + Proforma
          </button>
          <button
            onClick={() => onNewDocument('invoice')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Invoice Lunas
          </button>
          <button
            onClick={() => onNewDocument('purchase_order')}
            className="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-600 text-purple-200 border border-purple-700/60 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Buat Surat Pesanan Pembelian (PO) ke Vendor lain"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-300" />
            + Buat PO
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-rose-300 border border-rose-900/40 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            Catat Biaya
          </button>
          <button
            onClick={() => onNavigateTab('drive')}
            className="px-3 py-2 rounded-xl bg-sky-950/70 hover:bg-sky-900/80 text-sky-300 border border-sky-800/60 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Kelola & Cadangkan Dokumen ke Google Drive"
          >
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            Google Drive
          </button>
        </div>
      </div>

      {/* Overdue Warning Alert if any */}
      {overdueInvoices.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start sm:items-center justify-between gap-3 text-rose-200 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-semibold">{overdueInvoices.length} Invoice Melewati Jatuh Tempo!</span>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Segera kirim pengingat email otomatis atau pesan WhatsApp kepada klien terkait.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('documents')}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium shrink-0 cursor-pointer"
          >
            Tinjau Invoice
          </button>
        </div>
      )}

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Kas Masuk (Lunas) */}
        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Kas Masuk (Lunas)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {formatCurrency(totalPaidRevenueIDR, 'IDR')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{paidInvoices.length} invoice telah lunas dibayar</span>
          </div>
        </div>

        {/* Card 2: Piutang Belum Lunas (Accounts Receivable) */}
        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Piutang Tertagih (Unpaid)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {formatCurrency(totalUnpaidReceivableIDR, 'IDR')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{unpaidInvoices.length} invoice belum lunas</span>
          </div>
        </div>

        {/* Card 3: Arus Kas Bersih (Net Cash Flow) */}
        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Arus Kas Bersih (Net Flow)
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {formatCurrency(netCashFlowIDR, 'IDR')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span>Biaya Operasional: {formatCurrency(totalExpensesIDR, 'IDR')}</span>
          </div>
        </div>

        {/* Card 4: Penawaran Pipeline */}
        <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Potensi Deal (Penawaran)
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {formatCurrency(totalQuotationPipelineIDR, 'IDR')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-sky-400 font-medium">
            <Send className="w-3.5 h-3.5" />
            <span>{quotations.length} surat penawaran aktif</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Cash Flow Trend Chart + Quick Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Cash Flow Comparison Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Tren Arus Kas Real-Time (6 Bulan Terakhir)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbandingan Kas Masuk (Invoice Lunas) vs Pengeluaran Operasional
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-600 to-cyan-500" />
                <span className="text-slate-300">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500/80" />
                <span className="text-slate-300">Pengeluaran</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-64 flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-700/60">
            {monthlyData.map((d, i) => {
              const incomeHeight = Math.max(12, Math.round((d.income / maxChartVal) * 200));
              const expenseHeight = Math.max(8, Math.round((d.expense / maxChartVal) * 200));

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-52 relative">
                    {/* Income bar */}
                    <div 
                      style={{ height: `${incomeHeight}px` }} 
                      className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-600 via-teal-500 to-cyan-400 shadow-md group-hover:brightness-110 transition-all relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap z-20 pointer-events-none">
                        Masuk: {formatCurrency(d.income, 'IDR')}
                      </div>
                    </div>
                    {/* Expense bar */}
                    <div 
                      style={{ height: `${expenseHeight}px` }} 
                      className="w-full max-w-[28px] rounded-t-md bg-rose-500/80 hover:bg-rose-500 shadow-md transition-all relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap z-20 pointer-events-none">
                        Keluar: {formatCurrency(d.expense, 'IDR')}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400 group-hover:text-cyan-400 transition-colors">
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 px-1">
            <span>Perusahaan: <strong className="text-slate-200">PT Yusra Prima Solusindo</strong></span>
            <button 
              onClick={() => onNavigateTab('finance')}
              className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              Lihat Rincian Laporan Keuangan &rarr;
            </button>
          </div>
        </div>

        {/* Right Card: Quick Overview & Client Directory Glance */}
        <div className="space-y-4">
          {/* Document Status Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Status Dokumen Aktif</span>
              <span className="text-xs text-slate-400 font-normal">{documents.length} Total</span>
            </h3>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs">
                <span className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Lunas (Paid)
                </span>
                <span className="font-bold text-white">
                  {documents.filter(d => d.status === 'paid').length} Dokumen
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs">
                <span className="flex items-center gap-2 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  Menunggu Pelunasan / Pending
                </span>
                <span className="font-bold text-white">
                  {documents.filter(d => d.status === 'pending' || d.status === 'sent').length} Dokumen
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs">
                <span className="flex items-center gap-2 text-sky-400">
                  <FileText className="w-3.5 h-3.5" />
                  Surat Penawaran Harga
                </span>
                <span className="font-bold text-white">
                  {quotations.length} Dokumen
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs">
                <span className="flex items-center gap-2 text-slate-400">
                  <Building className="w-3.5 h-3.5" />
                  Klien Terdaftar
                </span>
                <span className="font-bold text-white">
                  {clients.length} Perusahaan
                </span>
              </div>
            </div>
          </div>

          {/* Payment Gateway Snapshot Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-800/40 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                Payment Gateway Ready
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Klien dapat langsung membayar via <strong>QRIS Interaktif</strong>, <strong>BCA/Mandiri Virtual Account</strong>, atau <strong>Transfer Bank</strong> dengan verifikasi status otomatis.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  const firstUnpaid = unpaidInvoices[0] || documents[0];
                  if (firstUnpaid) onPayDocument(firstUnpaid);
                }}
                className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Buka Portal Pelunasan Klien
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices & Quotations Table */}
      <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Aktivitas Tagihan & Dokumen Terkini</h2>
            <p className="text-xs text-slate-400 mt-0.5">Daftar penawaran dan invoice terbaru</p>
          </div>
          <button
            onClick={() => onNavigateTab('documents')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
          >
            Lihat Semua Dokumen &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Nomor & Tipe</th>
                <th className="py-3 px-3">Klien</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {documents.slice(0, 5).map((doc) => {
                const isPaid = doc.status === 'paid';
                const isQuo = doc.type === 'quotation';
                const isProforma = doc.type === 'proforma';

                return (
                  <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-200">{doc.documentNumber}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {doc.title || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200">{doc.client.companyName || doc.client.name}</div>
                      <div className="text-[11px] text-slate-400">{doc.client.picName}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{formatDateIndo(doc.issueDate)}</div>
                      <div className="text-[10px] text-slate-500">Tempo: {formatDateIndo(doc.dueDate)}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-100">
                      {formatCurrency(doc.grandTotal, doc.currency)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          LUNAS
                        </span>
                      ) : isProforma ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-semibold">
                          <Clock className="w-3 h-3" />
                          PROFORMA
                        </span>
                      ) : isQuo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[11px] font-semibold">
                          <Send className="w-3 h-3" />
                          PENAWARAN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px] font-semibold">
                          <Clock className="w-3 h-3" />
                          BELUM LUNAS
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewDocument(doc)}
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Lihat Dokumen"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!isPaid && !isQuo && (
                          <button
                            onClick={() => onPayDocument(doc)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            title="Proses Pelunasan"
                          >
                            <CreditCard className="w-3 h-3" />
                            Bayar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
