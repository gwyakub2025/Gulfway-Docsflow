import React from 'react';
import { User, Shield, CheckCircle } from 'lucide-react';
import { User as UserType } from '../types/index.js';

interface HeaderProps {
  currentUser: UserType | null;
  allUsers: Array<{ id: string; fullName: string; roleName: string; email: string }>;
  onSwitchUser: (userId: string) => void;
  onOpenQuickVerify: () => void;
  onQuickCreate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenQuickVerify,
  onQuickCreate,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10 shadow-xs">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span>Enterprise Form & Numbering Control</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              v2026.1-PROD
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Multi-entity document lifecycle, atomic sequential numbering & SHA-256 seal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick QR Verification Link */}
        <button
          onClick={onOpenQuickVerify}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
          title="Verify an existing document token without login"
        >
          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Verify Document QR</span>
        </button>

        {/* Quick Create Document Button */}
        <button
          onClick={onQuickCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <span>+ Generate Document</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1"></div>

        {/* Live Role Switcher (Crucial for testing RBAC and role permissions) */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
            {currentUser ? currentUser.fullName.charAt(0) : 'U'}
          </div>
          <div className="text-left pr-2">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {currentUser?.fullName}
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
        </div>
      </div>
    </header>
  );
};
