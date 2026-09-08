import React, { useState } from 'react';
import {
  Printer,
  Download,
  Upload,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  FileText,
  Eye,
} from 'lucide-react';
import { DocumentRecord } from '../types/index.js';
import { api } from '../api.js';

interface PhysicalSignatureModalProps {
  document: DocumentRecord;
  pdfBase64?: string;
  onSuccess: (updatedDoc: DocumentRecord) => void;
  onClose: () => void;
}

export const PhysicalSignatureModal: React.FC<PhysicalSignatureModalProps> = ({
  document,
  pdfBase64,
  onSuccess,
  onClose,
}) => {
  const [uploadedSignedFileUrl, setUploadedSignedFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [userConfirmedCorrect, setUserConfirmedCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [remarks, setRemarks] = useState('Physical signed and stamped copy scanned.');

  // Handle file upload (PDF, PNG, JPG, JPEG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Accepted file formats: PDF, JPG, JPEG, or PNG.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedSignedFileUrl(reader.result as string);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitSignedDocument = async () => {
    if (!uploadedSignedFileUrl) {
      setErrorMsg('Please upload the scanned physically signed document.');
      return;
    }
    if (!userConfirmedCorrect) {
      setErrorMsg('You must confirm that this is the correctly signed document.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.uploadSignedDocument(document.id, uploadedSignedFileUrl, remarks);
      onSuccess(res.document);
    } catch (err: any) {
      setErrorMsg(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadOfficialPdf = () => {
    const link = window.document.createElement('a');
    link.href = pdfBase64 || document.generatedPdfUrl || '';
    link.download = `${document.documentNumber || 'DOCUMENT'}_OFFICIAL.pdf`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
                PHYSICAL SIGNATURE WORKFLOW
              </span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {document.documentNumber}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Download, Sign Physically & Upload Scanned Copy
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Download & Print */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Download & Print Numbered Official PDF</span>
            </div>
            <button
              onClick={downloadOfficialPdf}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Print this document containing official number <strong>{document.documentNumber}</strong>. Obtain wet-ink signatures and physical thumbprints where required.
          </p>
        </div>

        {/* Step 2: Upload Signed Copy */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Upload Signed & Stamped Document</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Accepts scanned PDF, JPG, or PNG. Maximum upload size 25MB.
          </p>

          <label className="block w-full border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer hover:bg-blue-50/20 transition-all">
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <span className="text-xs font-semibold text-blue-600">
              {fileName ? `File Selected: ${fileName}` : 'Click or drop scanned signed document'}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {uploadedSignedFileUrl && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Signed file uploaded ready for review</span>
              </span>
            </div>
          )}
        </div>

        {/* Step 3: Mandatory Confirmation */}
        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={userConfirmedCorrect}
              onChange={(e) => setUserConfirmedCorrect(e.target.checked)}
              className="w-4 h-4 rounded-sm text-blue-600 border-amber-300 mt-0.5 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-800">
              "This is the correctly signed document."
            </span>
          </label>
          <p className="text-[10px] text-slate-500 pl-6">
            By confirming, you certify that all signatures, thumbprints, and seals correspond authentically to official personnel.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitSignedDocument}
            disabled={isSubmitting || !uploadedSignedFileUrl || !userConfirmedCorrect}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Verifying & Storing...' : 'Submit Signed Document'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
