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
import { clientStore } from './localStore.js';
import {
  saveDocumentToFirestore,
  deleteDocumentFromFirestore,
  getDocumentsFromFirestore,
} from './firebase.js';

/**
 * Robust fetch helper that connects to the live backend server when available,
 * and gracefully falls back to the client-side persistent localStore if running
 * in a static environment (like Vercel SPA deployment, offline, or 404 HTML response).
 */
async function safeFetch<T>(
  url: string,
  options: RequestInit | undefined,
  fallbackFn: () => T | Promise<T>
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server responded with a valid JSON response
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }

    // If server responded with a JSON error payload
    if (!res.ok && contentType.includes('application/json')) {
      const err = await res.json().catch(() => ({}));
      // On 404/500/502 server errors, try client-side fallback
      if (res.status === 404 || res.status >= 500) {
        console.warn(`[DocFlow API] Server returned ${res.status} JSON for ${url}. Executing local fallback.`);
        return await fallbackFn();
      }
      throw new Error(err.error || err.message || `Request failed with status ${res.status}`);
    }

    // Non-JSON response (e.g. Vercel returning HTML "The page could not be found" for /api/*)
    console.warn(`[DocFlow API] Server returned non-JSON (${contentType}, status ${res.status}) for ${url}. Executing client-side store fallback.`);
    return await fallbackFn();
  } catch (err: any) {
    // If it's a network error, CORS, or JSON parse error, fall back to local store
    console.warn(`[DocFlow API] Fetch failed for ${url} (${err.message}). Using local store fallback.`);
    return await fallbackFn();
  }
}

export const api = {
  // Auth & Session
  async getMe(): Promise<{ user: User; allUsers: Array<{ id: string; fullName: string; roleName: string; email: string }> }> {
    return safeFetch('/api/auth/me', undefined, () => clientStore.getMe());
  },

  async switchUser(userId: string): Promise<{ success: boolean; user: User }> {
    return safeFetch(
      '/api/auth/switch-user',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      },
      () => clientStore.switchUser(userId)
    );
  },

  // Companies
  async getCompanies(): Promise<Company[]> {
    return safeFetch('/api/companies', undefined, () => clientStore.getCompanies());
  },

  async createCompany(data: Partial<Company>): Promise<Company> {
    return safeFetch(
      '/api/companies',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.createCompany(data)
    );
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    return safeFetch(
      `/api/companies/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.updateCompany(id, data)
    );
  },

  async deleteCompany(id: string): Promise<{ success: boolean; id: string }> {
    return safeFetch(
      `/api/companies/${id}`,
      {
        method: 'DELETE',
      },
      () => clientStore.deleteCompany(id)
    );
  },

  async clearSampleData(): Promise<{ success: boolean }> {
    return safeFetch(
      '/api/database/clear-sample',
      {
        method: 'POST',
      },
      () => clientStore.clearAllSampleData()
    );
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    return safeFetch('/api/departments', undefined, () => clientStore.getDepartments());
  },

  async createDepartment(data: Partial<Department>): Promise<Department> {
    return safeFetch(
      '/api/departments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.createDepartment(data)
    );
  },

  async deleteDepartment(id: string): Promise<{ success: boolean; id: string }> {
    return safeFetch(
      `/api/departments/${id}`,
      {
        method: 'DELETE',
      },
      () => clientStore.deleteDepartment(id)
    );
  },

  // Users & Roles
  async getUsers(): Promise<User[]> {
    return safeFetch('/api/users', undefined, () => clientStore.getUsers());
  },

  async createUser(data: Partial<User>): Promise<User> {
    return safeFetch(
      '/api/users',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.createUser(data)
    );
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return safeFetch(
      `/api/users/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.updateUser(id, data)
    );
  },

  async deleteUser(id: string): Promise<{ success: boolean; id: string }> {
    return safeFetch(
      `/api/users/${id}`,
      {
        method: 'DELETE',
      },
      () => clientStore.deleteUser(id)
    );
  },

  async getRoles(): Promise<Role[]> {
    return safeFetch('/api/roles', undefined, () => clientStore.getRoles());
  },

  async createRole(data: Partial<Role>): Promise<Role> {
    return safeFetch(
      '/api/roles',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.createRole(data)
    );
  },

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    return safeFetch(
      `/api/roles/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.updateRole(id, data)
    );
  },

  async deleteRole(id: string): Promise<{ success: boolean; id: string }> {
    return safeFetch(
      `/api/roles/${id}`,
      {
        method: 'DELETE',
      },
      () => clientStore.deleteRole(id)
    );
  },

  // Numbering Rules
  async getNumberingRules(): Promise<NumberingRule[]> {
    return safeFetch('/api/numbering-rules', undefined, () => clientStore.getNumberingRules());
  },

  async createNumberingRule(data: Partial<NumberingRule>): Promise<NumberingRule> {
    return safeFetch(
      '/api/numbering-rules',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.createNumberingRule(data)
    );
  },

  async updateNumberingRule(id: string, data: Partial<NumberingRule>): Promise<NumberingRule> {
    return safeFetch(
      `/api/numbering-rules/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.updateNumberingRule(id, data)
    );
  },

  async deleteNumberingRule(id: string): Promise<{ success: boolean; id: string }> {
    return safeFetch(
      `/api/numbering-rules/${id}`,
      {
        method: 'DELETE',
      },
      () => clientStore.deleteNumberingRule(id)
    );
  },

  async previewNumberPattern(payload: {
    pattern: string;
    companyCode?: string;
    departmentCode?: string;
    formCode?: string;
    sampleSeq?: number;
  }): Promise<{ preview: string }> {
    return safeFetch(
      '/api/numbering-rules/preview',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      () => clientStore.previewNumberPattern(payload)
    );
  },

  // Forms
  async getForms(filters?: { companyId?: string; category?: string; status?: string }): Promise<FormTemplate[]> {
    const query = new URLSearchParams();
    if (filters?.companyId) query.set('companyId', filters.companyId);
    if (filters?.category) query.set('category', filters.category);
    if (filters?.status) query.set('status', filters.status);
    return safeFetch(`/api/forms?${query.toString()}`, undefined, () => clientStore.getForms(filters));
  },

  async getForm(id: string): Promise<FormTemplate> {
    return safeFetch(`/api/forms/${id}`, undefined, () => clientStore.getForm(id));
  },

  async createForm(data: Partial<FormTemplate>): Promise<FormTemplate> {
    return safeFetch(
      '/api/forms',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.createForm(data)
    );
  },

  async updateForm(id: string, data: Partial<FormTemplate>): Promise<FormTemplate> {
    return safeFetch(
      `/api/forms/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.updateForm(id, data)
    );
  },

  async publishForm(id: string): Promise<{ success: boolean; form: FormTemplate }> {
    return safeFetch(
      `/api/forms/${id}/publish`,
      { method: 'POST' },
      () => clientStore.publishForm(id)
    );
  },

  async deleteForm(id: string): Promise<{ success: boolean; id: string }> {
    return safeFetch(
      `/api/forms/${id}`,
      { method: 'DELETE' },
      () => clientStore.deleteForm(id)
    );
  },

  async bulkDeleteForms(ids: string[]): Promise<{ success: boolean; deletedIds: string[]; count: number }> {
    return safeFetch(
      '/api/forms/bulk',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      },
      () => {
        const res = clientStore.bulkDeleteForms(ids);
        return { success: true, deletedIds: res.deletedIds, count: res.deletedIds.length };
      }
    );
  },

  async testPreviewPdf(template: FormTemplate, sampleValues: Record<string, any>): Promise<{ pdfBase64: string; previewUrl?: string }> {
    return safeFetch(
      '/api/forms/test-preview-pdf',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, sampleValues }),
      },
      () => ({
        pdfBase64: '',
        previewUrl: '',
      })
    );
  },

  // Documents
  async getDocuments(filters?: { companyId?: string; status?: string; formId?: string; search?: string }): Promise<DocumentRecord[]> {
    const query = new URLSearchParams();
    if (filters?.companyId) query.set('companyId', filters.companyId);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.formId) query.set('formId', filters.formId);
    if (filters?.search) query.set('search', filters.search);

    const serverDocs = await safeFetch(`/api/documents?${query.toString()}`, undefined, () => clientStore.getDocuments(filters));

    // Also fetch from Firestore and reconcile
    try {
      const firestoreDocs = await getDocumentsFromFirestore();
      if (firestoreDocs.length > 0) {
        const map = new Map<string, DocumentRecord>();
        serverDocs.forEach((d) => map.set(d.id, d));
        firestoreDocs.forEach((d) => {
          // Firestore has priority or fills in documents
          if (!map.has(d.id) || (d.updatedAt && map.get(d.id)!.updatedAt < d.updatedAt)) {
            map.set(d.id, d);
            // Sync to server in background
            fetch('/api/documents/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ document: d }),
            }).catch(() => {});
          }
        });
        return Array.from(map.values());
      }
    } catch (err) {
      console.warn('[DocFlow API] Firestore reconciliation notice:', err);
    }

    return serverDocs;
  },

  async getDocument(id: string): Promise<DocumentRecord> {
    return safeFetch(`/api/documents/${id}`, undefined, () => clientStore.getDocument(id));
  },

  getDocumentPdfUrl(id: string, download = false): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();
    if (download) params.set('download', 'true');
    if (origin) params.set('baseUrl', origin);
    const queryString = params.toString();
    return `/api/documents/${id}/pdf${queryString ? `?${queryString}` : ''}`;
  },

  async getDocumentQrCode(id: string): Promise<{
    documentId: string;
    documentNumber: string | null;
    verificationToken: string;
    verificationUrl: string;
    qrDataUrl: string;
  }> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = origin
      ? `/api/documents/${id}/qr-code?baseUrl=${encodeURIComponent(origin)}`
      : `/api/documents/${id}/qr-code`;
    return safeFetch(
      url,
      undefined,
      () => {
        const doc = clientStore.getDocument(id);
        const tok = doc.secureVerificationToken || 'TOKEN_PENDING';
        return {
          documentId: doc.id,
          documentNumber: doc.documentNumber || null,
          verificationToken: tok,
          verificationUrl: `${origin || 'http://localhost:3000'}/verify/${tok}`,
          qrDataUrl: '',
        };
      }
    );
  },

  async saveDraft(data: { formTemplateId: string; companyId: string; values: Record<string, any> }): Promise<DocumentRecord> {
    const doc = await safeFetch(
      '/api/documents/draft',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.saveDraft(data)
    );
    saveDocumentToFirestore(doc).catch(() => {});
    return doc;
  },

  async updateDocument(
    id: string,
    data: {
      values?: Record<string, any>;
      employeeName?: string;
      employeeId?: string;
      signedDocumentUrl?: string | null;
      status?: any;
    }
  ): Promise<{
    success: boolean;
    document: DocumentRecord;
    pdfBase64?: string;
  }> {
    const res = await safeFetch(
      `/api/documents/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      () => clientStore.updateDocument(id, data)
    );
    if (res.document) {
      saveDocumentToFirestore(res.document).catch(() => {});
    }
    return res;
  },

  async generateDocumentNumber(id: string, signingMethod: 'PHYSICAL' | 'DIGITAL'): Promise<{
    success: boolean;
    document: DocumentRecord;
    pdfBase64: string;
  }> {
    const res = await safeFetch(
      `/api/documents/${id}/generate-number`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signingMethod }),
      },
      () => clientStore.generateDocumentNumber(id, signingMethod)
    );
    if (res.document) {
      saveDocumentToFirestore(res.document).catch(() => {});
    }
    return res;
  },

  async uploadSignedDocument(id: string, signedFileUrl: string, remarks?: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await safeFetch(
      `/api/documents/${id}/upload-signed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedFileUrl, remarks }),
      },
      () => clientStore.uploadSignedDocument(id, signedFileUrl, remarks)
    );
    if (res.document) {
      saveDocumentToFirestore(res.document).catch(() => {});
    }
    return res;
  },

  async applyDigitalSignature(
    id: string,
    fieldId: string,
    signatureDataUrl: string,
    type: 'DRAWN' | 'UPLOADED' | 'THUMBPRINT',
    signerName?: string,
    signerRole?: string
  ): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await safeFetch(
      `/api/documents/${id}/digital-sign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId, signatureDataUrl, type, signerName, signerRole }),
      },
      () => clientStore.applyDigitalSignature(id, fieldId, signatureDataUrl, type, signerName, signerRole)
    );
    if (res.document) {
      saveDocumentToFirestore(res.document).catch(() => {});
    }
    return res;
  },

  async applyMultipleDigitalSignatures(
    id: string,
    signatures: Array<{
      fieldId: string;
      signatureDataUrl: string;
      type: 'DRAWN' | 'UPLOADED' | 'THUMBPRINT';
      signerName?: string;
      signerRole?: string;
    }>
  ): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await safeFetch(
      `/api/documents/${id}/digital-sign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatures }),
      },
      () => clientStore.applyMultipleDigitalSignatures(id, signatures)
    );
    if (res.document) {
      saveDocumentToFirestore(res.document).catch(() => {});
    }
    return res;
  },

  async approveDocument(id: string, remarks?: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await safeFetch(
      `/api/documents/${id}/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      },
      () => clientStore.approveDocument(id, remarks)
    );
    if (res.document) {
      saveDocumentToFirestore(res.document).catch(() => {});
    }
    return res;
  },

  async rejectDocument(id: string, remarks: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await safeFetch(
      `/api/documents/${id}/reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      },
      () => clientStore.rejectDocument(id, remarks)
    );
    if (res.document) {
      saveDocumentToFirestore(res.document).catch(() => {});
    }
    return res;
  },

  async finalizeDocument(id: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await safeFetch(
      `/api/documents/${id}/finalize`,
      { method: 'POST' },
      () => clientStore.finalizeDocument(id)
    );
    if (res.document) {
      saveDocumentToFirestore(res.document).catch(() => {});
    }
    return res;
  },

  async voidDocument(id: string, remarks: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const res = await safeFetch(
      `/api/documents/${id}/void`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      },
      () => clientStore.voidDocument(id, remarks)
    );
    if (res.document) {
      saveDocumentToFirestore(res.document).catch(() => {});
    }
    return res;
  },

  async deleteDocument(id: string): Promise<{ success: boolean; id: string }> {
    const res = await safeFetch(
      `/api/documents/${id}`,
      { method: 'DELETE' },
      () => clientStore.deleteDocument(id)
    );
    deleteDocumentFromFirestore(id).catch(() => {});
    return res;
  },

  /**
   * Explicitly synchronizes a document record from browser/Firestore to backend server.
   * Ensures the server's in-memory and disk registries have the document record immediately.
   */
  async syncDocumentToServer(doc: DocumentRecord): Promise<DocumentRecord> {
    if (!doc || !doc.id) return doc;
    try {
      const res = await fetch('/api/documents/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: doc }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.document || doc;
      }
    } catch (e) {
      console.warn('[DocFlow API] Failed to sync document to server:', e);
    }
    return doc;
  },

  /**
   * Directly requests PDF generation by passing the document payload.
   * Returns base64 or array buffer without depending on server registry lookup.
   */
  async renderDocumentPdf(doc: DocumentRecord): Promise<{ pdfBase64: string; pdfBytes?: Uint8Array }> {
    const res = await fetch('/api/documents/render-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/pdf',
      },
      body: JSON.stringify({ document: doc }),
    });

    if (!res.ok) {
      throw new Error(`Failed to render PDF (${res.status})`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return { pdfBase64: json.pdfBase64 };
    }

    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return {
      pdfBase64: btoa(binary),
      pdfBytes: bytes,
    };
  },

  // Public Verification
  async verifyDocumentToken(token: string): Promise<any> {
    const cleanToken = encodeURIComponent(token.trim());
    return safeFetch(
      `/api/verify/${cleanToken}`,
      undefined,
      () => clientStore.verifyDocumentToken(token)
    );
  },

  // Audit Logs & Dashboard
  async getAuditLogs(filters?: { resourceType?: string; search?: string }): Promise<AuditLog[]> {
    const query = new URLSearchParams();
    if (filters?.resourceType) query.set('resourceType', filters.resourceType);
    if (filters?.search) query.set('search', filters.search);
    return safeFetch(
      `/api/audit-logs?${query.toString()}`,
      undefined,
      () => clientStore.getAuditLogs(filters)
    );
  },

  async getDashboardStats(): Promise<any> {
    return safeFetch(
      '/api/dashboard/stats',
      undefined,
      () => clientStore.getDashboardStats()
    );
  },
};
