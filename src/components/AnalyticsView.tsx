import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileCheck,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  PenTool,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ban,
  FileText,
  Activity,
  Layers,
  ArrowUpRight,
  Hash,
  Sparkles,
} from 'lucide-react';
import { DocumentRecord, Company, FormTemplate, AuditLog } from '../types/index.js';

interface AnalyticsViewProps {
  documents: DocumentRecord[];
  companies: Company[];
  forms: FormTemplate[];
  auditLogs: AuditLog[];
  onViewDocument?: (doc: DocumentRecord) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  documents,
  companies,
  forms,
  auditLogs,
  onViewDocument,
  onNavigateToTab,
}) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'YTD' | 'ALL'>('ALL');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');

  // Filter documents based on company and time range
  const filteredDocs = useMemo(() => {
    const now = new Date();
    return documents.filter((doc) => {
      // Company filter
      if (selectedCompanyId !== 'ALL' && doc.companyId !== selectedCompanyId) {
        return false;
      }

      // Time filter
      if (timeRange === 'ALL') return true;
      const createdDate = new Date(doc.createdAt);
      const diffMs = now.getTime() - createdDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (timeRange === '7D') return diffDays <= 7;
      if (timeRange === '30D') return diffDays <= 30;
      if (timeRange === '90D') return diffDays <= 90;
      if (timeRange === 'YTD') return createdDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [documents, selectedCompanyId, timeRange]);

  // Derived metrics
  const totalCount = filteredDocs.length;
  const finalizedCount = filteredDocs.filter((d) => d.status === 'FINAL').length;
  const awaitingSignCount = filteredDocs.filter(
    (d) => d.status === 'AWAITING_SIGNATURE' || d.status === 'NUMBER_ASSIGNED'
  ).length;
  const awaitingApprovalCount = filteredDocs.filter(
    (d) => d.status === 'SIGNED' || d.status === 'AWAITING_APPROVAL'
  ).length;
  const approvedCount = filteredDocs.filter((d) => d.status === 'APPROVED').length;
  const draftCount = filteredDocs.filter((d) => d.status === 'DRAFT').length;
  const voidCount = filteredDocs.filter((d) => d.status === 'VOID').length;
  const rejectedCount = filteredDocs.filter((d) => d.status === 'REJECTED').length;

  const inFlightCount = awaitingSignCount + awaitingApprovalCount + approvedCount;
  const finalizationRate = totalCount > 0 ? Math.round((finalizedCount / totalCount) * 100) : 0;

  // Signing method stats
  const digitalSignCount = filteredDocs.filter((d) => d.signingMethod === 'DIGITAL').length;
  const physicalSignCount = filteredDocs.filter((d) => d.signingMethod === 'PHYSICAL').length;
  const totalSigned = digitalSignCount + physicalSignCount;
  const digitalShare = totalSigned > 0 ? Math.round((digitalSignCount / totalSigned) * 100) : 0;

  // Company volume breakdown
  const companyStats = useMemo(() => {
    return companies.map((c) => {
      const companyDocs = filteredDocs.filter((d) => d.companyId === c.id);
      const finalized = companyDocs.filter((d) => d.status === 'FINAL').length;
      const share = totalCount > 0 ? Math.round((companyDocs.length / totalCount) * 100) : 0;
      return {
        company: c,
        total: companyDocs.length,
        finalized,
        share,
      };
    }).sort((a, b) => b.total - a.total);
  }, [companies, filteredDocs, totalCount]);

  // Form template utilization
  const formStats = useMemo(() => {
    return forms.map((f) => {
      const formDocs = filteredDocs.filter((d) => d.formTemplateId === f.id);
      const share = totalCount > 0 ? Math.round((formDocs.length / totalCount) * 100) : 0;
      return {
        form: f,
        total: formDocs.length,
        share,
      };
    }).sort((a, b) => b.total - a.total);
  }, [forms, filteredDocs, totalCount]);

  // Status breakdown array for progress visualization
  const statusBreakdown = [
    { label: 'Finalized & Sealed', count: finalizedCount, color: 'bg-emerald-500', textColor: 'text-emerald-700', bgBadge: 'bg-emerald-50 border-emerald-200' },
    { label: 'Awaiting Approval', count: awaitingApprovalCount, color: 'bg-teal-500', textColor: 'text-teal-700', bgBadge: 'bg-teal-50 border-teal-200' },
    { label: 'Awaiting Signature', count: awaitingSignCount, color: 'bg-amber-500', textColor: 'text-amber-700', bgBadge: 'bg-amber-50 border-amber-200' },
    { label: 'Unallocated Drafts', count: draftCount, color: 'bg-slate-400', textColor: 'text-slate-700', bgBadge: 'bg-slate-50 border-slate-200' },
    { label: 'Official Voided', count: voidCount, color: 'bg-rose-500', textColor: 'text-rose-700', bgBadge: 'bg-rose-50 border-rose-200' },
    { label: 'Rejected', count: rejectedCount, color: 'bg-orange-500', textColor: 'text-orange-700', bgBadge: 'bg-orange-50 border-orange-200' },
  ];

  // Print summary handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Document Flow & Compliance Analytics
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Live Ledger Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational throughput, cryptographic integrity metrics, signature modality, and multi-entity governance.
          </p>
        </div>

        {/* Filter Controls & Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Company Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="ALL">All Group Entities</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
            {(['7D', '30D', '90D', 'YTD', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  timeRange === r
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r === '7D' && '7 Days'}
                {r === '30D' && '30 Days'}
                {r === '90D' && '90 Days'}
                {r === 'YTD' && 'Year-to-Date'}
                {r === 'ALL' && 'All Time'}
              </button>
            ))}
          </div>

          {/* Print / Export Report */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Print Compliance Summary"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* High-Level KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Records</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">in register</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            <span>{totalCount - draftCount} allocated official numbers</span>
          </div>
        </div>

        {/* Finalized & Sealed */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Finalized & Sealed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{finalizedCount}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
              {finalizationRate}% finalized
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Tamper-evident SHA-256 seal enforced</span>
          </div>
        </div>

        {/* Active Pipeline / In Flight */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">In-Flight Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{inFlightCount}</span>
            <span className="text-xs text-slate-400 font-medium">pending actions</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="text-amber-700 font-medium">{awaitingSignCount} signing</span>
            <span className="text-slate-300">•</span>
            <span className="text-teal-700 font-medium">{awaitingApprovalCount} approval</span>
          </div>
        </div>

        {/* Retained VOID Audit */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Voided Sequences</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{voidCount}</span>
            <span className="text-xs text-slate-400 font-medium">cancelled numbers</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Zero sequence skipping (audit preserved)</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Content: 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Status Breakdown + Multi-Company Distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Breakdown Bar & Cards */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Document Lifecycle Distribution</h3>
                <p className="text-xs text-slate-500">Visual breakdown across all 7 operational states</p>
              </div>
              <span className="text-xs font-mono text-slate-400">{filteredDocs.length} Total</span>
            </div>

            {/* Visual Stacked Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {totalCount > 0 ? (
                statusBreakdown.map((st, i) => {
                  const width = (st.count / totalCount) * 100;
                  if (width === 0) return null;
                  return (
                    <div
                      key={i}
                      style={{ width: `${width}%` }}
                      className={`${st.color} transition-all relative group`}
                      title={`${st.label}: ${st.count} (${Math.round(width)}%)`}
                    />
                  );
                })
              ) : (
                <div className="w-full bg-slate-200" />
              )}
            </div>

            {/* Granular Status Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {statusBreakdown.map((st, idx) => {
                const pct = totalCount > 0 ? Math.round((st.count / totalCount) * 100) : 0;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${st.bgBadge} flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{st.label}</span>
                      <span className={`text-[10px] font-bold ${st.textColor}`}>{pct}%</span>
                    </div>
                    <div className="mt-2 text-lg font-black text-slate-900">{st.count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operating Entity Volume Comparison */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Company Throughput & Distribution</h3>
                <p className="text-xs text-slate-500">Document volume generated per operating subsidiary</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {companies.length} Entities
              </span>
            </div>

            {/* List of Companies with Proportional Bars */}
            <div className="space-y-4">
              {companyStats.length > 0 ? (
                companyStats.map(({ company, total, finalized, share }) => (
                  <div key={company.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {company.code}
                        </span>
                        <span className="font-semibold text-slate-800">{company.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono">
                          {total} docs <span className="text-slate-400">({finalized} final)</span>
                        </span>
                        <span className="font-bold text-slate-900 w-10 text-right">{share}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No company entities found. Add companies to view distribution.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Signature Modality + Form Utilization + Security Audit */}
        <div className="space-y-6">
          {/* Signature Modality Comparison */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Signature Execution Modality</h3>
              <p className="text-xs text-slate-500">Digital Pen On-Screen vs. Physical Wet-Ink Scan</p>
            </div>

            <div className="space-y-3">
              {/* Digital Signature */}
              <div className="p-3.5 rounded-lg border border-indigo-100 bg-indigo-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950">Digital Signature</span>
                  </div>
                  <span className="text-xs font-black text-indigo-700">{digitalSignCount}</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${digitalShare}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] text-indigo-600 font-medium flex justify-between">
                  <span>Biometric Canvas + Timestamp</span>
                  <span>{digitalShare}% of signed</span>
                </div>
              </div>

              {/* Physical Scan */}
              <div className="p-3.5 rounded-lg border border-amber-100 bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-950">Physical Wet-Ink Scan</span>
                  </div>
                  <span className="text-xs font-black text-amber-700">{physicalSignCount}</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full"
                    style={{ width: `${100 - digitalShare}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] text-amber-600 font-medium flex justify-between">
                  <span>Print, Physical Sign & Upload</span>
                  <span>{100 - digitalShare}% of signed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Template Demand Index */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Form Utilization Demand</h3>
                <p className="text-xs text-slate-500">Most active document types</p>
              </div>
              <span className="text-xs font-mono text-slate-400">{forms.length} Templates</span>
            </div>

            <div className="space-y-3">
              {formStats.slice(0, 5).map(({ form, total, share }) => (
                <div key={form.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-800 truncate">{form.formName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {form.formCode} • {form.category}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900">{total}</span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">({share}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Compliance Assurance Box */}
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Cryptographic Integrity
              </h4>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              All finalized documents are sealed with an irreversible SHA-256 cryptographic digest.
              Sequence numbers are non-reusable and retained in the permanent audit register.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Sealed Documents</span>
              <span className="font-mono text-emerald-400 font-bold">{finalizedCount} Records</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
