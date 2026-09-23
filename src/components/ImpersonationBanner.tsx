import React from 'react';
import {
  UserCheck,
  Shield,
  LogOut,
  FileCheck2,
  FilePenLine,
  Eye,
  PlusCircle,
  AlertTriangle,
  Building2,
  Briefcase,
} from 'lucide-react';
import { User } from '../types/index.js';

interface ImpersonationBannerProps {
  currentUser: User;
  originalAdmin: User;
  pendingApprovalsCount: number;
  pendingSignaturesCount: number;
  onExitImpersonation: () => void;
  onOpenScreenOverview: () => void;
  onNavigateToApprovals: () => void;
  onNavigateToSignatures: () => void;
  onNavigateToCreateDoc: () => void;
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  currentUser,
  originalAdmin,
  pendingApprovalsCount,
  pendingSignaturesCount,
  onExitImpersonation,
  onOpenScreenOverview,
  onNavigateToApprovals,
  onNavigateToSignatures,
  onNavigateToCreateDoc,
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-600 via-indigo-900 to-slate-900 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs z-50 border-b border-amber-400/30 shrink-0">
      {/* Left: User Identity & Impersonation notice */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-2.5 w-2.5 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>

        <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] shrink-0">
          <UserCheck className="w-3 h-3 text-amber-300" />
          <span>Impersonation Active</span>
        </div>

        <div className="text-slate-200 truncate">
          <span>Viewing screen as </span>
          <strong className="text-white font-bold">{currentUser.fullName}</strong>
          <span className="text-amber-300 mx-1.5">({currentUser.roleName})</span>
          <span className="hidden md:inline text-slate-300 font-mono text-[11px]">
            [{currentUser.employeeId}]
          </span>
          <span className="hidden lg:inline text-slate-400 ml-2 border-l border-slate-700 pl-2">
            Admin in charge: <strong className="text-slate-200">{originalAdmin.fullName}</strong>
          </span>
        </div>
      </div>

      {/* Middle & Right: Action Shortcuts and Exit Button */}
      <div className="flex items-center flex-wrap gap-2 shrink-0">
        {/* Screen & Workload Overview */}
        <button
          type="button"
          onClick={onOpenScreenOverview}
          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors flex items-center gap-1.5 font-medium border border-white/20 cursor-pointer"
          title="Inspect this user's approval status, pending tasks, and screen overview"
        >
          <Eye className="w-3.5 h-3.5 text-amber-300" />
          <span>User Screen & Approval Status</span>
        </button>

        {/* Pending Approvals Shortcut */}
        <button
          type="button"
          onClick={onNavigateToApprovals}
          className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 font-medium border cursor-pointer ${
            pendingApprovalsCount > 0
              ? 'bg-amber-500/30 text-amber-200 border-amber-400/50 hover:bg-amber-500/40'
              : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
          }`}
          title="View documents awaiting approval"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Approvals ({pendingApprovalsCount})</span>
        </button>

        {/* Pending Signatures Shortcut */}
        <button
          type="button"
          onClick={onNavigateToSignatures}
          className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 font-medium border cursor-pointer ${
            pendingSignaturesCount > 0
              ? 'bg-blue-500/30 text-blue-200 border-blue-400/50 hover:bg-blue-500/40'
              : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
          }`}
          title="View documents awaiting signature"
        >
          <FilePenLine className="w-3.5 h-3.5 text-blue-300" />
          <span>Signatures ({pendingSignaturesCount})</span>
        </button>

        {/* Create Document as this user */}
        <button
          type="button"
          onClick={onNavigateToCreateDoc}
          className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-md transition-colors flex items-center gap-1 font-medium border border-emerald-400/40 cursor-pointer hidden sm:flex"
          title="Create a new document transaction under this user's name"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Transact / Create</span>
        </button>

        {/* Exit Impersonation Button */}
        <button
          type="button"
          onClick={onExitImpersonation}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors flex items-center gap-1.5 shadow-xs border border-red-400/50 cursor-pointer ml-1"
          title={`End impersonation and restore administrator session as ${originalAdmin.fullName}`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Impersonation</span>
        </button>
      </div>
    </div>
  );
};
