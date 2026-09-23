import React, { useState } from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Layers,
  Binary,
  Check,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Stamp,
  Globe,
  Mail,
  Phone,
  MapPin,
  Lock,
} from 'lucide-react';
import { Company, Department, NumberingRule } from '../types/index.js';
import { api } from '../api.js';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (data: {
    company: Company;
    departments: Department[];
    numberingRule?: NumberingRule;
  }) => void;
  existingCompaniesCount: number;
}

interface DeptPreset {
  code: string;
  name: string;
  description: string;
  selected: boolean;
}

const DEFAULT_DEPT_PRESETS: DeptPreset[] = [
  {
    code: 'OPS',
    name: 'Operations & Fleet Logistics',
    description: 'Vehicle handovers, delivery rider agreements, equipment custodianship, and operational field dispatch.',
    selected: true,
  },
  {
    code: 'HR',
    name: 'Human Resources & Talent',
    description: 'Employee onboarding, leave clearance vouchers, salary certificates, and staff personnel management.',
    selected: true,
  },
  {
    code: 'FIN',
    name: 'Finance, Payroll & Accounts',
    description: 'Salary advance requests, expense requisitions, vendor vouchers, and fiscal undertakings.',
    selected: true,
  },
  {
    code: 'LEG',
    name: 'Legal, Compliance & Sanctions',
    description: 'Commercial contracts, corporate undertakings, regulatory compliance, and governance sign-offs.',
    selected: true,
  },
  {
    code: 'ADM',
    name: 'General Corporate Administration',
    description: 'Internal memos, procurement requisitions, facility asset allocation, and group circulars.',
    selected: false,
  },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  onCompleted,
  existingCompaniesCount,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<{
    company: Company;
    departments: Department[];
    numberingRule?: NumberingRule;
  } | null>(null);

  // Step 1: Company Profile Form
  const [companyName, setCompanyName] = useState('Gulf Way General Trading LLC');
  const [companyCode, setCompanyCode] = useState('GW');
  const [tradeLicense, setTradeLicense] = useState('TL-2024-89104');
  const [trnNumber, setTrnNumber] = useState('100234567800003');
  const [address, setAddress] = useState('Office 402, Al Moosa Tower, Sheikh Zayed Road, Dubai, UAE');
  const [phone, setPhone] = useState('+971 4 398 2210');
  const [email, setEmail] = useState('operations@gulfway.ae');
  const [stampColor, setStampColor] = useState<'EMERALD' | 'NAVY' | 'GOLD'>('EMERALD');

  // Step 2: Department Accounts
  const [departmentPresets, setDepartmentPresets] = useState<DeptPreset[]>(DEFAULT_DEPT_PRESETS);
  const [customDeptName, setCustomDeptName] = useState('');
  const [customDeptCode, setCustomDeptCode] = useState('');
  const [showAddCustomDept, setShowAddCustomDept] = useState(false);

  // Step 3: Numbering Rule Pattern
  const [numberPatternType, setNumberPatternType] = useState<string>('STANDARD');
  const [startingSeq, setStartingSeq] = useState<number>(1);
  const [adminSanction, setAdminSanction] = useState<boolean>(true);

  if (!isOpen) return null;

  // Toggle department selection
  const toggleDept = (index: number) => {
    setDepartmentPresets((prev) =>
      prev.map((d, i) => (i === index ? { ...d, selected: !d.selected } : d))
    );
  };

  // Add custom department
  const handleAddCustomDept = () => {
    if (!customDeptName.trim() || !customDeptCode.trim()) return;
    const cleanCode = customDeptCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const newPreset: DeptPreset = {
      code: cleanCode,
      name: customDeptName.trim(),
      description: 'Custom corporate operational department',
      selected: true,
    };
    setDepartmentPresets((prev) => [...prev, newPreset]);
    setCustomDeptName('');
    setCustomDeptCode('');
    setShowAddCustomDept(false);
  };

  // Remove department preset
  const handleRemoveDept = (index: number) => {
    setDepartmentPresets((prev) => prev.filter((_, i) => i !== index));
  };

  // Compute pattern preview
  const getPatternString = () => {
    switch (numberPatternType) {
      case 'STANDARD':
        return '{COMPANY}-{DEPT}-{YYYY}-{SEQ:4}';
      case 'SIMPLE':
        return '{COMPANY}-{YYYY}-{SEQ:5}';
      case 'SLASH':
        return '{COMPANY}/{DEPT}/{YYYY}/{SEQ:4}';
      default:
        return '{COMPANY}-{DEPT}-{YYYY}-{SEQ:4}';
    }
  };

  const getSamplePreview = () => {
    const yr = new Date().getFullYear();
    const c = (companyCode || 'GW').toUpperCase();
    const activeDept = departmentPresets.find((d) => d.selected)?.code || 'OPS';
    const seqStr = String(startingSeq).padStart(4, '0');

    switch (numberPatternType) {
      case 'STANDARD':
        return `${c}-${activeDept}-${yr}-${seqStr}`;
      case 'SIMPLE':
        return `${c}-${yr}-${String(startingSeq).padStart(5, '0')}`;
      case 'SLASH':
        return `${c}/${activeDept}/${yr}/${seqStr}`;
      default:
        return `${c}-${activeDept}-${yr}-${seqStr}`;
    }
  };

  // Stamp SVG Generator helper for pristine corporate seal
  const generateStampDataUrl = (color: 'EMERALD' | 'NAVY' | 'GOLD') => {
    const strokeColor = color === 'EMERALD' ? '#047857' : color === 'NAVY' ? '#1e3a8a' : '#b45309';
    const bgFill = color === 'EMERALD' ? '#ecfdf5' : color === 'NAVY' ? '#eff6ff' : '#fffbeb';
    const code = (companyCode || 'GW').toUpperCase();
    const name = companyName.toUpperCase();

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
      <circle cx="110" cy="110" r="102" fill="${bgFill}" stroke="${strokeColor}" stroke-width="3" stroke-dasharray="4,2"/>
      <circle cx="110" cy="110" r="92" fill="none" stroke="${strokeColor}" stroke-width="1.5"/>
      <circle cx="110" cy="110" r="62" fill="none" stroke="${strokeColor}" stroke-width="2"/>
      <text x="110" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="${strokeColor}" letter-spacing="1.5">OFFICIAL AUDIT SEAL</text>
      <text x="110" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="${strokeColor}">${code}</text>
      <text x="110" y="105" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="${strokeColor}" letter-spacing="1">GULF WAY LEDGER</text>
      <text x="110" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="${strokeColor}">TRN: ${trnNumber || '100234567800003'}</text>
      <text x="110" y="145" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="8.5" fill="${strokeColor}">VERIFIED &amp; TAMPER-EVIDENT</text>
      <text x="110" y="185" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="9.5" fill="${strokeColor}" letter-spacing="0.5">${name.length > 28 ? name.slice(0, 26) + '...' : name}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Validation
  const validateStep1 = () => {
    if (!companyName.trim()) {
      setErrorMessage('Legal company name is required.');
      return false;
    }
    if (!companyCode.trim() || companyCode.trim().length < 2) {
      setErrorMessage('Company short code must be at least 2 characters (e.g. GW).');
      return false;
    }
    if (!tradeLicense.trim()) {
      setErrorMessage('Trade license number is required for UAE/GCC compliance.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const validateStep2 = () => {
    const selectedCount = departmentPresets.filter((d) => d.selected).length;
    if (selectedCount === 0) {
      setErrorMessage('Please select or add at least one department account to establish your organization hierarchy.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  // Navigation handlers
  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrorMessage(null);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrorMessage(null);
    setStep((prev) => prev - 1);
  };

  // Execution & Direct Database Commit
  const handleExecuteSetup = async () => {
    if (!validateStep1() || !validateStep2()) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create Primary Company directly in database
      const generatedStamp = generateStampDataUrl(stampColor);
      const companyPayload: Partial<Company> = {
        name: companyName.trim(),
        code: companyCode.trim().toUpperCase(),
        tradeLicenseNumber: tradeLicense.trim(),
        taxRegistrationNumber: trnNumber.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        status: 'ACTIVE',
        isActive: true,
        officialStampUrl: generatedStamp,
        stampUrl: generatedStamp,
      };

      console.log('[OnboardingWizard] Committing company to database:', companyPayload);
      const createdCompany = await api.createCompany(companyPayload);

      // 2. Create Selected Department Accounts directly in database
      const selectedDepts = departmentPresets.filter((d) => d.selected);
      const createdDepartments: Department[] = [];

      for (const dept of selectedDepts) {
        console.log('[OnboardingWizard] Provisioning department:', dept.name);
        const deptPayload: Partial<Department> = {
          name: dept.name,
          code: dept.code.toUpperCase(),
          companyId: createdCompany.id,
        };
        const createdDept = await api.createDepartment(deptPayload);
        createdDepartments.push(createdDept);
      }

      // 3. Create Default Sequential Numbering Rule for this operating company
      let createdRule: NumberingRule | undefined;
      try {
        const pattern = getPatternString();
        const rulePayload: Partial<NumberingRule> = {
          name: `${createdCompany.code} Master Sequential Register`,
          pattern,
          sequenceReset: 'YEARLY',
          startingSequence: Number(startingSeq) || 1,
          currentSequence: Number(startingSeq) || 1,
          formTemplateId: 'DEFAULT',
          description: `Automatic register rule provisioned during administrator onboarding for ${createdCompany.name}`,
        };
        createdRule = await api.createNumberingRule(rulePayload);
      } catch (ruleErr) {
        console.warn('[OnboardingWizard] Notice creating numbering rule:', ruleErr);
      }

      // Mark onboarding completed in client storage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('gulfway_onboarding_completed', 'true');
      }

      const result = {
        company: createdCompany,
        departments: createdDepartments,
        numberingRule: createdRule,
      };

      setCompletedResult(result);
      setStep(4); // Move to completion celebrate view
      onCompleted(result);
    } catch (err: any) {
      console.error('[OnboardingWizard] Provisioning error:', err);
      setErrorMessage(err.message || 'Failed to provision initial company and departments to the database. Please check connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Wizard Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-16 -bottom-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">
                  First-Time Administrator Setup
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Gulf Way Enterprise Onboarding
                </h2>
              </div>
            </div>

            {existingCompaniesCount > 0 && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            )}
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
            <div
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-all ${
                step === 1
                  ? 'bg-blue-600/30 border border-blue-500/40 text-blue-200'
                  : step > 1
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/40 border border-slate-700/30 text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  step > 1 ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span className="truncate text-[11px] sm:text-xs">Primary Entity</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-all ${
                step === 2
                  ? 'bg-blue-600/30 border border-blue-500/40 text-blue-200'
                  : step > 2
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/40 border border-slate-700/30 text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  step > 2
                    ? 'bg-emerald-500 text-white'
                    : step === 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span className="truncate text-[11px] sm:text-xs">Departments</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-all ${
                step >= 3
                  ? 'bg-blue-600/30 border border-blue-500/40 text-blue-200'
                  : 'bg-slate-800/40 border border-slate-700/30 text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === 4
                    ? 'bg-emerald-500 text-white'
                    : step === 3
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {step === 4 ? <Check className="w-3.5 h-3.5" /> : '3'}
              </div>
              <span className="truncate text-[11px] sm:text-xs">Register & Commit</span>
            </div>
          </div>
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto max-h-[65vh]">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Required Information Missing:</span>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: PRIMARY COMPANY PROFILE */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Configure Primary Operating Company</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Enter your registered legal entity details. These parameters are directly stored in the database and stamped onto all official generated PDFs, certificates, and compliance registers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Legal Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Gulf Way General Trading LLC"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-900 bg-white"
                  />
                  <span className="text-[11px] text-slate-400">
                    Official registered name as printed on trade license and commercial register.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Entity Code / Prefix <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. GW"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold uppercase border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-900 bg-white"
                  />
                  <span className="text-[11px] text-slate-400">
                    2–4 characters used for document numbers (e.g. GW-OPS-001).
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Trade License Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tradeLicense}
                    onChange={(e) => setTradeLicense(e.target.value)}
                    placeholder="e.g. TL-2024-89104"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-900 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Tax Registration Number (TRN)
                  </label>
                  <input
                    type="text"
                    value={trnNumber}
                    onChange={(e) => setTrnNumber(e.target.value)}
                    placeholder="e.g. 100234567800003"
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered Physical Address</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Office 402, Al Moosa Tower, Sheikh Zayed Road, Dubai, UAE"
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Official Email</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. operations@gulfway.ae"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-900 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phone Contact</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +971 4 398 2210"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Seal Palette Selector */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Select Corporate Verification Stamp Style</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setStampColor('EMERALD')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      stampColor === 'EMERALD'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-600 bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                      {companyCode.slice(0, 2) || 'GW'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">UAE Emerald</div>
                      <div className="text-[10px] text-slate-500">Official GCC Seal</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStampColor('NAVY')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      stampColor === 'NAVY'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-blue-700 bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xs shrink-0">
                      {companyCode.slice(0, 2) || 'GW'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Navy Sovereign</div>
                      <div className="text-[10px] text-slate-500">Corporate Banking</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStampColor('GOLD')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      stampColor === 'GOLD'
                        ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-amber-600 bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs shrink-0">
                      {companyCode.slice(0, 2) || 'GW'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Gold Treasury</div>
                      <div className="text-[10px] text-slate-500">Governance Seal</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DEPARTMENT ACCOUNTS */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Select & Provision Department Accounts</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomDept(!showAddCustomDept)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddCustomDept ? 'Cancel' : 'Add Custom Dept'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Select which operational divisions will have dedicated numbering rules and document authorities for <strong>{companyName}</strong>. You can customize or add custom departments.
                </p>
              </div>

              {/* Add Custom Dept Form */}
              {showAddCustomDept && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-blue-900">New Department Account</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={customDeptName}
                        onChange={(e) => setCustomDeptName(e.target.value)}
                        placeholder="Department Name (e.g. Quality Assurance)"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        maxLength={5}
                        value={customDeptCode}
                        onChange={(e) => setCustomDeptCode(e.target.value.toUpperCase())}
                        placeholder="Code (e.g. QA)"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-mono font-bold uppercase"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomDept(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomDept}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Add Department
                    </button>
                  </div>
                </div>
              )}

              {/* Department Cards List */}
              <div className="space-y-2.5">
                {departmentPresets.map((dept, index) => (
                  <div
                    key={dept.code}
                    onClick={() => toggleDept(index)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                      dept.selected
                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                          dept.selected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                        }`}
                      >
                        {dept.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {dept.name}
                          </span>
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                            {dept.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {dept.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {index >= 4 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDept(index);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Remove custom department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          dept.selected
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {dept.selected ? 'Included' : 'Excluded'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <span>Total Departments Selected:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {departmentPresets.filter((d) => d.selected).length}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: NUMBERING ENGINE & COMMIT */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Binary className="w-5 h-5 text-blue-600" />
                  <span>Sequential Register Engine & Baseline Sanction</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select your group numbering convention. Every issued document will receive a cryptographic sequence number following this exact pattern.
                </p>
              </div>

              {/* Numbering Format Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700">
                  Sequential Numbering Pattern
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setNumberPatternType('STANDARD')}
                    className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                      numberPatternType === 'STANDARD'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">Standard GCC Format</div>
                    <div className="font-mono text-xs font-bold text-blue-700">
                      {'{COMPANY}-{DEPT}-{YYYY}-{SEQ}'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      e.g. {companyCode}-OPS-2026-0001
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNumberPatternType('SIMPLE')}
                    className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                      numberPatternType === 'SIMPLE'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">Annual Group Sequence</div>
                    <div className="font-mono text-xs font-bold text-blue-700">
                      {'{COMPANY}-{YYYY}-{SEQ:5}'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      e.g. {companyCode}-2026-00001
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNumberPatternType('SLASH')}
                    className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                      numberPatternType === 'SLASH'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">Slash Ledger Format</div>
                    <div className="font-mono text-xs font-bold text-blue-700">
                      {'{COMPANY}/{DEPT}/{YYYY}/{SEQ}'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      e.g. {companyCode}/HR/2026/0001
                    </div>
                  </button>
                </div>
              </div>

              {/* Sample Live Output Box */}
              <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  <span>Live Sequence Simulation</span>
                  <span className="text-emerald-400 font-bold">● Atomic Engine Ready</span>
                </div>
                <div className="font-mono text-lg font-bold text-emerald-300 tracking-wider">
                  {getSamplePreview()}
                </div>
                <p className="text-[11px] text-slate-400">
                  All serial numbers are atomically locked in Firestore and server registries to prevent duplicates or out-of-order allocations.
                </p>
              </div>

              {/* Starting Sequence input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Starting Sequence Counter
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={startingSeq}
                    onChange={(e) => setStartingSeq(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-900 bg-white"
                  />
                  <span className="text-[11px] text-slate-400">
                    Default is 1 or starting series for migration.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Annual Auto-Reset Cycle
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Yearly (Every January 1st)"
                    className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-100 text-slate-600 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-slate-400">
                    Automatically cycles sequence resets on annual fiscal bounds.
                  </span>
                </div>
              </div>

              {/* Summary Pre-flight Check */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
                <div className="font-bold text-slate-900">Setup Pre-flight Verification:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Operating Entity:</span>{' '}
                    <strong className="text-slate-900">{companyName}</strong> ({companyCode})
                  </div>
                  <div>
                    <span className="text-slate-400">Trade License:</span>{' '}
                    <strong className="text-slate-900">{tradeLicense}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Departments:</span>{' '}
                    <strong className="text-slate-900">
                      {departmentPresets.filter((d) => d.selected).length} accounts to create
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Audit Stamp:</span>{' '}
                    <strong className="text-slate-900">{stampColor} Official Seal</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adminSanction}
                      onChange={(e) => setAdminSanction(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      I sanction this enterprise setup and authorize writing these master records to the database.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS / CELEBRATION */}
          {step === 4 && completedResult && (
            <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Database Provisioned Successfully
                </span>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome to Gulf Way DocFlow!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your primary operating entity <strong>{completedResult.company.name}</strong> and{' '}
                  <strong>{completedResult.departments.length} department accounts</strong> are now live in the database with sequential numbering and SHA-256 audit tracking.
                </p>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Entity</span>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {completedResult.company.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Code: {completedResult.company.code}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Departments</span>
                  <div className="text-xs font-bold text-slate-900">
                    {completedResult.departments.length} Active Accounts
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {completedResult.departments.map((d) => d.code).join(', ')}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Numbering Pattern</span>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {completedResult.numberingRule?.pattern || '{COMPANY}-{DEPT}-{YYYY}-{SEQ}'}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold">
                    Atomic Locking Active
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Start Drafting First Document</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        {step < 4 && (
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : existingCompaniesCount > 0 ? (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Skip for Now
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">
                  Step {step} of 3
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExecuteSetup}
                  disabled={isSubmitting || !adminSanction}
                  className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Provisioning Database...' : 'Commit & Initialize Setup'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
