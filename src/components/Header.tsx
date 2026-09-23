import React from 'react';
import { User, Shield, CheckCircle, Database, Sparkles, UserCheck, LogOut } from 'lucide-react';
import { User as UserType } from '../types/index.js';

interface HeaderProps {
  currentUser: UserType | null;
  allUsers: Array<{ id: string; fullName: string; roleName: string; email: string }>;
  onSwitchUser: (userId: string) => void;
  onOpenQuickVerify: () => void;
  onQuickCreate: () => void;
  onOpenOnboarding?: () => void;
  isImpersonating?: boolean;
  originalAdmin?: UserType | null;
  onOpenImpersonateModal?: () => void;
  onExitImpersonation?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenQuickVerify,
  onQuickCreate,
  onOpenOnboarding,
  isImpersonating,
  originalAdmin,
  onOpenImpersonateModal,
  onExitImpersonation,
}) => {
  const isAdminOrSuperAdmin =
    isImpersonating ||
    currentUser?.roleName === 'Super Administrator' ||
    currentUser?.roleName === 'SUPER_ADMIN' ||
    currentUser?.roleName === 'Company Administrator' ||
    currentUser?.roleName === 'Administrator' ||
    currentUser?.roleName === 'ADMIN';
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10 shadow-xs">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span>Enterprise Form & Numbering Control</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1.5" title="Cloud Firestore Realtime DB Active">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <Database className="w-2.5 h-2.5 text-emerald-600" />
              <span>Database Connected</span>
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Multi-entity document lifecycle, atomic sequential numbering & SHA-256 seal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Onboarding Wizard Setup Button */}
        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            title="Launch first-time company and department onboarding wizard"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Setup Wizard</span>
          </button>
        )}

        {/* Quick QR Verification Link */}
        <button
          onClick={onOpenQuickVerify}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Verify an existing document token without login"
        >
          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Verify Document QR</span>
        </button>

        {/* Impersonate User Button (for Admins) */}
        {isAdminOrSuperAdmin && onOpenImpersonateModal && (
          <button
            onClick={onOpenImpersonateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all shadow-2xs cursor-pointer"
            title="Impersonate any employee to view their screen, approval status, and perform transactions"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Impersonate User</span>
          </button>
        )}

        {/* Quick Create Document Button */}
        <button
          onClick={onQuickCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <span>+ Generate Document</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1"></div>

        {/* Live Role Switcher (Crucial for testing RBAC and role permissions) */}
        <div className={`flex items-center gap-2 border rounded-lg p-1.5 ${
          isImpersonating
            ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            isImpersonating ? 'bg-amber-500 text-white' : 'bg-blue-100 text-blue-700'
          }`}>
            {currentUser ? currentUser.fullName.charAt(0) : 'U'}
          </div>
          <div className="text-left pr-2">
            <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
              <span>{currentUser?.fullName}</span>
              {isImpersonating && (
                <span className="text-[9px] bg-amber-500 text-white px-1 py-0.2 rounded font-bold uppercase">
                  Impersonating
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-indigo-500" />
              <span>{currentUser?.roleName}</span>
            </div>
          </div>

          <div className="border-l border-slate-200 pl-1.5">
            <select
              value={currentUser?.id || ''}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="text-[11px] font-medium bg-white text-slate-700 border border-slate-300 rounded-md px-2 py-1 focus:outline-hidden focus:border-blue-500 cursor-pointer"
              title="Switch user to test different permissions"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  Switch to: {u.fullName} ({u.roleName.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {isImpersonating && onExitImpersonation && (
            <button
              type="button"
              onClick={onExitImpersonation}
              title={`Exit Impersonation and return to ${originalAdmin?.fullName || 'Admin'}`}
              className="ml-1 p-1 text-red-600 hover:text-white hover:bg-red-600 rounded border border-red-200 hover:border-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
