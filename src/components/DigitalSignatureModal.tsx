import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  RotateCcw,
  Check,
  Upload,
  Shield,
  Clock,
  UserCheck,
  FileCheck2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Building2,
  CreditCard,
  Award,
} from 'lucide-react';
import { DocumentRecord, User, FormField } from '../types/index.js';
import { api } from '../api.js';

interface DigitalSignatureModalProps {
  document: DocumentRecord;
  currentUser: User | null;
  onSuccess: (updatedDoc: DocumentRecord) => void;
  onClose: () => void;
}

export interface SignatorySlotDefinition {
  id: string;
  roleKey: 'employee' | 'employer' | 'finance' | 'approver';
  label: string;
  roleName: string;
  defaultTitle: string;
  description: string;
  aliases: string[];
}

const STANDARD_SIGNATORY_SLOTS: SignatorySlotDefinition[] = [
  {
    id: 'fld-emp-sig',
    roleKey: 'employee',
    label: 'Employee / Applicant',
    roleName: 'USER',
    defaultTitle: 'Staff / Applicant',
    description: 'Applicant formal declaration and consent',
    aliases: ['fld-emp-sig', 'fld-bhf-r-sig', 'fld-saf-sig1', 'employee_signature', 'applicant_signature', 'rider_signature'],
  },
  {
    id: 'fld-employer-sig',
    roleKey: 'employer',
    label: 'Employer / Line Manager',
    roleName: 'EMPLOYER',
    defaultTitle: 'Operations / Line Manager',
    description: 'Direct supervisor custody & work verification',
    aliases: ['fld-employer-sig', 'fld-bhf-m-sig', 'employer_signature', 'manager_signature', 'supervisor_signature'],
  },
  {
    id: 'fld-finance-sig',
    roleKey: 'finance',
    label: 'Finance & Accounts',
    roleName: 'FINANCE',
    defaultTitle: 'Finance & Payroll Officer',
    description: 'Accounts reconciliation, salary, & advance check',
    aliases: ['fld-finance-sig', 'finance_signature', 'accounts_signature', 'payroll_signature'],
  },
  {
    id: 'fld-approver-sig',
    roleKey: 'approver',
    label: 'Approver / Sanction',
    roleName: 'APPROVER',
    defaultTitle: 'Managing Director / Head of HR',
    description: 'Executive management final authorization sanction',
    aliases: ['fld-approver-sig', 'fld-hr-sig', 'fld-ssc-hr-sig', 'fld-saf-sig2', 'approver_signature', 'director_signature', 'hr_signature'],
  },
];

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  document,
  currentUser,
  onSuccess,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentDoc, setCurrentDoc] = useState<DocumentRecord>(document);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [activeTab, setActiveTab] = useState<'DRAW' | 'UPLOAD'>('DRAW');
  const [uploadedSigUrl, setUploadedSigUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [penColor, setPenColor] = useState('#1e3a8a'); // Gulf Blue
  const [penSize, setPenSize] = useState(2.5);

  // Active selected role slot
  const [selectedSlotId, setSelectedSlotId] = useState<string>('fld-emp-sig');
  const [signerName, setSignerName] = useState<string>('');
  const [signerTitle, setSignerTitle] = useState<string>('');

  // Find if slot is signed in currentDoc
  const getSlotSignature = (slot: SignatorySlotDefinition) => {
    const sigs = currentDoc.signatures || [];
    return sigs.find(
      (s) => s.fieldId === slot.id || slot.aliases.includes(s.fieldId) || s.signerRole === slot.roleName
    );
  };

  // Compute signed count
  const signedCount = STANDARD_SIGNATORY_SLOTS.filter((slot) => !!getSlotSignature(slot)).length;

  // Initialize and load template slot mappings if applicable
  useEffect(() => {
    let isMounted = true;
    async function initSlots() {
      try {
        if (currentDoc.formTemplateId) {
          const form = await api.getForm(currentDoc.formTemplateId);
          if (isMounted && form && form.fields) {
            // Find template fields that map to our standard slots
            // This ensures perfect alignment with template coordinates
            STANDARD_SIGNATORY_SLOTS.forEach((slot) => {
              const matchedField = form.fields.find(
                (f: FormField) => f.type === 'signature' && slot.aliases.includes(f.id)
              );
              if (matchedField) {
                slot.id = matchedField.id;
              }
            });
          }
        }
      } catch (err) {
        console.warn('Template signature fields lookup warning:', err);
      }

      // Determine smart initial selected slot
      if (isMounted) {
        // Find first unsigned slot
        const firstUnsigned = STANDARD_SIGNATORY_SLOTS.find((s) => !getSlotSignature(s));
        if (firstUnsigned) {
          setSelectedSlotId(firstUnsigned.id);
        } else {
          setSelectedSlotId(STANDARD_SIGNATORY_SLOTS[0].id);
        }
      }
    }

    initSlots();
    return () => {
      isMounted = false;
    };
  }, [currentDoc.formTemplateId]);

  // When selected slot changes, set appropriate default signer name and title
  useEffect(() => {
    const slot = STANDARD_SIGNATORY_SLOTS.find((s) => s.id === selectedSlotId) || STANDARD_SIGNATORY_SLOTS[0];
    const existing = getSlotSignature(slot);

    if (existing) {
      setSignerName(existing.signerName || '');
      setSignerTitle(existing.signerRole || slot.defaultTitle);
    } else {
      if (slot.roleKey === 'employee') {
        const empName =
          currentDoc.values?.employee_name ||
          currentDoc.values?.rider_name ||
          currentDoc.employeeName ||
          currentUser?.fullName ||
          '';
        setSignerName(empName);
        setSignerTitle(slot.defaultTitle);
      } else {
        setSignerName(currentUser?.fullName || '');
        setSignerTitle(currentUser?.roleName || slot.defaultTitle);
      }
    }
    // Reset canvas when changing slot
    clearCanvas();
  }, [selectedSlotId, currentDoc]);

  // Canvas drawing handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [penColor, penSize, activeTab]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    setErrorMsg('');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setUploadedSigUrl(null);
    setErrorMsg('');
  };

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG or JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedSigUrl(reader.result as string);
      setHasDrawn(true);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  // Helper to extract the currently drawn / uploaded image base64
  const getSignatureDataUrl = (): string | null => {
    if (activeTab === 'DRAW') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return null;
      return canvas.toDataURL('image/png');
    }
    return uploadedSigUrl || null;
  };

  // Action 1: Sign Selected Slot
  const handleApplySingleSignature = async () => {
    const sigDataUrl = getSignatureDataUrl();
    if (!sigDataUrl) {
      setErrorMsg('Please draw or upload a signature first.');
      return;
    }

    const activeSlot = STANDARD_SIGNATORY_SLOTS.find((s) => s.id === selectedSlotId) || STANDARD_SIGNATORY_SLOTS[0];
    const sigType = activeTab === 'DRAW' ? 'DRAWN' : 'UPLOADED';

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessBanner('');

    try {
      const res = await api.applyDigitalSignature(
        currentDoc.id,
        activeSlot.id,
        sigDataUrl,
        sigType,
        signerName || currentUser?.fullName || 'Authorized Signatory',
        signerTitle || activeSlot.defaultTitle
      );

      if (res.document) {
        setCurrentDoc(res.document);
        setSuccessBanner(`✓ Successfully recorded signature for ${activeSlot.label}!`);
        clearCanvas();

        // Advance to next unsigned slot if one exists
        const nextSlot = STANDARD_SIGNATORY_SLOTS.find(
          (s) => s.id !== activeSlot.id && !res.document.signatures?.some((sig) => sig.fieldId === s.id)
        );
        if (nextSlot) {
          setSelectedSlotId(nextSlot.id);
        }
      }
    } catch (err: any) {
      console.error('Digital sign failed:', err);
      setErrorMsg(`Signing failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 2: Sign All Remaining Open Roles simultaneously
  const handleApplyToAllOpenRoles = async () => {
    const sigDataUrl = getSignatureDataUrl();
    if (!sigDataUrl) {
      setErrorMsg('Please draw or upload your authorized signature first.');
      return;
    }

    const openSlots = STANDARD_SIGNATORY_SLOTS.filter((s) => !getSlotSignature(s));
    if (openSlots.length === 0) {
      setErrorMsg('All signatory roles have already been signed.');
      return;
    }

    const sigType = activeTab === 'DRAW' ? 'DRAWN' : 'UPLOADED';
    const items = openSlots.map((slot) => ({
      fieldId: slot.id,
      signatureDataUrl: sigDataUrl,
      type: sigType as any,
      signerName: signerName || currentUser?.fullName || 'Authorized Corporate Officer',
      signerRole: signerTitle || slot.defaultTitle,
    }));

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessBanner('');

    try {
      const res = await api.applyMultipleDigitalSignatures(currentDoc.id, items);
      if (res.document) {
        setCurrentDoc(res.document);
        setSuccessBanner(`✓ Successfully applied signatures across all ${openSlots.length} open roles!`);
        clearCanvas();
      }
    } catch (err: any) {
      console.error('Batch digital sign failed:', err);
      setErrorMsg(`Multi-role signing failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    onSuccess(currentDoc);
  };

  const activeSlot = STANDARD_SIGNATORY_SLOTS.find((s) => s.id === selectedSlotId) || STANDARD_SIGNATORY_SLOTS[0];
  const activeExistingSig = getSlotSignature(activeSlot);
  const nowFormatted = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-indigo-100 text-indigo-800">
                MULTI-SIGNATORY DIGITAL SUITE
              </span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {currentDoc.documentNumber}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {signedCount} of 4 Roles Signed
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Sign for Employee, Employer, Finance, or Approver
            </h3>
          </div>
          <button
            onClick={handleFinish}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            title="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button
              onClick={() => setSuccessBanner('')}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 4-Role Selector Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select Role to Sign ({signedCount}/4 Complete)</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Click any role to sign or re-sign
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STANDARD_SIGNATORY_SLOTS.map((slot, index) => {
              const sig = getSlotSignature(slot);
              const isSelected = slot.id === selectedSlotId;
              const isSigned = !!sig;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setSelectedSlotId(slot.id);
                    setSuccessBanner('');
                    setErrorMsg('');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all relative flex flex-col justify-between cursor-pointer min-h-[90px] ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500 shadow-sm'
                      : isSigned
                      ? 'border-emerald-200 bg-emerald-50/30 text-slate-800 hover:border-emerald-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-600">
                      Step {index + 1}
                    </span>
                    {isSigned ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>Signed</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    <div className="font-bold text-xs line-clamp-1">{slot.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {isSigned ? sig.signerName : slot.defaultTitle}
                    </div>
                  </div>

                  {isSigned && sig.signatureDataUrl && (
                    <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                      <img
                        src={sig.signatureDataUrl}
                        alt="Signature Thumbnail"
                        className="h-4 max-w-[60px] object-contain bg-white/80 rounded px-1"
                      />
                      <span className="text-[9px] text-slate-400">Re-sign</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Slot Information Header */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                Signing as: {activeSlot.label}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                ({activeSlot.description})
              </span>
            </div>
            {activeExistingSig && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Currently Signed by {activeExistingSig.signerName}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Signer Full Name:
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter authorized signatory name"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Designation / Job Title:
              </label>
              <input
                type="text"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="e.g. Operations Manager, Fleet Director"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Input Mode Selector: Draw vs Upload */}
        <div className="flex border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('DRAW')}
            className={`pb-2 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'DRAW'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Draw on Screen (Stylus / Touch / Mouse)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('UPLOAD')}
            className={`pb-2 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'UPLOAD'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload Authorized Stamp / Signature File
          </button>
        </div>

        {/* Drawing Canvas */}
        {activeTab === 'DRAW' && (
          <div className="space-y-3">
            <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden bg-slate-50 shadow-inner">
              <canvas
                ref={canvasRef}
                width={560}
                height={170}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[170px] cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                  Draw signature for {activeSlot.label} within this box
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Pen Color:</span>
                <button
                  type="button"
                  onClick={() => setPenColor('#1e3a8a')}
                  className={`w-5 h-5 rounded-full bg-blue-900 border cursor-pointer ${
                    penColor === '#1e3a8a' ? 'ring-2 ring-blue-500' : ''
                  }`}
                  title="Official Gulf Navy"
                />
                <button
                  type="button"
                  onClick={() => setPenColor('#0f172a')}
                  className={`w-5 h-5 rounded-full bg-slate-900 border cursor-pointer ${
                    penColor === '#0f172a' ? 'ring-2 ring-blue-500' : ''
                  }`}
                  title="Official Slate Black"
                />
              </div>

              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Signature</span>
              </button>
            </div>
          </div>
        )}

        {/* Upload Mode */}
        {activeTab === 'UPLOAD' && (
          <div className="space-y-3">
            <label className="block w-full border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-7 text-center cursor-pointer hover:bg-indigo-50/20 transition-all">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <span className="text-xs font-semibold text-indigo-600 block">
                Choose transparent PNG or JPG image
              </span>
              <span className="text-[11px] text-slate-400">
                Official signature or authorized company stamp for {activeSlot.label}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleUploadSignature}
                className="hidden"
              />
            </label>

            {uploadedSigUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src={uploadedSigUrl}
                    alt="Uploaded Signature"
                    className="max-h-16 object-contain bg-white p-1 rounded border border-slate-200"
                  />
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Signature Loaded</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedSigUrl(null);
                    setHasDrawn(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                  title="Clear uploaded signature image preview"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Image Preview</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Audit Meta Stamp */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>UAE Corporate Audit Binding & Cryptographic Proof</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Signer Profile:</span>
            <span className="font-semibold text-slate-800">{signerName || 'Authorized Signatory'} ({signerTitle || activeSlot.defaultTitle})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Signatory Target:</span>
            <span className="font-bold text-indigo-700">{activeSlot.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Document Number:</span>
            <span className="font-mono font-bold text-slate-800">{currentDoc.documentNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Timestamp (GST):</span>
            <span>{nowFormatted}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleFinish}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer order-2 sm:order-1"
          >
            {signedCount > 0 ? 'Done / Close Window' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2 justify-end">
            {/* Quick multi-sign: Apply same signature to all open roles */}
            {signedCount < 4 && (
              <button
                type="button"
                onClick={handleApplyToAllOpenRoles}
                disabled={isSubmitting || !hasDrawn}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-40 border border-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                title="Sign all remaining open roles at once with this signature"
              >
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>Apply to All Open Roles ({4 - signedCount})</span>
              </button>
            )}

            {/* Primary Sign Action for Active Slot */}
            <button
              type="button"
              onClick={handleApplySingleSignature}
              disabled={isSubmitting || !hasDrawn}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving Signature...'
                  : `Sign as ${activeSlot.label}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
