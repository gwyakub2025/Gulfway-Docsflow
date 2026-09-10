import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Download,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  FileSpreadsheet,
  ArrowUpDown,
  PenTool,
  Printer,
  Sparkles,
} from 'lucide-react';
import { DocumentRecord, Company, FormTemplate, User } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import { api } from '../api.js';
import { downloadPdfFromUrl } from '../utils/pdfDownloadHelper.js';

interface DocumentRegisterProps {
  documents: DocumentRecord[];
  companies: Company[];
  forms: FormTemplate[];
  currentUser?: User | null;
  onViewDocument: (doc: DocumentRecord) => void;
  onOpenPhysicalSign: (doc: DocumentRecord) => void;
  onOpenDigitalSign: (doc: DocumentRecord) => void;
  onApproveDocument?: (doc: DocumentRecord) => void;
  onDocumentUpdated?: (doc: DocumentRecord) => void;
  selectedCompanyId: string;
}

export const DocumentRegister: React.FC<DocumentRegisterProps> = ({
  documents,
  companies,
  forms,
  currentUser,
  onViewDocument,
  onOpenPhysicalSign,
  onOpenDigitalSign,
  onApproveDocument,
  onDocumentUpdated,
  selectedCompanyId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState(
    selectedCompanyId !== 'ALL' ? selectedCompanyId : 'ALL'
  );
  const [formFilter, setFormFilter] = useState('ALL');
  const [approvingDocId, setApprovingDocId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const handleQuickApprove = async (doc: DocumentRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApproveDocument) {
      onApproveDocument(doc);
      return;
    }

    setApprovingDocId(doc.id);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await api.approveDocument(doc.id, 'Approved from Pending Approvals table');
      setActionSuccessMsg(`Document ${doc.documentNumber || doc.id} successfully approved!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      if (onDocumentUpdated) {
        onDocumentUpdated(res.document);
      }
    } catch (err: any) {
      setActionErrorMsg(`Failed to approve document: ${err.message}`);
      setTimeout(() => setActionErrorMsg(null), 5000);
    } finally {
      setApprovingDocId(null);
    }
  };

  // Filtered documents
  const filtered = documents.filter((doc) => {
    if (companyFilter !== 'ALL' && doc.companyId !== companyFilter) return false;
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    if (formFilter !== 'ALL' && doc.formTemplateId !== formFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const numMatch = doc.documentNumber?.toLowerCase().includes(term);
      const formMatch = doc.formName.toLowerCase().includes(term);
      const empMatch = doc.employeeName?.toLowerCase().includes(term);
      const idMatch = doc.employeeId?.toLowerCase().includes(term);
      if (!numMatch && !formMatch && !empMatch && !idMatch) return false;
    }

    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Document Master Register</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {filtered.length} Total Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of all generated, numbered, signed, approved, and archived company records.
          </p>
        </div>
      </div>

      {/* Notification Banners */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}
      {actionErrorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doc number, employee, form..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Form Template Filter */}
          <div>
            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Forms</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.formCode} - {f.formName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="AWAITING_SIGNATURE">Awaiting Signature</option>
              <option value="SIGNED">Signed</option>
              <option value="AWAITING_APPROVAL">Awaiting Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="FINAL">FINAL (Sealed)</option>
              <option value="REJECTED">Rejected</option>
              <option value="VOID">VOID (Cancelled)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Document Number</th>
                <th className="py-3 px-4">Form & Version</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Employee / Ref</th>
                <th className="py-3 px-4">Signing Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Allocated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No documents found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => {
                  const dateStr = doc.generatedDate
                    ? new Date(doc.generatedDate).toLocaleDateString('en-GB')
                    : 'Draft';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {doc.documentNumber || (
                          <span className="text-slate-400 italic">Unallocated Draft</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{doc.formName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {doc.formCode} • v{doc.formVersion}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {doc.companyName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{doc.employeeName || '—'}</div>
                        {doc.employeeId && (
                          <div className="text-[10px] text-slate-400">{doc.employeeId}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {doc.signingMethod === 'PHYSICAL' && 'Physical Scan'}
                        {doc.signingMethod === 'DIGITAL' && 'Digital Signature'}
                        {!doc.signingMethod && '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={doc.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{dateStr}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pending Approval State: Fast 1-click Approval */}
                          {(doc.status === 'SIGNED' || doc.status === 'AWAITING_APPROVAL') && (
                            <button
                              onClick={(e) => handleQuickApprove(doc, e)}
                              disabled={approvingDocId === doc.id}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                              title="Approve this document according to company policy"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{approvingDocId === doc.id ? 'Approving...' : 'Approve'}</span>
                            </button>
                          )}

                          {/* Awaiting Signature State: Offer BOTH Digital and Physical options */}
                          {(doc.status === 'AWAITING_SIGNATURE' || doc.status === 'NUMBER_ASSIGNED') && (
                            <>
                              <button
                                onClick={() => onOpenDigitalSign(doc)}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[11px] font-semibold border border-indigo-200 flex items-center gap-1 transition-colors"
                                title="Apply Digital Signature on screen"
                              >
                                <PenTool className="w-3 h-3" />
                                <span>Digital Sign</span>
                              </button>
                              <button
                                onClick={() => onOpenPhysicalSign(doc)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md text-[11px] font-semibold border border-amber-200 flex items-center gap-1 transition-colors"
                                title="Upload Scanned Physical Signed Copy"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Upload Scan</span>
                              </button>
                            </>
                          )}

                          {/* Download PDF button */}
                          {doc.documentNumber && (
                            <a
                              href={`/api/documents/${doc.id}/pdf?download=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={`${doc.documentNumber}.pdf`}
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadPdfFromUrl(
                                  `/api/documents/${doc.id}/pdf?download=true`,
                                  `${doc.documentNumber}.pdf`
                                );
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="Download Official PDF"
                            >
                              <Download className="w-4 h-4 text-slate-600" />
                            </a>
                          )}

                          {/* View Document Details */}
                          <button
                            onClick={() => onViewDocument(doc)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Document Details & Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
