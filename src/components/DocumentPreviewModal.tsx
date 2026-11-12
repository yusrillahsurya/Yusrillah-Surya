import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileCode, 
  Mail, 
  CreditCard, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  FileCheck2,
  Clock,
  ShieldCheck,
  Share2,
  Cloud,
  ExternalLink
} from 'lucide-react';
import { DocumentRecord, CompanyProfile } from '../types';
import { formatCurrency, formatDateIndo, formatTerbilang } from '../utils/formatters';
import { exportDocumentToWord } from '../utils/exportDocx';
import { exportDocumentToPdf, generateDocumentPdfBlob, printDocument } from '../utils/exportPdf';
import { COMPANY_LOGO_BASE64 } from '../data/logoBase64';
import { getAccessToken, googleSignIn } from '../services/googleAuth';
import { uploadBlobToDrive } from '../services/googleDrive';

interface DocumentPreviewModalProps {
  document: DocumentRecord;
  company: CompanyProfile;
  onClose: () => void;
  onPay: () => void;
  onEmail: () => void;
  onEdit: () => void;
  onUpdateSignature?: (docId: string, newSignatureUrl: string) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  company,
  onClose,
  onPay,
  onEmail,
  onEdit,
  onUpdateSignature,
}) => {
  const isPaid = doc.status === 'paid';
  const isQuo = doc.type === 'quotation';
  const isProforma = doc.type === 'proforma';
  const isPO = doc.type === 'purchase_order';
  const logoSrc = COMPANY_LOGO_BASE64 || company.logoUrl;
  const currentSignature = doc.signatureImageUrl || company.defaultSignatureUrl;

  const [isUploadingToDrive, setIsUploadingToDrive] = React.useState(false);
  const [driveUploadResult, setDriveUploadResult] = React.useState<{ success: boolean; link?: string; message: string } | null>(null);

  const handleSaveToDrive = async () => {
    setIsUploadingToDrive(true);
    setDriveUploadResult(null);
    try {
      let accessToken = await getAccessToken();
      if (!accessToken) {
        const authRes = await googleSignIn();
        if (authRes) {
          accessToken = authRes.accessToken;
        }
      }

      if (!accessToken) {
        throw new Error('Gagal menghubungkan akun Google Drive');
      }

      const pdfBlob = generateDocumentPdfBlob(doc, company);
      const fileName = `${doc.documentNumber.replace(/\//g, '_')}_${doc.type}.pdf`;

      const uploaded = await uploadBlobToDrive({
        fileName,
        blob: pdfBlob,
        mimeType: 'application/pdf',
        description: `Dokumen resmi ${doc.documentNumber} (${doc.title}) untuk klien ${doc.client.name}`,
        token: accessToken,
      });

      setDriveUploadResult({
        success: true,
        link: uploaded.webViewLink,
        message: `Tersimpan di Google Drive (${uploaded.name})`,
      });
    } catch (err: any) {
      console.error(err);
      setDriveUploadResult({
        success: false,
        message: err?.message || 'Gagal menyimpan ke Google Drive',
      });
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleUploadModalSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateSignature) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateSignature(doc.id, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[96vh] flex flex-col">
        {/* Top Action Toolbar (No Print) */}
        <div className="no-print p-4 bg-slate-800/95 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
              isPO
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : (isPaid 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : (isProforma 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'))
            }`}>
              {isPO ? 'PURCHASE ORDER (PO)' : (isPaid ? 'LUNAS / PAID' : (isProforma ? 'PROFORMA INVOICE' : (isQuo ? 'SURAT PENAWARAN' : 'INVOICE TAGIHAN')))}
            </span>
            <span className="text-xs font-mono text-slate-300 font-semibold">
              {doc.documentNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Print Button */}
            <button
              onClick={() => printDocument()}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cetak via Browser (Print / Save as PDF)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            {/* Direct Download PDF */}
            <button
              onClick={() => exportDocumentToPdf(doc, company)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download File PDF Resmi"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>

            {/* Direct Download Word */}
            <button
              onClick={() => exportDocumentToWord(doc, company)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download File Microsoft Word (.doc)"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Unduh Word</span>
            </button>

            {/* Send Email / WhatsApp */}
            <button
              onClick={onEmail}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Kirim ke Klien via Email / WhatsApp"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Kirim Email / WA</span>
            </button>

            {/* Google Drive Upload Button */}
            <button
              onClick={handleSaveToDrive}
              disabled={isUploadingToDrive}
              className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Simpan file PDF resmi langsung ke Google Drive Anda"
            >
              <Cloud className={`w-3.5 h-3.5 ${isUploadingToDrive ? 'animate-bounce text-cyan-300' : ''}`} />
              <span>{isUploadingToDrive ? 'Menyimpan...' : 'Simpan ke Drive'}</span>
            </button>

            {/* Pay Button if not paid */}
            {!isPaid && !isQuo && (
              <button
                onClick={onPay}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Buka Portal Pembayaran Gateway Klien"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Bayar Sekarang</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-2"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drive Upload Notification Toast (if any) */}
        {driveUploadResult && (
          <div className={`no-print px-4 py-2.5 text-xs flex items-center justify-between gap-3 border-b ${
            driveUploadResult.success 
              ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300' 
              : 'bg-rose-950/80 border-rose-700/60 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 shrink-0" />
              <span>{driveUploadResult.message}</span>
            </div>
            <div className="flex items-center gap-2">
              {driveUploadResult.link && (
                <a
                  href={driveUploadResult.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1 text-[11px]"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka di Google Drive</span>
                </a>
              )}
              <button
                onClick={() => setDriveUploadResult(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer ml-1"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Document Body (Printable Paper Sheet) */}
        <div className="overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/70">
          <div className="print-container w-full max-w-3xl bg-white text-slate-800 rounded-xl shadow-2xl p-6 sm:p-10 relative overflow-hidden text-xs">
            
            {/* Watermark for PAID status */}
            {isPaid && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-15 rotate-[-30deg]">
                <div className="border-8 border-dashed border-emerald-600 rounded-3xl p-8 text-center">
                  <div className="text-7xl font-black text-emerald-600 tracking-widest">
                    LUNAS
                  </div>
                  <div className="text-xl font-bold text-emerald-700 tracking-wider mt-2 uppercase">
                    PAID IN FULL - VERIFIED
                  </div>
                </div>
              </div>
            )}

            {/* Watermark for PROFORMA status */}
            {isProforma && !isPaid && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-10 rotate-[-30deg]">
                <div className="border-8 border-dashed border-amber-600 rounded-3xl p-8 text-center">
                  <div className="text-6xl font-black text-amber-600 tracking-widest">
                    PROFORMA
                  </div>
                  <div className="text-lg font-bold text-amber-700 tracking-wider mt-2 uppercase">
                    TAGIHAN SEMENTARA / DP
                  </div>
                </div>
              </div>
            )}

            {/* Official Letterhead (KOP SURAT) */}
            <div className="border-b-2 border-slate-300 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Logo & Company Identity */}
                <div className="flex items-center gap-4">
                  <div className="w-28 h-20 sm:w-32 sm:h-22 shrink-0 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center print:border-none print:shadow-none">
                    <img 
                      src={logoSrc} 
                      alt={company.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-sky-800">
                      {company.name}
                    </h1>
                    <p className="text-[11px] font-semibold text-emerald-700 tracking-wide mt-0.5">
                      {company.tagline}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      {company.address}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Telp/WA: <strong>{company.phone}</strong> | Email: <strong>{company.email}</strong>
                    </p>
                    {/* Hide NIB and NPWP on quotation sheet (Surat Penawaran) per user request */}
                    {!isQuo && (
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        NPWP: {company.npwp} | NIB: {company.nib}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Stamp Top Right */}
                <div className="text-right">
                  {isPO ? (
                    <div className="inline-block border-2 border-purple-600 text-purple-700 font-extrabold px-3 py-1.5 rounded-lg text-center uppercase tracking-wider bg-purple-50">
                      <div className="text-xs">JENIS:</div>
                      <div className="text-sm">PURCHASE ORDER</div>
                    </div>
                  ) : isPaid ? (
                    <div className="inline-block border-2 border-emerald-600 text-emerald-700 font-extrabold px-3 py-1.5 rounded-lg text-center uppercase tracking-wider bg-emerald-50">
                      <div className="text-xs">STATUS:</div>
                      <div className="text-sm">LUNAS / PAID</div>
                      {doc.paidAt && (
                        <div className="text-[9px] font-normal text-emerald-800 lowercase">
                          {formatDateIndo(doc.paidAt)}
                        </div>
                      )}
                    </div>
                  ) : isProforma ? (
                    <div className="inline-block border-2 border-amber-600 text-amber-700 font-extrabold px-3 py-1.5 rounded-lg text-center uppercase tracking-wider bg-amber-50">
                      <div className="text-xs">JENIS:</div>
                      <div className="text-sm">PROFORMA INVOICE</div>
                    </div>
                  ) : isQuo ? (
                    <div className="inline-block border-2 border-sky-600 text-sky-700 font-extrabold px-3 py-1.5 rounded-lg text-center uppercase tracking-wider bg-sky-50">
                      <div className="text-xs">JENIS:</div>
                      <div className="text-sm">PENAWARAN HARGA</div>
                    </div>
                  ) : (
                    <div className="inline-block border-2 border-slate-700 text-slate-800 font-extrabold px-3 py-1.5 rounded-lg text-center uppercase tracking-wider bg-slate-50">
                      <div className="text-xs">STATUS:</div>
                      <div className="text-sm">BELUM LUNAS</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Title & Meta Box */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-black tracking-wide text-slate-900 uppercase">
                {isPO && 'SURAT PESANAN PEMBELIAN / PURCHASE ORDER (PO)'}
                {isQuo && 'SURAT PENAWARAN HARGA'}
                {isProforma && 'PROFORMA INVOICE'}
                {doc.type === 'invoice' && (isPaid ? 'FAKTUR INVOICE LUNAS' : 'FAKTUR INVOICE')}
              </h2>
              <div className="text-sm font-bold text-sky-700 font-mono mt-0.5">
                Nomor: {doc.documentNumber}
              </div>
              {doc.title && (
                <div className="text-xs font-semibold text-slate-600 mt-1 max-w-xl mx-auto italic">
                  Perihal: {doc.title}
                </div>
              )}
            </div>

            {/* Information Grid: Client & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Client or Vendor Box */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isPO ? 'text-purple-800' : 'text-sky-800'}`}>
                  {isPO ? 'Ditujukan Kepada (Vendor / Rekanan):' : 'Ditujukan Kepada:'}
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {doc.client.companyName || doc.client.name}
                </div>
                <div className="text-slate-700 font-medium mt-0.5">
                  Attn: {doc.poAttentionPic || doc.client.picName || doc.client.name}
                </div>
                <div className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  {doc.client.address || '-'}
                </div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  Telp: {doc.client.phone || '-'} | Email: {doc.client.email || '-'}
                </div>
                {/* Hide NPWP on quotation sheets */}
                {!isQuo && doc.client.npwp && (
                  <div className="text-slate-500 text-[10px] font-mono mt-0.5">
                    NPWP: {doc.client.npwp}
                  </div>
                )}
              </div>

              {/* Document Meta Info */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isPO ? 'text-purple-800' : 'text-sky-800'}`}>
                  Rincian Dokumen:
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Terbit:</span>
                  <span className="font-semibold text-slate-800">{formatDateIndo(doc.issueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {isPO ? 'Target Pengiriman:' : (isQuo ? 'Berlaku Hingga:' : 'Jatuh Tempo:')}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatDateIndo(isPO ? (doc.poDeliveryDate || doc.dueDate) : (isQuo ? (doc.validUntil || doc.dueDate) : doc.dueDate))}
                  </span>
                </div>
                {isPO && doc.poReferenceQuotationNumber && (
                  <div className="flex justify-between text-purple-900 font-medium">
                    <span>Ref. Penawaran Vendor:</span>
                    <span className="font-mono font-bold text-purple-700">{doc.poReferenceQuotationNumber}</span>
                  </div>
                )}
                {isPO && doc.poDeliveryAddress && (
                  <div className="flex justify-between text-slate-700 text-[11px]">
                    <span className="text-slate-500 shrink-0">Alamat Kirim:</span>
                    <span className="font-medium text-right text-slate-800 max-w-[180px] truncate" title={doc.poDeliveryAddress}>
                      {doc.poDeliveryAddress}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Syarat Pembayaran:</span>
                  <span className="font-semibold text-slate-800">{doc.paymentTerms || 'Sesuai Kontrak'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mata Uang:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {doc.currency} {doc.currency !== 'IDR' ? `(Kurs: Rp ${doc.exchangeRate.toLocaleString('id-ID')})` : ''}
                  </span>
                </div>
                {isPaid && doc.paymentMethod && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Metode Pelunasan:</span>
                    <span>{doc.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-sky-800 text-white font-bold">
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Deskripsi Barang / Layanan</th>
                    <th className="py-2.5 px-3 text-center w-24">Kuantitas</th>
                    <th className="py-2.5 px-3 text-right w-28">Harga Satuan</th>
                    <th className="py-2.5 px-3 text-right w-32">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {doc.items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-500">{index + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.description}</div>
                        {item.specification && (
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5 whitespace-pre-wrap">
                            {item.specification}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-700 whitespace-nowrap">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                        {formatCurrency(item.unitPrice, doc.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(item.total, doc.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Terbilang Section */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mb-6">
              {/* Left Side: Terbilang & Bank Instruction */}
              <div className="sm:col-span-7 space-y-3">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                  <span className="font-bold block uppercase tracking-wide text-emerald-800 text-[10px]">
                    Jumlah Terbilang:
                  </span>
                  <div className="italic font-medium mt-0.5">
                    # {formatTerbilang(doc.grandTotal, doc.currency)} #
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                  <span className="font-bold text-sky-800 block uppercase tracking-wide text-[10px] mb-1">
                    Instruksi Pembayaran Bank:
                  </span>
                  <div>Bank: <strong>{doc.bankAccount.bankName}</strong></div>
                  <div>No. Rekening: <strong className="font-mono text-xs">{doc.bankAccount.accountNumber}</strong></div>
                  <div>Atas Nama: <strong>{doc.bankAccount.accountHolder}</strong></div>
                  <div className="text-[10px] text-slate-500 mt-1 italic">
                    * Mohon cantumkan nomor dokumen ({doc.documentNumber}) pada kolom berita transfer.
                  </div>
                </div>
              </div>

              {/* Right Side: Price Breakdown */}
              <div className="sm:col-span-5 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-800">{formatCurrency(doc.subtotal, doc.currency)}</span>
                </div>

                {doc.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon {doc.discountType === 'percent' ? `(${doc.discountValue}%)` : ''}:</span>
                    <span className="font-mono font-semibold">-{formatCurrency(doc.discountAmount, doc.currency)}</span>
                  </div>
                )}

                {doc.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>PPN ({doc.taxPercent}%):</span>
                    <span className="font-mono font-semibold text-slate-800">{formatCurrency(doc.taxAmount, doc.currency)}</span>
                  </div>
                )}

                <div className="border-t-2 border-slate-300 pt-2 flex justify-between items-center text-slate-900">
                  <span className="font-bold text-sm">TOTAL AKHIR:</span>
                  <span className="font-mono font-black text-base text-sky-800">
                    {formatCurrency(doc.grandTotal, doc.currency)}
                  </span>
                </div>

                {isPaid && (
                  <div className="border-t border-emerald-300 pt-1 flex justify-between items-center text-emerald-700 font-bold">
                    <span>Telah Dibayar (Paid):</span>
                    <span className="font-mono">{formatCurrency(doc.amountPaid || doc.grandTotal, doc.currency)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Signature Section */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-slate-200">
              {/* Terms */}
              <div className="sm:col-span-7">
                <div className="text-[11px] font-bold text-slate-800 mb-1">
                  Syarat & Ketentuan:
                </div>
                <ol className="list-decimal list-inside text-[10px] text-slate-600 space-y-1 leading-relaxed">
                  {doc.termsAndConditions.map((term, i) => (
                    <li key={i}>{term}</li>
                  ))}
                </ol>
                {doc.notes && (
                  <div className="mt-2 text-[10px] text-slate-600">
                    <strong>Catatan:</strong> {doc.notes}
                  </div>
                )}
              </div>

              {/* Official Signature & Digital Stamp */}
              <div className="sm:col-span-5 text-center flex flex-col items-center justify-end">
                <div className="text-[11px] text-slate-600">
                  Kab. Tangerang, {formatDateIndo(doc.issueDate)}
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {company.name}
                </div>

                {/* Signature Display (Pure uploaded signature, no circle/stamp) */}
                <div className="relative my-2 w-48 h-20 flex items-center justify-center group">
                  {/* Render Custom Uploaded Signature Image */}
                  {currentSignature ? (
                    <img
                      src={currentSignature}
                      alt="Tanda Tangan Sah"
                      className="max-h-20 max-w-[170px] object-contain select-none print:max-h-20"
                    />
                  ) : (
                    <div className="italic font-serif text-slate-700 text-sm select-none opacity-90 pt-3">
                      {doc.signedBy || company.directorName}
                    </div>
                  )}

                  {/* Quick Upload Button (Hidden on Print) */}
                  <label className="no-print absolute bottom-0 right-0 z-20 px-2 py-0.5 rounded bg-slate-900/90 text-cyan-300 border border-slate-700 text-[9px] font-semibold cursor-pointer opacity-70 hover:opacity-100 hover:bg-cyan-600 hover:text-white transition-all shadow-md">
                    <span>Ganti TTD</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadModalSignature}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="border-t border-slate-400 w-48 mt-1 pt-0.5">
                  <div className="font-bold text-slate-900 underline text-xs">
                    {doc.signedBy || company.directorName}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    {doc.signerRole || company.directorRole}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400">
              Dokumen ini diterbitkan secara sah oleh Sistem Informasi Keuangan PT Yusra Prima Solusindo | Kantor: Veteran Kavling No9c Kab. Tangerang Banten 15540 | Telp: 08318666847
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
