import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Shield,
  FileCheck2,
  FilePenLine,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  PlusCircle,
  Building2,
  Briefcase,
  Award,
  AlertCircle,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import { User, Company, Department, Role, DocumentRecord } from '../types/index.js';
import { api } from '../api.js';

interface UserScreenOverviewModalProps {
  currentUser: User;
  originalAdmin: User;
  companies: Company[];
  departments: Department[];
  roles: Role[];
  documents: DocumentRecord[];
  onClose: () => void;
  onViewDocument: (doc: DocumentRecord) => void;
  onOpenDigitalSign: (doc: DocumentRecord) => void;
  onOpenPhysicalSign: (doc: DocumentRecord) => void;
  onDocumentUpdated: () => Promise<void>;
  onNavigateToTab: (tab: string) => void;
}

export const UserScreenOverviewModal: React.FC<UserScreenOverviewModalProps> = ({
  currentUser,
  originalAdmin,
  companies,
  departments,
  roles,
  documents,
  onClose,
  onViewDocument,
  onOpenDigitalSign,
  onOpenPhysicalSign,
  onDocumentUpdated,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'APPROVALS' | 'SIGNATURES' | 'MY_DOCS' | 'PERMISSIONS'>('APPROVALS');
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [quickApprovalSuccess, setQuickApprovalSuccess] = useState<string | null>(null);
  const [quickApprovalError, setQuickApprovalError] = useState<string | null>(null);

  const company = companies.find((c) => c.id === currentUser.companyId);
  const department = departments.find((d) => d.id === currentUser.departmentId);
  const role = roles.find((r) => r.id === currentUser.roleId || r.name === currentUser.roleName);

  // Check user capabilities
  const canApprove =
    currentUser.roleName.toLowerCase().includes('admin') ||
    (Array.isArray(currentUser.permissions) && currentUser.permissions.includes('DOCUMENT_APPROVE')) ||
    (role && Array.isArray(role.permissions) && role.permissions.includes('DOCUMENT_APPROVE'));

  const canSign =
    currentUser.roleName.toLowerCase().includes('admin') ||
    (Array.isArray(currentUser.permissions) && currentUser.permissions.includes('DOCUMENT_SIGN')) ||
    (role && Array.isArray(role.permissions) && role.permissions.includes('DOCUMENT_SIGN'));

  // Pending Approvals list for this user
  const pendingApprovals = useMemo(() => {
    return documents.filter((d) => {
      if (d.status !== 'SIGNED' && d.status !== 'AWAITING_APPROVAL') return false;
      if (!canApprove) return false;
      // If user is tied to a company, filter by company, else all
      if (currentUser.companyId && d.companyId !== currentUser.companyId) return false;
      return true;
    });
  }, [documents, canApprove, currentUser.companyId]);

  // Pending Signatures list for this user
  const pendingSignatures = useMemo(() => {
    return documents.filter((d) => {
      if (d.status !== 'AWAITING_SIGNATURE' && d.status !== 'NUMBER_ASSIGNED') return false;
      return (
        d.employeeName === currentUser.fullName ||
        d.employeeId === currentUser.employeeId ||
        d.createdBy === currentUser.id ||
        (currentUser.companyId ? d.companyId === currentUser.companyId : true)
      );
    });
  }, [documents, currentUser]);

  // My Authored Documents
  const myAuthoredDocs = useMemo(() => {
    return documents.filter(
      (d) => d.createdBy === currentUser.id || d.employeeId === currentUser.employeeId
    );
  }, [documents, currentUser]);

  // Quick Approve Transaction right from this screen
  const handleQuickApprove = async (doc: DocumentRecord) => {
    setProcessingDocId(doc.id);
    setQuickApprovalSuccess(null);
    setQuickApprovalError(null);
    try {
      const res = await api.approveDocument(
        doc.id,
        `Approved by ${currentUser.fullName} (${currentUser.roleName}) via Administrative Impersonation by ${originalAdmin.fullName}`
      );
      setQuickApprovalSuccess(`Document ${doc.documentNumber || doc.id} approved successfully!`);
      await onDocumentUpdated();
    } catch (err: any) {
      setQuickApprovalError(`Failed to approve: ${err.message}`);
    } finally {
      setProcessingDocId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shrink-0 relative border-b border-indigo-500/20">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
                {currentUser.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white">{currentUser.fullName}</h2>
                  <span className="text-[11px] font-mono bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded">
                    {currentUser.employeeId}
                  </span>
                  <span className="text-[10px] uppercase font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Impersonated Screen
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1.5">
                  <span className="flex items-center gap-1 text-amber-300 font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{currentUser.roleName}</span>
                  </span>
                  {company && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{company.code} - {company.name}</span>
                    </span>
                  )}
                  {department && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{department.name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Button to create document as user */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToTab('create-document');
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Document as {currentUser.fullName.split(' ')[0]}</span>
            </button>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-slate-700/60 pb-px">
            <button
              type="button"
              onClick={() => setActiveSubTab('APPROVALS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'APPROVALS'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pending Approvals ({pendingApprovals.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('SIGNATURES')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'SIGNATURES'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FilePenLine className="w-3.5 h-3.5 text-blue-600" />
              <span>Pending Signatures ({pendingSignatures.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('MY_DOCS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'MY_DOCS'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Authored Documents ({myAuthoredDocs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('PERMISSIONS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'PERMISSIONS'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Assigned Capabilities</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {quickApprovalSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{quickApprovalSuccess}</span>
            </div>
            <button
              onClick={() => setQuickApprovalSuccess(null)}
              className="text-emerald-700 hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {quickApprovalError && (
          <div className="bg-red-50 border-b border-red-200 p-3 text-xs text-red-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{quickApprovalError}</span>
            </div>
            <button
              onClick={() => setQuickApprovalError(null)}
              className="text-red-700 hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Content Container */}
        <div className="p-6 overflow-y-auto max-h-[58vh] bg-slate-50 flex-1">
          {/* TAB 1: PENDING APPROVALS */}
          {activeSubTab === 'APPROVALS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Approval Queue for {currentUser.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Documents in Signed status waiting for manager/approver sanction. You can directly approve transactions as this user.
                  </p>
                </div>
                {!canApprove && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    Notice: Role {currentUser.roleName} does not have DOCUMENT_APPROVE permission. (Admin override active for execution)
                  </span>
                )}
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Approval Queue is Clear</p>
                  <p className="text-xs text-slate-500 mt-1">
                    No documents are currently awaiting approval for {currentUser.fullName}.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Document #</th>
                        <th className="py-2.5 px-4">Form Template</th>
                        <th className="py-2.5 px-4">Applicant / Employee</th>
                        <th className="py-2.5 px-4">Company</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingApprovals.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">
                            {doc.documentNumber || 'DRAFT'}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {doc.formName}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {doc.employeeName || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            {doc.companyName || doc.companyId}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3" />
                              {doc.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onViewDocument(doc);
                                }}
                                className="px-2.5 py-1 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Inspect</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickApprove(doc)}
                                disabled={processingDocId === doc.id}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{processingDocId === doc.id ? 'Approving...' : 'Approve as User'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PENDING SIGNATURES */}
          {activeSubTab === 'SIGNATURES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Signature Queue for {currentUser.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Documents awaiting digital or physical signature. You can execute signatures under this user identity.
                  </p>
                </div>
              </div>

              {pendingSignatures.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
                  <CheckCircle className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No Signatures Pending</p>
                  <p className="text-xs text-slate-500 mt-1">
                    All documents requiring signature for {currentUser.fullName} have been signed.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Document #</th>
                        <th className="py-2.5 px-4">Form Template</th>
                        <th className="py-2.5 px-4">Applicant</th>
                        <th className="py-2.5 px-4">Company</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingSignatures.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">
                            {doc.documentNumber || 'DRAFT'}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {doc.formName}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {doc.employeeName || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            {doc.companyName || doc.companyId}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              <FilePenLine className="w-3 h-3" />
                              {doc.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenDigitalSign(doc);
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                              >
                                <FilePenLine className="w-3.5 h-3.5" />
                                <span>Digital Sign</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenPhysicalSign(doc);
                                }}
                                className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <span>Upload Scan</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUTHORED DOCUMENTS */}
          {activeSubTab === 'MY_DOCS' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Documents Authored by {currentUser.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  History of records initiated or owned by this employee.
                </p>
              </div>

              {myAuthoredDocs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No Documents Authored Yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    This user has not generated or submitted any documents yet.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Document #</th>
                        <th className="py-2.5 px-4">Form Template</th>
                        <th className="py-2.5 px-4">Created Date</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myAuthoredDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">
                            {doc.documentNumber || 'DRAFT'}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {doc.formName}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onViewDocument(doc);
                              }}
                              className="px-2.5 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PERMISSIONS */}
          {activeSubTab === 'PERMISSIONS' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  RBAC Role & Authority Permissions
                </h3>
                <p className="text-xs text-slate-500">
                  Role: <strong className="text-slate-800">{currentUser.roleName}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'DOCUMENT_VIEW', label: 'View Documents', desc: 'Can view registered documents in company' },
                  { key: 'DOCUMENT_GENERATE', label: 'Generate Sequential Numbers', desc: 'Can allocate official number' },
                  { key: 'DOCUMENT_EDIT_DRAFT', label: 'Edit Draft Values', desc: 'Can modify draft fields before sealing' },
                  { key: 'DOCUMENT_SIGN', label: 'Apply Digital & Physical Sign', desc: 'Authorized to sign documents' },
                  { key: 'DOCUMENT_APPROVE', label: 'Approve Documents', desc: 'Executive / line manager approval' },
                  { key: 'DOCUMENT_REJECT', label: 'Reject Documents', desc: 'Can reject documents with remarks' },
                  { key: 'DOCUMENT_VOID', label: 'Void Documents', desc: 'Can officially void sealed documents' },
                  { key: 'DOCUMENT_DELETE', label: 'Delete Records', desc: 'Privileged deletion rights' },
                  { key: 'FORM_CREATE', label: 'Create Form Templates', desc: 'Form builder access' },
                  { key: 'FORM_EDIT', label: 'Edit Form Templates', desc: 'Can modify form fields & versions' },
                  { key: 'FORM_DELETE', label: 'Delete Form Templates', desc: 'Can remove form templates' },
                  { key: 'COMPANY_MANAGE', label: 'Manage Companies & Entities', desc: 'Multi-entity corporate governance' },
                ].map((perm) => {
                  const hasPerm =
                    currentUser.roleName.toLowerCase().includes('admin') ||
                    (Array.isArray(currentUser.permissions) && currentUser.permissions.includes(perm.key as any)) ||
                    (role && Array.isArray(role.permissions) && role.permissions.includes(perm.key as any));

                  return (
                    <div
                      key={perm.key}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        hasPerm
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{perm.label}</span>
                        {hasPerm ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{perm.desc}</p>
                      <div className="mt-1.5 font-mono text-[10px] text-slate-400">{perm.key}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              All transactions executed will be recorded in the audit trail as: <strong className="text-slate-700">{currentUser.fullName}</strong> (Impersonated by <strong className="text-slate-700">{originalAdmin.fullName}</strong>).
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
