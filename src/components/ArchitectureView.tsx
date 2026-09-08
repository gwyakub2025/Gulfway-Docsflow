import React from 'react';
import {
  ShieldCheck,
  Lock,
  Binary,
  Database,
  FileCheck,
  CheckCircle2,
  Server,
  Layers,
  Key,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const principles = [
    {
      title: 'No Client-Side Sequence Generation',
      desc: 'Client React applications can never compute, guess, or assign sequence numbers. All counters reside behind server-side atomic mutex locks.',
      icon: Lock,
    },
    {
      title: 'Atomic Sequential Locks',
      desc: 'Multi-user requests in rapid succession are serialized in-memory or via Firestore transactions, guaranteeing zero duplicate numbers and zero gaps.',
      icon: Binary,
    },
    {
      title: 'Permanent Number Retention & VOID Policy',
      desc: 'Once allocated, a document number is permanently bound. Even if cancelled, the record transitions to VOID and the number is never recycled.',
      icon: ShieldCheck,
    },
    {
      title: 'Strict Template Version Immutability',
      desc: 'Modifying published templates spawns Version 2, 3, etc. Historical documents remain forever linked to the exact template version active during issuance.',
      icon: Layers,
    },
    {
      title: 'Cryptographic SHA-256 Sealing',
      desc: 'Finalized documents have their content and payload hashed with SHA-256 and locked server-side, enabling public QR code authenticity verification.',
      icon: Key,
    },
    {
      title: 'Multi-Tenant Entity Segregation',
      desc: 'Operating companies (GWDS, GWL, GWT, etc.) maintain independent company codes, licenses, stamps, and granular role assignments.',
      icon: Database,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
            ENTERPRISE GOVERNANCE & SECURITY
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1">
          System Architecture & Compliance Rules
        </h2>
        <p className="text-xs text-slate-500">
          Enforced constraints, Firestore collections schema, and server-side execution boundaries.
        </p>
      </div>

      {/* Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {principles.map((p, i) => {
          const Icon = p.icon;
          return (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{p.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Collections Schema Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            Cloud Firestore Collections & Document Models
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Collection</th>
                <th className="py-2.5 px-4">Entity Responsibility</th>
                <th className="py-2.5 px-4">Security Rules & Constraints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              <tr>
                <td className="py-3 px-4 font-bold text-blue-900">companies</td>
                <td className="py-3 px-4 text-slate-800 font-sans">
                  Operating entities, Trade Licenses, TRN, Official Stamps
                </td>
                <td className="py-3 px-4 text-emerald-700 font-sans">
                  Admin write-only; public verified read
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-blue-900">numberingRules</td>
                <td className="py-3 px-4 text-slate-800 font-sans">
                  Dynamic pattern tokens, sequence starting number, reset frequency
                </td>
                <td className="py-3 px-4 text-emerald-700 font-sans">
                  Server-side transaction access only
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-blue-900">formTemplates</td>
                <td className="py-3 px-4 text-slate-800 font-sans">
                  Blank PDF templates, field coordinates, version histories
                </td>
                <td className="py-3 px-4 text-emerald-700 font-sans">
                  Published forms immutable; modifications spawn v+1
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-blue-900">documents</td>
                <td className="py-3 px-4 text-slate-800 font-sans">
                  Assigned numbers, form values, physical/digital signatures, status
                </td>
                <td className="py-3 px-4 text-emerald-700 font-sans">
                  Allocations atomic; sealed documents immutable
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-blue-900">auditLogs</td>
                <td className="py-3 px-4 text-slate-800 font-sans">
                  Append-only immutable record of all lifecycle events
                </td>
                <td className="py-3 px-4 text-emerald-700 font-sans">
                  No updates or deletes permitted
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
