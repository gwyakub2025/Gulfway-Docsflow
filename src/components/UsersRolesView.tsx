import React, { useState } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Building2,
  Lock,
  Key,
} from 'lucide-react';
import { User, Role, Company } from '../types/index.js';

interface UsersRolesViewProps {
  users: User[];
  roles: Role[];
  companies: Company[];
}

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({
  users,
  roles,
  companies,
}) => {
  const [selectedRole, setSelectedRole] = useState<Role>(roles[0]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
            ROLE-BASED ACCESS CONTROL (RBAC)
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1">Users, Directory & Permissions</h2>
        <p className="text-xs text-slate-500">
          Enforce granular security policies, company isolation, and authorized signing/approval delegation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Users Directory */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Active User Accounts ({users.length})
            </h3>
            <span className="text-[11px] text-slate-400">Use top navbar to switch users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">System Role</th>
                  <th className="py-2.5 px-4">Entity Assignment</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const company = companies.find((c) => c.id === u.companyId);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          <Shield className="w-3 h-3 text-blue-600" />
                          {u.roleName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {u.companyId === 'ALL' ? (
                          <span className="text-blue-700 font-bold text-[11px]">
                            All Group Companies
                          </span>
                        ) : (
                          <span>{company?.name.split(' ')[0]} {company?.name.split(' ')[1]}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 cols: Granular Permissions Matrix */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Role Permission Inspector
            </h3>
            <p className="text-[11px] text-slate-500">
              Select a role to inspect granted privileges in Gulf Way DocFlow.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-100">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r)}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                  selectedRole?.id === r.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {selectedRole && (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Description
                </span>
                <p className="text-xs text-slate-700 mt-0.5">{selectedRole.description}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Granted System Capabilities
                </span>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedRole.permissions.map((perm) => (
                    <div
                      key={perm}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between font-mono text-[11px]"
                    >
                      <span className="text-slate-800 font-semibold">{perm}</span>
                      <span className="text-emerald-600 font-bold text-[10px]">GRANTED</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Permissions are authoritatively enforced server-side. Any attempt to allocate numbers or sanction documents without the matching role token will be rejected by the API layer.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
