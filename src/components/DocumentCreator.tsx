import React, { useState } from 'react';
import {
  FileText,
  Save,
  Eye,
  AlertTriangle,
  Building2,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Printer,
  PenTool,
  Upload,
  Download,
  PlusCircle,
} from 'lucide-react';
import { FormTemplate, Company, DocumentRecord } from '../types/index.js';
import { api } from '../api.js';

interface DocumentCreatorProps {
  forms: FormTemplate[];
  companies: Company[];
  selectedForm: FormTemplate | null;
  onSelectForm: (form: FormTemplate) => void;
  onDocumentCreated: (doc: DocumentRecord, pdfBase64?: string) => void;
  onCancel: () => void;
  onNavigateToFormBuilder?: () => void;
}

export const DocumentCreator: React.FC<DocumentCreatorProps> = ({
  forms,
  companies,
  selectedForm,
  onSelectForm,
  onDocumentCreated,
  onCancel,
  onNavigateToFormBuilder,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [signingMethod, setSigningMethod] = useState<'PHYSICAL' | 'DIGITAL'>('PHYSICAL');
  const [draftSuccessMsg, setDraftSuccessMsg] = useState('');
  const [previewPdfModal, setPreviewPdfModal] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [creatorError, setCreatorError] = useState<string | null>(null);

  // If no form selected yet, show form selector catalog or empty state
  if (!selectedForm) {
    if (forms.length === 0) {
      return (
        <div className="p-8 max-w-4xl mx-auto space-y-6 text-center">
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                No Form Templates Available in Catalog
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Before generating official numbered records, you need at least one published form template. Use the Form Builder to configure your document fields, or click below.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {onNavigateToFormBuilder && (
                <button
                  type="button"
                  onClick={onNavigateToFormBuilder}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Open Form Builder</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Select Form to Fill</h2>
          <p className="text-xs text-slate-500">
            Choose an active company form to start entering information and generating an official numbered document.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-500 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {form.formCode}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">v{form.currentVersion}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-2">{form.formName}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{form.description}</p>
                <div className="mt-3 text-[11px] text-slate-400">
                  <span>Category: {form.category}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    onSelectForm(form);
                    // Pre-fill default values
                    const initial: Record<string, any> = {};
                    form.fields.forEach((f) => {
                      if (f.defaultValue) initial[f.name] = f.defaultValue;
                    });
                    setFormValues(initial);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Start Form →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Value change handler
  const handleValueChange = (fieldName: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    }
  };

  // Validate form fields
  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    for (const field of selectedForm.fields) {
      // Ignore automated / stamp / signature / qr fields during initial data entry
      if (
        field.type === 'document_number' ||
        field.type === 'qr_code' ||
        field.type === 'company_stamp' ||
        field.type === 'signature'
      ) {
        continue;
      }

      if (field.required) {
        const val = formValues[field.name];
        if (val === undefined || val === null || String(val).trim() === '') {
          errors[field.name] = `${field.label} is required`;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // SAVE DRAFT - Strictly no document number assigned!
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setDraftSuccessMsg('');
    try {
      const draftDoc = await api.saveDraft({
        formTemplateId: selectedForm.id,
        companyId: selectedCompanyId,
        values: formValues,
      });

      setDraftSuccessMsg(
        '✓ Draft saved successfully. Official document number has NOT been allocated.'
      );
    } catch (err: any) {
      alert(`Failed to save draft: ${err.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // PREVIEW FORM
  const handlePreviewForm = async () => {
    setIsPreviewLoading(true);
    setCreatorError(null);
    try {
      const company = companies.find((c) => c.id === selectedCompanyId) || companies[0];
      const preview = await api.testPreviewPdf(selectedForm, formValues);
      setPreviewPdfModal(preview.previewUrl || preview.pdfBase64);
    } catch (err: any) {
      setCreatorError(`Preview generation failed: ${err.message}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Open confirmation modal for official document numbering
  const handleInitiateNumbering = () => {
    if (!validateFields()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowConfirmModal(true);
  };

  // Confirm and call atomic server numbering engine
  const handleConfirmAndGenerate = async () => {
    setIsGeneratingNumber(true);
    setCreatorError(null);
    try {
      // Step 1: Save draft record first to get document id
      const draft = await api.saveDraft({
        formTemplateId: selectedForm.id,
        companyId: selectedCompanyId,
        values: formValues,
      });

      // Step 2: Request server atomic sequence allocation + official PDF generation
      const result = await api.generateDocumentNumber(draft.id, signingMethod);

      setShowConfirmModal(false);
      onDocumentCreated(result.document, result.pdfBase64);
    } catch (err: any) {
      setCreatorError(`Document numbering allocation error: ${err.message}`);
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  // Filter out system coordinate fields for data entry
  const entryFields = selectedForm.fields.filter(
    (f) =>
      f.type !== 'document_number' &&
      f.type !== 'qr_code' &&
      f.type !== 'company_stamp' &&
      f.type !== 'signature'
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Error / Success Banners */}
      {creatorError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{creatorError}</span>
          <button onClick={() => setCreatorError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
              FORM: {selectedForm.formCode}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
              Version {selectedForm.currentVersion}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedForm.formName}</h2>
          <p className="text-xs text-slate-500">{selectedForm.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Change Form
          </button>
          <button
            onClick={handlePreviewForm}
            disabled={isPreviewLoading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>{isPreviewLoading ? 'Generating Preview...' : 'Preview PDF'}</span>
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
          </button>
          <button
            onClick={handleInitiateNumbering}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate for Signature</span>
          </button>
        </div>
      </div>

      {draftSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span>{draftSuccessMsg}</span>
          <button onClick={() => setDraftSuccessMsg('')} className="text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Instructions Alert */}
      {selectedForm.instructions && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Instructions: </span>
            <span>{selectedForm.instructions}</span>
          </div>
        </div>
      )}

      {/* Form Data Entry Sheet */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
        {/* Company Binding */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Issuing Operating Company <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}) - License: {c.tradeLicenseNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Document Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {entryFields.map((field) => {
              const hasError = validationErrors[field.name];
              const value = formValues[field.name] !== undefined ? formValues[field.name] : '';

              if (field.type === 'textarea') {
                return (
                  <div key={field.id} className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <textarea
                      rows={3}
                      value={value}
                      onChange={(e) => handleValueChange(field.name, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label}...`}
                      className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-hidden focus:border-blue-500 font-medium ${
                        hasError ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                      }`}
                    />
                    {hasError && <p className="text-[11px] text-rose-600 mt-1">{hasError}</p>}
                  </div>
                );
              }

              if (field.type === 'dropdown') {
                return (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      value={value}
                      onChange={(e) => handleValueChange(field.name, e.target.value)}
                      className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-hidden focus:border-blue-500 ${
                        hasError ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                      }`}
                    >
                      <option value="">-- Select {field.label} --</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {hasError && <p className="text-[11px] text-rose-600 mt-1">{hasError}</p>}
                  </div>
                );
              }

              if (field.type === 'checkbox') {
                return (
                  <div key={field.id} className="flex items-center gap-3 pt-4">
                    <input
                      type="checkbox"
                      id={`chk-${field.id}`}
                      checked={value === true || value === 'true'}
                      onChange={(e) => handleValueChange(field.name, e.target.checked)}
                      className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 cursor-pointer"
                    />
                    <label
                      htmlFor={`chk-${field.id}`}
                      className="text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {field.label}
                    </label>
                  </div>
                );
              }

              return (
                <div key={field.id}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={value}
                    onChange={(e) => handleValueChange(field.name, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-hidden focus:border-blue-500 font-medium ${
                      hasError ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300'
                    }`}
                  />
                  {hasError && <p className="text-[11px] text-rose-600 mt-1">{hasError}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            Saving draft preserves information without allocating sequence numbers.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Save Draft
            </button>
            <button
              onClick={handleInitiateNumbering}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Generate for Signature →
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR ATOMIC DOCUMENT NUMBER ALLOCATION */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Allocate Official Document Number
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanent sequence assignment & compliance notice
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed space-y-2">
              <p className="font-semibold">
                "You are about to generate an official document number. Once generated, this number cannot be deleted or reused."
              </p>
              <p className="text-[11px] text-amber-800/90">
                The atomic numbering engine will allocate the next sequential serial on the server. Even if later cancelled, this record will be archived as VOID with complete audit logs.
              </p>
            </div>

            {/* Signing Method Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Select Signing Method:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSigningMethod('PHYSICAL')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    signingMethod === 'PHYSICAL'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Printer className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold">Physical Signature</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Print numbered PDF, sign/thumbprint, upload scanned signed copy.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSigningMethod('DIGITAL')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    signingMethod === 'DIGITAL'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <PenTool className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold">Digital Signature</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Sign directly on screen using mouse, stylus or touch signature pad.
                  </p>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAndGenerate}
                disabled={isGeneratingNumber}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingNumber ? 'Allocating Number...' : 'Confirm & Allocate Number'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAFT PREVIEW MODAL */}
      {previewPdfModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[88vh] p-6 shadow-2xl border border-slate-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Draft Document Preview (Watermarked)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Live layout rendering with template coordinates and sample values
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={previewPdfModal}
                  target="_blank"
                  rel="noreferrer"
                  download="draft-preview.pdf"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Draft</span>
                </a>
                <button
                  onClick={() => setPreviewPdfModal(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-sm px-2 py-1"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-slate-100 rounded-xl border border-slate-300 overflow-hidden">
              <object
                data={previewPdfModal}
                type="application/pdf"
                className="w-full h-full"
              >
                <iframe
                  src={previewPdfModal}
                  className="w-full h-full border-0"
                  title="PDF Draft Preview"
                />
              </object>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
