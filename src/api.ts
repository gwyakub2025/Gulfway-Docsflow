import {
  Company,
  Department,
  User,
  Role,
  NumberingRule,
  FormTemplate,
  DocumentRecord,
  AuditLog,
} from './types/index.js';

export const api = {
  // Auth & Session
  async getMe(): Promise<{ user: User; allUsers: Array<{ id: string; fullName: string; roleName: string; email: string }> }> {
    const res = await fetch('/api/auth/me');
    return res.json();
  },

  async switchUser(userId: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Companies
  async getCompanies(): Promise<Company[]> {
    const res = await fetch('/api/companies');
    return res.json();
  },

  async createCompany(data: Partial<Company>): Promise<Company> {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    const res = await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    const res = await fetch('/api/departments');
    return res.json();
  },

  // Users & Roles
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    return res.json();
  },

  async createUser(data: Partial<User>): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getRoles(): Promise<Role[]> {
    const res = await fetch('/api/roles');
    return res.json();
  },

  // Numbering Rules
  async getNumberingRules(): Promise<NumberingRule[]> {
    const res = await fetch('/api/numbering-rules');
    return res.json();
  },

  async createNumberingRule(data: Partial<NumberingRule>): Promise<NumberingRule> {
    const res = await fetch('/api/numbering-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async previewNumberPattern(payload: {
    pattern: string;
    companyCode?: string;
    departmentCode?: string;
    formCode?: string;
    sampleSeq?: number;
  }): Promise<{ preview: string }> {
    const res = await fetch('/api/numbering-rules/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Forms
  async getForms(filters?: { companyId?: string; category?: string; status?: string }): Promise<FormTemplate[]> {
    const query = new URLSearchParams();
    if (filters?.companyId) query.set('companyId', filters.companyId);
    if (filters?.category) query.set('category', filters.category);
    if (filters?.status) query.set('status', filters.status);
    const res = await fetch(`/api/forms?${query.toString()}`);
    return res.json();
  },

  async getForm(id: string): Promise<FormTemplate> {
    const res = await fetch(`/api/forms/${id}`);
    return res.json();
  },

  async createForm(data: Partial<FormTemplate>): Promise<FormTemplate> {
    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateForm(id: string, data: Partial<FormTemplate>): Promise<FormTemplate> {
    const res = await fetch(`/api/forms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async publishForm(id: string): Promise<{ success: boolean; form: FormTemplate }> {
    const res = await fetch(`/api/forms/${id}/publish`, { method: 'POST' });
    return res.json();
  },

  async testPreviewPdf(template: FormTemplate, sampleValues: Record<string, any>): Promise<{ pdfBase64: string; previewUrl?: string }> {
    const res = await fetch('/api/forms/test-preview-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template, sampleValues }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to generate draft preview (Status: ${res.status})`);
    }
    return res.json();
  },

  // Documents
  async getDocuments(filters?: { companyId?: string; status?: string; formId?: string; search?: string }): Promise<DocumentRecord[]> {
    const query = new URLSearchParams();
    if (filters?.companyId) query.set('companyId', filters.companyId);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.formId) query.set('formId', filters.formId);
    if (filters?.search) query.set('search', filters.search);
    const res = await fetch(`/api/documents?${query.toString()}`);
    return res.json();
  },

  async getDocument(id: string): Promise<DocumentRecord> {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Document not found (${res.status})`);
    }
    return res.json();
  },

  getDocumentPdfUrl(id: string, download = false): string {
    return `/api/documents/${id}/pdf${download ? '?download=true' : ''}`;
  },

  async getDocumentQrCode(id: string): Promise<{
    documentId: string;
    documentNumber: string | null;
    verificationToken: string;
    verificationUrl: string;
    qrDataUrl: string;
  }> {
    const res = await fetch(`/api/documents/${id}/qr-code`);
    return res.json();
  },

  async saveDraft(data: { formTemplateId: string; companyId: string; values: Record<string, any> }): Promise<DocumentRecord> {
    const res = await fetch('/api/documents/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async generateDocumentNumber(id: string, signingMethod: 'PHYSICAL' | 'DIGITAL'): Promise<{
    success: boolean;
    document: DocumentRecord;
    pdfBase64: string;
  }> {
    const res = await fetch(`/api/documents/${id}/generate-number`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signingMethod }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to allocate document number');
    }
    return res.json();
  },

  async uploadSignedDocument(id: string, signedFileUrl: string, remarks?: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await fetch(`/api/documents/${id}/upload-signed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedFileUrl, remarks }),
    });
    return res.json();
  },

  async applyDigitalSignature(
    id: string,
    fieldId: string,
    signatureDataUrl: string,
    type: 'DRAWN' | 'UPLOADED' | 'THUMBPRINT'
  ): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await fetch(`/api/documents/${id}/digital-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldId, signatureDataUrl, type }),
    });
    return res.json();
  },

  async approveDocument(id: string, remarks?: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await fetch(`/api/documents/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Approval failed (Status: ${res.status})`);
    }
    return res.json();
  },

  async rejectDocument(id: string, remarks: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await fetch(`/api/documents/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Rejection failed (Status: ${res.status})`);
    }
    return res.json();
  },

  async finalizeDocument(id: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await fetch(`/api/documents/${id}/finalize`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Finalization failed (Status: ${res.status})`);
    }
    return res.json();
  },

  async voidDocument(id: string, remarks: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await fetch(`/api/documents/${id}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Void failed (Status: ${res.status})`);
    }
    return res.json();
  },

  // Public Verification
  async verifyDocumentToken(token: string): Promise<any> {
    const cleanToken = encodeURIComponent(token.trim());
    const res = await fetch(`/api/verify/${cleanToken}`);
    const data = await res.json();
    if (!res.ok) {
      return {
        valid: false,
        verified: false,
        message: data.message || 'Document token could not be verified in the registry.',
      };
    }
    return data;
  },

  // Audit Logs & Dashboard
  async getAuditLogs(filters?: { resourceType?: string; search?: string }): Promise<AuditLog[]> {
    const query = new URLSearchParams();
    if (filters?.resourceType) query.set('resourceType', filters.resourceType);
    if (filters?.search) query.set('search', filters.search);
    const res = await fetch(`/api/audit-logs?${query.toString()}`);
    return res.json();
  },

  async getDashboardStats(): Promise<any> {
    const res = await fetch('/api/dashboard/stats');
    return res.json();
  },
};
