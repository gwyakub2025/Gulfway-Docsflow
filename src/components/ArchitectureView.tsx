import React, { useState } from 'react';
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
  ArrowRight,
  Building2,
  Users,
  Hash,
  FileText,
  PenTool,
  QrCode,
  CheckSquare,
  Shield,
  ExternalLink,
} from 'lucide-react';

export interface ArchitectureViewProps {
  onNavigate?: (tab: string) => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ onNavigate }) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const workflowSteps = [
    {
      step: 1,
      order: 'FIRST STEP',
      phase: 'Entity Foundation',
      title: 'Register Operating Company',
      actor: 'Super Administrator',
      module: 'Companies Tab',
      tab: 'companies',
      summary: 'Register the legal entity (GWDS, GWT, GWL) with its UAE Trade License, TRN, and Official Stamp.',
      details:
        'All numbering patterns, letterheads, and stamps are scoped to a legal entity. A document cannot be generated without an underlying company.',
      inputs: ['Company Legal Name', 'Entity Code (e.g. GWDS)', 'Trade License #', 'TRN', 'Official Stamp'],
      outputs: ['Unique Company ID', 'Entity Document Scope'],
      rule: 'Mandatory before any templates or documents can be created.',
      icon: Building2,
      color: 'blue',
    },
    {
      step: 2,
      order: 'SECOND STEP',
      phase: 'Access Control',
      title: 'Configure Users, Departments & Roles',
      actor: 'Super Administrator',
      module: 'Users & Roles Tab',
      tab: 'users-roles',
      summary: 'Set up organizational departments (HR, Fleet/OPS, Finance) and grant RBAC permissions to staff.',
      details:
        'Assign users to entities and departments. Roles dictate who can draft, who can allocate sequential numbers, who can sign, and who can approve.',
      inputs: ['Employee ID', 'Department ID', 'Role Assignment (Admin, Approver, User)'],
      outputs: ['Active User Sessions', 'Permission Matrix Enforcement'],
      rule: 'Only designated Approvers can sign final sanctions.',
      icon: Users,
      color: 'indigo',
    },
    {
      step: 3,
      order: 'THIRD STEP',
      phase: 'Sequential Control',
      title: 'Establish Numbering Rules & Counter Registers',
      actor: 'Compliance & Systems Admin',
      module: 'Numbering Rules Tab',
      tab: 'numbering-rules',
      summary: 'Define atomic, tamper-proof pattern formulas and yearly sequence reset intervals.',
      details:
        'Formula standard: {COMPANY}-{DEPT}-{FORM}-{YYYY}-{SEQ:6}. Initial starting sequence counter (e.g., 1000) and padding zeros are locked into server memory.',
      inputs: ['Pattern Expression', 'Padding (6 digits)', 'Reset Frequency (YEARLY/NEVER)', 'Starting #'],
      outputs: ['Active Sequential Counter', 'Pattern Regex Validator'],
      rule: 'Counters reside behind mutex locks; numbers cannot be recycled or manually assigned.',
      icon: Hash,
      color: 'amber',
    },
    {
      step: 4,
      order: 'FOURTH STEP',
      phase: 'Template Design',
      title: 'Publish Form Templates & Signature Slots',
      actor: 'Department Lead / Admin',
      module: 'Forms Catalog & Form Builder',
      tab: 'form-builder',
      summary: 'Link forms to numbering rules, define input fields, and set digital signature / QR coordinates.',
      details:
        'Templates define what data needs to be captured (e.g. Leave dates, motorcycle plate number, advance sum). Once published, versions are immutable (v1, v2).',
      inputs: ['Field Types & Coordinates', 'Associated Numbering Rule ID', 'Required Signatures'],
      outputs: ['Published Form Template (ACTIVE)', 'Versioned Field Schema'],
      rule: 'Editing a published template automatically spawns a new version (v+1).',
      icon: FileText,
      color: 'teal',
    },
    {
      step: 5,
      order: 'FIFTH STEP',
      phase: 'Request Initiation',
      title: 'Draft Document Request (Zero Number Allocated)',
      actor: 'Employee / Rider / Initiator',
      module: 'Dashboard / Create Document',
      tab: 'create-document',
      summary: 'Select an active form template, fill in applicant values, and save as working draft.',
      details:
        'CRITICAL COMPLIANCE DIRECTIVE: No sequential number is allocated during drafting. This guarantees that unsubmitted or abandoned drafts do not consume sequence numbers or leave audit gaps.',
      inputs: ['Form Fields (Name, Dates, Amounts, Justifications)'],
      outputs: ['Draft Record (Status: DRAFT)', 'docNum: UNALLOCATED'],
      rule: 'Sequence numbers are STRICTLY withheld until formal submission.',
      icon: CheckSquare,
      color: 'slate',
    },
    {
      step: 6,
      order: 'SIXTH STEP',
      phase: 'Atomic Allocation',
      title: 'Allocate Official Number & Generate QR Verification',
      actor: 'Server-Side Engine (Automated)',
      module: 'Document Register',
      tab: 'document-register',
      summary: 'System atomically increments sequence counter and burns the official number and verification QR into PDF.',
      details:
        'An unforgeable 32-character verification token is minted. Document transitions to AWAITING_SIGNATURE. The official PDF is generated with company letterhead, official stamp, and dynamic QR code.',
      inputs: ['Confirmed Draft Submission', 'Selected Signing Method (Digital / Physical)'],
      outputs: ['Sequential Number (e.g. GWDS-HR-LF-2026-001026)', 'QR Code & Token', 'Official Generated PDF'],
      rule: 'Irreversible allocation. Once issued, the number cannot be un-assigned.',
      icon: QrCode,
      color: 'emerald',
    },
    {
      step: 7,
      order: 'SEVENTH STEP',
      phase: 'Signature Execution',
      title: 'Execute Signature (Digital Pad or Physical Wet-Ink)',
      actor: 'Applicant / Assigned Signer',
      module: 'Pending Signatures View',
      tab: 'pending-signatures',
      summary: 'Sign digitally via HTML5 canvas pad with cryptographic metadata, or print and scan physical wet-ink copy.',
      details:
        'Digital mode records signer IP, timestamp, role, and drawn vector. Physical mode allows printing the official numbered PDF and uploading the scanned wet-ink copy with physical company stamp.',
      inputs: ['Drawn Vector / Uploaded PNG', 'OR Scanned Wet-Ink PDF/Image'],
      outputs: ['Embedded Signature Block', 'Status: SIGNED / AWAITING_APPROVAL'],
      rule: 'Signatures are time-stamped and bound to the document token.',
      icon: PenTool,
      color: 'violet',
    },
    {
      step: 8,
      order: 'EIGHTH STEP',
      phase: 'Managerial Sanction',
      title: 'Supervisor / Manager Approval',
      actor: 'Authorized Department Approver',
      module: 'Pending Approvals View',
      tab: 'pending-approvals',
      summary: 'Manager inspects document data, verified signatures, and either approves sanction or returns with remarks.',
      details:
        'Supervisors review compliance. Approval appends to the approval history trail in the ledger. Rejection marks document REJECTED without recycling the allocated number.',
      inputs: ['Approver Decision', 'Approval Remarks'],
      outputs: ['Status: APPROVED', 'Audit Log Trail'],
      rule: 'Only users with DOCUMENT_APPROVE permission can execute this step.',
      icon: CheckCircle2,
      color: 'cyan',
    },
    {
      step: 9,
      order: 'NINTH STEP',
      phase: 'Cryptographic Locking',
      title: 'Finalize & Compute SHA-256 Tamper-Evident Seal',
      actor: 'System / Compliance Lead',
      module: 'Document Details -> Finalize',
      tab: 'document-register',
      summary: 'Document transitions to immutable FINAL status. Server computes SHA-256 hash of entire payload.',
      details:
        'Once finalized, the document can never be edited or altered. If any change occurs, the SHA-256 hash validation will immediately alert of tampering.',
      inputs: ['Approved Document Payload'],
      outputs: ['Cryptographic SHA-256 Checksum', 'Immutable Status: FINAL', 'Official Archived PDF'],
      rule: '100% immutable. Further edits are strictly blocked by server rules.',
      icon: Key,
      color: 'rose',
    },
    {
      step: 10,
      order: 'TENTH STEP',
      phase: 'Verification',
      title: 'Public Authenticity Verification',
      actor: 'Auditors, Traffic Police, Client Inspectors',
      module: 'Public Portal /verify/:token',
      tab: 'verify',
      summary: 'Anyone scanning the QR code or entering the token verifies the authentic record against the official registry.',
      details:
        'The public verification portal displays issuance entity, date, authorized signers, document type, status, and SHA-256 checksum without exposing confidential private values.',
      inputs: ['Scanned QR Code', 'OR Verification Token'],
      outputs: ['Live Authenticity Verification Badge', 'Official Issuing Entity Details', 'SHA-256 Confirmation'],
      rule: 'Open public verification available 24/7 without requiring account login.',
      icon: ShieldCheck,
      color: 'green',
    },
  ];

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

  const currentStepData = workflowSteps.find((s) => s.step === activeStep) || workflowSteps[0];
  const StepIcon = currentStepData.icon;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
            OPERATIONAL WORKFLOW MANUAL & ARCHITECTURE
          </span>
          <span className="text-xs font-medium text-slate-500">
            Standard Operating Procedure (SOP)
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
          System Workflow Sequence & Architecture
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          Follow the exact chronological order of operations from initial operating entity registration down to atomic sequence allocation, dual-mode signing, and public cryptographic QR verification.
        </p>
      </div>

      {/* Interactive Step-by-Step Flowchart Map */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-blue-600 tracking-wider">
              WHAT NEEDS TO BE DONE FIRST
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Chronological Sequence of Actions (10-Step Workflow Map)
            </h3>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Click any step below to inspect inputs, outputs, and compliance rules:
          </div>
        </div>

        {/* Step Navigation Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {workflowSteps.map((ws) => {
            const isSelected = ws.step === activeStep;
            const Icon = ws.icon;
            return (
              <button
                key={ws.step}
                type="button"
                onClick={() => setActiveStep(ws.step)}
                className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-102 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-2xs'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                    isSelected ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  Step {ws.step}
                </span>
                <span className="text-[11px] font-bold leading-tight mt-0.5 line-clamp-2">
                  {ws.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Card */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                <StepIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-500 text-[10px] font-mono font-bold uppercase text-white">
                    {currentStepData.order}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Phase: <strong className="text-white">{currentStepData.phase}</strong>
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mt-1">
                  Step {currentStepData.step}: {currentStepData.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {currentStepData.summary}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 md:text-right shrink-0 bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
              <div className="text-[11px] text-slate-400">Responsible Actor</div>
              <div className="text-xs font-bold text-blue-300">{currentStepData.actor}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">Application Module:</div>
              <div className="text-xs font-mono font-semibold text-emerald-400">
                {currentStepData.module}
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(currentStepData.tab)}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>Open {currentStepData.module}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/40">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">
                Required Inputs
              </div>
              <ul className="space-y-1 text-slate-300">
                {currentStepData.inputs.map((inp, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span>{inp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/40">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">
                Expected System Outputs
              </div>
              <ul className="space-y-1 text-slate-300">
                {currentStepData.outputs.map((out, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{out}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/40 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-amber-400 font-bold mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Strict Integrity Rule</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {currentStepData.rule}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-700 text-[10px] text-slate-400">
                <button
                  type="button"
                  disabled={activeStep === 1}
                  onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                  className="hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  ← Previous Step
                </button>
                <span>Step {activeStep} of 10</span>
                <button
                  type="button"
                  disabled={activeStep === 10}
                  onClick={() => setActiveStep((prev) => Math.min(10, prev + 1))}
                  className="text-blue-400 hover:text-blue-300 disabled:opacity-30 cursor-pointer font-bold"
                >
                  Next Step →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Architectural Principles */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold text-blue-600 tracking-wider">
            GOVERNANCE PRINCIPLES
          </span>
          <h3 className="text-base font-bold text-slate-900">
            Immutable Architecture & Tamper-Proof Guarantees
          </h3>
        </div>

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
                <h4 className="font-bold text-slate-900 text-sm">{p.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Model / Firestore Schema */}
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
