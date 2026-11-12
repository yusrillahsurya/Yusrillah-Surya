import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  TrendingUp, 
  Settings, 
  PlusCircle, 
  Building2, 
  Phone, 
  Mail,
  ShieldCheck,
  Cloud
} from 'lucide-react';
import { CompanyProfile, DocumentType } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'documents' | 'clients' | 'finance' | 'drive' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'documents' | 'clients' | 'finance' | 'drive' | 'settings') => void;
  company: CompanyProfile;
  onNewDocument: (type?: DocumentType) => void;
  unpaidCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  company,
  onNewDocument,
  unpaidCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 no-print">
      {/* Top micro bar for office details */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Veteran Kavling No9c, Kab. Tangerang, Banten 15540</span>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <a href="tel:08318666847">08318666847</a>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <a href="mailto:yusraprimasolusindo@gmail.com">yusraprimasolusindo@gmail.com</a>
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[11px] font-medium font-mono">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              NIB: {company.nib || '2809260033791'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              NPWP: {company.npwp || '1000000010827045'}
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Company Brand & Logo */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-white p-0.5 border border-cyan-500/30 shadow-md shadow-cyan-500/10 group-hover:border-cyan-400 transition-all flex items-center justify-center">
              <img 
                src={company.logoUrl} 
                alt="Logo PT Yusra Prima Solusindo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                  PT YUSRA PRIMA SOLUSINDO
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/70">
                  NIB: {company.nib || '2809260033791'}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/70">
                  NPWP: {company.npwp || '1000000010827045'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Sistem Penawaran, Proforma, Invoice Lunas & Purchase Order Real-Time
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dasbor</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'documents'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Penawaran & Invoice</span>
              {unpaidCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                  {unpaidCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'clients'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manajemen Klien</span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'finance'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Laporan Arus Kas</span>
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'drive'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Google Drive Cloud Storage & Cadangan"
            >
              <Cloud className="w-4 h-4 text-sky-400" />
              <span>Google Drive</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Profil Perusahaan & Pengaturan"
            >
              <Settings className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Profil</span>
            </button>
          </nav>

          {/* Quick Create Dropdown / Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNewDocument('invoice')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-medium text-sm shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-emerald-400 transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Buat Dokumen</span>
              <span className="sm:hidden">Buat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800 bg-slate-900/90 py-2 px-2 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'dashboard' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dasbor</span>
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded relative ${
            activeTab === 'documents' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoice</span>
          {unpaidCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'clients' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Klien</span>
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'finance' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Arus Kas</span>
        </button>
        <button
          onClick={() => setActiveTab('drive')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'drive' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Cloud className="w-4 h-4 text-sky-400" />
          <span>Drive</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            activeTab === 'settings' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Profil</span>
        </button>
      </div>
    </header>
  );
};
