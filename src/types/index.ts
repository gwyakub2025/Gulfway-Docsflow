export type CompanyStatus = 'ACTIVE' | 'INACTIVE';

export interface Company {
  id: string;
  name: string;
  code: string;
  tradeLicenseNumber: string;
  taxRegistrationNumber?: string;
  logoUrl?: string;
  stampUrl?: string;
  officialStampUrl?: string;
  address: string;
  phone: string;
  email: string;
  status: CompanyStatus;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  companyId?: string; // empty means all companies
}

export type RoleType =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'FORM_ADMIN'
  | 'APPROVER'
  | 'USER'
  | 'AUDITOR'
  | 'CUSTOM';

export type PermissionCode =
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_EDIT'
  | 'USER_DISABLE'
  | 'FORM_VIEW'
  | 'FORM_CREATE'
  | 'FORM_EDIT'
  | 'FORM_DELETE'
  | 'FORM_PUBLISH'
  | 'DOCUMENT_CREATE'
  | 'DOCUMENT_VIEW'
  | 'DOCUMENT_EDIT_DRAFT'
  | 'DOCUMENT_GENERATE'
  | 'DOCUMENT_SIGN'
  | 'DOCUMENT_APPROVE'
  | 'DOCUMENT_REJECT'
  | 'DOCUMENT_VOID'
  | 'DOCUMENT_DOWNLOAD'
  | 'COMPANY_MANAGE'
  | 'NUMBERING_MANAGE'
  | 'AUDIT_VIEW'
  | 'SETTINGS_MANAGE'
  | 'COMPANY_STAMP';

export interface Role {
  id: string;
  code: RoleType | string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionCode[];
}

export interface User {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  phone: string;
  companyId: string;
  companyIds: string[];
  departmentId: string;
  designation: string;
  roleId: string;
  roleName: string;
  permissions: PermissionCode[];
  status: 'ACTIVE' | 'DISABLED';
  avatarUrl?: string;
  signatureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'employee_search'
  | 'company_search'
  | 'signature'
  | 'thumbprint'
  | 'company_stamp'
  | 'photo'
  | 'attachment'
  | 'document_number'
  | 'generated_date'
  | 'generated_by'
  | 'qr_code'
  | 'barcode';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  pageNumber: number; // 1-indexed
  x: number; // percentage (0 - 100) or points
  y: number; // percentage (0 - 100) or points
  width: number; // percentage (0 - 100) or points
  height: number; // percentage or points
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: 'normal' | 'bold' | 'italic';
  alignment?: 'left' | 'center' | 'right';
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  options?: string[]; // for dropdown, radio
  validationRules?: string;
  visibility: boolean;
  editable: boolean;
  dataSource?: string;
  signerRole?: string; // for signature fields
}

export type FormStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface FormVersion {
  version: number;
  fields: FormField[];
  pdfTemplateUrl: string;
  pdfPageCount: number;
  updatedAt: string;
  updatedBy: string;
  changelog?: string;
}

export interface FormTemplate {
  id: string;
  formName: string;
  formCode: string; // e.g. LF, SAF, ECF, AHF
  description: string;
  companyScope: 'ALL' | 'SPECIFIC';
  companyIds: string[];
  departmentId: string;
  category: string; // HR, Finance, Operations, Safety, Rider, Legal
  currentVersion: number;
  effectiveDate: string;
  status: FormStatus;
  instructions: string;
  pdfTemplateUrl: string;
  pdfPageCount: number;
  docxHtmlContent?: string;
  sourceDocumentName?: string;
  fields: FormField[];
  numberingRuleId: string;
  approvalWorkflowId?: string;
  changelog?: string;
  versions: FormVersion[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type SequenceResetType = 'NEVER' | 'YEARLY' | 'MONTHLY' | 'FINANCIAL_YEAR';

export interface NumberingRule {
  id: string;
  formTemplateId?: string; // or 'DEFAULT'
  name: string;
  pattern: string; // e.g. {COMPANY}-{DEPARTMENT}-{FORMCODE}-{YYYY}-{SEQ:6}
  sequenceReset?: SequenceResetType;
  resetFrequency?: 'NEVER' | 'YEARLY' | 'MONTHLY';
  prefix?: string;
  paddingZeros?: number;
  startingSequence?: number;
  startingNumber?: number;
  currentSequence?: number;
  isActive?: boolean;
  lastResetPeriod?: string; // e.g. "2026", "2026-09"
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus =
  | 'DRAFT'
  | 'READY_FOR_NUMBERING'
  | 'NUMBER_ASSIGNED'
  | 'AWAITING_SIGNATURE'
  | 'SIGNED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'FINAL'
  | 'REJECTED'
  | 'CANCELLED'
  | 'VOID';

export interface StatusHistoryEntry {
  id: string;
  previousStatus: DocumentStatus;
  newStatus: DocumentStatus;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  remarks?: string;
  ipAddress?: string;
}

export interface DocumentSignature {
  id: string;
  fieldId: string;
  signerName: string;
  signerRole: string;
  signatureDataUrl: string;
  type: 'DRAWN' | 'UPLOADED' | 'THUMBPRINT';
  signedAt: string;
  userId: string;
  ipAddress?: string;
}

export interface ApprovalAction {
  id: string;
  stepName: string;
  approverId: string;
  approverName: string;
  action: 'APPROVED' | 'REJECTED' | 'RETURNED';
  remarks?: string;
  actionAt: string;
}

export interface DocumentRecord {
  id: string;
  documentNumber?: string; // Allocated strictly server-side
  secureVerificationToken: string;
  formTemplateId: string;
  formTemplateVersion: number;
  formName: string;
  formCode: string;
  companyId: string;
  companyName: string;
  departmentId: string;
  employeeName?: string;
  employeeId?: string;
  status: DocumentStatus;
  signingMethod?: 'PHYSICAL' | 'DIGITAL';
  values: Record<string, any>;
  generatedPdfUrl?: string; // URL / base64 of generated official PDF
  signedDocumentUrl?: string; // Scanned / physical uploaded copy
  finalPdfUrl?: string;
  finalPdfHashSha256?: string;
  statusHistory: StatusHistoryEntry[];
  signatures: DocumentSignature[];
  approvalHistory: ApprovalAction[];
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt: string;
  finalizedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: 'DOCUMENT' | 'FORM' | 'COMPANY' | 'USER' | 'NUMBERING' | 'AUTH' | 'STAMP';
  resourceId: string;
  oldValue?: string;
  newValue?: string;
  remarks?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  companyId?: string;
}
