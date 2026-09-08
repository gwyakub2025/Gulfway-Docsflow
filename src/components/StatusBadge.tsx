import React from 'react';
import { DocumentStatus } from '../types/index.js';
import {
  FileEdit,
  Clock,
  FileCheck2,
  FileCheck,
  CheckCircle2,
  XCircle,
  Ban,
  ShieldCheck,
} from 'lucide-react';

interface StatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  switch (status) {
    case 'DRAFT':
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <FileEdit className="w-3.5 h-3.5 text-slate-500" />
          Draft (Unnumbered)
        </span>
      );

    case 'NUMBER_ASSIGNED':
    case 'AWAITING_SIGNATURE':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Awaiting Signature
        </span>
      );

    case 'SIGNED':
      return (
        <span className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/80 ${sizeClasses}`}>
          <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
          Signed
        </span>
      );

    case 'AWAITING_APPROVAL':
      return (
        <span className={`inline-flex items-center rounded-full bg-sky-50 text-sky-800 border border-sky-200/80 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          Awaiting Approval
        </span>
      );

    case 'APPROVED':
      return (
        <span className={`inline-flex items-center rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 ${sizeClasses}`}>
          <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
          Approved
        </span>
      );

    case 'FINAL':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold shadow-xs ${sizeClasses}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          FINAL (Sealed)
        </span>
      );

    case 'REJECTED':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-800 border border-rose-200/80 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );

    case 'VOID':
      return (
        <span className={`inline-flex items-center rounded-full bg-zinc-800 text-zinc-200 border border-zinc-900 ${sizeClasses}`}>
          <Ban className="w-3.5 h-3.5 text-zinc-400" />
          <span className="line-through">VOID</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
          {status}
        </span>
      );
  }
};
