import { DocumentRecord, CompanyProfile } from '../types';
import { formatCurrency, formatDateIndo, formatTerbilang } from './formatters';
import { COMPANY_LOGO_BASE64 } from '../data/logoBase64';

export function exportDocumentToWord(doc: DocumentRecord, company: CompanyProfile): void {
  const isQuotation = doc.type === 'quotation';
  const isProforma = doc.type === 'proforma';
  const isPaid = doc.status === 'paid';
  const isPO = doc.type === 'purchase_order';

  const docTitle = isPO
    ? 'SURAT PESANAN PEMBELIAN / PURCHASE ORDER (PO)'
    : (isQuotation 
      ? 'SURAT PENAWARAN HARGA' 
      : (isProforma 
        ? 'PROFORMA INVOICE' 
        : (isPaid 
          ? 'INVOICE LUNAS (PAID)' 
          : 'INVOICE TAGIHAN')));

  const itemsHtml = doc.items.map((item, idx) => `
    <tr>
      <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${idx + 1}</td>
      <td style="border: 1px solid #d1d5db; padding: 8px;">
        <strong>${item.description}</strong>
        ${item.specification ? `<div style="font-size: 11px; color: #4b5563;">${item.specification}</div>` : ''}
      </td>
      <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${item.quantity} ${item.unit}</td>
      <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${formatCurrency(item.unitPrice, doc.currency)}</td>
      <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;"><strong>${formatCurrency(item.total, doc.currency)}</strong></td>
    </tr>
  `).join('');

  const termsHtml = doc.termsAndConditions.map((term, i) => `
    <li style="margin-bottom: 4px;">${term}</li>
  `).join('');

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${doc.documentNumber} - ${company.name}</title>
      <style>
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          color: #1f2937;
          margin: 30px;
          line-height: 1.4;
        }
        .header-table {
          width: 100%;
          border-bottom: 3px double #0284c7;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .company-name {
          font-size: 20px;
          font-weight: bold;
          color: #0369a1;
          letter-spacing: 0.5px;
        }
        .company-info {
          font-size: 11px;
          color: #4b5563;
          margin-top: 4px;
        }
        .doc-title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0 10px 0;
          color: #0f172a;
          text-transform: uppercase;
        }
        .doc-number {
          font-size: 13px;
          text-align: center;
          color: #0284c7;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .info-grid {
          width: 100%;
          margin-bottom: 20px;
        }
        .info-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px;
          font-size: 12px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 15px;
          font-size: 12px;
        }
        .items-table th {
          background-color: #0284c7;
          color: #ffffff;
          padding: 10px 8px;
          text-align: left;
          border: 1px solid #0284c7;
        }
        .total-section {
          width: 100%;
          margin-top: 10px;
        }
        .terbilang-box {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 10px;
          font-style: italic;
          font-size: 12px;
          margin: 15px 0;
          color: #166534;
        }
        .stamp-badge {
          display: inline-block;
          border: 2px solid ${isPaid ? '#16a34a' : '#0284c7'};
          color: ${isPaid ? '#16a34a' : '#0284c7'};
          padding: 6px 16px;
          font-weight: bold;
          font-size: 14px;
          text-transform: uppercase;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <!-- Header / Kop Surat dengan Logo PT -->
      <table class="header-table" width="100%">
        <tr>
          <td width="20%" valign="middle">
            <img src="${COMPANY_LOGO_BASE64}" width="115" height="76" alt="${company.name}" style="max-width: 115px; height: auto;" />
          </td>
          <td width="55%" valign="middle" style="padding-left: 10px;">
            <div class="company-name">${company.name}</div>
            <div style="font-size: 11px; color: #047857; font-weight: bold;">${company.tagline}</div>
            <div class="company-info">
              ${company.address}<br>
              Telp / WhatsApp: ${company.phone} | Email: ${company.email}<br>
              ${!isQuotation ? `NPWP: ${company.npwp || '1000000010827045'} | NIB: ${company.nib || '2809260033791'}` : ''}
            </div>
          </td>
          <td width="25%" align="right" valign="top">
            <span class="stamp-badge">${isPO ? 'PURCHASE ORDER' : (isPaid ? 'LUNAS / PAID' : (isProforma ? 'PROFORMA' : (isQuotation ? 'PENAWARAN' : 'INVOICE')))}</span>
          </td>
        </tr>
      </table>

      <!-- Document Title -->
      <div class="doc-title">${docTitle}</div>
      <div class="doc-number">Nomor: ${doc.documentNumber}</div>

      <!-- Detail Info -->
      <table class="info-grid" width="100%">
        <tr>
          <td width="55%" valign="top">
            <div class="info-box">
              <strong style="color: ${isPO ? '#7e22ce' : '#0369a1'};">${isPO ? 'DITUJUKAN KEPADA VENDOR / REKANAN:' : 'DITUJUKAN KEPADA:'}</strong><br>
              <strong>${doc.client.companyName || doc.client.name}</strong><br>
              Attn: ${doc.poAttentionPic || doc.client.picName || doc.client.name}<br>
              ${doc.client.address || '-'}<br>
              Telp: ${doc.client.phone || '-'} | Email: ${doc.client.email || '-'}<br>
              ${doc.client.npwp && !isQuotation ? `NPWP: ${doc.client.npwp}` : ''}
            </div>
          </td>
          <td width="5%"></td>
          <td width="40%" valign="top">
            <div class="info-box">
              <strong>Tanggal:</strong> ${formatDateIndo(doc.issueDate)}<br>
              ${isPO ? `<strong>Target Kirim:</strong> ${formatDateIndo(doc.poDeliveryDate || doc.dueDate)}<br>` : ''}
              ${isQuotation ? `<strong>Berlaku Hingga:</strong> ${formatDateIndo(doc.validUntil || doc.dueDate)}<br>` : ''}
              ${!isQuotation && !isPO ? `<strong>Jatuh Tempo:</strong> ${formatDateIndo(doc.dueDate)}<br>` : ''}
              ${isPO && doc.poReferenceQuotationNumber ? `<strong style="color: #7e22ce;">Ref. Quo Vendor:</strong> ${doc.poReferenceQuotationNumber}<br>` : ''}
              ${isPO && doc.poDeliveryAddress ? `<strong>Alamat Kirim:</strong> ${doc.poDeliveryAddress}<br>` : ''}
              <strong>Syarat Pembayaran:</strong> ${doc.paymentTerms || 'Sesuai Kesepakatan'}<br>
              <strong>Mata Uang:</strong> ${doc.currency} ${doc.currency !== 'IDR' ? `(Kurs: 1 ${doc.currency} = Rp ${doc.exchangeRate.toLocaleString('id-ID')})` : ''}<br>
              ${doc.convertedFromNumber && !isPO ? `<strong>Ref. Dokumen:</strong> ${doc.convertedFromNumber}<br>` : ''}
              ${isPaid && doc.paidAt ? `<strong style="color: #16a34a;">Tanggal Pelunasan:</strong> ${formatDateIndo(doc.paidAt)}<br>` : ''}
            </div>
          </td>
        </tr>
      </table>

      ${doc.title ? `<div style="margin: 10px 0; font-size: 13px;"><strong>Perihal / Deskripsi:</strong> ${doc.title}</div>` : ''}

      <!-- Items Table -->
      <table class="items-table" width="100%">
        <thead>
          <tr>
            <th width="5%" style="text-align: center;">No</th>
            <th width="45%">Deskripsi / Spesifikasi</th>
            <th width="15%" style="text-align: center;">Qty / Satuan</th>
            <th width="17%" style="text-align: right;">Harga Satuan</th>
            <th width="18%" style="text-align: right;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Subtotal, Diskon, Pajak & Total -->
      <table class="total-section" width="100%">
        <tr>
          <td width="50%" valign="top">
            <div class="terbilang-box">
              <strong>Terbilang:</strong><br>
              <em># ${formatTerbilang(doc.grandTotal, doc.currency)} #</em>
            </div>

            <!-- Rekening Bank -->
            <div style="font-size: 11px; border: 1px solid #e2e8f0; padding: 10px; background-color: #f8fafc;">
              <strong>Instruksi Pembayaran Bank:</strong><br>
              Bank: <strong>${doc.bankAccount.bankName}</strong><br>
              No. Rekening: <strong>${doc.bankAccount.accountNumber}</strong><br>
              Atas Nama: <strong>${doc.bankAccount.accountHolder}</strong><br>
              <em>Mohon cantumkan nomor dokumen pada berita transfer.</em>
            </div>
          </td>
          <td width="10%"></td>
          <td width="40%" valign="top">
            <table width="100%" style="font-size: 12px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px;">Subtotal:</td>
                <td style="padding: 4px; text-align: right;">${formatCurrency(doc.subtotal, doc.currency)}</td>
              </tr>
              ${doc.discountAmount > 0 ? `
              <tr>
                <td style="padding: 4px; color: #dc2626;">Diskon ${doc.discountType === 'percent' ? `(${doc.discountValue}%)` : ''}:</td>
                <td style="padding: 4px; text-align: right; color: #dc2626;">-${formatCurrency(doc.discountAmount, doc.currency)}</td>
              </tr>
              ` : ''}
              ${doc.taxAmount > 0 ? `
              <tr>
                <td style="padding: 4px;">PPN (${doc.taxPercent}%):</td>
                <td style="padding: 4px; text-align: right;">${formatCurrency(doc.taxAmount, doc.currency)}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #0284c7; border-bottom: 2px solid #0284c7;">
                <td style="padding: 8px 4px; font-weight: bold; font-size: 14px;">Total Akhir:</td>
                <td style="padding: 8px 4px; text-align: right; font-weight: bold; font-size: 14px; color: #0284c7;">${formatCurrency(doc.grandTotal, doc.currency)}</td>
              </tr>
              ${isPaid ? `
              <tr style="color: #16a34a;">
                <td style="padding: 4px; font-weight: bold;">Status:</td>
                <td style="padding: 4px; text-align: right; font-weight: bold;">LUNAS (${formatDateIndo(doc.paidAt || doc.dueDate)})</td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- Terms & Signature -->
      <table width="100%" style="margin-top: 30px; font-size: 11px;">
        <tr>
          <td width="60%" valign="top">
            <strong>Syarat & Ketentuan:</strong>
            <ol style="margin-top: 4px; padding-left: 20px;">
              ${termsHtml}
            </ol>
            ${doc.notes ? `<div style="margin-top: 8px;"><strong>Catatan Tambahan:</strong><br>${doc.notes}</div>` : ''}
          </td>
          <td width="40%" align="center" valign="top">
            <div>Hormat kami,</div>
            <div style="font-weight: bold; margin-bottom: 8px;">${company.name}</div>
            ${(doc.signatureImageUrl || company.defaultSignatureUrl) ? `
              <div style="height: 60px; text-align: center; margin-bottom: 5px;">
                <img src="${doc.signatureImageUrl || company.defaultSignatureUrl}" width="130" height="55" alt="Tanda Tangan" style="max-height: 55px; width: auto;" />
              </div>
            ` : `
              <div style="height: 50px;"></div>
            `}
            <div style="font-weight: bold; text-decoration: underline;">${doc.signedBy || company.directorName}</div>
            <div>${doc.signerRole || company.directorRole}</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });

  const filename = `${doc.documentNumber.replace(/\//g, '_')}_${doc.type}.doc`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
