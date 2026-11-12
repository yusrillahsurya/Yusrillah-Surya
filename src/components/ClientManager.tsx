import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  CreditCard, 
  Trash2, 
  Edit, 
  Eye, 
  X, 
  Save, 
  CheckCircle2, 
  Clock,
  Briefcase
} from 'lucide-react';
import { Client, DocumentRecord } from '../types';
import { formatCurrency, formatDateIndo } from '../utils/formatters';

interface ClientManagerProps {
  clients: Client[];
  documents: DocumentRecord[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onNewDocumentForClient: (client: Client, type?: 'quotation' | 'proforma' | 'invoice') => void;
  onViewDocument: (doc: DocumentRecord) => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({
  clients,
  documents,
  onSaveClient,
  onDeleteClient,
  onNewDocumentForClient,
  onViewDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Filter clients
  const filteredClients = clients.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.picName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  const handleOpenAddModal = () => {
    setEditingClient({
      id: `client-${Date.now()}`,
      name: '',
      companyName: '',
      picName: '',
      email: '',
      phone: '',
      address: '',
      city: 'Tangerang',
      npwp: '',
      paymentTerms: 'Net 14 Hari',
      notes: '',
      createdAt: new Date().toISOString().split('T')[0],
    });
    setIsEditing(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient({ ...client });
    setIsEditing(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    onSaveClient(editingClient);
    setIsEditing(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            Manajemen Klien & Mitra Bisnis
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Pusat database klien, PIC, alamat kantor, NPWP, dan riwayat transaksi tagihan.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Tambah Klien Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama perusahaan, nama PIC, email, nomor telepon, atau kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          // Client specific stats
          const clientDocs = documents.filter(d => d.clientId === client.id);
          const paidSum = clientDocs
            .filter(d => d.status === 'paid')
            .reduce((s, d) => s + (d.grandTotal * (d.exchangeRate || 1)), 0);
          const unpaidSum = clientDocs
            .filter(d => d.status !== 'paid' && d.type !== 'quotation')
            .reduce((s, d) => s + (d.balanceDue * (d.exchangeRate || 1)), 0);

          return (
            <div
              key={client.id}
              className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/50 shadow-lg transition-all space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(client)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Edit Klien"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus data klien ${client.companyName || client.name}?`)) {
                          onDeleteClient(client.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus Klien"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                    {client.companyName || client.name}
                  </h3>
                  <div className="text-xs text-slate-300 font-medium mt-0.5">
                    Attn: {client.picName}
                  </div>
                </div>

                {/* Contact items */}
                <div className="space-y-1.5 pt-2 text-xs text-slate-400 border-t border-slate-700/60">
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{client.address || client.city}</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-[11px] space-y-1 mt-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Lunas:</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(paidSum, 'IDR')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Piutang Belum Lunas:</span>
                    <span className="font-bold text-amber-400">{formatCurrency(unpaidSum, 'IDR')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2">
                <button
                  onClick={() => setSelectedClientForDetail(client)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Riwayat</span>
                </button>
                <button
                  onClick={() => onNewDocumentForClient(client, 'invoice')}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Tagihan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Client Details & History */}
      {selectedClientForDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-4">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-cyan-950/80 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedClientForDetail.companyName || selectedClientForDetail.name}
                </h3>
                <p className="text-xs text-slate-400">
                  PIC: {selectedClientForDetail.picName} | NPWP: {selectedClientForDetail.npwp || '-'}
                </p>
              </div>
              <button
                onClick={() => setSelectedClientForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Riwayat Transaksi Dokumen Klien Ini
              </h4>

              {documents.filter(d => d.clientId === selectedClientForDetail.id).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada dokumen yang diterbitkan untuk klien ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents
                    .filter(d => d.clientId === selectedClientForDetail.id)
                    .map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{d.documentNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-900 text-slate-300">
                              {d.type}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {formatDateIndo(d.issueDate)} • {d.title || '-'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-white">
                            {formatCurrency(d.grandTotal, d.currency)}
                          </div>
                          <span className={`text-[10px] font-bold ${
                            d.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {d.status === 'paid' ? 'LUNAS' : 'PENDING'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-800/60 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setSelectedClientForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Client */}
      {isEditing && editingClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-4">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-cyan-950/80 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingClient.name ? 'Edit Data Klien' : 'Tambah Klien Baru'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Perusahaan / Instansi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Telkom Akses"
                  value={editingClient.companyName}
                  onChange={(e) => setEditingClient({ ...editingClient, companyName: e.target.value, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama PIC (Contact Person) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. Bambang Wijaya"
                    value={editingClient.picName}
                    onChange={(e) => setEditingClient({ ...editingClient, picName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nomor WhatsApp / Telepon <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="081298765432"
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Klien
                  </label>
                  <input
                    type="email"
                    placeholder="finance@klien.com"
                    value={editingClient.email}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    NPWP Klien
                  </label>
                  <input
                    type="text"
                    placeholder="01.234.567.8-012.000"
                    value={editingClient.npwp || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, npwp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alamat Kantor Lengkap
                </label>
                <textarea
                  rows={2}
                  placeholder="Jl. Sudirman No..."
                  value={editingClient.address}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kota / Wilayah
                  </label>
                  <input
                    type="text"
                    value={editingClient.city}
                    onChange={(e) => setEditingClient({ ...editingClient, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Syarat Pembayaran Default
                  </label>
                  <input
                    type="text"
                    placeholder="Net 14 Hari / DP 50%"
                    value={editingClient.paymentTerms}
                    onChange={(e) => setEditingClient({ ...editingClient, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Simpan Klien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
