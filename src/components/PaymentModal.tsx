import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Building, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Upload,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DocumentRecord, CompanyProfile } from '../types';
import { formatCurrency, formatDateIndo } from '../utils/formatters';

interface PaymentModalProps {
  document: DocumentRecord;
  company: CompanyProfile;
  onClose: () => void;
  onPaymentSuccess: (docId: string, paymentMethod: string, reference: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  document: doc,
  company,
  onClose,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'qris' | 'va' | 'transfer' | 'card'>('qris');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedBankVA, setSelectedBankVA] = useState<'bca' | 'mandiri' | 'bni' | 'bri'>('bca');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentDone, setPaymentDone] = useState<boolean>(doc.status === 'paid');

  // Generate unique VA Number based on document ID & selected bank
  const getVANumber = () => {
    const rawNumber = doc.documentNumber.replace(/\D/g, '') || '202611';
    switch (selectedBankVA) {
      case 'bca':
        return `80777${rawNumber.padStart(8, '0')}`;
      case 'mandiri':
        return `88908${rawNumber.padStart(8, '0')}`;
      case 'bni':
        return `8277${rawNumber.padStart(9, '0')}`;
      case 'bri':
        return `12800${rawNumber.padStart(8, '0')}`;
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulatePayment = (methodName: string) => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setPaymentDone(true);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6', '#f59e0b']
        });
      } catch (e) {
        // Safe fallback
      }

      const refNumber = `TRX-${Date.now().toString().slice(-8)}`;
      onPaymentSuccess(doc.id, methodName, refNumber);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Portal Pelunasan Invoice</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Instant Gateway
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tagihan untuk <strong className="text-slate-200">{doc.client.companyName || doc.client.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentDone ? (
          /* Payment Success State */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Pembayaran Berhasil Dikonfirmasi
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Invoice Telah LUNAS</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Pelunasan sejumlah <strong className="text-emerald-400">{formatCurrency(doc.grandTotal, doc.currency)}</strong> untuk dokumen <strong>{doc.documentNumber}</strong> telah sukses diverifikasi dan tercatat ke Buku Arus Kas.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-left space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between text-slate-400">
                <span>No. Referensi:</span>
                <span className="font-mono text-white font-bold">{doc.paymentReference || 'TRX-SUCCESS-9921'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Waktu Pelunasan:</span>
                <span className="text-slate-200">{formatDateIndo(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status Dokumen:</span>
                <span className="text-emerald-400 font-bold">LUNAS / PAID (100%)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Kembali ke Dokumen
              </button>
            </div>
          </div>
        ) : (
          /* Payment Process State */
          <div className="p-5 sm:p-6 space-y-5">
            {/* Amount Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 font-medium">Total Tagihan Yang Harus Dibayar:</span>
                <div className="text-2xl font-black text-cyan-400 font-mono mt-0.5">
                  {formatCurrency(doc.grandTotal, doc.currency)}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div>No. Invoice: <strong className="text-white font-mono">{doc.documentNumber}</strong></div>
                <div className="text-[11px] text-slate-500">Jatuh Tempo: {formatDateIndo(doc.dueDate)}</div>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('qris')}
                className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'qris'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QRIS</span>
              </button>

              <button
                onClick={() => setActiveTab('va')}
                className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'va'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Virtual Account</span>
              </button>

              <button
                onClick={() => setActiveTab('transfer')}
                className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'transfer'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Transfer Bank</span>
              </button>

              <button
                onClick={() => setActiveTab('card')}
                className={`py-2 px-1 rounded-lg font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'card'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Kartu Kredit</span>
              </button>
            </div>

            {/* Tab 1: QRIS */}
            {activeTab === 'qris' && (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-xl bg-white text-slate-900 inline-block shadow-lg mx-auto border-4 border-cyan-500/20">
                  <div className="w-48 h-48 mx-auto flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PT%20YUSRA%20PRIMA%20SOLUSINDO%20-%20INV%20${doc.documentNumber}%20-%20TOTAL%20${doc.grandTotal}`}
                      alt="QRIS Pembayaran"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-wider">
                    QRIS Standar Pembayaran Nasional
                  </div>
                  <div className="text-[9px] text-slate-400">
                    BCA Mobile, GoPay, OVO, ShopeePay, Dana, LinkAja
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 max-w-sm mx-auto text-left space-y-1">
                  <span className="font-semibold text-white block">Cara Pembayaran QRIS:</span>
                  <ol className="list-decimal list-inside text-slate-400 text-[11px] space-y-0.5">
                    <li>Buka aplikasi m-Banking atau E-Wallet pilihan Anda.</li>
                    <li>Pilih menu <strong>Scan QRIS</strong> dan arahkan kamera ke barcode di atas.</li>
                    <li>Periksa nama merchant: <strong>PT YUSRA PRIMA SOLUSINDO</strong>.</li>
                    <li>Konfirmasi nominal dan masukkan PIN transaksi Anda.</li>
                  </ol>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSimulatePayment('QRIS Nasional')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? 'Memverifikasi Pembayaran...' : 'Simulasikan Pembayaran Sukses (QRIS)'}
                </button>
              </div>
            )}

            {/* Tab 2: Virtual Account */}
            {activeTab === 'va' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {(['bca', 'mandiri', 'bni', 'bri'] as const).map((bank) => (
                    <button
                      key={bank}
                      onClick={() => setSelectedBankVA(bank)}
                      className={`p-2 rounded-xl border text-center text-xs font-bold uppercase transition-all cursor-pointer ${
                        selectedBankVA === bank
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {bank.toUpperCase()} VA
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">
                      Nomor {selectedBankVA.toUpperCase()} Virtual Account:
                    </span>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="font-mono font-bold text-base text-cyan-400 tracking-wider">
                        {getVANumber()}
                      </span>
                      <button
                        onClick={() => copyToClipboard(getVANumber(), 'va')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'va' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'va' ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">
                      Total Nominal Pembayaran:
                    </span>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="font-mono font-bold text-sm text-white">
                        {formatCurrency(doc.grandTotal, doc.currency)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(String(doc.grandTotal), 'amt')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'amt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'amt' ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSimulatePayment(`${selectedBankVA.toUpperCase()} Virtual Account`)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? 'Memverifikasi Pembayaran VA...' : 'Simulasikan Pembayaran Sukses (VA)'}
                </button>
              </div>
            )}

            {/* Tab 3: Transfer Bank Manual */}
            {activeTab === 'transfer' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                      Rekening Resmi Perusahaan:
                    </span>
                    <div className="font-bold text-white text-sm">{company.defaultBank.bankName}</div>
                    <div className="font-mono text-base text-cyan-300 font-bold my-1">
                      {company.defaultBank.accountNumber}
                    </div>
                    <div className="text-xs text-slate-300">
                      Atas Nama: <strong>{company.defaultBank.accountHolder}</strong>
                    </div>
                  </div>

                  {company.secondaryBank && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="font-bold text-white text-sm">{company.secondaryBank.bankName}</div>
                      <div className="font-mono text-base text-cyan-300 font-bold my-1">
                        {company.secondaryBank.accountNumber}
                      </div>
                      <div className="text-xs text-slate-300">
                        Atas Nama: <strong>{company.secondaryBank.accountHolder}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 block mb-1">
                    Konfirmasi Bukti Transfer:
                  </span>
                  Setelah melakukan transfer, sistem akan otomatis mencocokkan mutasi rekening atau Anda dapat mengklik tombol konfirmasi instan di bawah ini.
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSimulatePayment('Transfer Bank Manual')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isProcessing ? 'Memverifikasi Transfer...' : 'Konfirmasi Bukti Transfer Diterima (Lunas)'}
                </button>
              </div>
            )}

            {/* Tab 4: Kartu Kredit / Debit Online */}
            {activeTab === 'card' && (
              <div className="space-y-4">
                <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-700/80">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Nomor Kartu Kredit / Debit (Visa / Mastercard)
                    </label>
                    <input
                      type="text"
                      defaultValue="4111 •••• •••• 4242"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Masa Berlaku (MM/YY)
                      </label>
                      <input
                        type="text"
                        defaultValue="12/28"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Kode CVV
                      </label>
                      <input
                        type="password"
                        defaultValue="888"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs text-center focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSimulatePayment('Kartu Kredit / Debit')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isProcessing ? 'Memproses Otorisasi Bank...' : `Bayar Sekarang ${formatCurrency(doc.grandTotal, doc.currency)}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
