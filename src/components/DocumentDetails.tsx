import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  XCircle,
  Ban,
  ShieldCheck,
  Clock,
  Printer,
  FileText,
  Building2,
  Calendar,
  PenTool,
  QrCode,
  FileCheck2,
  Copy,
  ExternalLink,
  Eye,
  Maximize2,
  AlertCircle,
  Sparkles,
  Pencil,
  Save,
  RefreshCw,
} from 'lucide-react';
import { DocumentRecord, User } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import { api } from '../api.js';
import { PdfViewerCanvas } from './PdfViewerCanvas.js';
import { downloadPdfFromUrl } from '../utils/pdfDownloadHelper.js';

interface DocumentDetailsProps {
  document: DocumentRecord;
  currentUser: User | null;
  onBack: () => void;
  onOpenPhysicalSign: (doc: DocumentRecord) => void;
  onOpenDigitalSign: (doc: DocumentRecord) => void;
  onDocumentUpdated: (doc: DocumentRecord) => void;
  onOpenPublicVerify: (token: string) => void;
}

export const DocumentDetails: React.FC<DocumentDetailsProps> = ({
  document,
  currentUser,
  onBack,
  onOpenPhysicalSign,
  onOpenDigitalSign,
  onDocumentUpdated,
  onOpenPublicVerify,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, any>>(document.values || {});
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [templateFields, setTemplateFields] = useState<any[]>([]);
  const [hasLoadedTemplate, setHasLoadedTemplate] = useState(false);

  const [approvalRemarks, setApprovalRemarks] = useState('Sanctioned and approved according to company governance policy.');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [voidRemarks, setVoidRemarks] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 6000);
  };

  // Manager Approval Action
  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const res = await api.approveDocument(document.id, approvalRemarks);
      setApproveModalOpen(false);
      showNotification('success', `Document ${document.documentNumber || document.id} successfully approved!`);
      onDocumentUpdated(res.document);
    } catch (err: any) {
      showNotification('error', `Approval failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject Action
  const handleReject = async () => {
    if (!rejectRemarks.trim()) {
      showNotification('error', 'Remarks are required for rejecting a document.');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await api.rejectDocument(document.id, rejectRemarks);
      setRejectModalOpen(false);
      showNotification('success', 'Document rejected and recorded in audit log.');
      onDocumentUpdated(res.document);
    } catch (err: any) {
      showNotification('error', `Rejection failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Finalize and Lock with SHA-256 Hash
  const handleFinalize = async () => {
    setIsProcessing(true);
    try {
      const res = await api.finalizeDocument(document.id);
      setFinalizeModalOpen(false);
      showNotification('success', 'Document finalized! Cryptographic SHA-256 seal permanently locked.');
      onDocumentUpdated(res.document);
    } catch (err: any) {
      showNotification('error', `Finalization failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Void Document (Retains number, marks VOID)
  const handleVoid = async () => {
    if (!voidRemarks.trim()) {
      showNotification('error', 'Cancellation reason is required to void this document.');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await api.voidDocument(document.id, voidRemarks);
      setVoidModalOpen(false);
      showNotification('success', `Document ${document.documentNumber} has been permanently voided.`);
      onDocumentUpdated(res.document);
    } catch (err: any) {
      showNotification('error', `Void failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copySha256 = () => {
    const hash = document.finalPdfHashSha256 || (document as any).sha256Hash;
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const copyToken = () => {
    const tok = document.secureVerificationToken || (document as any).verificationToken;
    if (!tok) return;
    navigator.clipboard.writeText(tok);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleOpenEditModal = async () => {
    setEditValues({ ...(document.values || {}) });
    setEditModalOpen(true);
    if (!hasLoadedTemplate) {
      try {
        const forms = await api.getForms();
        const t = forms.find((f) => f.id === document.formTemplateId);
        if (t && t.fields && t.fields.length > 0) {
          setTemplateFields(
            t.fields.filter(
              (fld: any) =>
                fld.editable !== false &&
                fld.type !== 'qr_code' &&
                fld.type !== 'signature' &&
                fld.type !== 'company_stamp' &&
                fld.type !== 'document_number'
            )
          );
        }
        setHasLoadedTemplate(true);
      } catch (err) {
        console.warn('Could not load template fields for edit modal', err);
      }
    }
  };

  const handleSaveEditValues = async () => {
    setIsSavingEdit(true);
    try {
      const empName = editValues.employee_name || editValues.rider_name || document.employeeName;
      const empId = editValues.employee_id || document.employeeId;
      const res = await api.updateDocument(document.id, {
        values: editValues,
        employeeName: empName,
        employeeId: empId,
      });
      showNotification('success', 'Document information updated and PDF re-rendered successfully!');
      setEditModalOpen(false);
      setPdfRefreshKey((prev) => prev + 1);
      onDocumentUpdated(res.document);
    } catch (err: any) {
      showNotification('error', `Failed to update document: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Lifecycle stage status flags
  const isNumbered = !!document.documentNumber;
  const isAwaitingSign = document.status === 'AWAITING_SIGNATURE' || document.status === 'NUMBER_ASSIGNED';
  const isPendingApproval = document.status === 'SIGNED' || document.status === 'AWAITING_APPROVAL';
  const isSigned =
    document.status === 'SIGNED' ||
    document.status === 'AWAITING_APPROVAL' ||
    document.status === 'APPROVED' ||
    document.status === 'FINAL';
  const isApproved = document.status === 'APPROVED' || document.status === 'FINAL';
  const isFinal = document.status === 'FINAL';

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const verificationToken = document.secureVerificationToken || (document as any).verificationToken;
  const updateFingerprint = `${document.updatedAt || ''}_${(document.signatures || []).length}_${document.status}_${pdfRefreshKey}`;
  const pdfStreamUrl = `/api/documents/${document.id}/pdf?baseUrl=${encodeURIComponent(origin)}&sigCount=${(document.signatures || []).length}&v=${encodeURIComponent(updateFingerprint)}`;
  const pdfDownloadUrl = `/api/documents/${document.id}/pdf?download=true&baseUrl=${encodeURIComponent(origin)}&v=${encodeURIComponent(updateFingerprint)}`;
  const qrImageUrl = `/api/documents/${document.id}/qr-code/image?baseUrl=${encodeURIComponent(origin)}&v=${encodeURIComponent(updateFingerprint)}`;
  const publicVerifyUrl = `${origin}/verify/${verificationToken || ''}`;

  const historyList = document.statusHistory || (document as any).history || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="Back to register"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {document.documentNumber || 'Draft (Unallocated)'}
              </span>
              <StatusBadge status={document.status} size="sm" />
              <span className="text-[11px] text-slate-500 font-mono">
                {document.companyName}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{document.formName}</h2>
          </div>
        </div>

        {/* Primary Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Preview Button */}
          <button
            onClick={() => setPreviewModalOpen(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Preview generated PDF document"
          >
            <Eye className="w-4 h-4" />
            <span>Preview PDF</span>
          </button>

          {/* PDF Download Button */}
          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={`${document.documentNumber || 'DOCUMENT'}.pdf`}
            onClick={() => downloadPdfFromUrl(pdfDownloadUrl, `${document.documentNumber || 'DOCUMENT'}.pdf`)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer inline-flex"
            title="Download official PDF file"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download PDF</span>
          </a>

          {/* Edit Information Button (Available for non-final, non-void docs) */}
          {document.status !== 'FINAL' && document.status !== 'VOID' && (
            <button
              onClick={handleOpenEditModal}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Edit filled form information in this template"
            >
              <Pencil className="w-4 h-4 text-amber-600" />
              <span>Edit Information</span>
            </button>
          )}

          {/* SIGNING ACTIONS: Display BOTH options clearly when awaiting signature */}
          {isAwaitingSign && (
            <>
              <button
                onClick={() => onOpenDigitalSign(document)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                title="Sign digitally on screen with digital pen or touch"
              >
                <PenTool className="w-4 h-4" />
                <span>Apply Digital Signature</span>
              </button>

              <button
                onClick={() => onOpenPhysicalSign(document)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                title="Print official copy and upload signed physical scan"
              >
                <Printer className="w-4 h-4" />
                <span>Upload Physical Scan</span>
              </button>
            </>
          )}

          {/* APPROVAL ACTIONS: When signed and waiting for manager */}
          {isPendingApproval && (
            <>
              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={isProcessing}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              <button
                onClick={() => setApproveModalOpen(true)}
                disabled={isProcessing}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Document</span>
              </button>
            </>
          )}

          {/* FINALIZATION ACTION: If approved, allow locking */}
          {document.status === 'APPROVED' && (
            <button
              onClick={() => setFinalizeModalOpen(true)}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Finalize & Apply SHA-256 Seal</span>
            </button>
          )}

          {/* VOID ACTION */}
          {document.status !== 'FINAL' && document.status !== 'VOID' && isNumbered && (
            <button
              onClick={() => setVoidModalOpen(true)}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
              title="Void this document while strictly preserving its sequence number"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Void</span>
            </button>
          )}
        </div>
      </div>

      {/* Workflow Step Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
          {/* Step 1: Draft */}
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Draft Form</div>
              <div className="text-[10px] text-slate-400">Values filled</div>
            </div>
          </div>

          {/* Step 2: Number Allocated */}
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isNumbered
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-300'
              }`}
            >
              {isNumbered ? '✓' : '2'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Official Number</div>
              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                {document.documentNumber || 'Pending'}
              </div>
            </div>
          </div>

          {/* Step 3: Signed */}
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isSigned
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-300'
              }`}
            >
              {isSigned ? '✓' : '3'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Signed</div>
              <div className="text-[10px] text-slate-400">
                {document.signatures && document.signatures.length > 0
                  ? 'Digital Signature'
                  : document.signedDocumentUrl || document.signedFileUrl
                  ? 'Physical Scan'
                  : 'Pending'}
              </div>
            </div>
          </div>

          {/* Step 4: Approved */}
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isApproved
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-300'
              }`}
            >
              {isApproved ? '✓' : '4'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Sanctioned</div>
              <div className="text-[10px] text-slate-400">
                {isApproved ? 'Manager Approved' : 'Pending Approval'}
              </div>
            </div>
          </div>

          {/* Step 5: Finalized Seal */}
          <div className="flex flex-col items-center text-center space-y-1.5 col-span-2 md:col-span-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isFinal
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-300'
              }`}
            >
              {isFinal ? '✓' : '5'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">SHA-256 Lock</div>
              <div className="text-[10px] text-slate-400">
                {isFinal ? 'Immutable Record' : 'Pending Seal'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Form Values, Signatures, and PDF Preview */}
        <div className="lg:col-span-8 space-y-6">
          {/* SIGNING SECTION */}
          {isAwaitingSign && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-indigo-950">
                    Awaiting Signature & Verification
                  </h3>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-indigo-900/80">
                This document has been allocated official serial number <strong>{document.documentNumber}</strong>. Choose how you would like to sign:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => onOpenDigitalSign(document)}
                  className="p-3.5 bg-white border border-indigo-200 hover:border-indigo-500 rounded-xl text-left shadow-2xs hover:shadow-xs transition-all flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Apply Digital Signature</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Draw on screen with touch or mouse, recorded with IP & timestamp.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => onOpenPhysicalSign(document)}
                  className="p-3.5 bg-white border border-amber-200 hover:border-amber-500 rounded-xl text-left shadow-2xs hover:shadow-xs transition-all flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Upload Physical Scan</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Print official form, collect physical ink signature, and upload scan.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Captured Digital Signatures */}
          {document.signatures && document.signatures.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>Captured Digital Signatures ({document.signatures.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {document.signatures.map((sig) => (
                  <div key={sig.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{sig.signerName}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {sig.signedAt ? new Date(sig.signedAt).toLocaleString('en-GB') : 'Signed'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">{sig.signerRole}</div>
                    {sig.signatureDataUrl && (
                      <div className="bg-white p-2 border border-slate-200 rounded flex items-center justify-center">
                        <img
                          src={sig.signatureDataUrl}
                          alt="Digital Signature"
                          className="max-h-16 max-w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Embedded Document PDF Preview Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Document PDF Preview (Official Sheet)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewModalOpen(true)}
                  className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                </button>
                <a
                  href={pdfDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`${document.documentNumber || 'DOCUMENT'}.pdf`}
                  onClick={() => downloadPdfFromUrl(pdfDownloadUrl, `${document.documentNumber || 'DOCUMENT'}.pdf`)}
                  className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer inline-flex"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>

            {/* Embedded Interactive PDF Viewer Frame */}
            <div className="w-full bg-slate-900 rounded-xl overflow-hidden shadow-inner h-[580px]">
              <PdfViewerCanvas
                pdfUrl={pdfStreamUrl}
                documentNumber={document.documentNumber || 'Draft'}
                title={`${document.formName || 'Document'} Official Sheet`}
                onClose={() => setPreviewModalOpen(true)}
                showDownloadButton={true}
                showOpenInNewTabButton={true}
                className="h-[580px]"
              />
            </div>
          </div>

          {/* Form Captured Values */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Captured Form Data Fields</span>
              </h3>
              {document.status !== 'FINAL' && document.status !== 'VOID' && (
                <button
                  onClick={handleOpenEditModal}
                  className="px-2.5 py-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md flex items-center gap-1 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit Fields</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(document.values || {}).map(([key, val]) => (
                <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 break-words mt-0.5 block">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Audit Trail & Lifecycle History ({historyList.length})</span>
            </h3>
            <div className="space-y-3">
              {historyList.map((h: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <StatusBadge status={h.newStatus || h.status} size="sm" />
                      <span>by {h.changedByName || h.changedBy || 'System'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {h.changedAt || h.timestamp
                        ? new Date(h.changedAt || h.timestamp).toLocaleString('en-GB')
                        : 'Recorded'}
                    </span>
                  </div>
                  {h.remarks && (
                    <p className="text-[11px] text-slate-600 pl-2 border-l-2 border-slate-300 italic">
                      "{h.remarks}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 cols: QR Verification & Cryptographic Authenticity */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold tracking-wide">Document Authenticity</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                {isFinal ? 'SEALED & LOCKED' : 'ACTIVE RECORD'}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-400">Sequence Register:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {document.documentNumber || 'Pending Allocation'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-400">Issuing Entity:</span>
                <span className="text-slate-200 font-semibold">{document.companyName}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-400">Form Code:</span>
                <span className="font-mono text-slate-200">{document.formCode}</span>
              </div>

              {/* SHA-256 Checksum Card */}
              {(document.finalPdfHashSha256 || (document as any).sha256Hash) ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">SHA-256 Checksum:</span>
                    <button
                      onClick={copySha256}
                      className="text-[10px] text-blue-300 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedHash ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="mt-1 p-2 bg-black/40 rounded-md font-mono text-[10px] text-emerald-400 break-all border border-white/10 select-all">
                    {document.finalPdfHashSha256 || (document as any).sha256Hash}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-[11px] text-slate-300">
                  SHA-256 seal is generated upon final sanction and locks this document against tampering.
                </div>
              )}

              {/* Server-Side Verification QR Code Badge */}
              {verificationToken && (
                <div className="pt-2 space-y-3">
                  <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center border border-white/20 text-slate-900 shadow-xs">
                    <img
                      src={qrImageUrl}
                      alt="Document Verification QR Code"
                      className="w-36 h-36 rounded shadow-xs"
                    />
                    <span className="text-[10px] text-slate-600 font-semibold mt-2 text-center">
                      Official Verification QR Code
                    </span>
                    <span className="text-[9px] text-slate-400 text-center mt-0.5">
                      Scan with mobile phone to verify authenticity against registry
                    </span>
                    <div className="flex items-center gap-1 mt-2 w-full justify-between bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      <span className="text-[9px] text-slate-600 font-mono truncate max-w-[150px]" title={publicVerifyUrl}>
                        {publicVerifyUrl}
                      </span>
                      <button
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(publicVerifyUrl);
                            setCopiedToken(true);
                            setTimeout(() => setCopiedToken(false), 2000);
                          }
                        }}
                        className="text-[9px] text-blue-600 hover:underline font-semibold shrink-0"
                      >
                        {copiedToken ? 'Copied' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenPublicVerify(verificationToken)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Open Public QR Verification Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* APPROVE MODAL */}
      {approveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-teal-700">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Approve Document</h3>
            </div>
            <p className="text-xs text-slate-600">
              Confirm official approval of <strong>{document.documentNumber || document.formName}</strong>. This status transition will be recorded permanently in the sequence register.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Approval Remarks / Notes:
              </label>
              <textarea
                rows={3}
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Optional remarks (e.g. Sanctioned and verified according to policy)..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? 'Approving...' : 'Confirm Approval'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-rose-700">
              <XCircle className="w-5 h-5" />
              <span>Reject Document</span>
            </h3>
            <p className="text-xs text-slate-500">
              Please enter the specific reason for rejecting this document. This comment will be permanently recorded in the audit trail.
            </p>

            <textarea
              rows={3}
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              placeholder="State reason for rejection (e.g. Incomplete information, unclear signature)..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectRemarks.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINALIZE MODAL */}
      {finalizeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Finalize & Seal Document</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Finalizing locks this document into an immutable permanent state. The system will compute a cryptographic <strong>SHA-256 checksum</strong> locking all text, numbers, signatures, and QR codes against any future modifications.
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium">
              Document Number: <strong className="font-mono">{document.documentNumber}</strong>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setFinalizeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isProcessing ? 'Finalizing...' : 'Confirm & Apply Seal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOID MODAL */}
      {voidModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-slate-800">
              <Ban className="w-5 h-5 text-rose-600" />
              <span>Void Document Number</span>
            </h3>
            <p className="text-xs text-slate-600">
              Notice: The document number <strong>{document.documentNumber}</strong> will remain permanently registered and will <strong>NOT</strong> be reused or recycled.
            </p>

            <textarea
              rows={3}
              value={voidRemarks}
              onChange={(e) => setVoidRemarks(e.target.value)}
              placeholder="Mandatory reason for cancellation..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setVoidModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={isProcessing || !voidRemarks.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Permanently Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT INFORMATION MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] p-6 shadow-2xl border border-slate-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Document Information
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {document.documentNumber || 'Draft'} • {document.formName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Update Document Content</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Edit the field values below. Upon saving, the document data will update and the PDF will be re-rendered with your new information.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {templateFields.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templateFields.map((fld) => {
                    const val = editValues[fld.name] ?? '';
                    return (
                      <div
                        key={fld.id}
                        className={fld.type === 'textarea' || fld.width > 60 ? 'md:col-span-2' : ''}
                      >
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {fld.label}
                          {fld.required && <span className="text-rose-500 ml-0.5">*</span>}
                        </label>
                        {fld.type === 'textarea' ? (
                          <textarea
                            value={val}
                            onChange={(e) =>
                              setEditValues({ ...editValues, [fld.name]: e.target.value })
                            }
                            rows={3}
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                            placeholder={fld.placeholder || `Enter ${fld.label}`}
                          />
                        ) : fld.type === 'dropdown' && fld.options && fld.options.length > 0 ? (
                          <select
                            value={val}
                            onChange={(e) =>
                              setEditValues({ ...editValues, [fld.name]: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden bg-white"
                          >
                            <option value="">-- Select {fld.label} --</option>
                            {fld.options.map((opt: string) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={fld.type === 'number' ? 'number' : fld.type === 'date' ? 'date' : 'text'}
                            value={val}
                            onChange={(e) =>
                              setEditValues({ ...editValues, [fld.name]: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                            placeholder={fld.placeholder || `Enter ${fld.label}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.keys(editValues).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No custom fields found. You can add field values below.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(editValues).map(([k, v]) => (
                        <div key={k} className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            {k.replace(/_/g, ' ')}
                          </label>
                          <input
                            type="text"
                            value={String(v ?? '')}
                            onChange={(e) =>
                              setEditValues({ ...editValues, [k]: e.target.value })
                            }
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0">
              <span className="text-[11px] text-slate-500">
                Changes will be saved to document record and re-render PDF preview.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditValues}
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving & Re-rendering...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes & Update PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN PDF PREVIEW MODAL */}
      {previewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-5xl w-full h-[90vh]">
            <PdfViewerCanvas
              pdfUrl={pdfStreamUrl}
              documentNumber={document.documentNumber || 'Draft Preview'}
              title={`${document.documentNumber || 'Draft Preview'} — ${document.formName} (Official Serial & QR)`}
              onClose={() => setPreviewModalOpen(false)}
              showDownloadButton={true}
              showOpenInNewTabButton={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
