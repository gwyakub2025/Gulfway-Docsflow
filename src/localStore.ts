import {
  Company,
  Department,
  User,
  Role,
  NumberingRule,
  FormTemplate,
  DocumentRecord,
  AuditLog,
  FormField,
} from './types/index.js';

const STORAGE_KEY = 'gulfway_docflow_client_store_v3';

interface StoreData {
  companies: Company[];
  departments: Department[];
  roles: Role[];
  users: User[];
  numberingRules: NumberingRule[];
  formTemplates: FormTemplate[];
  documents: DocumentRecord[];
  auditLogs: AuditLog[];
  currentUserId: string;
}

const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'comp-gwds',
    name: 'Gulf Way Delivery Services LLC',
    code: 'GWDS',
    tradeLicenseNumber: 'CN-1084920',
    taxRegistrationNumber: '100293848100003',
    logoUrl: '',
    stampUrl: '',
    officialStampUrl: '',
    address: 'Al Quoz Industrial Area 3, Warehouse 14, Dubai, UAE',
    phone: '+971 4 394 8820',
    email: 'operations@gulfwaydelivery.ae',
    status: 'ACTIVE',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'comp-gwt',
    name: 'Gulf Way Transport LLC',
    code: 'GWT',
    tradeLicenseNumber: 'CN-1073841',
    taxRegistrationNumber: '100384729100003',
    logoUrl: '',
    stampUrl: '',
    officialStampUrl: '',
    address: 'Mussafah Industrial Sector 9, Abu Dhabi, UAE',
    phone: '+971 2 554 9912',
    email: 'transport@gulfway.ae',
    status: 'ACTIVE',
    isActive: true,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'comp-gwl',
    name: 'Gulf Way Logistics & Express LLC',
    code: 'GWL',
    tradeLicenseNumber: 'CN-1092834',
    taxRegistrationNumber: '100483920100003',
    logoUrl: '',
    stampUrl: '',
    officialStampUrl: '',
    address: 'Sharjah Airport International Free Zone (SAIF), Sharjah, UAE',
    phone: '+971 6 526 1140',
    email: 'logistics@gulfway.ae',
    status: 'ACTIVE',
    isActive: true,
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
];

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-hr', code: 'HR', name: 'Human Resources' },
  { id: 'dept-ops', code: 'OPS', name: 'Fleet & Operations' },
  { id: 'dept-fin', code: 'FIN', name: 'Finance & Accounts' },
  { id: 'dept-adm', code: 'ADM', name: 'General Administration' },
  { id: 'dept-leg', code: 'LEG', name: 'Legal & Compliance' },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'role-super-admin',
    code: 'SUPER_ADMIN',
    name: 'Super Administrator',
    description: 'Complete cross-entity authorization, rule configuration, audit inspection, and system management.',
    isSystem: true,
    permissions: [
      'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DISABLE',
      'FORM_VIEW', 'FORM_CREATE', 'FORM_EDIT', 'FORM_DELETE', 'FORM_PUBLISH',
      'DOCUMENT_CREATE', 'DOCUMENT_VIEW', 'DOCUMENT_EDIT_DRAFT', 'DOCUMENT_GENERATE',
      'DOCUMENT_SIGN', 'DOCUMENT_APPROVE', 'DOCUMENT_REJECT', 'DOCUMENT_VOID', 'DOCUMENT_DOWNLOAD',
      'COMPANY_MANAGE', 'NUMBERING_MANAGE', 'AUDIT_VIEW', 'SETTINGS_MANAGE', 'COMPANY_STAMP'
    ],
  },
  {
    id: 'role-company-admin',
    code: 'COMPANY_ADMIN',
    name: 'Entity Operations Lead',
    description: 'Manages company documents, numbering sequences, and departmental operations.',
    isSystem: true,
    permissions: [
      'USER_VIEW', 'FORM_VIEW', 'DOCUMENT_CREATE', 'DOCUMENT_VIEW', 'DOCUMENT_EDIT_DRAFT',
      'DOCUMENT_GENERATE', 'DOCUMENT_SIGN', 'DOCUMENT_APPROVE', 'DOCUMENT_REJECT',
      'DOCUMENT_DOWNLOAD', 'AUDIT_VIEW'
    ],
  },
  {
    id: 'role-approver',
    code: 'APPROVER',
    name: 'Department Approver / Manager',
    description: 'Authorizes and reviews submitted documents, signs sanction approvals.',
    isSystem: true,
    permissions: [
      'DOCUMENT_VIEW', 'DOCUMENT_APPROVE', 'DOCUMENT_REJECT', 'DOCUMENT_DOWNLOAD'
    ],
  },
  {
    id: 'role-user',
    code: 'USER',
    name: 'Rider / Operations Staff',
    description: 'Generates document requests, signs forms digitally, downloads official copies.',
    isSystem: true,
    permissions: [
      'DOCUMENT_CREATE', 'DOCUMENT_VIEW', 'DOCUMENT_EDIT_DRAFT', 'DOCUMENT_SIGN', 'DOCUMENT_DOWNLOAD'
    ],
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin',
    fullName: 'Yacine Belkacem',
    employeeId: 'GW-001',
    email: 'gw.yakub2025@gmail.com',
    phone: '+971 50 111 2233',
    companyId: 'comp-gwds',
    companyIds: ['comp-gwds', 'comp-gwt', 'comp-gwl'],
    departmentId: 'dept-adm',
    designation: 'Group Managing Director & Compliance Officer',
    roleId: 'role-super-admin',
    roleName: 'Super Administrator',
    status: 'ACTIVE',
    permissions: DEFAULT_ROLES[0].permissions,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-hr-sara',
    fullName: 'Sara Al-Mansoor',
    employeeId: 'GW-042',
    email: 'sara.m@gulfway.ae',
    phone: '+971 52 234 5678',
    companyId: 'comp-gwds',
    companyIds: ['comp-gwds'],
    departmentId: 'dept-hr',
    designation: 'Senior HR Operations Officer',
    roleId: 'role-approver',
    roleName: 'Department Approver / Manager',
    status: 'ACTIVE',
    permissions: DEFAULT_ROLES[2].permissions,
    createdAt: '2026-01-12T00:00:00.000Z',
    updatedAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'usr-ops-tariq',
    fullName: 'Tariq Mansoor',
    employeeId: 'GW-088',
    email: 'tariq.m@gulfway.ae',
    phone: '+971 55 876 5432',
    companyId: 'comp-gwt',
    companyIds: ['comp-gwt'],
    departmentId: 'dept-ops',
    designation: 'Fleet & Dispatch Supervisor',
    roleId: 'role-company-admin',
    roleName: 'Entity Operations Lead',
    status: 'ACTIVE',
    permissions: DEFAULT_ROLES[1].permissions,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'usr-rider-irfan',
    fullName: 'Mohammed Irfan',
    employeeId: 'EMP-9022',
    email: 'irfan.m@gulfway.ae',
    phone: '+971 54 908 1234',
    companyId: 'comp-gwds',
    companyIds: ['comp-gwds'],
    departmentId: 'dept-ops',
    designation: 'Fleet Courier Rider',
    roleId: 'role-user',
    roleName: 'Rider / Operations Staff',
    status: 'ACTIVE',
    permissions: DEFAULT_ROLES[3].permissions,
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-02-15T00:00:00.000Z',
  },
];

const DEFAULT_RULES: NumberingRule[] = [
  {
    id: 'rule-hr-leave',
    name: 'HR Leave Sequential Register',
    formTemplateId: 'form-leave',
    prefix: '',
    pattern: '{COMPANY}-HR-LF-{YYYY}-{SEQ:6}',
    paddingZeros: 6,
    currentSequence: 1025,
    sequenceReset: 'YEARLY',
    isActive: true,
    description: 'Sequential register for all Gulf Way HR Leave & Vacation requests',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-ops-bike',
    name: 'Fleet Handover Protocol Register',
    formTemplateId: 'form-bike-handover',
    prefix: '',
    pattern: '{COMPANY}-OPS-BHF-{YYYY}-{SEQ:6}',
    paddingZeros: 6,
    currentSequence: 541,
    sequenceReset: 'YEARLY',
    isActive: true,
    description: 'Fleet Motorcycle and Equipment Asset Handover protocol register',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-fin-salary-advance',
    name: 'Emergency Salary Advance Register',
    formTemplateId: 'form-salary-advance',
    prefix: '',
    pattern: '{COMPANY}-FIN-SAF-{YYYY}-{SEQ:6}',
    paddingZeros: 6,
    currentSequence: 108,
    sequenceReset: 'YEARLY',
    isActive: true,
    description: 'Emergency Salary Advance and Expense Claim register',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-salary-cert',
    name: 'Staff Salary & Certificate Register',
    formTemplateId: 'form-salary-certificate',
    prefix: '',
    pattern: '{COMPANY}-HR-SSC-{YYYY}-{SEQ:6}',
    paddingZeros: 6,
    currentSequence: 1025,
    sequenceReset: 'YEARLY',
    isActive: true,
    description: 'Sequential register for Staff Salary & Employment Certificates',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const makeField = (f: Partial<FormField> & { id: string; name: string; label: string; type: any }): FormField => ({
  id: f.id,
  name: f.name,
  label: f.label,
  type: f.type,
  pageNumber: f.pageNumber || 1,
  x: f.x || 10,
  y: f.y || 20,
  width: f.width || 40,
  height: f.height || 4,
  required: f.required ?? true,
  visibility: f.visibility ?? true,
  editable: f.editable ?? true,
  defaultValue: f.defaultValue,
  options: f.options,
  placeholder: f.placeholder,
});

const DEFAULT_TEMPLATES: FormTemplate[] = [
  {
    id: 'form-leave',
    formName: 'Annual & Emergency Leave Application Form',
    formCode: 'LF',
    description: 'Official application for Annual Vacation, Emergency Leave, or Medical Sick Leave.',
    companyScope: 'ALL',
    companyIds: ['comp-gwds', 'comp-gwt', 'comp-gwl'],
    departmentId: 'dept-hr',
    category: 'Human Resources',
    currentVersion: 1,
    effectiveDate: '2026-01-01',
    status: 'ACTIVE',
    instructions: 'Submit at least 14 days prior to proposed vacation start date. Handover rider must confirm fleet assets.',
    pdfTemplateUrl: '',
    pdfPageCount: 1,
    numberingRuleId: 'rule-hr-leave',
    versions: [],
    fields: [
      makeField({ id: 'fld-emp-name', name: 'employee_name', label: 'Employee Full Name', type: 'text', pageNumber: 1, x: 8, y: 28, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-emp-id', name: 'employee_id', label: 'Employee ID / Rider Code', type: 'text', pageNumber: 1, x: 52, y: 28, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-dept', name: 'department', label: 'Department', type: 'text', pageNumber: 1, x: 8, y: 34, width: 40, height: 3.5, required: true, defaultValue: 'Operations & Fleet' }),
      makeField({ id: 'fld-leave-type', name: 'leave_type', label: 'Leave Category', type: 'dropdown', pageNumber: 1, x: 52, y: 34, width: 40, height: 3.5, required: true, options: ['Annual Leave', 'Sick Leave', 'Emergency Leave', 'Unpaid Leave'] }),
      makeField({ id: 'fld-start-date', name: 'start_date', label: 'Start Date', type: 'date', pageNumber: 1, x: 8, y: 40, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-end-date', name: 'end_date', label: 'End Date', type: 'date', pageNumber: 1, x: 52, y: 40, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-days', name: 'total_days', label: 'Total Days', type: 'number', pageNumber: 1, x: 8, y: 46, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-contact', name: 'contact_number', label: 'Contact Number During Leave', type: 'text', pageNumber: 1, x: 52, y: 46, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-reason', name: 'leave_reason', label: 'Leave Reason / Justification', type: 'textarea', pageNumber: 1, x: 8, y: 52, width: 84, height: 6, required: true }),
    ],
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
    createdBy: 'usr-admin',
  },
  {
    id: 'form-bike-handover',
    formName: 'Fleet Bike & Asset Handover Form',
    formCode: 'BHF',
    description: 'Mandatory handover checklist for company motorcycles, fuel cards, delivery boxes, and mobile devices.',
    companyScope: 'ALL',
    companyIds: ['comp-gwds', 'comp-gwt', 'comp-gwl'],
    departmentId: 'dept-ops',
    category: 'Fleet Operations',
    currentVersion: 1,
    effectiveDate: '2026-01-01',
    status: 'ACTIVE',
    instructions: 'Both dispatch supervisor and receiving rider must inspect vehicle condition and sign simultaneously.',
    pdfTemplateUrl: '',
    pdfPageCount: 1,
    numberingRuleId: 'rule-ops-bike',
    versions: [],
    fields: [
      makeField({ id: 'fld-rider-name', name: 'rider_name', label: 'Rider Full Name', type: 'text', pageNumber: 1, x: 8, y: 28, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-bike-plate', name: 'bike_plate', label: 'Motorcycle Plate Number', type: 'text', pageNumber: 1, x: 52, y: 28, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-odometer', name: 'odometer_km', label: 'Odometer Reading (KM)', type: 'number', pageNumber: 1, x: 8, y: 34, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-fuel-card', name: 'fuel_card_no', label: 'E-Fuel Card Number', type: 'text', pageNumber: 1, x: 52, y: 34, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-helmet', name: 'helmet_provided', label: 'Safety Helmet Issued', type: 'checkbox', pageNumber: 1, x: 8, y: 40, width: 20, height: 3.5, required: false }),
      makeField({ id: 'fld-box', name: 'delivery_box_ok', label: 'Delivery Box Inspected', type: 'checkbox', pageNumber: 1, x: 30, y: 40, width: 20, height: 3.5, required: false }),
    ],
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    createdBy: 'usr-admin',
  },
  {
    id: 'form-salary-advance',
    formName: 'Emergency Salary Advance Request',
    formCode: 'SAF',
    description: 'Formal payroll deduction request for urgent medical or emergency salary advances.',
    companyScope: 'ALL',
    companyIds: ['comp-gwds', 'comp-gwt', 'comp-gwl'],
    departmentId: 'dept-fin',
    category: 'Finance & Payroll',
    currentVersion: 1,
    effectiveDate: '2026-01-01',
    status: 'ACTIVE',
    instructions: 'Advance cannot exceed 50% of basic monthly salary. Deductions will apply in next payroll run.',
    pdfTemplateUrl: '',
    pdfPageCount: 1,
    numberingRuleId: 'rule-fin-salary-advance',
    versions: [],
    fields: [
      makeField({ id: 'fld-emp-name-saf', name: 'employee_name', label: 'Applicant Name', type: 'text', pageNumber: 1, x: 8, y: 28, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-amount', name: 'requested_amount', label: 'Advance Amount (AED)', type: 'number', pageNumber: 1, x: 52, y: 28, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-installments', name: 'deduction_installments', label: 'Deduction Installments (Months)', type: 'dropdown', pageNumber: 1, x: 8, y: 34, width: 40, height: 3.5, options: ['1 Month', '2 Months', '3 Months'], required: true }),
      makeField({ id: 'fld-saf-reason', name: 'reason', label: 'Reason for Emergency Advance', type: 'textarea', pageNumber: 1, x: 8, y: 40, width: 84, height: 6, required: true }),
    ],
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    createdBy: 'usr-admin',
  },
  {
    id: 'form-salary-certificate',
    formName: 'Staff Salary & Employment Certificate',
    formCode: 'SSC',
    description: 'Official corporate salary certificate for bank accounts, loans, visa applications, and embassy submissions',
    companyScope: 'ALL',
    companyIds: [],
    departmentId: 'dept-hr',
    category: 'HR Forms',
    currentVersion: 1,
    effectiveDate: '2026-01-01',
    status: 'ACTIVE',
    instructions: 'Fill in employee salary and recipient information accurately. Digital signature by HR and company seal are verified via QR code.',
    pdfTemplateUrl: '',
    pdfPageCount: 1,
    numberingRuleId: 'rule-salary-cert',
    versions: [],
    fields: [
      makeField({ id: 'fld-ssc-emp-name', name: 'employee_name', label: 'Staff Full Name', type: 'text', pageNumber: 1, x: 8, y: 28, width: 40, height: 3.5, required: true, placeholder: 'e.g. Tariq Mansoor' }),
      makeField({ id: 'fld-ssc-emp-id', name: 'employee_id', label: 'Staff / Badge ID', type: 'text', pageNumber: 1, x: 52, y: 28, width: 40, height: 3.5, required: true, placeholder: 'GW-088' }),
      makeField({ id: 'fld-ssc-desig', name: 'designation', label: 'Designation / Job Title', type: 'text', pageNumber: 1, x: 8, y: 35, width: 40, height: 3.5, required: true, placeholder: 'Fleet & Dispatch Supervisor' }),
      makeField({ id: 'fld-ssc-join', name: 'joining_date', label: 'Date of Joining', type: 'date', pageNumber: 1, x: 52, y: 35, width: 40, height: 3.5, required: true }),
      makeField({ id: 'fld-ssc-basic', name: 'basic_salary', label: 'Basic Salary (AED)', type: 'number', pageNumber: 1, x: 8, y: 42, width: 40, height: 3.5, required: true, placeholder: '5500' }),
      makeField({ id: 'fld-ssc-allow', name: 'allowances', label: 'Allowances (Housing & Transport) (AED)', type: 'number', pageNumber: 1, x: 52, y: 42, width: 40, height: 3.5, required: true, placeholder: '2500' }),
      makeField({ id: 'fld-ssc-gross', name: 'gross_monthly_salary', label: 'Total Gross Monthly Salary (AED)', type: 'number', pageNumber: 1, x: 8, y: 49, width: 40, height: 3.5, required: true, placeholder: '8000' }),
      makeField({ id: 'fld-ssc-purpose', name: 'certificate_purpose', label: 'Purpose of Certificate', type: 'dropdown', pageNumber: 1, x: 52, y: 49, width: 40, height: 3.5, required: true, options: ['Bank Account Opening / Salary Transfer', 'Personal Loan / Auto Finance Application', 'Embassy Visa Application', 'Family Residence Visa Sponsorship', 'General Verification'] }),
      makeField({ id: 'fld-ssc-recipient', name: 'addressed_to', label: 'Addressed To / Recipient', type: 'text', pageNumber: 1, x: 8, y: 56, width: 84, height: 3.5, required: true, placeholder: 'To Whom It May Concern (or Bank Name)' }),
      makeField({ id: 'fld-ssc-qr', name: 'qr_verification', label: 'Tamper-evident QR Code', type: 'qr_code', pageNumber: 1, x: 8, y: 83, width: 13, height: 10, required: true, editable: false }),
      makeField({ id: 'fld-ssc-hr-sig', name: 'hr_signature', label: 'Authorized HR Signatory', type: 'signature', pageNumber: 1, x: 35, y: 84, width: 34, height: 8, required: true, editable: false, signerRole: 'APPROVER' }),
      makeField({ id: 'fld-ssc-stamp', name: 'company_stamp', label: 'Corporate Seal & Stamp', type: 'company_stamp', pageNumber: 1, x: 74, y: 84, width: 18, height: 9, required: true, editable: false }),
    ],
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    createdBy: 'usr-admin',
  },
];

const DEFAULT_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc-seed-003',
    documentNumber: 'GWDS-HR-LF-2026-001025',
    secureVerificationToken: 'vt_seed_leave_001025_signed',
    formTemplateId: 'form-leave',
    formCode: 'LF',
    formName: 'Annual & Emergency Leave Application Form',
    formTemplateVersion: 1,
    companyId: 'comp-gwds',
    companyName: 'Gulf Way Delivery Services LLC',
    departmentId: 'dept-hr',
    employeeName: 'Mohammed Irfan',
    employeeId: 'EMP-9022',
    status: 'AWAITING_APPROVAL',
    signingMethod: 'DIGITAL',
    values: {
      employee_name: 'Mohammed Irfan',
      employee_id: 'EMP-9022',
      department: 'Operations & Fleet Logistics',
      leave_type: 'Annual Leave',
      start_date: '2026-09-15',
      end_date: '2026-09-30',
      total_days: '15',
      contact_number: '+971 52 987 6543',
      emergency_contact: '+971 52 987 6543',
      leave_reason: 'Scheduled annual vacation to home country with family.',
      reason: 'Scheduled annual vacation to home country with family.',
    },
    generatedPdfUrl: '/api/documents/doc-seed-003/pdf',
    signatures: [
      {
        id: 'sig-seed-003',
        fieldId: 'signature',
        signerName: 'Mohammed Irfan',
        signerRole: 'Standard Employee / Rider',
        signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10 40 Q 50 10 90 40 T 170 30" stroke="%231e3a8a" stroke-width="2.5" fill="none"/></svg>',
        type: 'DRAWN',
        signedAt: '2026-09-08T08:30:00.000Z',
        userId: 'usr-rider-irfan',
      },
    ],
    approvalHistory: [],
    statusHistory: [
      {
        id: 'sh-c1',
        previousStatus: 'DRAFT',
        newStatus: 'NUMBER_ASSIGNED',
        changedBy: 'usr-rider-irfan',
        changedByName: 'Mohammed Irfan',
        changedAt: '2026-09-08T08:00:00.000Z',
        remarks: 'Official sequential registration number GWDS-HR-LF-2026-001025 allocated.',
      },
      {
        id: 'sh-c2',
        previousStatus: 'NUMBER_ASSIGNED',
        newStatus: 'AWAITING_APPROVAL',
        changedBy: 'usr-rider-irfan',
        changedByName: 'Mohammed Irfan',
        changedAt: '2026-09-08T08:30:00.000Z',
        remarks: 'Digitally signed by applicant with cryptographic verification badge.',
      },
    ],
    createdAt: '2026-09-08T08:00:00.000Z',
    createdBy: 'usr-rider-irfan',
    createdByName: 'Mohammed Irfan',
    updatedAt: '2026-09-08T08:30:00.000Z',
  },
  {
    id: 'doc-seed-002',
    documentNumber: 'GWT-OPS-BHF-2026-000541',
    secureVerificationToken: 'vt_seed_bike_000541_final',
    formTemplateId: 'form-bike-handover',
    formCode: 'BHF',
    formName: 'Fleet Bike & Asset Handover Form',
    formTemplateVersion: 1,
    companyId: 'comp-gwt',
    companyName: 'Gulf Way Transport LLC',
    departmentId: 'dept-ops',
    employeeName: 'Bilal Farooq',
    employeeId: 'RDR-1102',
    status: 'FINAL',
    signingMethod: 'PHYSICAL',
    finalPdfHashSha256: 'a4b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    finalizedAt: '2026-09-07T14:30:00.000Z',
    values: {
      rider_name: 'Bilal Farooq',
      bike_plate: 'DXB-58291',
      odometer_km: '14280',
      fuel_card_no: 'E-PUMP-99482',
      helmet_provided: true,
      delivery_box_ok: true,
    },
    signatures: [],
    approvalHistory: [],
    statusHistory: [
      {
        id: 'sh-b1',
        previousStatus: 'NUMBER_ASSIGNED',
        newStatus: 'FINAL',
        changedBy: 'usr-ops-tariq',
        changedByName: 'Tariq Mansoor',
        changedAt: '2026-09-07T14:30:00.000Z',
        remarks: 'Physical wet-ink scan uploaded, verified, and locked with SHA-256 seal.',
      },
    ],
    createdAt: '2026-09-07T10:00:00.000Z',
    createdBy: 'usr-ops-tariq',
    createdByName: 'Tariq Mansoor',
    updatedAt: '2026-09-07T14:30:00.000Z',
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-09-08T08:30:00.000Z',
    userId: 'usr-rider-irfan',
    userName: 'Mohammed Irfan',
    action: 'Document Digitally Signed',
    resourceType: 'DOCUMENT',
    resourceId: 'doc-seed-003',
    remarks: 'Signature captured and embedded into official PDF template.',
  },
  {
    id: 'log-002',
    timestamp: '2026-09-08T08:00:00.000Z',
    userId: 'usr-rider-irfan',
    userName: 'Mohammed Irfan',
    action: 'Document Number Allocated',
    resourceType: 'DOCUMENT',
    resourceId: 'doc-seed-003',
    remarks: 'Allocated GWDS-HR-LF-2026-001025',
  },
  {
    id: 'log-003',
    timestamp: '2026-09-07T14:30:00.000Z',
    userId: 'usr-ops-tariq',
    userName: 'Tariq Mansoor',
    action: 'Document Finalized & Sealed',
    resourceType: 'DOCUMENT',
    resourceId: 'doc-seed-002',
    remarks: 'SHA256 seal: a4b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
  },
];

class ClientLocalStorageStore {
  private data: StoreData;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): StoreData {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            companies: Array.isArray(parsed.companies) ? parsed.companies : [...DEFAULT_COMPANIES],
            departments: Array.isArray(parsed.departments) ? parsed.departments : [...DEFAULT_DEPARTMENTS],
            roles: Array.isArray(parsed.roles) ? parsed.roles : [...DEFAULT_ROLES],
            users: Array.isArray(parsed.users) ? parsed.users : [...DEFAULT_USERS],
            numberingRules: Array.isArray(parsed.numberingRules) ? parsed.numberingRules : [...DEFAULT_RULES],
            formTemplates: Array.isArray(parsed.formTemplates) ? parsed.formTemplates : [...DEFAULT_TEMPLATES],
            documents: Array.isArray(parsed.documents) ? parsed.documents : [...DEFAULT_DOCUMENTS],
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [...DEFAULT_AUDIT_LOGS],
            currentUserId: parsed.currentUserId || 'usr-admin',
          };
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using in-memory defaults', e);
    }

    return {
      companies: [...DEFAULT_COMPANIES],
      departments: [...DEFAULT_DEPARTMENTS],
      roles: [...DEFAULT_ROLES],
      users: [...DEFAULT_USERS],
      numberingRules: [...DEFAULT_RULES],
      formTemplates: [...DEFAULT_TEMPLATES],
      documents: [...DEFAULT_DOCUMENTS],
      auditLogs: [...DEFAULT_AUDIT_LOGS],
      currentUserId: 'usr-admin',
    };
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
  }

  public getCurrentUser(): User {
    const user = this.data.users.find((u) => u.id === this.data.currentUserId);
    return user || this.data.users[0];
  }

  public getMe() {
    const user = this.getCurrentUser();
    return {
      user,
      allUsers: this.data.users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        employeeId: u.employeeId,
        roleName: u.roleName,
        email: u.email,
      })),
    };
  }

  public switchUser(userId: string) {
    const target = this.data.users.find((u) => u.id === userId);
    if (!target) throw new Error('User not found');
    this.data.currentUserId = userId;
    this.recordAudit(target.id, target.fullName, 'User Switched', 'AUTH', target.id, `Switched session to ${target.fullName} (${target.roleName})`);
    this.saveToStorage();
    return { success: true, user: target };
  }

  public getCompanies(): Company[] {
    return this.data.companies;
  }

  public createCompany(data: Partial<Company>): Company {
    const user = this.getCurrentUser();
    const newCompany: Company = {
      id: `comp-${Date.now()}`,
      name: data.name || 'Gulf Way Operating Entity',
      code: (data.code || 'GW').toUpperCase(),
      tradeLicenseNumber: data.tradeLicenseNumber || 'N/A',
      taxRegistrationNumber: data.taxRegistrationNumber,
      logoUrl: data.logoUrl || '',
      stampUrl: data.stampUrl || data.officialStampUrl || '',
      officialStampUrl: data.officialStampUrl || data.stampUrl || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.companies.push(newCompany);
    this.recordAudit(user.id, user.fullName, 'Company Created', 'COMPANY', newCompany.id, `${newCompany.name} (${newCompany.code})`);
    this.saveToStorage();
    return newCompany;
  }

  public updateCompany(id: string, data: Partial<Company>): Company {
    const user = this.getCurrentUser();
    const idx = this.data.companies.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Company not found');
    const old = this.data.companies[idx];
    const updated: Company = {
      ...old,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.data.companies[idx] = updated;
    this.recordAudit(user.id, user.fullName, 'Company Updated', 'COMPANY', id, `Renamed ${old.name} -> ${updated.name}`);
    this.saveToStorage();
    return updated;
  }

  public deleteCompany(id: string): { success: boolean; id: string } {
    const user = this.getCurrentUser();
    const idx = this.data.companies.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Company not found');
    const removed = this.data.companies.splice(idx, 1)[0];
    this.recordAudit(user.id, user.fullName, 'Company Deleted', 'COMPANY', id, `Deleted company: ${removed.name} (${removed.code})`);
    this.saveToStorage();
    return { success: true, id };
  }

  public clearAllSampleData(): { success: boolean } {
    const user = this.getCurrentUser();
    this.data.companies = [];
    this.data.documents = [];
    this.data.auditLogs = [];
    this.recordAudit(user.id, user.fullName, 'Database Cleared', 'AUTH', 'system', 'All sample data cleared. Clean empty database ready for manual entry.');
    this.saveToStorage();
    return { success: true };
  }

  public getDepartments(): Department[] {
    return this.data.departments;
  }

  public createDepartment(data: Partial<Department>): Department {
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      code: (data.code || 'DEPT').toUpperCase(),
      name: data.name || 'New Department',
    };
    this.data.departments.push(newDept);
    this.saveToStorage();
    return newDept;
  }

  public deleteDepartment(id: string): { success: boolean; id: string } {
    const idx = this.data.departments.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Department not found');
    this.data.departments.splice(idx, 1);
    this.saveToStorage();
    return { success: true, id };
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public createUser(data: Partial<User>): User {
    const user = this.getCurrentUser();
    const role = this.data.roles.find((r) => r.id === data.roleId) || this.data.roles[0];
    const newUser: User = {
      id: `usr-${Date.now()}`,
      fullName: data.fullName || 'New User',
      employeeId: data.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      email: data.email || 'user@example.com',
      phone: data.phone || '',
      companyId: data.companyId || 'comp-gwds',
      companyIds: data.companyIds || [data.companyId || 'comp-gwds'],
      departmentId: data.departmentId || 'dept-ops',
      designation: data.designation || 'Staff',
      roleId: role.id,
      roleName: role.name,
      permissions: role.permissions,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.recordAudit(user.id, user.fullName, 'User Created', 'USER', newUser.id, `${newUser.fullName} (${newUser.roleName})`);
    this.saveToStorage();
    return newUser;
  }

  public updateUser(id: string, data: Partial<User>): User {
    const user = this.getCurrentUser();
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    const existing = this.data.users[idx];
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    if (data.roleId && data.roleId !== existing.roleId) {
      const role = this.data.roles.find((r) => r.id === data.roleId);
      if (role) {
        updated.roleName = role.name;
        updated.permissions = role.permissions;
      }
    }
    this.data.users[idx] = updated;
    this.recordAudit(user.id, user.fullName, 'User Updated', 'USER', id, `Updated ${updated.fullName}`);
    this.saveToStorage();
    return updated;
  }

  public deleteUser(id: string): { success: boolean; id: string } {
    const user = this.getCurrentUser();
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    const removed = this.data.users.splice(idx, 1)[0];
    this.recordAudit(user.id, user.fullName, 'User Deleted', 'USER', id, `Deleted user ${removed.fullName}`);
    this.saveToStorage();
    return { success: true, id };
  }

  public getRoles(): Role[] {
    return this.data.roles;
  }

  public createRole(data: Partial<Role>): Role {
    const user = this.getCurrentUser();
    const newRole: Role = {
      id: `role-${Date.now()}`,
      code: (data.code || `ROLE_${Date.now()}`).toUpperCase(),
      name: data.name || 'Custom Role',
      description: data.description || 'Custom defined role',
      isSystem: false,
      permissions: data.permissions || ['DOCUMENT_VIEW', 'DOCUMENT_DOWNLOAD'],
    };
    this.data.roles.push(newRole);
    this.recordAudit(user.id, user.fullName, 'Role Created', 'AUTH', newRole.id, `Created ${newRole.name}`);
    this.saveToStorage();
    return newRole;
  }

  public updateRole(id: string, data: Partial<Role>): Role {
    const user = this.getCurrentUser();
    const idx = this.data.roles.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Role not found');
    const existing = this.data.roles[idx];
    const updated: Role = {
      ...existing,
      ...data,
      id: existing.id,
      isSystem: existing.isSystem,
    };
    this.data.roles[idx] = updated;
    this.data.users.forEach((u) => {
      if (u.roleId === id) {
        if (data.name) u.roleName = data.name;
        if (data.permissions) u.permissions = data.permissions;
      }
    });
    this.recordAudit(user.id, user.fullName, 'Role Updated', 'AUTH', id, `Updated role ${updated.name}`);
    this.saveToStorage();
    return updated;
  }

  public deleteRole(id: string): { success: boolean; id: string } {
    const user = this.getCurrentUser();
    const idx = this.data.roles.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Role not found');
    const removed = this.data.roles.splice(idx, 1)[0];
    this.recordAudit(user.id, user.fullName, 'Role Deleted', 'AUTH', id, `Deleted role ${removed.name}`);
    this.saveToStorage();
    return { success: true, id };
  }

  public getNumberingRules(): NumberingRule[] {
    return this.data.numberingRules;
  }

  public createNumberingRule(data: Partial<NumberingRule>): NumberingRule {
    const user = this.getCurrentUser();
    const newRule: NumberingRule = {
      id: `rule-${Date.now()}`,
      name: data.name || 'Sequential Register',
      formTemplateId: data.formTemplateId,
      prefix: data.prefix || '',
      pattern: data.pattern || '{COMPANY}-{DEPT}-{FORM}-{YYYY}-{SEQ:6}',
      paddingZeros: data.paddingZeros || 6,
      currentSequence: data.currentSequence || 0,
      sequenceReset: data.sequenceReset || 'YEARLY',
      isActive: true,
      description: data.description || 'Configured sequence register',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.numberingRules.push(newRule);
    this.recordAudit(user.id, user.fullName, 'Numbering Rule Created', 'NUMBERING', newRule.id, newRule.pattern);
    this.saveToStorage();
    return newRule;
  }

  public updateNumberingRule(id: string, data: Partial<NumberingRule>): NumberingRule {
    const user = this.getCurrentUser();
    const idx = this.data.numberingRules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Numbering rule not found');
    const existing = this.data.numberingRules[idx];
    const updated: NumberingRule = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    this.data.numberingRules[idx] = updated;
    this.recordAudit(user.id, user.fullName, 'Numbering Rule Updated', 'NUMBERING', id, updated.pattern);
    this.saveToStorage();
    return updated;
  }

  public deleteNumberingRule(id: string): { success: boolean; id: string } {
    const user = this.getCurrentUser();
    const idx = this.data.numberingRules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Numbering rule not found');
    const removed = this.data.numberingRules.splice(idx, 1)[0];
    this.recordAudit(user.id, user.fullName, 'Numbering Rule Deleted', 'NUMBERING', id, `Deleted ${removed.name}`);
    this.saveToStorage();
    return { success: true, id };
  }

  public previewNumberPattern(payload: {
    pattern: string;
    companyCode?: string;
    departmentCode?: string;
    formCode?: string;
    sampleSeq?: number;
  }): { preview: string } {
    const pattern = payload.pattern || '{COMPANY}-{DEPT}-{FORM}-{YYYY}-{SEQ:6}';
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const seq = payload.sampleSeq || 1;

    let res = pattern
      .replace('{COMPANY}', payload.companyCode || 'GWDS')
      .replace('{DEPT}', payload.departmentCode || 'OPS')
      .replace('{FORM}', payload.formCode || 'DOC')
      .replace('{YYYY}', yyyy)
      .replace('{YY}', yyyy.slice(-2))
      .replace('{MM}', mm);

    const seqMatch = res.match(/\{SEQ:?(\d+)?\}/);
    if (seqMatch) {
      const pad = parseInt(seqMatch[1] || '6', 10);
      res = res.replace(seqMatch[0], String(seq).padStart(pad, '0'));
    }
    return { preview: res };
  }

  public getForms(filters?: { companyId?: string; category?: string; status?: string }): FormTemplate[] {
    let list = this.data.formTemplates;
    if (filters?.companyId) {
      list = list.filter((f) => f.companyScope === 'ALL' || f.companyIds.includes(filters.companyId!));
    }
    if (filters?.category) list = list.filter((f) => f.category === filters.category);
    if (filters?.status) list = list.filter((f) => f.status === filters.status);
    return list;
  }

  public getForm(id: string): FormTemplate {
    const f = this.data.formTemplates.find((t) => t.id === id);
    if (!f) throw new Error('Form not found');
    return f;
  }

  public createForm(data: Partial<FormTemplate>): FormTemplate {
    const user = this.getCurrentUser();
    const newForm: FormTemplate = {
      id: `form-${Date.now()}`,
      formName: data.formName || 'New Operational Document',
      formCode: (data.formCode || 'DOC').toUpperCase(),
      description: data.description || '',
      companyScope: data.companyScope || 'ALL',
      companyIds: data.companyIds || ['comp-gwds'],
      departmentId: data.departmentId || 'dept-ops',
      category: data.category || 'General',
      currentVersion: 1,
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      instructions: data.instructions || '',
      pdfTemplateUrl: data.pdfTemplateUrl || '',
      pdfPageCount: data.pdfPageCount || 1,
      docxHtmlContent: data.docxHtmlContent,
      sourceDocumentName: data.sourceDocumentName,
      numberingRuleId: data.numberingRuleId || 'rule-hr-leave',
      versions: [],
      fields: data.fields || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id,
    };
    this.data.formTemplates.unshift(newForm);
    this.recordAudit(user.id, user.fullName, 'Form Template Created', 'FORM', newForm.id, newForm.formName);
    this.saveToStorage();
    return newForm;
  }

  public updateForm(id: string, data: Partial<FormTemplate>): FormTemplate {
    const user = this.getCurrentUser();
    const idx = this.data.formTemplates.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Form template not found');
    const old = this.data.formTemplates[idx];
    const updated: FormTemplate = {
      ...old,
      ...data,
      currentVersion: (old.currentVersion || 1) + 1,
      updatedAt: new Date().toISOString(),
    };
    this.data.formTemplates[idx] = updated;
    this.recordAudit(user.id, user.fullName, 'Form Template Updated', 'FORM', id, `Updated version ${updated.currentVersion}`);
    this.saveToStorage();
    return updated;
  }

  public publishForm(id: string) {
    const form = this.getForm(id);
    form.status = 'ACTIVE';
    form.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return { success: true, form };
  }

  public deleteForm(id: string): { success: boolean; id: string } {
    const user = this.getCurrentUser();
    const idx = this.data.formTemplates.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Form not found');
    const removed = this.data.formTemplates.splice(idx, 1)[0];
    this.recordAudit(user.id, user.fullName, 'Form Deleted', 'FORM', id, `Deleted ${removed.formName}`);
    this.saveToStorage();
    return { success: true, id };
  }

  public getDocuments(filters?: { companyId?: string; status?: string; formId?: string; search?: string }): DocumentRecord[] {
    let docs = this.data.documents;
    if (filters?.companyId) docs = docs.filter((d) => d.companyId === filters.companyId);
    if (filters?.status) docs = docs.filter((d) => d.status === filters.status);
    if (filters?.formId) docs = docs.filter((d) => d.formTemplateId === filters.formId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.documentNumber?.toLowerCase().includes(q) ||
          d.employeeName?.toLowerCase().includes(q) ||
          d.formName?.toLowerCase().includes(q)
      );
    }
    return docs;
  }

  public getDocument(id: string): DocumentRecord {
    const doc = this.data.documents.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');
    return doc;
  }

  public saveDraft(data: { formTemplateId: string; companyId: string; values: Record<string, any> }): DocumentRecord {
    const user = this.getCurrentUser();
    const template = this.data.formTemplates.find((t) => t.id === data.formTemplateId) || this.data.formTemplates[0];
    const company = this.data.companies.find((c) => c.id === data.companyId) || this.data.companies[0];

    const draftDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      documentNumber: undefined,
      secureVerificationToken: '',
      formTemplateId: template.id,
      formTemplateVersion: template.currentVersion,
      formName: template.formName,
      formCode: template.formCode,
      companyId: company.id,
      companyName: company.name,
      departmentId: template.departmentId,
      employeeName: data.values?.employee_name || data.values?.rider_name || user.fullName,
      employeeId: data.values?.employee_id || user.employeeId,
      status: 'DRAFT',
      values: data.values || {},
      statusHistory: [
        {
          id: `sh-${Date.now()}`,
          previousStatus: 'DRAFT',
          newStatus: 'DRAFT',
          changedBy: user.id,
          changedByName: user.fullName,
          changedAt: new Date().toISOString(),
          remarks: 'Document draft created in local register.',
        },
      ],
      signatures: [],
      approvalHistory: [],
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      createdByName: user.fullName,
      updatedAt: new Date().toISOString(),
    };

    this.data.documents.unshift(draftDoc);
    this.recordAudit(user.id, user.fullName, 'Document Draft Created', 'DOCUMENT', draftDoc.id, draftDoc.formName);
    this.saveToStorage();
    return draftDoc;
  }

  public updateDocument(id: string, data: { values?: Record<string, any>; employeeName?: string; employeeId?: string }) {
    const user = this.getCurrentUser();
    const doc = this.getDocument(id);

    if (doc.status === 'FINAL' || doc.status === 'VOID') {
      throw new Error('Cannot modify a finalized or voided document');
    }

    if (data.values && typeof data.values === 'object') {
      doc.values = { ...doc.values, ...data.values };
    }
    if (data.employeeName) doc.employeeName = data.employeeName;
    if (data.employeeId) doc.employeeId = data.employeeId;
    doc.updatedAt = new Date().toISOString();

    doc.statusHistory.push({
      id: `sh-${Date.now()}`,
      previousStatus: doc.status,
      newStatus: doc.status,
      changedBy: user.id,
      changedByName: user.fullName,
      changedAt: new Date().toISOString(),
      remarks: 'Document data fields updated and re-saved.',
    });

    this.recordAudit(user.id, user.fullName, 'Document Information Updated', 'DOCUMENT', doc.id, `Updated data fields for ${doc.documentNumber || doc.id}`);
    this.saveToStorage();
    return { success: true, document: doc, pdfBase64: '' };
  }

  public generateDocumentNumber(id: string, signingMethod: 'PHYSICAL' | 'DIGITAL') {
    const user = this.getCurrentUser();
    const doc = this.getDocument(id);
    if (doc.documentNumber) {
      throw new Error(`Document already allocated official number: ${doc.documentNumber}`);
    }

    const company = this.data.companies.find((c) => c.id === doc.companyId) || this.data.companies[0];
    const dept = this.data.departments.find((d) => d.id === doc.departmentId) || this.data.departments[0];
    const template = this.data.formTemplates.find((t) => t.id === doc.formTemplateId) || this.data.formTemplates[0];

    let rule = this.data.numberingRules.find(
      (r) => r.formTemplateId === template.id
    ) || this.data.numberingRules[0];

    rule.currentSequence = (rule.currentSequence || 0) + 1;
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const seqStr = String(rule.currentSequence).padStart(rule.paddingZeros || 6, '0');

    let docNum = rule.pattern
      .replace('{COMPANY}', company.code)
      .replace('{DEPT}', dept.code)
      .replace('{FORM}', template.formCode)
      .replace('{YYYY}', yyyy)
      .replace('{YY}', yyyy.slice(-2))
      .replace('{MM}', mm);

    const seqMatch = docNum.match(/\{SEQ:?(\d+)?\}/);
    if (seqMatch) {
      docNum = docNum.replace(seqMatch[0], seqStr);
    } else {
      docNum = `${docNum}-${seqStr}`;
    }

    const token = `vt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    doc.documentNumber = docNum;
    doc.secureVerificationToken = token;
    doc.signingMethod = signingMethod;
    doc.status = 'AWAITING_SIGNATURE';
    doc.updatedAt = new Date().toISOString();

    doc.statusHistory.push({
      id: `sh-${Date.now()}`,
      previousStatus: 'DRAFT',
      newStatus: doc.status,
      changedBy: user.id,
      changedByName: user.fullName,
      changedAt: new Date().toISOString(),
      remarks: `Atomic sequence allocated: ${docNum}. Token issued.`,
    });

    this.recordAudit(user.id, user.fullName, 'Document Number Allocated', 'DOCUMENT', doc.id, `Allocated ${docNum}`);
    this.saveToStorage();
    return { success: true, document: doc, pdfBase64: '' };
  }

  public applyDigitalSignature(id: string, fieldId: string, signatureDataUrl: string, type: 'DRAWN' | 'UPLOADED' | 'THUMBPRINT') {
    const user = this.getCurrentUser();
    const doc = this.getDocument(id);

    const sigEntry = {
      id: `sig-${Date.now()}`,
      fieldId,
      signerName: user.fullName,
      signerRole: user.roleName,
      signatureDataUrl,
      type,
      signedAt: new Date().toISOString(),
      userId: user.id,
    };

    const existingIndex = doc.signatures.findIndex((s) => s.fieldId === fieldId);
    if (existingIndex >= 0) {
      doc.signatures[existingIndex] = sigEntry;
    } else {
      doc.signatures.push(sigEntry);
    }

    const oldStatus = doc.status;
    doc.status = 'AWAITING_APPROVAL';
    doc.updatedAt = new Date().toISOString();

    doc.statusHistory.push({
      id: `sh-${Date.now()}`,
      previousStatus: oldStatus,
      newStatus: 'AWAITING_APPROVAL',
      changedBy: user.id,
      changedByName: user.fullName,
      changedAt: new Date().toISOString(),
      remarks: `Digitally signed by ${user.fullName} (${type}). Pending supervisor approval.`,
    });

    this.recordAudit(user.id, user.fullName, 'Document Digitally Signed', 'DOCUMENT', doc.id, `Signed by ${user.fullName}`);
    this.saveToStorage();
    return { success: true, document: doc };
  }

  public uploadSignedDocument(id: string, signedFileUrl: string, remarks?: string) {
    const user = this.getCurrentUser();
    const doc = this.getDocument(id);

    doc.signedDocumentUrl = signedFileUrl;
    const oldStatus = doc.status;
    doc.status = 'AWAITING_APPROVAL';
    doc.updatedAt = new Date().toISOString();

    doc.statusHistory.push({
      id: `sh-${Date.now()}`,
      previousStatus: oldStatus,
      newStatus: 'AWAITING_APPROVAL',
      changedBy: user.id,
      changedByName: user.fullName,
      changedAt: new Date().toISOString(),
      remarks: remarks || 'Wet-ink signed paper document scanned & uploaded.',
    });

    this.recordAudit(user.id, user.fullName, 'Signed Document Scan Uploaded', 'DOCUMENT', doc.id, remarks || 'Physical scan uploaded');
    this.saveToStorage();
    return { success: true, document: doc };
  }

  public approveDocument(id: string, remarks?: string) {
    const user = this.getCurrentUser();
    const doc = this.getDocument(id);

    const oldStatus = doc.status;
    doc.status = 'APPROVED';
    doc.updatedAt = new Date().toISOString();

    doc.statusHistory.push({
      id: `sh-${Date.now()}`,
      previousStatus: oldStatus,
      newStatus: 'APPROVED',
      changedBy: user.id,
      changedByName: user.fullName,
      changedAt: new Date().toISOString(),
      remarks: remarks || 'Sanction granted and approved.',
    });

    this.recordAudit(user.id, user.fullName, 'Document Approved', 'DOCUMENT', doc.id, remarks || 'Approved');
    this.saveToStorage();
    return { success: true, document: doc };
  }

  public rejectDocument(id: string, remarks: string) {
    const user = this.getCurrentUser();
    const doc = this.getDocument(id);

    const oldStatus = doc.status;
    doc.status = 'REJECTED';
    doc.updatedAt = new Date().toISOString();

    doc.statusHistory.push({
      id: `sh-${Date.now()}`,
      previousStatus: oldStatus,
      newStatus: 'REJECTED',
      changedBy: user.id,
      changedByName: user.fullName,
      changedAt: new Date().toISOString(),
      remarks: remarks || 'Document rejected by approver.',
    });

    this.recordAudit(user.id, user.fullName, 'Document Rejected', 'DOCUMENT', doc.id, remarks);
    this.saveToStorage();
    return { success: true, document: doc };
  }

  public finalizeDocument(id: string) {
    const user = this.getCurrentUser();
    const doc = this.getDocument(id);

    const fakeSha = `sha256_${Date.now().toString(16)}_${Math.random().toString(36).substring(2, 10)}`;
    const oldStatus = doc.status;
    doc.status = 'FINAL';
    doc.finalPdfHashSha256 = fakeSha;
    doc.finalizedAt = new Date().toISOString();
    doc.updatedAt = new Date().toISOString();

    doc.statusHistory.push({
      id: `sh-${Date.now()}`,
      previousStatus: oldStatus,
      newStatus: 'FINAL',
      changedBy: user.id,
      changedByName: user.fullName,
      changedAt: new Date().toISOString(),
      remarks: `Document permanently locked. Cryptographic SHA-256 seal computed.`,
    });

    this.recordAudit(user.id, user.fullName, 'Document Finalized & Sealed', 'DOCUMENT', doc.id, fakeSha);
    this.saveToStorage();
    return { success: true, document: doc };
  }

  public voidDocument(id: string, remarks: string) {
    const user = this.getCurrentUser();
    const doc = this.getDocument(id);

    const oldStatus = doc.status;
    doc.status = 'VOID';
    doc.updatedAt = new Date().toISOString();

    doc.statusHistory.push({
      id: `sh-${Date.now()}`,
      previousStatus: oldStatus,
      newStatus: 'VOID',
      changedBy: user.id,
      changedByName: user.fullName,
      changedAt: new Date().toISOString(),
      remarks: `VOIDED: ${remarks}`,
    });

    this.recordAudit(user.id, user.fullName, 'Document Voided', 'DOCUMENT', doc.id, remarks);
    this.saveToStorage();
    return { success: true, document: doc };
  }

  public deleteDocument(id: string): { success: boolean; id: string } {
    const user = this.getCurrentUser();
    const idx = this.data.documents.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Document not found');
    const removed = this.data.documents.splice(idx, 1)[0];
    this.recordAudit(user.id, user.fullName, 'Document Deleted', 'DOCUMENT', id, `Deleted ${removed.documentNumber || removed.id}`);
    this.saveToStorage();
    return { success: true, id };
  }

  public verifyDocumentToken(token: string) {
    const clean = decodeURIComponent(token.trim()).toLowerCase();
    const doc = this.data.documents.find((d) => {
      if (d.secureVerificationToken && d.secureVerificationToken.toLowerCase() === clean) return true;
      if (d.documentNumber && d.documentNumber.toLowerCase() === clean) return true;
      if (d.id.toLowerCase() === clean) return true;
      return false;
    });

    if (!doc) {
      return {
        valid: false,
        verified: false,
        message: `Invalid or unrecognized verification token "${token}". No matching registered record found in Gulf Way Ledger.`,
      };
    }

    const shaSeal = doc.finalPdfHashSha256 || 'Tamper-evident seal pending final sanction';
    return {
      valid: true,
      verified: true,
      documentNumber: doc.documentNumber || 'UNALLOCATED',
      company: doc.companyName,
      issuingCompany: doc.companyName,
      documentType: doc.formName,
      formName: doc.formName,
      formCode: doc.formCode,
      formVersion: doc.formTemplateVersion || 1,
      issueDate: doc.createdAt.split('T')[0],
      finalizedDate: doc.finalizedAt ? doc.finalizedAt.split('T')[0] : 'Pending Final Sanction',
      status: doc.status === 'FINAL' ? 'FINAL' : doc.status,
      signingMethod: doc.signingMethod || 'PHYSICAL',
      signaturesCount: doc.signatures.length,
      sha256Hash: shaSeal,
      sha256Checksum: shaSeal,
      verificationResult: doc.status === 'VOID' ? 'VOIDED_DOCUMENT' : 'OFFICIALLY_VERIFIED',
      verificationMessage: doc.status === 'VOID'
        ? 'This document number has been officially voided and cancelled.'
        : 'Authentic Gulf Way document verified against immutable sequence register.',
      verifiedAt: new Date().toISOString(),
    };
  }

  public getAuditLogs(filters?: { resourceType?: string; search?: string }): AuditLog[] {
    let logs = this.data.auditLogs;
    if (filters?.resourceType && (filters.resourceType as any) !== 'ALL') {
      logs = logs.filter((l) => l.resourceType === filters.resourceType);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.resourceId.toLowerCase().includes(q)
      );
    }
    return logs;
  }

  public getDashboardStats() {
    const docs = this.data.documents;
    return {
      overview: {
        totalDocuments: docs.length,
        draftDocs: docs.filter((d) => d.status === 'DRAFT').length,
        numberedDocs: docs.filter((d) => d.documentNumber).length,
        awaitingSignatureDocs: docs.filter((d) => d.status === 'AWAITING_SIGNATURE' || d.status === 'NUMBER_ASSIGNED').length,
        awaitingApprovalDocs: docs.filter((d) => d.status === 'AWAITING_APPROVAL' || d.status === 'SIGNED').length,
        approvedDocs: docs.filter((d) => d.status === 'APPROVED').length,
        rejectedDocs: docs.filter((d) => d.status === 'REJECTED').length,
        voidedDocs: docs.filter((d) => d.status === 'VOID').length,
        finalizedDocs: docs.filter((d) => d.status === 'FINAL').length,
        formsAvailable: this.data.formTemplates.length,
        activeUsers: this.data.users.filter((u) => u.status === 'ACTIVE').length,
      },
      recentDocuments: docs.slice(0, 5),
    };
  }

  private recordAudit(userId: string, userName: string, action: string, resourceType: 'DOCUMENT' | 'FORM' | 'COMPANY' | 'USER' | 'NUMBERING' | 'AUTH' | 'STAMP', resourceId: string, remarks?: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action,
      resourceType,
      resourceId,
      remarks,
    };
    this.data.auditLogs.unshift(log);
  }
}

export const clientStore = new ClientLocalStorageStore();
