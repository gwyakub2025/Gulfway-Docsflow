import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Ban,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  Search,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { api } from '../api.js';

interface PublicVerifyPageProps {
  initialToken?: string;
  onBackToApp: () => void;
}

export const PublicVerifyPage: React.FC<PublicVerifyPageProps> = ({
  initialToken = '',
  onBackToApp,
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const runVerification = async (tokenToVerify: string) => {
    let cleanToken = tokenToVerify.trim();
    if (!cleanToken) return;

    // Handle full QR scan URLs: extract the token segment
    if (cleanToken.includes('/verify/')) {
      cleanToken = cleanToken.split('/verify/').pop()?.split('?')[0]?.split('#')[0] || cleanToken;
    } else if (cleanToken.startsWith('http://') || cleanToken.startsWith('https://')) {
      try {
        const parsed = new URL(cleanToken);
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length > 0) {
          cleanToken = parts[parts.length - 1];
        }
      } catch {
        // keep cleanToken
      }
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.verifyDocumentToken(cleanToken);
      if (res.valid || res.verified) {
        setVerificationResult(res);
      } else {
        setErrorMsg(res.message || 'Document token or number could not be verified in the registry.');
        setVerificationResult(null);
      }
    } catch (err: any) {
      setErrorMsg(`Verification service error: ${err.message}`);
      setVerificationResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      runVerification(initialToken);
    }
  }, [initialToken]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6">
      {/* Top Header */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            GW
          </div>
          <div>
            <h1 className="font-bold text-white text-base">Gulf Way DocFlow</h1>
            <p className="text-xs text-slate-400">Official Document Verification Portal</p>
          </div>
        </div>

        <button
          onClick={onBackToApp}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Console</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto my-8 space-y-6">
        {/* Token Search Bar */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 shadow-xl">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Enter Verification Token or Scan QR Code:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. vt_1741512345678_abcd"
              className="flex-1 text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
            />
            <button
              onClick={() => runVerification(tokenInput)}
              disabled={isLoading || !tokenInput.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? 'Verifying...' : 'Verify'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-300 flex items-start gap-3">
            <Ban className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block">Invalid or Unrecognized Token</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Verification Result Card */}
        {verificationResult && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-200">
            {/* Authenticity Banner */}
            <div
              className={`p-4 rounded-xl flex items-center gap-3 ${
                verificationResult.status === 'VOID'
                  ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  : 'bg-emerald-950/60 border border-emerald-700 text-emerald-200'
              }`}
            >
              {verificationResult.status === 'VOID' ? (
                <Ban className="w-6 h-6 text-rose-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {verificationResult.status === 'VOID'
                    ? 'DOCUMENT NUMBER CANCELLED (VOID)'
                    : 'AUTHENTIC OFFICIAL DOCUMENT VERIFIED'}
                </div>
                <div className="text-xs opacity-80">
                  {verificationResult.status === 'VOID'
                    ? 'This serial number was officially cancelled and is no longer valid.'
                    : 'This record was issued by Gulf Way and verified against our immutable register.'}
                </div>
              </div>
            </div>

            {/* Official Metadata (Notice: Strictly NO personal employee data exposed!) */}
            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-700/60">
                <span className="text-slate-400">Document Number:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {verificationResult.documentNumber}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-700/60">
                <span className="text-slate-400">Document Form:</span>
                <span className="font-bold text-white">
                  {verificationResult.formName || verificationResult.documentType || 'Official Gulf Way Form'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-700/60">
                <span className="text-slate-400">Issuing Entity:</span>
                <span className="font-semibold text-slate-200">
                  {verificationResult.issuingCompany || verificationResult.company || 'Gulf Way Delivery Services LLC'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-700/60">
                <span className="text-slate-400">Date Allocated:</span>
                <span className="text-slate-300 font-mono">
                  {verificationResult.issueDate
                    ? new Date(verificationResult.issueDate).toLocaleDateString('en-GB')
                    : '—'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-700/60">
                <span className="text-slate-400">Sealed Date:</span>
                <span className="text-slate-300 font-mono">
                  {verificationResult.finalizedDate && verificationResult.finalizedDate !== 'Pending Final Sanction'
                    ? new Date(verificationResult.finalizedDate).toLocaleDateString('en-GB')
                    : 'Awaiting Final Sanction'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-700/60">
                <span className="text-slate-400">Current Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-sm ${
                    verificationResult.status === 'FINAL'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : verificationResult.status === 'VOID'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {verificationResult.status}
                </span>
              </div>

              {/* SHA-256 Checksum */}
              {(verificationResult.sha256Checksum || verificationResult.sha256Hash) && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">SHA-256 Integrity Checksum:</span>
                  <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[10px] text-emerald-400 break-all select-all border border-slate-700">
                    {verificationResult.sha256Checksum || verificationResult.sha256Hash}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Compliance Notice */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 flex items-start gap-2">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Protected</strong>: In compliance with UAE and enterprise data governance, individual employee names, financial details, and sensitive attributes are masked on public verification scans.
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4 border-t border-slate-800">
        © 2026 Gulf Way Group • Digital Document Registry & Certificate Authority
      </footer>
    </div>
  );
};
