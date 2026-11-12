import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  CheckCircle2,
  FileCheck,
  Upload,
  RotateCcw
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { DEFAULT_SIGNATURE_BASE64 } from '../data/signatureDefault';

interface CompanySettingsModalProps {
  company: CompanyProfile;
  onSave: (updated: CompanyProfile) => void;
  onClose: () => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  company,
  onSave,
  onClose,
}) => {
  const [profile, setProfile] = useState<CompanyProfile>({ ...company });
  const [isSaved, setIsSaved] = useState(false);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfile({
            ...profile,
            defaultSignatureUrl: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(profile);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/80 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Profil Perusahaan & Rekening Resmi</h3>
              <p className="text-xs text-slate-400">
                Pengaturan Kop Surat, Rekening Bank, dan Penandatangan Sah
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
          {isSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Profil perusahaan berhasil diperbarui!</span>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
              Identitas Badan Usaha
            </h4>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nama Perusahaan
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Alamat Kantor Resmi
              </label>
              <textarea
                rows={2}
                required
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Email Perusahaan
                </label>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nomor Pokok Wajib Pajak (NPWP)
                </label>
                <input
                  type="text"
                  value={profile.npwp}
                  onChange={(e) => setProfile({ ...profile, npwp: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nomor Induk Berusaha (NIB)
                </label>
                <input
                  type="text"
                  value={profile.nib || ''}
                  onChange={(e) => setProfile({ ...profile, nib: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
              Rekening Bank Utama (Penerimaan Tagihan)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  required
                  value={profile.defaultBank.bankName}
                  onChange={(e) => setProfile({
                    ...profile,
                    defaultBank: { ...profile.defaultBank, bankName: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  required
                  value={profile.defaultBank.accountNumber}
                  onChange={(e) => setProfile({
                    ...profile,
                    defaultBank: { ...profile.defaultBank, accountNumber: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Atas Nama Rekening
                </label>
                <input
                  type="text"
                  required
                  value={profile.defaultBank.accountHolder}
                  onChange={(e) => setProfile({
                    ...profile,
                    defaultBank: { ...profile.defaultBank, accountHolder: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
              Penandatangan Sah Dokumen
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Direktur / Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={profile.directorName}
                  onChange={(e) => setProfile({ ...profile, directorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={profile.directorRole}
                  onChange={(e) => setProfile({ ...profile, directorRole: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Master Signature Image Upload */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 mt-3">
              <label className="block font-semibold text-slate-300 text-xs">
                Gambar Tanda Tangan Master (Otomatis digunakan di semua dokumen baru)
              </label>

              <div className="flex flex-wrap items-center gap-4">
                <div className="w-44 h-24 bg-white rounded-xl p-2 flex items-center justify-center border-2 border-dashed border-slate-600 shadow-inner">
                  {profile.defaultSignatureUrl ? (
                    <img
                      src={profile.defaultSignatureUrl}
                      alt="Tanda Tangan Master"
                      className="max-h-20 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Belum ada gambar TTD</span>
                  )}
                </div>

                <div className="space-y-2 flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Gambar TTD</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </label>

                    {profile.defaultSignatureUrl !== DEFAULT_SIGNATURE_BASE64 && (
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, defaultSignatureUrl: DEFAULT_SIGNATURE_BASE64 })}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
                        title="Kembalikan ke format tanda tangan standar"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Standar</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Unggah tanda tangan resmi (PNG transparan disarankan, atau JPG/WebP). Gambar ini akan otomatis muncul pada lembar cetak penawaran &amp; invoice.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-700 text-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Simpan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
