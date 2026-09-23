import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Shield,
  Building2,
  Briefcase,
  CheckCircle2,
  X,
  FileCheck2,
  FilePenLine,
  FileText,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { User, Company, Department, Role, DocumentRecord } from '../types/index.js';

interface ImpersonateModalProps {
  currentUser: User | null;
  allUsers: User[];
  companies: Company[];
  departments: Department[];
  roles: Role[];
  documents: DocumentRecord[];
  onImpersonate: (targetUserId: string) => Promise<void>;
  onClose: () => void;
}

export const ImpersonateModal: React.FC<ImpersonateModalProps> = ({
  currentUser,
  allUsers,
  companies,
  departments,
  roles,
  documents,
  onImpersonate,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [capabilityFilter, setCapabilityFilter] = useState<'ALL' | 'APPROVER' | 'SIGNER'>('ALL');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Compute pending documents per user/role
  const userWorkloadStats = useMemo(() => {
    const stats: Record<
      string,
      { pendingApprovals: number; pendingSignatures: number; totalDocsCreated: number }
    > = {};

    allUsers.forEach((u) => {
      // Find documents awaiting approval where this user or their role can approve
      const pendingApprovals = documents.filter((d) => {
        if (d.status !== 'SIGNED' && d.status !== 'AWAITING_APPROVAL') return false;
        // If document matches company and user has approve permission
        const role = roles.find((r) => r.id === u.roleId || r.name === u.roleName);
        const hasApprovePerm =
          u.roleName.toLowerCase().includes('admin') ||
          (Array.isArray(u.permissions) && u.permissions.includes('DOCUMENT_APPROVE')) ||
          (role && Array.isArray(role.permissions) && role.permissions.includes('DOCUMENT_APPROVE'));
        return hasApprovePerm && (u.companyId ? d.companyId === u.companyId : true);
      }).length;

      // Find documents awaiting signature
      const pendingSignatures = documents.filter((d) => {
        if (d.status !== 'AWAITING_SIGNATURE' && d.status !== 'NUMBER_ASSIGNED') return false;
        // Either employee name matches or document is in their company
        return (
          d.employeeName === u.fullName ||
          d.employeeId === u.employeeId ||
          d.createdBy === u.id ||
          d.companyId === u.companyId
        );
      }).length;

      // Total created
      const totalDocsCreated = documents.filter(
        (d) => d.createdBy === u.id || d.employeeId === u.employeeId
      ).length;

      stats[u.id] = { pendingApprovals, pendingSignatures, totalDocsCreated };
    });

    return stats;
  }, [allUsers, documents, roles]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      // Search
      const searchMatch =
        !searchTerm.trim() ||
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.roleName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      // Role filter
      if (selectedRoleFilter !== 'ALL' && u.roleId !== selectedRoleFilter && u.roleName !== selectedRoleFilter) {
        return false;
      }

      // Company filter
      if (selectedCompanyFilter !== 'ALL' && u.companyId !== selectedCompanyFilter) {
        return false;
      }

      // Capability filter
      if (capabilityFilter === 'APPROVER') {
        const role = roles.find((r) => r.id === u.roleId || r.name === u.roleName);
        const canApprove =
          u.roleName.toLowerCase().includes('admin') ||
          (Array.isArray(u.permissions) && u.permissions.includes('DOCUMENT_APPROVE')) ||
          (role && Array.isArray(role.permissions) && role.permissions.includes('DOCUMENT_APPROVE'));
        if (!canApprove) return false;
      }

      if (capabilityFilter === 'SIGNER') {
        const role = roles.find((r) => r.id === u.roleId || r.name === u.roleName);
        const canSign =
          u.roleName.toLowerCase().includes('admin') ||
          (Array.isArray(u.permissions) && u.permissions.includes('DOCUMENT_SIGN')) ||
          (role && Array.isArray(role.permissions) && role.permissions.includes('DOCUMENT_SIGN'));
        if (!canSign) return false;
      }

      return true;
    });
  }, [allUsers, searchTerm, selectedRoleFilter, selectedCompanyFilter, capabilityFilter, roles]);

  const handleSelectUser = async (userId: string) => {
    setIsProcessingId(userId);
    try {
      await onImpersonate(userId);
      onClose();
    } catch (err) {
      console.error('Failed to impersonate user', err);
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Impersonate User Perspective</span>
                <span className="text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Admin & Super Admin Privilege
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Switch perspective to view any employee or manager screen, monitor their pending approval queues, and perform transactions on their behalf.
              </p>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, employee ID, role, email..."
                className="w-full bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-2 focus:outline-hidden focus:border-amber-400 cursor-pointer"
              >
                <option value="ALL">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-2 focus:outline-hidden focus:border-amber-400 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Capability Tags Filter */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Quick Filter:
            </span>
            <button
              type="button"
              onClick={() => setCapabilityFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                capabilityFilter === 'ALL'
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Staff ({allUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setCapabilityFilter('APPROVER')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                capabilityFilter === 'APPROVER'
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Approvers & Managers
            </button>
            <button
              type="button"
              onClick={() => setCapabilityFilter('SIGNER')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                capabilityFilter === 'SIGNER'
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Signatories
            </button>
          </div>
        </div>

        {/* Users List Container */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3 bg-slate-50">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching users found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or filter tags</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const comp = companies.find((c) => c.id === user.companyId);
              const dept = departments.find((d) => d.id === user.departmentId);
              const stats = userWorkloadStats[user.id] || {
                pendingApprovals: 0,
                pendingSignatures: 0,
                totalDocsCreated: 0,
              };
              const isCurrent = currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-blue-50/70 border-blue-200 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  {/* User Profile */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {user.fullName.charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {user.fullName}
                        </h4>
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {user.employeeId}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                            Active Session
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-semibold text-indigo-700">
                          <Shield className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{user.roleName}</span>
                        </span>
                        {comp && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{comp.code}</span>
                          </span>
                        )}
                        {dept && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span>{dept.name}</span>
                          </span>
                        )}
                        <span className="text-slate-400 truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Workload Badges & Impersonate Action */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {/* Approvals Count */}
                    <div
                      className={`text-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                        stats.pendingApprovals > 0
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                      title="Documents awaiting approval for this user/role"
                    >
                      <div className="text-sm font-bold leading-tight">{stats.pendingApprovals}</div>
                      <div className="text-[10px] text-slate-500">Approvals</div>
                    </div>

                    {/* Signatures Count */}
                    <div
                      className={`text-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                        stats.pendingSignatures > 0
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                      title="Documents awaiting signature"
                    >
                      <div className="text-sm font-bold leading-tight">{stats.pendingSignatures}</div>
                      <div className="text-[10px] text-slate-500">Signatures</div>
                    </div>

                    {/* Action Button */}
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-lg cursor-not-allowed border border-slate-200"
                      >
                        Active
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectUser(user.id)}
                        disabled={isProcessingId === user.id}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-4 h-4 text-indigo-200" />
                        <span>{isProcessingId === user.id ? 'Switching...' : 'Impersonate'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>
              All actions, signatures, and approval decisions executed during impersonation will be logged in the immutable audit trail.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
