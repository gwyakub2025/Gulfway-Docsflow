import React, { useState } from 'react';
import {
  Binary,
  Plus,
  Check,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { NumberingRule, Company } from '../types/index.js';
import { api } from '../api.js';

interface NumberingRulesViewProps {
  rules: NumberingRule[];
  companies: Company[];
  onRuleCreated: (newRule: NumberingRule) => void;
}

export const NumberingRulesView: React.FC<NumberingRulesViewProps> = ({
  rules,
  companies,
  onRuleCreated,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('{COMPANY}-{DEPARTMENT}-{FORMCODE}-{YYYY}-{SEQ:6}');
  const [prefix, setPrefix] = useState('GW');
  const [paddingZeros, setPaddingZeros] = useState(6);
  const [startingNumber, setStartingNumber] = useState(1);
  const [resetFrequency, setResetFrequency] = useState<'NEVER' | 'YEARLY' | 'MONTHLY'>('YEARLY');
  const [testCompanyCode, setTestCompanyCode] = useState('GWDS');
  const [testDeptCode, setTestDeptCode] = useState('HR');
  const [testFormCode, setTestFormCode] = useState('LF');
  const [livePreview, setLivePreview] = useState('GWDS-HR-LF-2026-000001');

  // Available tokens for easy clicking
  const tokenChips = [
    '{COMPANY}',
    '{DEPARTMENT}',
    '{FORMCODE}',
    '{YYYY}',
    '{YY}',
    '{MM}',
    '{DD}',
    '{SEQ:4}',
    '{SEQ:5}',
    '{SEQ:6}',
  ];

  const insertToken = (token: string) => {
    setPattern((prev) => `${prev}-${token}`);
    updatePreview(pattern + '-' + token);
  };

  const updatePreview = async (testPattern: string) => {
    try {
      const res = await api.previewNumberPattern({
        pattern: testPattern,
        companyCode: testCompanyCode,
        departmentCode: testDeptCode,
        formCode: testFormCode,
        sampleSeq: startingNumber,
      });
      setLivePreview(res.preview);
    } catch {
      // Fallback local preview
      const year = new Date().getFullYear();
      const seqStr = String(startingNumber).padStart(paddingZeros, '0');
      const p = testPattern
        .replace('{COMPANY}', testCompanyCode)
        .replace('{DEPARTMENT}', testDeptCode)
        .replace('{FORMCODE}', testFormCode)
        .replace('{YYYY}', String(year))
        .replace(/{SEQ:\d+}/, seqStr);
      setLivePreview(p);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pattern.trim()) return;

    try {
      const created = await api.createNumberingRule({
        name,
        pattern,
        prefix,
        paddingZeros,
        startingNumber,
        resetFrequency,
        isActive: true,
      });
      onRuleCreated(created);
      setShowModal(false);
      setName('');
    } catch (err: any) {
      alert(`Error creating numbering rule: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
              ATOMIC NUMBERING ENGINE
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Sequential Document Numbering Rules
          </h2>
          <p className="text-xs text-slate-500">
            Define dynamic numbering patterns using company codes, department abbreviations, form codes, calendar tokens, and padded atomic sequences.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Numbering Rule</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                  {rule.resetFrequency} RESET
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-2">{rule.name}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-xs">
                #
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Configured Token Pattern
              </span>
              <div className="font-mono font-bold text-xs text-blue-900 break-all">
                {rule.pattern}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block">Prefix</span>
                <span className="font-semibold text-slate-800">{rule.prefix}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Padding</span>
                <span className="font-semibold text-slate-800">{rule.paddingZeros} Digits</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Reset Cycle</span>
                <span className="font-semibold text-slate-800">{rule.resetFrequency}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Rule */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Binary className="w-5 h-5 text-blue-600" />
                <span>Configure Document Number Pattern</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rule Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard UAE Group Pattern"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pattern Template <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => {
                    setPattern(e.target.value);
                    updatePreview(e.target.value);
                  }}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-blue-900"
                />

                {/* Token chips */}
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">
                    Insert Token:
                  </span>
                  {tokenChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => insertToken(chip)}
                      className="px-2 py-0.5 rounded-sm bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 font-mono text-[10px] border border-slate-200 transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Live Generated Sample Output
                </span>
                <div className="font-mono font-bold text-sm text-blue-900">{livePreview}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reset Frequency</label>
                  <select
                    value={resetFrequency}
                    onChange={(e) => setResetFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="YEARLY">Yearly (Resets sequence every Jan 1st)</option>
                    <option value="MONTHLY">Monthly (Resets sequence every 1st)</option>
                    <option value="NEVER">Continuous (Never resets)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sequence Zero-Padding</label>
                  <select
                    value={paddingZeros}
                    onChange={(e) => setPaddingZeros(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value={4}>4 Digits (0001)</option>
                    <option value={5}>5 Digits (00001)</option>
                    <option value={6}>6 Digits (000001)</option>
                    <option value={7}>7 Digits (0000001)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Save Numbering Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
