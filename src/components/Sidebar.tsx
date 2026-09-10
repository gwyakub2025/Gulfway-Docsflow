import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  PlusCircle,
  FolderKanban,
  PenTool,
  CheckSquare,
  Building2,
  Users,
  Binary,
  ShieldAlert,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import { Company } from '../types/index.js';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  pendingSignaturesCount: number;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  companies,
  selectedCompanyId,
  onSelectCompany,
  pendingSignaturesCount,
  pendingApprovalsCount,
}) => {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'form-library', label: 'Forms Catalog', icon: FileSpreadsheet },
    { id: 'create-document', label: 'Create Document', icon: PlusCircle },
    { id: 'document-register', label: 'Document Register', icon: FolderKanban },
    {
      id: 'pending-signatures',
      label: 'Pending Signatures',
      icon: PenTool,
      badge: pendingSignaturesCount > 0 ? pendingSignaturesCount : null,
    },
    {
      id: 'pending-approvals',
      label: 'Pending Approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
    },
  ];

  const adminNavItems = [
    { id: 'form-builder', label: 'Form Builder', icon: FileText },
    { id: 'numbering-rules', label: 'Numbering Rules', icon: Binary },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'users-roles', label: 'Users & Roles', icon: Users },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert },
    { id: 'settings', label: 'System Architecture', icon: SlidersHorizontal },
  ];

  return (
    <aside className="w-68 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <span className="tracking-tight text-lg">GW</span>
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">
              Gulf Way DocFlow
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Enterprise Document Engine
            </p>
          </div>
        </div>

        {/* Company Filter Selector */}
        <div className="mt-4">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Active Operating Entity
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => onSelectCompany(e.target.value)}
            className="w-full bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-hidden focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Group Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name.split(' ')[0]} {c.name.split(' ')[1] || ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Operational Hub
          </span>
          <nav className="mt-2 space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white text-blue-700' : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Governance & Rules
          </span>
          <nav className="mt-2 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Security Badge */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Atomic Sequence Engine Active</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          SHA-256 Tamper-Evident Records
        </p>
      </div>
    </aside>
  );
};
