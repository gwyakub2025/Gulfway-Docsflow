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
} from 'lucide-react';
import { DocumentRecord, User, FormField } from '../types/index.js';
import { api } from '../api.js';

interface DigitalSignatureModalProps {
  document: DocumentRecord;
  currentUser: User | null;
  onSuccess: (updatedDoc: DocumentRecord) => void;
  onClose: () => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  document,
  currentUser,
  onSuccess,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [activeTab, setActiveTab] = useState<'DRAW' | 'UPLOAD'>('DRAW');
  const [uploadedSigUrl, setUploadedSigUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [penColor, setPenColor] = useState('#1e3a8a'); // Gulf Blue
  const [penSize, setPenSize] = useState(2.5);

  // Dynamic template signature slots detection
  const [availableSlots, setAvailableSlots] = useState<Array<{ id: string; label: string; role?: string }>>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('fld-emp-sig');

  useEffect(() => {
    let isMounted = true;
    async function loadTemplateSignatureSlots() {
      try {
        if (document.formTemplateId) {
          const form = await api.getForm(document.formTemplateId);
          if (isMounted && form && form.fields) {
            const sigs = form.fields
              .filter((f: FormField) => f.type === 'signature')
              .map((f: FormField) => ({
                id: f.id,
                label: f.label || 'Signature',
                role: f.signerRole,
              }));

            if (sigs.length > 0) {
              setAvailableSlots(sigs);

              // Smart default selection:
              // If user is Approver, or applicant slot is already signed, default to approver slot
              const hasApplicantSigned = (document.signatures || []).some(
                (s) => s.fieldId === sigs[0].id || !s.fieldId.includes('hr')
              );
              const isApproverUser =
                currentUser?.roleName === 'APPROVER' ||
                currentUser?.roleName === 'ADMIN' ||
                currentUser?.roleName === 'SUPER_ADMIN';

              if (isApproverUser && sigs.length > 1 && hasApplicantSigned) {
                setSelectedSlotId(sigs[1].id);
              } else {
                setSelectedSlotId(sigs[0].id);
              }
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Could not load form template signature slots, using standard defaults:', err);
      }

      // Default fallback slots
      if (isMounted) {
        setAvailableSlots([
          { id: 'fld-emp-sig', label: 'Applicant Signature', role: 'USER' },
          { id: 'fld-hr-sig', label: 'HR / Manager Verification', role: 'APPROVER' },
        ]);
        setSelectedSlotId('fld-emp-sig');
      }
    }

    loadTemplateSignatureSlots();
    return () => {
      isMounted = false;
    };
  }, [document.formTemplateId, document.signatures, currentUser?.roleName]);

  // Initialize Canvas
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

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
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
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedSigUrl(reader.result as string);
      setHasDrawn(true);
    };
    reader.readAsDataURL(file);
  };

  const handleApplySignature = async () => {
    let finalSignatureUrl = '';

    if (activeTab === 'DRAW') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        setErrorMsg('Please draw your signature before submitting.');
        return;
      }
      finalSignatureUrl = canvas.toDataURL('image/png');
    } else {
      if (!uploadedSigUrl) {
        setErrorMsg('Please select an authorized signature image to upload.');
        return;
      }
      finalSignatureUrl = uploadedSigUrl;
    }

    const targetSlot = selectedSlotId || 'fld-emp-sig';
    const sigType = activeTab === 'DRAW' ? 'DRAWN' : 'UPLOADED';

    console.log('[DigitalSignatureModal] Applying signature payload (BEFORE API UPDATE):', {
      documentId: document.id,
      documentNumber: document.documentNumber,
      selectedSlotId: targetSlot,
      signatureType: sigType,
      payloadDataLength: finalSignatureUrl.length,
      payloadPreview: finalSignatureUrl.substring(0, 50) + '...',
      currentDocStatus: document.status,
      timestamp: new Date().toISOString(),
    });

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.applyDigitalSignature(
        document.id,
        targetSlot,
        finalSignatureUrl,
        sigType
      );

      console.log('[DigitalSignatureModal] Received API response (AFTER API UPDATE):', {
        success: res.success,
        updatedDocumentId: res.document?.id,
        previousStatus: document.status,
        newStatus: res.document?.status,
        totalSignatures: res.document?.signatures?.length,
        signatures: res.document?.signatures?.map((s) => ({
          id: s.id,
          fieldId: s.fieldId,
          signerName: s.signerName,
          type: s.type,
          dataLength: s.signatureDataUrl?.length,
        })),
        generatedPdfUrl: res.document?.generatedPdfUrl,
      });

      onSuccess(res.document);
    } catch (err: any) {
      console.error('[DigitalSignatureModal] API update failed:', err);
      setErrorMsg(`Signing failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nowFormatted = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' });
  const selectedSlot = availableSlots.find((s) => s.id === selectedSlotId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-indigo-100 text-indigo-800">
                DIGITAL SIGNATURE PAD
              </span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {document.documentNumber}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Apply Cryptographically Bound Digital Signature
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Signature Slot Selector */}
        {availableSlots.length > 0 && (
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>Target Signature Slot in Document</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {availableSlots.map((slot) => {
                const isSignedAlready = (document.signatures || []).some((s) => s.fieldId === slot.id);
                const isSelected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-2xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{slot.label}</div>
                      <div className="text-[10px] text-slate-500">{slot.role || 'Signatory Slot'}</div>
                    </div>
                    {isSignedAlready ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                        Signed ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        Open
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('DRAW')}
            className={`pb-2 px-4 border-b-2 transition-colors ${
              activeTab === 'DRAW'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Draw on Screen (Stylus / Mouse)
          </button>
          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`pb-2 px-4 border-b-2 transition-colors ${
              activeTab === 'UPLOAD'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload Authorized Stamp / Signature
          </button>
        </div>

        {/* Draw Mode Canvas */}
        {activeTab === 'DRAW' && (
          <div className="space-y-3">
            <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden bg-slate-50 shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[180px] cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                  Draw your official signature or thumbprint within this box
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Pen Color:</span>
                <button
                  type="button"
                  onClick={() => setPenColor('#1e3a8a')}
                  className={`w-5 h-5 rounded-full bg-blue-900 border ${
                    penColor === '#1e3a8a' ? 'ring-2 ring-blue-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setPenColor('#0f172a')}
                  className={`w-5 h-5 rounded-full bg-slate-900 border ${
                    penColor === '#0f172a' ? 'ring-2 ring-blue-500' : ''
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
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
            <label className="block w-full border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50/20 transition-all">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <span className="text-xs font-semibold text-blue-600 block">
                Choose transparent PNG or JPG of authorized signature
              </span>
              <span className="text-[11px] text-slate-400">
                Must be an authorized signature registered under your employee profile.
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleUploadSignature}
                className="hidden"
              />
            </label>

            {uploadedSigUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                <img
                  src={uploadedSigUrl}
                  alt="Uploaded Signature"
                  className="max-h-20 object-contain"
                />
              </div>
            )}
          </div>
        )}

        {/* Security Binding Stamp Metadata */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Digital Audit Binding Metadata</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Signer:</span>
            <span className="font-semibold text-slate-800">{currentUser?.fullName} ({currentUser?.roleName})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Target Signature Slot:</span>
            <span className="font-semibold text-indigo-700">{selectedSlot?.label || selectedSlotId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Document Number:</span>
            <span className="font-mono font-bold text-slate-800">{document.documentNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Timestamp (GST):</span>
            <span>{nowFormatted}</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApplySignature}
            disabled={isSubmitting || !hasDrawn}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Embedding Signature...' : 'Apply Signature to Document'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
