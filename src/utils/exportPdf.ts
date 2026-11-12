import jsPDF from 'jspdf';
import { DocumentRecord, CompanyProfile } from '../types';
import { formatCurrency, formatDateIndo, formatTerbilang } from './formatters';
import { COMPANY_LOGO_BASE64 } from '../data/logoBase64';

export function generateDocumentPdf(doc: DocumentRecord, company: CompanyProfile): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isQuotation = doc.type === 'quotation';
  const isProforma = doc.type === 'proforma';
  const isPaid = doc.status === 'paid';
  const isPO = doc.type === 'purchase_order';

  // Margins & Dimensions
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // Header Bar (Teal / Blue top accent)
  pdf.setFillColor(isPO ? 126 : 2, isPO ? 34 : 132, isPO ? 206 : 199);
  pdf.rect(0, 0, pageWidth, 4, 'F');

  // Embed Company Logo image at top left
  try {
    const logoImg = COMPANY_LOGO_BASE64 || company.logoUrl;
    if (logoImg) {
      pdf.addImage(logoImg, 'JPEG', margin, y - 6, 28, 18.6);
    }
  } catch (err) {
    console.warn('Could not add logo to PDF:', err);
  }

  // Company Name and Details (Offset to the right of the logo)
  const headerTextX = margin + 32;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(3, 105, 161);
  pdf.text(company.name, headerTextX, y - 1);

  // Status Badge / Watermark on top right
  pdf.setFontSize(10.5);
  if (isPO) {
    pdf.setTextColor(126, 34, 206); // Purple
    pdf.setDrawColor(126, 34, 206);
    pdf.roundedRect(pageWidth - margin - 42, y - 6, 42, 9, 2, 2, 'D');
    pdf.text('PURCHASE ORDER', pageWidth - margin - 40, y);
  } else if (isPaid) {
    pdf.setTextColor(22, 163, 74); // Green
    pdf.setDrawColor(22, 163, 74);
    pdf.roundedRect(pageWidth - margin - 35, y - 6, 35, 9, 2, 2, 'D');
    pdf.text('LUNAS / PAID', pageWidth - margin - 33, y);
  } else if (isProforma) {
    pdf.setTextColor(217, 119, 6); // Amber
    pdf.setDrawColor(217, 119, 6);
    pdf.roundedRect(pageWidth - margin - 38, y - 6, 38, 9, 2, 2, 'D');
    pdf.text('PROFORMA', pageWidth - margin - 34, y);
  } else {
    pdf.setTextColor(2, 132, 199);
    pdf.setDrawColor(2, 132, 199);
    pdf.roundedRect(pageWidth - margin - 40, y - 6, 40, 9, 2, 2, 'D');
    pdf.text(isQuotation ? 'PENAWARAN' : 'INVOICE', pageWidth - margin - 37, y);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.text(company.address, headerTextX, y + 4);
  pdf.text(`Telp/WA: ${company.phone}   |   Email: ${company.email}`, headerTextX, y + 8);
  // User requirement: Hilangkan nomer nib dan nomer NPWP di lembar penawaran
  if (!isQuotation) {
    pdf.text(`NPWP: ${company.npwp || '1000000010827045'}   |   NIB: ${company.nib || '2809260033791'}`, headerTextX, y + 12);
  }

  y += 16;
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);

  // Document Title & Number
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  const titleText = isPO 
    ? 'SURAT PESANAN PEMBELIAN (PURCHASE ORDER)'
    : (isQuotation 
      ? 'SURAT PENAWARAN HARGA' 
      : (isProforma ? 'PROFORMA INVOICE' : (isPaid ? 'FAKTUR INVOICE LUNAS' : 'FAKTUR INVOICE')));
  pdf.text(titleText, margin, y);

  pdf.setFontSize(9.5);
  pdf.setTextColor(isPO ? 126 : 2, isPO ? 34 : 132, isPO ? 206 : 199);
  pdf.text(`No: ${doc.documentNumber}`, pageWidth - margin, y, { align: 'right' });

  // Info Boxes (Client vs Document Details)
  y += 6;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, y, contentWidth * 0.52, 28, 'F');
  pdf.rect(margin + contentWidth * 0.55, y, contentWidth * 0.45, 28, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(margin, y, contentWidth * 0.52, 28, 'D');
  pdf.rect(margin + contentWidth * 0.55, y, contentWidth * 0.45, 28, 'D');

  // Left box: Client Info
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(isPO ? 126 : 3, isPO ? 34 : 105, isPO ? 206 : 161);
  pdf.text(isPO ? 'DITUJUKAN KEPADA VENDOR / REKANAN:' : 'DITUJUKAN KEPADA:', margin + 3, y + 5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text(doc.client.companyName || doc.client.name, margin + 3, y + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.text(`Attn: ${doc.poAttentionPic || doc.client.picName || doc.client.name}`, margin + 3, y + 14);
  pdf.text(`${doc.client.address ? doc.client.address.substring(0, 48) : '-'}`, margin + 3, y + 18);
  pdf.text(`Telp: ${doc.client.phone || '-'} | Email: ${doc.client.email || '-'}`, margin + 3, y + 22);
  // Hide NPWP on quotation sheets
  if (doc.client.npwp && !isQuotation) {
    pdf.text(`NPWP: ${doc.client.npwp}`, margin + 3, y + 26);
  }

  // Right box: Document Details
  const rightX = margin + contentWidth * 0.55 + 3;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.text(`Tanggal:`, rightX, y + 5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${formatDateIndo(doc.issueDate)}`, rightX + 28, y + 5);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  if (isPO) {
    pdf.text(`Target Kirim:`, rightX, y + 10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${formatDateIndo(doc.poDeliveryDate || doc.dueDate)}`, rightX + 28, y + 10);
  } else if (isQuotation) {
    pdf.text(`Berlaku Hingga:`, rightX, y + 10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${formatDateIndo(doc.validUntil || doc.dueDate)}`, rightX + 28, y + 10);
  } else {
    pdf.text(`Jatuh Tempo:`, rightX, y + 10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${formatDateIndo(doc.dueDate)}`, rightX + 28, y + 10);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  if (isPO && doc.poReferenceQuotationNumber) {
    pdf.text(`Ref. Quo Vendor:`, rightX, y + 15);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(126, 34, 206);
    pdf.text(`${doc.poReferenceQuotationNumber.substring(0, 18)}`, rightX + 28, y + 15);
  } else {
    pdf.text(`Syarat Bayar:`, rightX, y + 15);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${doc.paymentTerms || 'Net 14'}`, rightX + 28, y + 15);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);
  pdf.text(`Mata Uang:`, rightX, y + 20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${doc.currency} ${doc.currency !== 'IDR' ? `(Kurs: Rp ${doc.exchangeRate.toLocaleString('id-ID')})` : ''}`, rightX + 28, y + 20);

  if (isPaid && doc.paidAt) {
    pdf.setTextColor(22, 163, 74);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Lunas Pada: ${formatDateIndo(doc.paidAt)}`, rightX, y + 25);
  }

  y += 34;

  if (doc.title) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Perihal: ${doc.title}`, margin, y);
    y += 5;
  }

  // Items Table Header
  pdf.setFillColor(2, 132, 199);
  pdf.rect(margin, y, contentWidth, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);

  const colNo = margin + 3;
  const colDesc = margin + 14;
  const colQty = margin + 100;
  const colPrice = margin + 130;
  const colTotal = pageWidth - margin - 3;

  pdf.text('NO', colNo, y + 4.8);
  pdf.text('DESKRIPSI / SPESIFIKASI', colDesc, y + 4.8);
  pdf.text('QTY', colQty, y + 4.8);
  pdf.text('HARGA SATUAN', colPrice, y + 4.8);
  pdf.text('TOTAL', colTotal, y + 4.8, { align: 'right' });

  y += 7;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(31, 41, 55);

  doc.items.forEach((item, index) => {
    // Alternating zebra
    if (index % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, contentWidth, 8, 'F');
    }

    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y + 8, pageWidth - margin, y + 8);

    pdf.text(String(index + 1), colNo, y + 5.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.description.substring(0, 52), colDesc, y + 5.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${item.quantity} ${item.unit}`, colQty, y + 5.5);
    pdf.text(formatCurrency(item.unitPrice, doc.currency), colPrice, y + 5.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(item.total, doc.currency), colTotal, y + 5.5, { align: 'right' });

    y += 8;
  });

  // Totals Section
  y += 4;
  const totalBoxX = margin + contentWidth * 0.52;
  const totalBoxW = contentWidth * 0.48;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(75, 85, 99);
  pdf.text('Subtotal:', totalBoxX, y + 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(formatCurrency(doc.subtotal, doc.currency), pageWidth - margin, y + 4, { align: 'right' });

  y += 5;
  if (doc.discountAmount > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(220, 38, 38);
    pdf.text(`Diskon (${doc.discountType === 'percent' ? `${doc.discountValue}%` : 'Potongan'}):`, totalBoxX, y + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`-${formatCurrency(doc.discountAmount, doc.currency)}`, pageWidth - margin, y + 4, { align: 'right' });
    y += 5;
  }

  if (doc.taxAmount > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    pdf.text(`PPN (${doc.taxPercent}%):`, totalBoxX, y + 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(formatCurrency(doc.taxAmount, doc.currency), pageWidth - margin, y + 4, { align: 'right' });
    y += 5;
  }

  // Grand Total highlight bar
  pdf.setFillColor(2, 132, 199);
  pdf.rect(totalBoxX - 2, y + 2, totalBoxW + 2, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('TOTAL AKHIR:', totalBoxX + 2, y + 7.5);
  pdf.text(formatCurrency(doc.grandTotal, doc.currency), pageWidth - margin - 2, y + 7.5, { align: 'right' });

  // Terbilang box on the left
  const terbilangY = y - (doc.discountAmount > 0 ? 10 : 5);
  pdf.setFillColor(240, 253, 244);
  pdf.rect(margin, terbilangY, contentWidth * 0.48, 18, 'F');
  pdf.setDrawColor(187, 247, 208);
  pdf.rect(margin, terbilangY, contentWidth * 0.48, 18, 'D');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(22, 101, 52);
  pdf.text('Terbilang:', margin + 2, terbilangY + 4);
  pdf.setFont('helvetica', 'italic');
  const splitTerbilang = pdf.splitTextToSize(`# ${formatTerbilang(doc.grandTotal, doc.currency)} #`, contentWidth * 0.46);
  pdf.text(splitTerbilang, margin + 2, terbilangY + 8);

  y += 18;

  // Bank Info & Payment Instruction
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, y, contentWidth * 0.52, 22, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(margin, y, contentWidth * 0.52, 22, 'D');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(3, 105, 161);
  pdf.text('INSTRUKSI PEMBAYARAN BANK:', margin + 3, y + 5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Bank: ${doc.bankAccount.bankName}`, margin + 3, y + 10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`No. Rekening: ${doc.bankAccount.accountNumber}`, margin + 3, y + 14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Atas Nama: ${doc.bankAccount.accountHolder}`, margin + 3, y + 18);

  // Terms and Signature
  const sigX = margin + contentWidth * 0.65;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.text('Tangerang, ' + formatDateIndo(doc.issueDate), sigX, y + 5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(company.name, sigX, y + 9);

  // Embed Custom Signature Image if available (No circle stamp)
  const sigImg = doc.signatureImageUrl || company.defaultSignatureUrl;
  if (sigImg) {
    try {
      if (sigImg.startsWith('data:image/')) {
        const format = sigImg.includes('image/jpeg') ? 'JPEG' : 'PNG';
        pdf.addImage(sigImg, format, sigX + 2, y + 10, 36, 16);
      }
    } catch (e) {
      console.warn('Could not add signature image to PDF:', e);
    }
  }

  y += 28;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(doc.signedBy || company.directorName, sigX, y);
  pdf.setLineWidth(0.3);
  pdf.line(sigX, y + 1, sigX + 45, y + 1);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(75, 85, 99);
  pdf.text(doc.signerRole || company.directorRole, sigX, y + 5);

  // Bottom note: Terms
  if (doc.termsAndConditions.length > 0) {
    y += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Syarat & Ketentuan:', margin, y);
    y += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    doc.termsAndConditions.slice(0, 3).forEach((term, idx) => {
      pdf.text(`${idx + 1}. ${term}`, margin, y);
      y += 3.5;
    });
  }

  return pdf;
}

export function exportDocumentToPdf(doc: DocumentRecord, company: CompanyProfile): void {
  const pdf = generateDocumentPdf(doc, company);
  const filename = `${doc.documentNumber.replace(/\//g, '_')}.pdf`;
  pdf.save(filename);
}

export function generateDocumentPdfBlob(doc: DocumentRecord, company: CompanyProfile): Blob {
  const pdf = generateDocumentPdf(doc, company);
  return pdf.output('blob');
}

export function printDocument(): void {
  window.print();
}
