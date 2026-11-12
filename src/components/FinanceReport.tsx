import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Plus, 
  Calendar, 
  DollarSign, 
  Clock, 
  PieChart, 
  Filter, 
  Trash2, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { DocumentRecord, ExpenseRecord, CompanyProfile } from '../types';
import { formatCurrency, formatDateIndo } from '../utils/formatters';

interface FinanceReportProps {
  documents: DocumentRecord[];
  expenses: ExpenseRecord[];
  company: CompanyProfile;
  onAddExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
}

export const FinanceReport: React.FC<FinanceReportProps> = ({
  documents,
  expenses,
  company,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'cashflow' | 'pl' | 'aging' | 'expenses'>('cashflow');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // New Expense State
  const [newExpense, setNewExpense] = useState<Partial<ExpenseRecord>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Operasional Kantor',
    title: '',
    amount: 0,
    currency: 'IDR',
    paymentMethod: 'Transfer BCA',
    notes: '',
  });

  // Calculate Inflows (Paid Invoices)
  const paidInvoices = documents.filter(d => (d.type === 'invoice' || d.type === 'proforma') && d.status === 'paid');
  const totalInflowIDR = paidInvoices.reduce((sum, d) => sum + (d.grandTotal * (d.exchangeRate || 1)), 0);

  // Calculate Outflows (Expenses)
  const totalOutflowIDR = expenses.reduce((sum, e) => sum + (e.amount * (e.currency === 'USD' ? 16250 : 1)), 0);

  // Net Cash & Profit Margin
  const netCashIDR = totalInflowIDR - totalOutflowIDR;
  const profitMarginPercent = totalInflowIDR > 0 ? Math.round((netCashIDR / totalInflowIDR) * 100) : 0;

  // Unpaid Invoices & Aging
  const unpaidInvoices = documents.filter(d => (d.type === 'invoice' || d.type === 'proforma') && d.status !== 'paid' && d.status !== 'cancelled');
  const today = new Date();

  const agingCurrent = unpaidInvoices.filter(d => {
    const diffDays = Math.ceil((new Date(d.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0; // Not yet overdue
  });

  const agingOverdue1to30 = unpaidInvoices.filter(d => {
    const diffDays = Math.ceil((today.getTime() - new Date(d.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  });

  const agingOverdue30Plus = unpaidInvoices.filter(d => {
    const diffDays = Math.ceil((today.getTime() - new Date(d.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  });

  // Export CSV Helper
  const handleExportCSV = () => {
    let csvRows = ['Tanggal,Tipe,Kategori/Klien,Deskripsi/No Dokumen,Mata Uang,Nominal (IDR)'];

    // Inflows
    paidInvoices.forEach(d => {
      csvRows.push(`"${d.paidAt || d.issueDate}","Pemasukan (Inflow)","${d.client.companyName || d.client.name}","${d.documentNumber} - ${d.title}","${d.currency}","${d.grandTotal * d.exchangeRate}"`);
    });

    // Outflows
    expenses.forEach(e => {
      csvRows.push(`"${e.date}","Pengeluaran (Outflow)","${e.category}","${e.title}","${e.currency}","-${e.amount * (e.currency === 'USD' ? 16250 : 1)}"`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.href = csvContent;
    link.download = `Laporan_Keuangan_PT_YUSRA_PRIMA_SOLUSINDO_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    onAddExpense({
      id: `exp-${Date.now()}`,
      date: newExpense.date || new Date().toISOString().split('T')[0],
      category: newExpense.category as any,
      title: newExpense.title,
      amount: Number(newExpense.amount),
      currency: newExpense.currency as any || 'IDR',
      paymentMethod: newExpense.paymentMethod || 'Transfer BCA',
      notes: newExpense.notes,
    });

    setIsExpenseModalOpen(false);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      category: 'Operasional Kantor',
      title: '',
      amount: 0,
      currency: 'IDR',
      paymentMethod: 'Transfer BCA',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            Laporan Keuangan & Arus Kas Otomatis
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Laporan Arus Kas (Cash Flow), Laba Rugi (P&L), dan Analisis Aging Piutang real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Inflow */}
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Kas Masuk (Inflow)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatCurrency(totalInflowIDR, 'IDR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dari {paidInvoices.length} invoice lunas diterima
          </div>
        </div>

        {/* Total Outflow */}
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-rose-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Pengeluaran (Outflow)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">
            {formatCurrency(totalOutflowIDR, 'IDR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dari {expenses.length} transaksi biaya operasional
          </div>
        </div>

        {/* Net Profit & Margin */}
        <div className="p-5 rounded-2xl bg-slate-800/80 border border-cyan-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Laba Bersih & Margin
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-400">
            {formatCurrency(netCashIDR, 'IDR')}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Margin Keuntungan Bersih: {profitMarginPercent}%</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Cash Flow, Profit & Loss, Aging Piutang, Expenses List */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-slate-700/60">
          <button
            onClick={() => setActiveSubTab('cashflow')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeSubTab === 'cashflow'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Arus Kas (Cash Flow)
          </button>

          <button
            onClick={() => setActiveSubTab('pl')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeSubTab === 'pl'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Laba Rugi (P&L)
          </button>

          <button
            onClick={() => setActiveSubTab('aging')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeSubTab === 'aging'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Aging Piutang (Receivables)
          </button>

          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeSubTab === 'expenses'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Buku Pengeluaran ({expenses.length})
          </button>
        </div>

        {/* Tab Content 1: Cash Flow Statement */}
        {activeSubTab === 'cashflow' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Mutasi Kas Masuk & Kas Keluar</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Jenis Arus Kas</th>
                    <th className="py-2.5 px-3">Kategori / Klien</th>
                    <th className="py-2.5 px-3">Keterangan / Dokumen</th>
                    <th className="py-2.5 px-3 text-right">Kas Masuk (+)</th>
                    <th className="py-2.5 px-3 text-right">Kas Keluar (-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {/* Paid Invoices */}
                  {paidInvoices.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-slate-300">{formatDateIndo(d.paidAt || d.issueDate)}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                          Penerimaan Invoice
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{d.client.companyName || d.client.name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{d.documentNumber} - {d.title}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        +{formatCurrency(d.grandTotal * d.exchangeRate, 'IDR')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">-</td>
                    </tr>
                  ))}

                  {/* Expenses */}
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-slate-300">{formatDateIndo(e.date)}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold text-[10px]">
                          Beban Operasional
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-300">{e.category}</td>
                      <td className="py-2.5 px-3 text-slate-400">{e.title}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">-</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                        -{formatCurrency(e.amount * (e.currency === 'USD' ? 16250 : 1), 'IDR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 2: Profit & Loss (Laba Rugi) */}
        {activeSubTab === 'pl' && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-4 max-w-2xl mx-auto text-xs">
            <div className="text-center border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white uppercase">{company.name}</h3>
              <div className="text-sm font-semibold text-cyan-400">LAPORAN LABA RUGI OPERASIONAL</div>
              <div className="text-slate-400 text-[11px] mt-0.5">Periode Berjalan (Tahun 2026)</div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-white border-b border-slate-800 pb-1">
                <span>PENDAPATAN USAHA (REVENUE)</span>
                <span className="font-mono text-emerald-400">{formatCurrency(totalInflowIDR, 'IDR')}</span>
              </div>
              <div className="pl-4 space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>Pendapatan Proyek & Jasa Implementasi IT:</span>
                  <span className="font-mono">{formatCurrency(totalInflowIDR, 'IDR')}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-white border-b border-slate-800 pt-3 pb-1">
                <span>BEBAN OPERASIONAL (EXPENSES)</span>
                <span className="font-mono text-rose-400">-{formatCurrency(totalOutflowIDR, 'IDR')}</span>
              </div>
              <div className="pl-4 space-y-1 text-slate-300">
                {expenses.map((exp) => (
                  <div key={exp.id} className="flex justify-between">
                    <span>{exp.title} ({exp.category}):</span>
                    <span className="font-mono text-slate-400">{formatCurrency(exp.amount * (exp.currency === 'USD' ? 16250 : 1), 'IDR')}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-cyan-500/80 flex justify-between items-center text-sm font-black text-white">
                <span>LABA BERSIH OPERASIONAL (NET PROFIT):</span>
                <span className="font-mono text-base text-cyan-400">{formatCurrency(netCashIDR, 'IDR')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Aging Piutang (Accounts Receivable) */}
        {activeSubTab === 'aging' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Analisis Umur Piutang (Aging Schedule)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30">
                <span className="text-[11px] font-bold text-emerald-400 block uppercase">
                  Lancar (Belum Jatuh Tempo)
                </span>
                <div className="text-xl font-bold text-white mt-1">
                  {formatCurrency(agingCurrent.reduce((s, d) => s + (d.balanceDue * d.exchangeRate), 0), 'IDR')}
                </div>
                <div className="text-xs text-slate-400 mt-1">{agingCurrent.length} invoice</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30">
                <span className="text-[11px] font-bold text-amber-400 block uppercase">
                  Overdue 1 - 30 Hari
                </span>
                <div className="text-xl font-bold text-white mt-1">
                  {formatCurrency(agingOverdue1to30.reduce((s, d) => s + (d.balanceDue * d.exchangeRate), 0), 'IDR')}
                </div>
                <div className="text-xs text-slate-400 mt-1">{agingOverdue1to30.length} invoice</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30">
                <span className="text-[11px] font-bold text-rose-400 block uppercase">
                  Overdue &gt; 30 Hari (Prioritas)
                </span>
                <div className="text-xl font-bold text-white mt-1">
                  {formatCurrency(agingOverdue30Plus.reduce((s, d) => s + (d.balanceDue * d.exchangeRate), 0), 'IDR')}
                </div>
                <div className="text-xs text-slate-400 mt-1">{agingOverdue30Plus.length} invoice</div>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-semibold uppercase">
                    <th className="py-2 px-3">No. Dokumen</th>
                    <th className="py-2 px-3">Klien</th>
                    <th className="py-2 px-3">Jatuh Tempo</th>
                    <th className="py-2 px-3 text-right">Sisa Tagihan</th>
                    <th className="py-2 px-3 text-center">Status Umur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {unpaidInvoices.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{d.documentNumber}</td>
                      <td className="py-2.5 px-3">{d.client.companyName || d.client.name}</td>
                      <td className="py-2.5 px-3 text-slate-300">{formatDateIndo(d.dueDate)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {formatCurrency(d.balanceDue, d.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Menunggu Pelunasan
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 4: Expenses List */}
        {activeSubTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Daftar Beban & Pengeluaran Operasional</h3>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                + Tambah Biaya
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3">Metode Bayar</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-300">{formatDateIndo(exp.date)}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">{exp.title}</td>
                      <td className="py-2.5 px-3 text-slate-400">{exp.paymentMethod}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                        {formatCurrency(exp.amount, exp.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Hapus catatan pengeluaran "${exp.title}"?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-4">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-rose-950/80 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Catat Pengeluaran Operasional</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Kategori Biaya <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="Operasional Kantor">Operasional Kantor & Sewa</option>
                  <option value="Bahan / Vendor">Bahan / Vendor & Spareparts</option>
                  <option value="Gaji & Honor">Gaji, Lembur & Honor Teknisi</option>
                  <option value="Transport & Logistik">Transport & Logistik Survey</option>
                  <option value="Utilitas & Internet">Internet, Server & Listrik</option>
                  <option value="Pemasaran">Pemasaran & Iklan</option>
                  <option value="Pajak & Legal">Pajak & Legalitas</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Keterangan Pengeluaran <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembelian Konektor RJ45 & Patchcord 50 Pcs"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nominal Biaya (Rp) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    value={newExpense.amount || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Tanggal Pengeluaran
                  </label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Metode Pembayaran
                </label>
                <input
                  type="text"
                  placeholder="Transfer BCA / Petty Cash / dsb."
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
