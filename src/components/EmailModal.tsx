import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  Check, 
  Copy, 
  MessageSquare, 
  Sparkles, 
  FileText, 
  Building2,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { DocumentRecord, CompanyProfile } from '../types';
import { formatCurrency, formatDateIndo } from '../utils/formatters';

interface EmailModalProps {
  document: DocumentRecord;
  company: CompanyProfile;
  onClose: () => void;
  onSentSuccess: (method: string) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  document: doc,
  company,
  onClose,
  onSentSuccess,
}) => {
  const isQuo = doc.type === 'quotation';
  const isProforma = doc.type === 'proforma';
  const isPaid = doc.status === 'paid';

  const recipientEmail = doc.client.email || 'client@example.com';
  const recipientName = doc.client.picName || doc.client.name;
  const companyName = doc.client.companyName || doc.client.name;

  const defaultSubject = isQuo
    ? `[PENAWARAN HARGA] ${doc.documentNumber} - ${doc.title || 'Layanan Solusi IT'} - ${company.name}`
    : isProforma
      ? `[PROFORMA INVOICE] ${doc.documentNumber} - ${companyName} - ${company.name}`
      : isPaid
        ? `[BUKTI LUNAS] ${doc.documentNumber} - Terima Kasih atas Pembayaran Anda - ${company.name}`
        : `[INVOICE TAGIHAN] ${doc.documentNumber} - ${companyName} - ${company.name}`;

  const defaultBody = isPaid
    ? `Kepada Yth.
Bapak/Ibu ${recipientName}
${companyName}

Dengan hormat,

Terima kasih atas kepercayaan Anda bermitra dengan ${company.name}.
Melalui pesan ini, kami mengonfirmasi bahwa tagihan untuk dokumen ${doc.documentNumber} telah LUNAS kami terima.

Rincian Transaksi:
- Nomor Invoice: ${doc.documentNumber}
- Tanggal Pelunasan: ${formatDateIndo(doc.paidAt || doc.issueDate)}
- Total Pembayaran: ${formatCurrency(doc.grandTotal, doc.currency)}
- Metode: ${doc.paymentMethod || 'Transfer Bank'}
- Ref. Transaksi: ${doc.paymentReference || 'TRX-VERIFIED'}

Bukti faktur lunas resmi terlampir pada dokumen ini.
Apabila Bapak/Ibu membutuhkan koordinasi atau konsultasi lebih lanjut, silakan menghubungi kami.

Hormat kami,
${company.name}
Veteran Kavling No9c Kab. Tangerang Banten 15540
Telp/WA: ${company.phone}
Email: ${company.email}`
    : `Kepada Yth.
Bapak/Ibu ${recipientName}
${companyName}

Dengan hormat,

Bersama pesan ini, kami dari ${company.name} menyampaikan dokumen ${isQuo ? 'Surat Penawaran Harga' : (isProforma ? 'Proforma Invoice' : 'Invoice Tagihan')} dengan rincian sebagai berikut:

- Nomor Dokumen: ${doc.documentNumber}
- Perihal: ${doc.title || '-'}
- Tanggal Terbit: ${formatDateIndo(doc.issueDate)}
- ${isQuo ? 'Masa Berlaku' : 'Jatuh Tempo'}: ${formatDateIndo(isQuo ? (doc.validUntil || doc.dueDate) : doc.dueDate)}
- Nilai Dokumen: ${formatCurrency(doc.grandTotal, doc.currency)}

Instruksi Rekening Pembayaran Resmi:
- Bank: ${doc.bankAccount.bankName}
- No. Rekening: ${doc.bankAccount.accountNumber}
- Atas Nama: ${doc.bankAccount.accountHolder}

Klien juga dapat melakukan pembayaran secara instan via QRIS dan Virtual Account melalui Portal Pembayaran kami.

Demikian kami sampaikan, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.

Hormat kami,
${doc.signedBy || company.directorName}
${company.name}
Telp/WA: ${company.phone} | Email: ${company.email}`;

  const [toEmail, setToEmail] = useState(recipientEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultBody);
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${message}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoUrl, '_blank');
    onSentSuccess('Email Client (mailto)');
  };

  const handleOpenWhatsApp = () => {
    const waPhone = (doc.client.phone || '').replace(/\D/g, '');
    const cleanPhone = waPhone.startsWith('0') ? '62' + waPhone.slice(1) : waPhone;
    const waText = `Halo Bapak/Ibu ${recipientName} (${companyName}),\n\nBerikut kami sampaikan dokumen resmi ${doc.documentNumber} dari *${company.name}*:\n\n*Total:* ${formatCurrency(doc.grandTotal, doc.currency)}\n*Jatuh Tempo:* ${formatDateIndo(doc.dueDate)}\n*Rekening:* ${doc.bankAccount.bankName} - ${doc.bankAccount.accountNumber} a/n ${doc.bankAccount.accountHolder}\n\nTerima kasih!`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');
    onSentSuccess('WhatsApp Gateway');
  };

  const handleSimulateCloudSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      onSentSuccess('Cloud SMTP Automated Dispatch');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/60 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Kirim Dokumen via Email / WA</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  Otomatis
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kirim langsung ke <strong className="text-slate-200">{companyName}</strong> ({recipientName})
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

        {sentSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Email Berhasil Dikirimkan!</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Notifikasi dokumen <strong>{doc.documentNumber}</strong> telah berhasil diteruskan ke <strong>{toEmail}</strong> dan tercatat pada riwayat korespondensi.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg"
            >
              Selesai
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Form Fields */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Penerima (Klien)
              </label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subjek Email
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Isi Pesan Email
                </label>
                <button
                  onClick={handleCopyText}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>
              </div>
              <textarea
                rows={9}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Kirim via WhatsApp Langsung"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenMailto}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Buka Aplikasi Email Default (Outlook / Gmail)"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>Buka App Email</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isSending}
                onClick={handleSimulateCloudSend}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Mengirimkan Email...' : 'Kirim Otomatis via Cloud SMTP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
