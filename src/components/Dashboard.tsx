import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Building2,
  Users,
  ShieldCheck,
  ArrowUpRight,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge.js';
import { DocumentRecord, FormTemplate } from '../types/index.js';

interface DashboardProps {
  stats: any;
  forms: FormTemplate[];
  onSelectForm: (form: FormTemplate) => void;
  onViewDocument: (doc: DocumentRecord) => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  forms,
  onSelectForm,
  onViewDocument,
  onNavigateTab,
}) => {
  const metrics = stats?.metrics || {
    docsToday: 0,
    docsThisMonth: 0,
    pendingSignatures: 0,
    pendingApprovals: 0,
    rejectedDocs: 0,
    voidedDocs: 0,
    finalizedDocs: 0,
    formsAvailable: 0,
    activeUsers: 0,
  };

  const recentDocs: DocumentRecord[] = stats?.recentDocuments || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise Compliance & Digital Numbering</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Gulf Way Operations & Form Flow Control
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Atomic sequential document allocation, strict multi-company separation,
            tamper-evident SHA-256 verification and physical/digital signature workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('create-document')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Document</span>
          </button>
          <button
            onClick={() => onNavigateTab('form-builder')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <span>Form Builder</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Generated Today</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{metrics.docsToday}</span>
            <span className="text-xs text-slate-400 ml-2">Official records</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Signatures</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-700">{metrics.pendingSignatures}</span>
            <span className="text-xs text-amber-600/80 ml-2">Physical / Digital</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-sky-700">{metrics.pendingApprovals}</span>
            <span className="text-xs text-sky-600/80 ml-2">Manager reviews</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Finalized & Sealed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-700">{metrics.finalizedDocs}</span>
            <span className="text-xs text-emerald-600/80 ml-2">Immutable</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">This Month Total</span>
            <div className="text-lg font-bold text-slate-800">{metrics.docsThisMonth}</div>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-sm">2026</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Rejected Documents</span>
            <div className="text-lg font-bold text-rose-700">{metrics.rejectedDocs}</div>
          </div>
          <XCircle className="w-4 h-4 text-rose-500" />
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Retained VOID Numbers</span>
            <div className="text-lg font-bold text-slate-700">{metrics.voidedDocs}</div>
          </div>
          <Ban className="w-4 h-4 text-slate-500" />
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Active System Users</span>
            <div className="text-lg font-bold text-indigo-700">{metrics.activeUsers}</div>
          </div>
          <Users className="w-4 h-4 text-indigo-500" />
        </div>
      </div>

      {/* Quick Launch Forms */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Standard Operational Forms</h3>
            <p className="text-xs text-slate-500">
              Select a form to start dynamic data-entry, preview or generate official document numbers.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('form-library')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View Full Form Catalog</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {forms.slice(0, 3).map((form) => (
            <div
              key={form.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {form.formCode} • v{form.currentVersion}
                  </span>
                  <span className="text-[11px] text-blue-600 font-medium">{form.category}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-2">{form.formName}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{form.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {form.fields.length} Mapped Fields
                </span>
                <button
                  onClick={() => onSelectForm(form)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Fill Form</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Document Registers</h3>
            <p className="text-xs text-slate-500">Live sequence activity across all operating entities</p>
          </div>
          <button
            onClick={() => onNavigateTab('document-register')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Open Full Register →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Document Number</th>
                <th className="py-3 px-4">Form</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Employee / Ref</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No documents generated yet. Click "Generate Document" to create your first record.
                  </td>
                </tr>
              ) : (
                recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {doc.documentNumber || (
                        <span className="text-slate-400 italic">Draft (Unallocated)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{doc.formName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {doc.companyName.split(' ')[0]} {doc.companyName.split(' ')[1] || ''}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>{doc.employeeName || 'N/A'}</div>
                      {doc.employeeId && (
                        <span className="text-[10px] text-slate-400">{doc.employeeId}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {doc.signingMethod || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewDocument(doc)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="View Document Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
