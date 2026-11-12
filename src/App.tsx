import React, { useState, useEffect } from 'react';
import { 
  INITIAL_COMPANY_PROFILE, 
  INITIAL_CLIENTS, 
  INITIAL_DOCUMENTS, 
  INITIAL_EXPENSES 
} from './data/initialData';
import { 
  DocumentRecord, 
  DocumentType, 
  Client, 
  ExpenseRecord, 
  CompanyProfile 
} from './types';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { DocumentList } from './components/DocumentList';
import { DocumentEditor } from './components/DocumentEditor';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { PaymentModal } from './components/PaymentModal';
import { EmailModal } from './components/EmailModal';
import { ClientManager } from './components/ClientManager';
import { FinanceReport } from './components/FinanceReport';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { GoogleDriveManager } from './components/GoogleDriveManager';
import { generateDocNumber } from './utils/formatters';

const STORAGE_KEYS = {
  DOCS: 'yps_documents_v1',
  CLIENTS: 'yps_clients_v1',
  EXPENSES: 'yps_expenses_v1',
  COMPANY: 'yps_company_v1',
};

export default function App() {
  // Local storage loaded state with fallbacks to realistic initialData
  const [company, setCompany] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPANY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          nib: '2809260033791',
          npwp: '1000000010827045',
        };
      }
      return INITIAL_COMPANY_PROFILE;
    } catch {
      return INITIAL_COMPANY_PROFILE;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCS);
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  // Sync to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
    } catch (e) {
      console.error(e);
    }
  }, [company]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.error(e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(documents));
    } catch (e) {
      console.error(e);
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error(e);
    }
  }, [expenses]);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'documents' | 'clients' | 'finance' | 'drive' | 'settings'>('dashboard');

  // Modal and Editor Views
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [editorDefaultType, setEditorDefaultType] = useState<DocumentType>('invoice');

  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [paymentDoc, setPaymentDoc] = useState<DocumentRecord | null>(null);
  const [emailDoc, setEmailDoc] = useState<DocumentRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [triggerExpenseModal, setTriggerExpenseModal] = useState(false);

  // Unpaid invoices count
  const unpaidCount = documents.filter(d => (d.type === 'invoice' || d.type === 'proforma') && d.status !== 'paid' && d.status !== 'cancelled').length;

  // Document Handlers
  const handleOpenNewDocument = (type: DocumentType = 'invoice') => {
    setEditingDoc(null);
    setEditorDefaultType(type);
    setIsEditorOpen(true);
  };

  const handleEditDocument = (doc: DocumentRecord) => {
    setEditingDoc(doc);
    setEditorDefaultType(doc.type);
    setIsEditorOpen(true);
  };

  const handleSaveDocument = (savedDoc: DocumentRecord) => {
    const exists = documents.some(d => d.id === savedDoc.id);
    if (exists) {
      setDocuments(documents.map(d => d.id === savedDoc.id ? savedDoc : d));
    } else {
      setDocuments([savedDoc, ...documents]);
    }
    setIsEditorOpen(false);
    setEditingDoc(null);
    setActiveTab('documents');
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
    if (previewDoc?.id === id) setPreviewDoc(null);
  };

  const handleDuplicateDocument = (doc: DocumentRecord) => {
    const newSeq = Math.floor(Math.random() * 800) + 10;
    const duplicated: DocumentRecord = {
      ...doc,
      id: `doc-${Date.now()}`,
      documentNumber: generateDocNumber(doc.type, newSeq),
      title: `${doc.title} (Salinan)`,
      status: 'draft',
      amountPaid: 0,
      balanceDue: doc.grandTotal,
      paidAt: undefined,
      paymentMethod: undefined,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    setDocuments([duplicated, ...documents]);
  };

  // Convert Quotation -> Proforma -> Invoice -> Purchase Order
  const handleConvertDocument = (sourceDoc: DocumentRecord, targetType: DocumentType) => {
    const newSeq = Math.floor(Math.random() * 800) + 10;
    const isTargetPO = targetType === 'purchase_order';

    const convertedDoc: DocumentRecord = {
      ...sourceDoc,
      id: `doc-${Date.now()}`,
      documentNumber: generateDocNumber(targetType, newSeq),
      type: targetType,
      title: isTargetPO 
        ? `Surat Pesanan Pembelian / PO berdasarkan Penawaran ${sourceDoc.documentNumber}`
        : `${sourceDoc.title} [Ref: ${sourceDoc.documentNumber}]`,
      status: targetType === 'invoice' ? 'sent' : 'pending',
      convertedFromId: sourceDoc.id,
      convertedFromNumber: sourceDoc.documentNumber,
      poReferenceQuotationNumber: isTargetPO ? sourceDoc.documentNumber : undefined,
      poDeliveryDate: isTargetPO ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      poDeliveryAddress: isTargetPO ? (company.address || 'Veteran Kavling No9c Kab. Tangerang Banten 15540') : undefined,
      poAttentionPic: isTargetPO ? sourceDoc.client.picName : undefined,
      amountPaid: 0,
      balanceDue: sourceDoc.grandTotal,
      paidAt: undefined,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    setDocuments([convertedDoc, ...documents]);
    setPreviewDoc(convertedDoc);
  };

  // Payment Success Handler
  const handlePaymentSuccess = (docId: string, paymentMethod: string, reference: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    setDocuments(prevDocs => prevDocs.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          status: 'paid',
          amountPaid: d.grandTotal,
          balanceDue: 0,
          paidAt: todayStr,
          paymentMethod,
          paymentReference: reference,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    }));

    // Update preview doc if open
    if (previewDoc && previewDoc.id === docId) {
      setPreviewDoc({
        ...previewDoc,
        status: 'paid',
        amountPaid: previewDoc.grandTotal,
        balanceDue: 0,
        paidAt: todayStr,
        paymentMethod,
        paymentReference: reference,
      });
    }
  };

  // Custom Signature Handler
  const handleUpdateDocumentSignature = (docId: string, newSignatureUrl: string) => {
    setDocuments(prevDocs => prevDocs.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          signatureImageUrl: newSignatureUrl,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    }));

    if (previewDoc && previewDoc.id === docId) {
      setPreviewDoc({
        ...previewDoc,
        signatureImageUrl: newSignatureUrl,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Client Management Handlers
  const handleSaveClient = (client: Client) => {
    const exists = clients.some(c => c.id === client.id);
    if (exists) {
      setClients(clients.map(c => c.id === client.id ? client : c));
    } else {
      setClients([client, ...clients]);
    }
  };

  const handleDeleteClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
  };

  const handleNewDocumentForClient = (client: Client, type: DocumentType = 'invoice') => {
    setEditingDoc({
      id: `doc-${Date.now()}`,
      documentNumber: generateDocNumber(type, Math.floor(Math.random() * 800) + 10),
      type,
      title: `Pengadaan Layanan untuk ${client.companyName || client.name}`,
      clientId: client.id,
      client,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'IDR',
      exchangeRate: 1,
      items: [
        {
          id: `item-${Date.now()}`,
          description: 'Layanan Solusi Sistem & Integrasi',
          specification: 'Spesifikasi teknis implementasi di lokasi klien',
          quantity: 1,
          unit: 'Paket',
          unitPrice: 10000000,
          total: 10000000,
        }
      ],
      subtotal: 10000000,
      discountType: 'fixed',
      discountValue: 0,
      discountAmount: 0,
      taxType: 'ppn_11',
      taxPercent: 11,
      taxAmount: 1100000,
      grandTotal: 11100000,
      amountPaid: 0,
      balanceDue: 11100000,
      status: 'sent',
      paymentTerms: client.paymentTerms || 'Net 14 Hari',
      notes: 'Pembayaran ditransfer ke rekening resmi PT Yusra Prima Solusindo.',
      termsAndConditions: company.defaultTerms,
      bankAccount: company.defaultBank,
      signedBy: company.directorName,
      signerRole: company.directorRole,
      hasOfficialStamp: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    });
    setEditorDefaultType(type);
    setIsEditorOpen(true);
  };

  // Expense Handlers
  const handleAddExpense = (expense: ExpenseRecord) => {
    setExpenses([expense, ...expenses]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setIsEditorOpen(false);
          setActiveTab(tab);
        }}
        company={company}
        onNewDocument={(type) => handleOpenNewDocument(type || 'invoice')}
        unpaidCount={unpaidCount}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If Document Editor is open, show editor full-screen */}
        {isEditorOpen ? (
          <DocumentEditor
            initialDocument={editingDoc}
            defaultType={editorDefaultType}
            allDocuments={documents}
            clients={clients}
            company={company}
            onSave={handleSaveDocument}
            onCancel={() => {
              setIsEditorOpen(false);
              setEditingDoc(null);
            }}
            onAddNewClient={() => {
              setActiveTab('clients');
              setIsEditorOpen(false);
            }}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                documents={documents}
                expenses={expenses}
                clients={clients}
                company={company}
                onViewDocument={(doc) => setPreviewDoc(doc)}
                onPayDocument={(doc) => setPaymentDoc(doc)}
                onNewDocument={(type) => handleOpenNewDocument(type)}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenExpenseModal={() => {
                  setActiveTab('finance');
                  setTriggerExpenseModal(true);
                }}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentList
                documents={documents}
                company={company}
                onViewDocument={(doc) => setPreviewDoc(doc)}
                onEditDocument={(doc) => handleEditDocument(doc)}
                onDeleteDocument={handleDeleteDocument}
                onDuplicateDocument={handleDuplicateDocument}
                onConvertDocument={handleConvertDocument}
                onPayDocument={(doc) => setPaymentDoc(doc)}
                onEmailDocument={(doc) => setEmailDoc(doc)}
                onNewDocument={(type) => handleOpenNewDocument(type)}
              />
            )}

            {activeTab === 'clients' && (
              <ClientManager
                clients={clients}
                documents={documents}
                onSaveClient={handleSaveClient}
                onDeleteClient={handleDeleteClient}
                onNewDocumentForClient={handleNewDocumentForClient}
                onViewDocument={(doc) => setPreviewDoc(doc)}
              />
            )}

            {activeTab === 'finance' && (
              <FinanceReport
                documents={documents}
                expenses={expenses}
                company={company}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}

            {activeTab === 'drive' && (
              <GoogleDriveManager
                documents={documents}
                clients={clients}
                company={company}
                onOpenDocument={(doc) => setPreviewDoc(doc)}
              />
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto py-6">
                <CompanySettingsModal
                  company={company}
                  onSave={(updated) => {
                    setCompany(updated);
                    setActiveTab('dashboard');
                  }}
                  onClose={() => setActiveTab('dashboard')}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer info (hidden on print) */}
      <footer className="no-print mt-auto border-t border-slate-800 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-300">PT YUSRA PRIMA SOLUSINDO</span>
            <span>&bull;</span>
            <span>Sistem Invoicing & Laporan Keuangan Real-Time</span>
          </div>
          <div>
            Veteran Kavling No9c Kab. Tangerang Banten 15540 | WA: 08318666847
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Official Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          company={company}
          onClose={() => setPreviewDoc(null)}
          onPay={() => {
            setPaymentDoc(previewDoc);
          }}
          onEmail={() => {
            setEmailDoc(previewDoc);
          }}
          onEdit={() => {
            const doc = previewDoc;
            setPreviewDoc(null);
            handleEditDocument(doc);
          }}
          onUpdateSignature={handleUpdateDocumentSignature}
        />
      )}

      {/* 2. Interactive Payment Gateway Modal */}
      {paymentDoc && (
        <PaymentModal
          document={paymentDoc}
          company={company}
          onClose={() => setPaymentDoc(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* 3. Automated Email / WhatsApp Modal */}
      {emailDoc && (
        <EmailModal
          document={emailDoc}
          company={company}
          onClose={() => setEmailDoc(null)}
          onSentSuccess={(method) => {
            // Update document status if it was draft
            setDocuments(prev => prev.map(d => {
              if (d.id === emailDoc.id && d.status === 'draft') {
                return { ...d, status: 'sent', updatedAt: new Date().toISOString() };
              }
              return d;
            }));
          }}
        />
      )}
    </div>
  );
}
