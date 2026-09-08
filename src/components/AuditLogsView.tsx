import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Database,
  Terminal,
} from 'lucide-react';
import { AuditLog } from '../types/index.js';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = logs.filter((log) => {
    if (resourceFilter !== 'ALL' && log.resourceType !== resourceFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const actionMatch = log.action.toLowerCase().includes(term);
      const userMatch = log.userName.toLowerCase().includes(term);
      const resMatch = log.resourceId.toLowerCase().includes(term);
      if (!actionMatch && !userMatch && !resMatch) return false;
    }

    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
            COMPLIANCE & GOVERNANCE
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
            Append-Only Immutable
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1">Audit Trail & Activity Records</h2>
        <p className="text-xs text-slate-500">
          Every sequence counter increment, signature event, manager sanction, void action, and document seal is recorded with user identity, timestamp, and metadata.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action, user, or document number..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg font-medium focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Event Domains</option>
              <option value="DOCUMENT">Document Operations</option>
              <option value="FORM">Form Template Builder</option>
              <option value="NUMBERING">Atomic Numbering</option>
              <option value="AUTH">Authentication & Users</option>
              <option value="COMPANY">Company Directory</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp (GST)</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Domain</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Resource ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`cursor-pointer transition-colors ${
                      selectedLog?.id === log.id ? 'bg-blue-50/80 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                        {log.resourceType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{log.userName}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                      {log.resourceId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 cols: Details Snapshot */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-blue-600" />
            <span>Audit Payload Inspection</span>
          </h3>

          {selectedLog ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Action:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLog.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Performed By:</span>
                  <span className="font-semibold text-slate-800">{selectedLog.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="font-mono text-slate-600">{selectedLog.ipAddress}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Metadata & State Payload
                </span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-mono overflow-auto max-h-72 border border-slate-800">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Click on any row in the audit trail to inspect event payload and parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
