import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Upload, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  FolderSync, 
  Database, 
  HardDrive, 
  Lock, 
  FileCode, 
  Image as ImageIcon,
  Check,
  Download,
  Share2,
  FolderOpen
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  googleSignIn, 
  logout, 
  initAuth, 
  getAccessToken 
} from '../services/googleAuth';
import { 
  listAppDriveFiles, 
  uploadBlobToDrive, 
  deleteDriveFile, 
  backupDatabaseToDrive, 
  GoogleDriveFile 
} from '../services/googleDrive';
import { DocumentRecord, CompanyProfile, Client } from '../types';
import { generateDocumentPdfBlob } from '../utils/exportPdf';
import { formatCurrency, formatDateIndo } from '../utils/formatters';

interface GoogleDriveManagerProps {
  documents: DocumentRecord[];
  clients: Client[];
  company: CompanyProfile;
  onOpenDocument?: (doc: DocumentRecord) => void;
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
  documents,
  clients,
  company,
  onOpenDocument,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Selected document to upload to Drive
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Custom file upload state
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [isUploadingCustom, setIsUploadingCustom] = useState(false);

  // Confirmation modal for deletion (MANDATORY per Workspace Integration Skill)
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        fetchFiles(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setDriveFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 6000);
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showNotification('success', `Berhasil masuk dengan akun Google: ${res.user.email}`);
        await fetchFiles(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', err?.message || 'Gagal masuk dengan akun Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setDriveFiles([]);
      showNotification('info', 'Anda telah keluar dari Google Drive.');
    } catch (err: any) {
      console.error(err);
      showNotification('error', 'Gagal keluar dari akun Google.');
    }
  };

  const fetchFiles = async (currentToken?: string) => {
    const t = currentToken || token;
    if (!t) return;
    setIsFetchingFiles(true);
    try {
      const files = await listAppDriveFiles(undefined, t);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      showNotification('error', err?.message || 'Gagal mengambil daftar file dari Google Drive');
    } finally {
      setIsFetchingFiles(false);
    }
  };

  // Upload a selected document as PDF to Drive
  const handleUploadDocumentToDrive = async () => {
    const docToUpload = documents.find(d => d.id === selectedDocId);
    if (!docToUpload) {
      showNotification('error', 'Silakan pilih dokumen yang ingin diunggah.');
      return;
    }

    setIsUploadingDoc(true);
    try {
      const pdfBlob = generateDocumentPdfBlob(docToUpload, company);
      const fileName = `${docToUpload.documentNumber.replace(/\//g, '_')}_${docToUpload.type}.pdf`;

      const uploaded = await uploadBlobToDrive({
        fileName,
        blob: pdfBlob,
        mimeType: 'application/pdf',
        description: `Dokumen resmi ${docToUpload.documentNumber} (${docToUpload.title}) untuk klien ${docToUpload.client.name}`,
        token: token || undefined,
      });

      showNotification('success', `Dokumen "${uploaded.name}" berhasil diunggah ke folder Google Drive!`);
      await fetchFiles();
    } catch (err: any) {
      console.error(err);
      showNotification('error', err?.message || 'Gagal mengunggah dokumen ke Google Drive');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Backup entire ERP database as JSON to Drive
  const handleBackupDatabase = async () => {
    setIsBackingUp(true);
    try {
      const uploaded = await backupDatabaseToDrive({
        documents,
        clients,
        company,
        token: token || undefined,
      });

      showNotification('success', `Cadangan database "${uploaded.name}" berhasil disimpan di Google Drive!`);
      await fetchFiles();
    } catch (err: any) {
      console.error(err);
      showNotification('error', err?.message || 'Gagal mencadangkan database ke Google Drive');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Upload custom file (e.g., scan BAST, bukti transfer, kontrak)
  const handleUploadCustomFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFile) return;

    setIsUploadingCustom(true);
    try {
      const uploaded = await uploadBlobToDrive({
        fileName: customFile.name,
        blob: customFile,
        mimeType: customFile.type || 'application/octet-stream',
        description: `Berkas lampiran diunggah oleh ${user?.displayName || 'Admin PT Yusra Prima Solusindo'}`,
        token: token || undefined,
      });

      showNotification('success', `Berkas "${uploaded.name}" berhasil diunggah ke Google Drive!`);
      setCustomFile(null);
      await fetchFiles();
    } catch (err: any) {
      console.error(err);
      showNotification('error', err?.message || 'Gagal mengunggah berkas ke Google Drive');
    } finally {
      setIsUploadingCustom(false);
    }
  };

  // Execute deletion after explicit user confirmation
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id, token || undefined);
      showNotification('success', `File "${fileToDelete.name}" telah dihapus dari Google Drive.`);
      setFileToDelete(null);
      await fetchFiles();
    } catch (err: any) {
      console.error(err);
      showNotification('error', err?.message || 'Gagal menghapus file dari Google Drive.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '-';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '-';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border border-slate-700/70 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                Google Workspace Drive Integration
              </span>
              <span className="text-xs text-slate-400">
                PT Yusra Prima Solusindo Cloud Storage
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <FolderSync className="w-6 h-6 text-cyan-400" />
              Integrasi Google Drive & Arsip Cloud
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Sinkronkan otomatis surat penawaran, invoice tagihan, dan purchase order ke Google Drive pribadi / kantor. Amankan cadangan database secara terenkripsi dan bagikan berkas langsung ke klien.
            </p>
          </div>

          {/* User Sign In / Profile Box */}
          <div className="shrink-0">
            {user ? (
              <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-lg flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-cyan-400/40 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-sm">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{user.displayName || 'Pengguna Google'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                    {user.email}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline mt-0.5 cursor-pointer"
                  >
                    Putuskan Akun
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="gsi-material-button px-5 py-3 rounded-xl bg-white text-slate-800 font-semibold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center gap-3 cursor-pointer border border-slate-300 active:scale-95 disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoading ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300' 
              : statusMessage.type === 'error'
                ? 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                : 'bg-sky-950/60 border-sky-700/60 text-sky-300'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {statusMessage.type === 'info' && <Cloud className="w-4 h-4 text-sky-400 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!user ? (
        <div className="p-10 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
            <Cloud className="w-8 h-8" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Hubungkan Akun Google untuk Akses Google Drive
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Masuk dengan akun Google Anda untuk mengaktifkan folder penyimpanan otomatis <strong>PT Yusra Prima Solusindo - Dokumen ERP</strong> di Google Drive Anda.
          </p>
          <div className="pt-2">
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>{isLoading ? 'Sedang Menghubungkan...' : 'Hubungkan Google Drive Sekarang'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Upload Active Invoice / Quotation / PO to Drive */}
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 shadow-lg space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Simpan Dokumen ke Drive</span>
                </div>
                <p className="text-xs text-slate-300">
                  Pilih salah satu invoice atau penawaran untuk diekspor menjadi PDF dan diunggah langsung ke Drive.
                </p>
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] text-slate-400 block">Pilih Dokumen:</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.documentNumber} - {doc.client.name} ({formatCurrency(doc.grandTotal, doc.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleUploadDocumentToDrive}
                disabled={isUploadingDoc || documents.length === 0}
                className="w-full px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploadingDoc ? 'Mengunggah PDF ke Drive...' : 'Unggah PDF ke Google Drive'}</span>
              </button>
            </div>

            {/* Card 2: 1-Click Database Backup */}
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 shadow-lg space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Database className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cadangan Database Lengkap</span>
                </div>
                <p className="text-xs text-slate-300">
                  Simpan salinan cadangan seluruh data ({documents.length} dokumen, {clients.length} klien, dan profil perusahaan) ke Drive.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Dokumen:</span>
                    <strong className="text-slate-200">{documents.length} File</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Klien:</span>
                    <strong className="text-slate-200">{clients.length} Kontak</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBackupDatabase}
                disabled={isBackingUp}
                className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <HardDrive className="w-4 h-4" />
                <span>{isBackingUp ? 'Mencadangkan ke Drive...' : 'Cadangkan Database (JSON)'}</span>
              </button>
            </div>

            {/* Card 3: Upload Any Attachment / File */}
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 shadow-lg space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-400">
                  <Upload className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Unggah Berkas Lampiran</span>
                </div>
                <p className="text-xs text-slate-300">
                  Unggah berkas eksternal (BAST, scan kontrak, bukti transfer, atau foto pekerjaan) ke folder Drive PT Yusra.
                </p>
                <div className="pt-1">
                  <input
                    type="file"
                    onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 cursor-pointer"
                  />
                  {customFile && (
                    <div className="text-[11px] text-purple-300 mt-1 truncate">
                      Pilihan: {customFile.name} ({(customFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleUploadCustomFile}
                disabled={!customFile || isUploadingCustom}
                className="w-full px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploadingCustom ? 'Mengunggah Berkas...' : 'Unggah Berkas ke Drive'}</span>
              </button>
            </div>
          </div>

          {/* Drive Files List */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Berkas di Google Drive (Folder: PT Yusra Prima Solusindo - Dokumen ERP)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Total {driveFiles.length} berkas tersimpan di cloud storage Anda
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchFiles()}
                  disabled={isFetchingFiles}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  title="Muat Ulang Berkas"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingFiles ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Segarkan</span>
                </button>
              </div>
            </div>

            {/* Files Table */}
            {isFetchingFiles ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                <p>Memuat daftar berkas dari Google Drive API...</p>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <Cloud className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-400">Belum ada berkas di folder Google Drive ini</p>
                <p>Gunakan tombol di atas untuk mengunggah PDF invoice atau membuat cadangan database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Nama Berkas</th>
                      <th className="py-3 px-3">Tipe</th>
                      <th className="py-3 px-3">Ukuran</th>
                      <th className="py-3 px-3">Waktu Diubah</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {driveFiles.map((file) => {
                      const isPdf = file.mimeType.includes('pdf');
                      const isJson = file.mimeType.includes('json');

                      return (
                        <tr key={file.id} className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {isPdf ? (
                                <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                              ) : isJson ? (
                                <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : (
                                <Cloud className="w-4 h-4 text-sky-400 shrink-0" />
                              )}
                              <span className="font-semibold text-slate-200 truncate max-w-sm" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                              isPdf 
                                ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                                : isJson 
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                                  : 'bg-slate-700 text-slate-300'
                            }`}>
                              {isPdf ? 'PDF Dokumen' : isJson ? 'Database Backup' : 'File'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono">
                            {formatFileSize(file.size)}
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {file.modifiedTime ? formatDateIndo(file.modifiedTime) : '-'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg bg-sky-900/40 hover:bg-sky-600 text-sky-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer border border-sky-700/40"
                                  title="Buka Berkas di Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Buka</span>
                                </a>
                              )}

                              {/* Delete button opens explicit confirmation modal */}
                              <button
                                onClick={() => setFileToDelete(file)}
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white transition-all cursor-pointer border border-rose-800/40"
                                title="Hapus Berkas dari Google Drive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
      )}

      {/* Mandatory User Confirmation Modal for Destructive Delete (Google Workspace Integration Rule) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-700/60 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Konfirmasi Penghapusan</h3>
                <p className="text-xs text-rose-300">Tindakan ini akan menghapus berkas dari Google Drive Anda.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5">
              <div className="text-slate-400">Nama Berkas:</div>
              <div className="font-bold text-white break-all">{fileToDelete.name}</div>
              <div className="text-slate-400 text-[11px] pt-1">
                Ukuran: {formatFileSize(fileToDelete.size)}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus berkas ini dari Google Drive secara permanen? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus File'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
