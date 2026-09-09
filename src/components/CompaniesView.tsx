import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Sparkles,
  AlertCircle,
  X,
  FileText,
  HelpCircle,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Company } from '../types/index.js';
import { api } from '../api.js';

interface CompaniesViewProps {
  companies: Company[];
  onCompanyCreated: (newComp: Company) => void;
  onCompanyDeleted?: (deletedId: string) => void;
  onResetAllData?: () => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  onCompanyCreated,
  onCompanyDeleted,
  onResetAllData,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [showExplainer, setShowExplainer] = useState(true);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [trn, setTrn] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [stampUrl, setStampUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-generate a clean acronym code from company name if user hasn't manually customized code
  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code.length <= 4) {
      const words = val.trim().split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        const acronym = words
          .filter((w) => !['and', '&', 'the', 'for', 'of'].includes(w.toLowerCase()))
          .map((w) => w[0]?.toUpperCase() || '')
          .join('')
          .slice(0, 5);
        if (acronym) setCode(acronym);
      }
    }
  };

  const handleFillSample = () => {
    setName('Gulf Way Express Cargo LLC');
    setCode('GWEC');
    setTradeLicense('CN-2026-88192');
    setTrn('100482910400003');
    setAddress('Warehouse 12, Al Quoz Industrial Area 4, Dubai, UAE');
    setPhone('+971 4 388 9922');
    setEmail('operations@gulfwaycargo.ae');
    setStatusMessage(null);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a company legal name.' });
      return;
    }

    const finalCode = (code.trim() || name.slice(0, 3)).toUpperCase();

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const created = await api.createCompany({
        name: name.trim(),
        code: finalCode,
        tradeLicenseNumber: tradeLicense.trim() || `CN-${Date.now().toString().slice(-6)}`,
        taxRegistrationNumber: trn.trim() || undefined,
        address: address.trim() || 'Dubai, United Arab Emirates',
        phone: phone.trim() || '+971 4 000 0000',
        email: email.trim() || `admin@${finalCode.toLowerCase()}.ae`,
        officialStampUrl: stampUrl || undefined,
        isActive: true,
      });

      setStatusMessage({ type: 'success', text: `Company "${created.name}" registered successfully!` });
      onCompanyCreated(created);

      setTimeout(() => {
        setShowModal(false);
        setName('');
        setCode('');
        setTradeLicense('');
        setTrn('');
        setAddress('');
        setPhone('');
        setEmail('');
        setStampUrl('');
        setStatusMessage(null);
        setIsSubmitting(false);
      }, 700);
    } catch (err: any) {
      console.error('Company registration caught error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Unable to register company. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteCompany(companyToDelete.id);
      if (onCompanyDeleted) {
        onCompanyDeleted(companyToDelete.id);
      }
      setCompanyToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete company:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAllSampleData = async () => {
    setIsClearing(true);
    try {
      await api.clearSampleData();
      setShowClearModal(false);
      if (onResetAllData) {
        onResetAllData();
      }
    } catch (err: any) {
      console.error('Failed to clear sample data:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Why Sample Data Explainer Banner */}
      {showExplainer && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Why was sample data showing?
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Initial sample companies (GWDS, GWT, GWL) were pre-loaded so you could immediately preview sequential numbering, PDF stamps, and signature workflows. If you want an <strong>empty database to add your own real company details</strong>, click <strong>"Clear Sample Data"</strong> on the right, or delete individual companies with the trash icon.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowExplainer(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
            title="Dismiss explanation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
              MULTI-ENTITY MANAGEMENT
            </span>
            <span className="text-xs font-medium text-slate-500">
              {companies.length} Registered {companies.length === 1 ? 'Entity' : 'Entities'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Registered Group Operating Companies
          </h2>
          <p className="text-xs text-slate-500">
            Configure legal entities, trade licenses, official stamps, and document separation boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {companies.length > 0 && (
            <button
              id="btn-clear-sample-data"
              type="button"
              onClick={() => setShowClearModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 border border-slate-300 hover:border-red-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Clear sample data to have an empty database"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600" />
              <span>Clear Sample Data</span>
            </button>
          )}

          <button
            id="btn-open-add-company"
            onClick={() => {
              setShowModal(true);
              setStatusMessage(null);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Operating Company</span>
          </button>
        </div>
      </div>

      {/* Empty State when no companies exist */}
      {companies.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto my-8 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No Operating Companies Registered
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your database is clean and empty. Begin by adding your operating company details (Legal Name, Acronym Code, UAE Trade License, and TRN).
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(true);
                setStatusMessage(null);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Company</span>
            </button>
          </div>
        </div>
      ) : (
        /* Grid of Companies */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((comp) => (
            <div
              key={comp.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs font-mono">
                    {comp.code}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE ENTITY
                    </span>
                    <button
                      type="button"
                      title={`Delete ${comp.name}`}
                      onClick={() => setCompanyToDelete(comp)}
                      className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{comp.name}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  Code: <strong className="text-slate-800">{comp.code}</strong>
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Trade License:</span>
                  <span className="font-medium text-slate-800 font-mono">
                    {comp.tradeLicenseNumber || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">TRN / Tax:</span>
                  <span className="font-medium text-slate-800 font-mono">
                    {comp.taxRegistrationNumber || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{comp.address || 'UAE Registered'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Verified Entity</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium font-mono">
                  {comp.email || 'UAE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {companyToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete Operating Company?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete <strong>{companyToDelete.name}</strong> ({companyToDelete.code})? This will permanently remove this entity from your database.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCompany}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Sample Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Clear All Sample Data?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This will remove the 3 demo companies and sample documents from your database. You will get a <strong>completely empty, clean slate</strong> ready to register your actual UAE companies, trade licenses, and details.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={isClearing}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 text-xs rounded-lg transition-colors cursor-pointer"
              >
                Keep Current Data
              </button>
              <button
                type="button"
                onClick={handleClearAllSampleData}
                disabled={isClearing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isClearing ? 'Clearing...' : 'Empty Database & Start Fresh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple, Streamlined Company Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Register Operating Company
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add your company details to the document numbering registry.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inline Notifications */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{statusMessage.text}</span>
              </div>
            )}

            {/* Quick Fill Helper */}
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Want to test quickly with sample data?</span>
              </span>
              <button
                type="button"
                onClick={handleFillSample}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
              >
                Fill Sample Data
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCompany} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Company Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-company-name"
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Gulf Way Express LLC"
                    required
                    autoFocus
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Entity Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-company-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="GWE"
                    maxLength={6}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                  />
                </div>
              </div>

              {/* Core Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Trade License Number
                  </label>
                  <input
                    id="input-trade-license"
                    type="text"
                    value={tradeLicense}
                    onChange={(e) => setTradeLicense(e.target.value)}
                    placeholder="CN-2026-XXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    TRN (Tax Registration)
                  </label>
                  <input
                    id="input-trn"
                    type="text"
                    value={trn}
                    onChange={(e) => setTrn(e.target.value)}
                    placeholder="100XXXXXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Toggle Optional Fields */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer pt-1"
                >
                  <span>{showAdvanced ? '− Hide address & contact fields' : '+ Add optional address & contact details'}</span>
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Registered Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Al Quoz Industrial Area, Dubai, UAE"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+971 4 000 0000"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Official Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@gulfway.ae"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-register-company"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register Company</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
