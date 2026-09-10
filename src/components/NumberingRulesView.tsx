import React, { useState } from 'react';
import {
  Binary,
  Plus,
  Check,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Hash,
  Trash2,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { NumberingRule, Company } from '../types/index.js';
import { api } from '../api.js';

interface NumberingRulesViewProps {
  rules: NumberingRule[];
  companies: Company[];
  onRuleCreated: (newRule: NumberingRule) => void;
  onRuleUpdated?: (updatedRule: NumberingRule) => void;
  onRuleDeleted?: (deletedId: string) => void;
}

export const NumberingRulesView: React.FC<NumberingRulesViewProps> = ({
  rules,
  companies,
  onRuleCreated,
  onRuleUpdated,
  onRuleDeleted,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<NumberingRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<NumberingRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    const updated = pattern ? `${pattern}-${token}` : token;
    setPattern(updated);
    updatePreview(updated);
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

  const handleOpenCreate = () => {
    setRuleToEdit(null);
    setName('');
    setPattern('{COMPANY}-{DEPARTMENT}-{FORMCODE}-{YYYY}-{SEQ:6}');
    setPrefix('GW');
    setPaddingZeros(6);
    setStartingNumber(1);
    setResetFrequency('YEARLY');
    setShowModal(true);
  };

  const handleOpenEdit = (rule: NumberingRule) => {
    setRuleToEdit(rule);
    setName(rule.name);
    setPattern(rule.pattern);
    setPrefix(rule.prefix || 'GW');
    setPaddingZeros(rule.paddingZeros || 6);
    setStartingNumber(rule.startingNumber || 1);
    setResetFrequency((rule.resetFrequency as any) || 'YEARLY');
    setShowModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pattern.trim()) return;

    try {
      if (ruleToEdit) {
        const updated = await api.updateNumberingRule(ruleToEdit.id, {
          name,
          pattern,
          prefix,
          paddingZeros,
          startingNumber,
          resetFrequency,
        });
        if (onRuleUpdated) onRuleUpdated(updated);
      } else {
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
      }
      setShowModal(false);
      setRuleToEdit(null);
      setName('');
    } catch (err: any) {
      alert(`Error saving numbering rule: ${err.message}`);
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteNumberingRule(ruleToDelete.id);
      if (onRuleDeleted) onRuleDeleted(ruleToDelete.id);
      setRuleToDelete(null);
    } catch (err: any) {
      alert(`Error deleting rule: ${err.message}`);
    } finally {
      setIsDeleting(false);
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
          id="btn-new-numbering-rule"
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Numbering Rule</span>
        </button>
      </div>

      {/* Rules Grid or Empty State */}
      {rules.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto my-8 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Hash className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No Numbering Rules Configured
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Define your atomic sequential formulas (e.g. {'{COMPANY}'}-{'{DEPT}'}-{'{FORM}'}-{'{YYYY}'}-{'{SEQ:6}'}) to govern document numbering across all subsidiaries.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Numbering Rule</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 hover:border-blue-300 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                    {rule.resetFrequency} RESET
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{rule.name}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(rule)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                    title="Edit Rule Pattern"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleToDelete(rule)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                  <span className="font-semibold text-slate-800">{rule.prefix || 'None'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Padding</span>
                  <span className="font-semibold text-slate-800">{rule.paddingZeros || 6} Digits</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Reset Cycle</span>
                  <span className="font-semibold text-slate-800">{rule.resetFrequency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Rule */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Binary className="w-5 h-5 text-blue-600" />
                <span>{ruleToEdit ? 'Edit Numbering Rule' : 'Configure Document Number Pattern'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setRuleToEdit(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rule Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Gulf Way Sequence"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Pattern Formula <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Click chips below to insert</span>
                </div>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => {
                    setPattern(e.target.value);
                    updatePreview(e.target.value);
                  }}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-bold text-blue-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Token Chips */}
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Available Dynamic Variables:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tokenChips.map((tok) => (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => insertToken(tok)}
                      className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer"
                    >
                      {tok}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Real-time Formatted Example:</span>
                </div>
                <div className="font-mono text-sm font-bold text-blue-950 tracking-wider">
                  {livePreview}
                </div>
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setRuleToEdit(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {ruleToEdit ? 'Save Changes' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Rule Confirmation Modal */}
      {ruleToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Numbering Rule</h3>
                <p className="text-xs text-slate-500">Irreversible configuration change</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete the numbering rule <strong className="text-slate-900 font-mono">"{ruleToDelete.name}"</strong>?
              Forms assigned to this rule will no longer generate sequential numbers until updated.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setRuleToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteRule}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Rule'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
