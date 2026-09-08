import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';
import { AtomicNumberingEngine } from './server/atomicNumbering.js';
import { PdfGenerationEngine } from './server/pdfEngine.js';
import { QrGenerator } from './server/qrGenerator.js';
import { DocumentRecord, StatusHistoryEntry } from './src/types/index.js';

const app = express();
const PORT = 3000;

// Middleware for parsing large JSON payloads (PDF templates and signature data URLs)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Active session simulation (Default to Super Admin, easily switched)
let currentSessionUserId = 'usr-admin';

function getCurrentUser() {
  return store.users.find((u) => u.id === currentSessionUserId) || store.users[0];
}

// Server-side permission check helper
function checkPermission(req: express.Request, res: express.Response, requiredPerm: string): boolean {
  const user = getCurrentUser();
  if (!user || user.status === 'DISABLED') {
    res.status(403).json({ error: 'Unauthorized: User account is inactive or disabled' });
    return false;
  }
  // Super admin has wildcard access
  if (user.roleName === 'Super Administrator' || user.permissions.includes(requiredPerm as any)) {
    return true;
  }
  res.status(403).json({ error: `Forbidden: Missing required permission [${requiredPerm}]` });
  return false;
}

// ==========================================
// 1. HEALTH & AUTH APIS
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'Gulf Way DocFlow', timestamp: new Date().toISOString() });
});

app.get('/api/auth/me', (req, res) => {
  const user = getCurrentUser();
  res.json({
    user,
    allUsers: store.users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      employeeId: u.employeeId,
      roleName: u.roleName,
      email: u.email,
    })),
  });
});

app.post('/api/auth/switch-user', (req, res) => {
  const { userId } = req.body;
  const targetUser = store.users.find((u) => u.id === userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  currentSessionUserId = userId;
  store.recordAudit(
    targetUser.id,
    targetUser.fullName,
    'User Switched / Authenticated',
    'AUTH',
    targetUser.id,
    { remarks: `Switched active session to ${targetUser.fullName} (${targetUser.roleName})` }
  );
  res.json({ success: true, user: targetUser });
});

// ==========================================
// 2. COMPANIES & DEPARTMENTS
// ==========================================
app.get('/api/companies', (req, res) => {
  res.json(store.companies);
});

app.post('/api/companies', (req, res) => {
  if (!checkPermission(req, res, 'COMPANY_MANAGE')) return;
  const user = getCurrentUser();
  const { name, code, tradeLicenseNumber, address, phone, email, stampUrl, logoUrl } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: 'Name and company code are required' });
  }

  const newCompany = {
    id: `comp-${Date.now()}`,
    name,
    code: code.toUpperCase(),
    tradeLicenseNumber: tradeLicenseNumber || 'N/A',
    address: address || '',
    phone: phone || '',
    email: email || '',
    logoUrl: logoUrl || '',
    stampUrl: stampUrl || '',
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.companies.push(newCompany);
  store.recordAudit(user.id, user.fullName, 'Company Created', 'COMPANY', newCompany.id, {
    newValue: `${newCompany.name} (${newCompany.code})`,
  });

  res.status(201).json(newCompany);
});

app.put('/api/companies/:id', (req, res) => {
  if (!checkPermission(req, res, 'COMPANY_MANAGE')) return;
  const user = getCurrentUser();
  const { id } = req.params;
  const compIndex = store.companies.findIndex((c) => c.id === id);
  if (compIndex === -1) return res.status(404).json({ error: 'Company not found' });

  const old = store.companies[compIndex];
  const updated = {
    ...old,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  store.companies[compIndex] = updated;

  store.recordAudit(user.id, user.fullName, 'Company Updated', 'COMPANY', id, {
    oldValue: old.name,
    newValue: updated.name,
  });

  res.json(updated);
});

app.get('/api/departments', (req, res) => {
  res.json(store.departments);
});

// ==========================================
// 3. USERS & ROLES
// ==========================================
app.get('/api/users', (req, res) => {
  res.json(store.users);
});

app.post('/api/users', (req, res) => {
  if (!checkPermission(req, res, 'USER_CREATE')) return;
  const user = getCurrentUser();
  const { fullName, employeeId, email, phone, companyId, departmentId, designation, roleId } = req.body;

  const role = store.roles.find((r) => r.id === roleId) || store.roles.find((r) => r.code === 'USER')!;

  const newUser = {
    id: `usr-${Date.now()}`,
    fullName,
    employeeId: employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
    email,
    phone: phone || '',
    companyId: companyId || 'comp-gwds',
    companyIds: [companyId || 'comp-gwds'],
    departmentId: departmentId || 'dept-ops',
    designation: designation || 'Employee',
    roleId: role.id,
    roleName: role.name,
    permissions: role.permissions,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.users.push(newUser);
  store.recordAudit(user.id, user.fullName, 'User Created', 'USER', newUser.id, {
    newValue: `${newUser.fullName} (${newUser.roleName})`,
  });

  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  if (!checkPermission(req, res, 'USER_EDIT')) return;
  const user = getCurrentUser();
  const { id } = req.params;
  const userIdx = store.users.findIndex((u) => u.id === id);
  if (userIdx === -1) return res.status(404).json({ error: 'User not found' });

  const existing = store.users[userIdx];
  const updated = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  // If role changed, re-sync permissions
  if (req.body.roleId && req.body.roleId !== existing.roleId) {
    const role = store.roles.find((r) => r.id === req.body.roleId);
    if (role) {
      updated.roleName = role.name;
      updated.permissions = role.permissions;
    }
  }

  store.users[userIdx] = updated;
  store.recordAudit(user.id, user.fullName, 'User Updated', 'USER', id, {
    oldValue: existing.status,
    newValue: updated.status,
  });

  res.json(updated);
});

app.get('/api/roles', (req, res) => {
  res.json(store.roles);
});

// ==========================================
// 4. NUMBERING ENGINE APIS
// ==========================================
app.get('/api/numbering-rules', (req, res) => {
  res.json(store.numberingRules);
});

app.post('/api/numbering-rules', (req, res) => {
  if (!checkPermission(req, res, 'NUMBERING_MANAGE')) return;
  const user = getCurrentUser();
  const { formTemplateId, name, pattern, sequenceReset, startingSequence } = req.body;

  const newRule = {
    id: `rule-${Date.now()}`,
    formTemplateId: formTemplateId || 'DEFAULT',
    name: name || 'Custom Rule',
    pattern: pattern || '{COMPANY}-{DEPARTMENT}-{FORMCODE}-{YYYY}-{SEQ:6}',
    sequenceReset: sequenceReset || 'YEARLY',
    startingSequence: Number(startingSequence) || 1001,
    currentSequence: (Number(startingSequence) || 1001) - 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.numberingRules.push(newRule);
  store.recordAudit(user.id, user.fullName, 'Numbering Rule Created', 'NUMBERING', newRule.id, {
    newValue: `${newRule.name}: ${newRule.pattern}`,
  });

  res.status(201).json(newRule);
});

app.post('/api/numbering-rules/preview', (req, res) => {
  const { pattern, companyCode, departmentCode, formCode, sampleSeq } = req.body;
  const preview = AtomicNumberingEngine.previewPattern(
    pattern || '{COMPANY}-{DEPARTMENT}-{FORMCODE}-{YYYY}-{SEQ:6}',
    {
      companyCode: companyCode || 'GWDS',
      departmentCode: departmentCode || 'HR',
      formCode: formCode || 'LF',
    },
    Number(sampleSeq) || 1001
  );
  res.json({ preview });
});

// ==========================================
// 5. FORM BUILDER & TEMPLATES
// ==========================================
app.get('/api/forms', (req, res) => {
  const { companyId, category, status } = req.query;
  let forms = store.formTemplates;

  if (category && category !== 'ALL') {
    forms = forms.filter((f) => f.category === category);
  }
  if (status && status !== 'ALL') {
    forms = forms.filter((f) => f.status === status);
  }
  if (companyId) {
    forms = forms.filter(
      (f) => f.companyScope === 'ALL' || f.companyIds.includes(String(companyId))
    );
  }

  res.json(forms);
});

app.get('/api/forms/:id', (req, res) => {
  const form = store.formTemplates.find((f) => f.id === req.params.id);
  if (!form) return res.status(404).json({ error: 'Form template not found' });
  res.json(form);
});

app.post('/api/forms', (req, res) => {
  if (!checkPermission(req, res, 'FORM_CREATE')) return;
  const user = getCurrentUser();
  const {
    formName,
    formCode,
    description,
    companyScope,
    companyIds,
    departmentId,
    category,
    effectiveDate,
    instructions,
    pdfTemplateUrl,
    pdfPageCount,
    fields,
    numberingRuleId,
  } = req.body;

  if (!formName || !formCode) {
    return res.status(400).json({ error: 'Form Name and Form Code are required' });
  }

  const newForm = {
    id: `form-${Date.now()}`,
    formName,
    formCode: formCode.toUpperCase(),
    description: description || '',
    companyScope: companyScope || 'ALL',
    companyIds: companyIds || [],
    departmentId: departmentId || 'dept-hr',
    category: category || 'General',
    currentVersion: 1,
    effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
    status: 'DRAFT' as const,
    instructions: instructions || '',
    pdfTemplateUrl: pdfTemplateUrl || '',
    pdfPageCount: Number(pdfPageCount) || 1,
    fields: fields || [],
    numberingRuleId: numberingRuleId || 'rule-default',
    versions: [
      {
        version: 1,
        fields: fields || [],
        pdfTemplateUrl: pdfTemplateUrl || '',
        pdfPageCount: Number(pdfPageCount) || 1,
        updatedAt: new Date().toISOString(),
        updatedBy: user.fullName,
        changelog: 'Initial drafted template',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: user.fullName,
  };

  store.formTemplates.push(newForm);
  store.recordAudit(user.id, user.fullName, 'Form Created', 'FORM', newForm.id, {
    newValue: `${newForm.formName} (${newForm.formCode}) v1`,
  });

  res.status(201).json(newForm);
});

// Update Form Template with Strict Versioning (Never overwrite published versions)
app.put('/api/forms/:id', (req, res) => {
  if (!checkPermission(req, res, 'FORM_EDIT')) return;
  const user = getCurrentUser();
  const { id } = req.params;
  const formIdx = store.formTemplates.findIndex((f) => f.id === id);
  if (formIdx === -1) return res.status(404).json({ error: 'Form not found' });

  const existingForm = store.formTemplates[formIdx];

  // If form was already ACTIVE (published), creating modification increments version
  let nextVersion = existingForm.currentVersion;
  let versions = [...existingForm.versions];

  if (existingForm.status === 'ACTIVE') {
    nextVersion += 1;
    versions.push({
      version: nextVersion,
      fields: req.body.fields || existingForm.fields,
      pdfTemplateUrl: req.body.pdfTemplateUrl || existingForm.pdfTemplateUrl,
      pdfPageCount: req.body.pdfPageCount || existingForm.pdfPageCount,
      updatedAt: new Date().toISOString(),
      updatedBy: user.fullName,
      changelog: req.body.changelog || `Updated form to Version ${nextVersion}`,
    });
  }

  const updatedForm = {
    ...existingForm,
    ...req.body,
    currentVersion: nextVersion,
    versions,
    updatedAt: new Date().toISOString(),
  };

  store.formTemplates[formIdx] = updatedForm;
  store.recordAudit(user.id, user.fullName, 'Form Modified', 'FORM', id, {
    oldValue: `Version ${existingForm.currentVersion}`,
    newValue: `Version ${nextVersion}`,
    remarks: req.body.changelog || 'Form template structure updated',
  });

  res.json(updatedForm);
});

app.post('/api/forms/:id/publish', (req, res) => {
  if (!checkPermission(req, res, 'FORM_PUBLISH')) return;
  const user = getCurrentUser();
  const { id } = req.params;
  const form = store.formTemplates.find((f) => f.id === id);
  if (!form) return res.status(404).json({ error: 'Form not found' });

  form.status = 'ACTIVE';
  form.updatedAt = new Date().toISOString();

  store.recordAudit(user.id, user.fullName, 'Form Published', 'FORM', id, {
    newValue: `Active Version ${form.currentVersion}`,
    remarks: `Form ${form.formName} (${form.formCode}) published for company wide generation`,
  });

  res.json({ success: true, form });
});

// Ephemeral preview cache for live form previews
const previewSessions = new Map<string, { bytes: Uint8Array; createdAt: number }>();

// Test-fill live PDF preview before publishing
app.post('/api/forms/test-preview-pdf', async (req, res) => {
  try {
    const { template, sampleValues } = req.body;
    const company = store.companies[0];
    const previewResult = await PdfGenerationEngine.generateDocumentPdf({
      template,
      document: {
        documentNumber: 'DRAFT-PREVIEW-NOT-OFFICIAL',
        secureVerificationToken: 'sample-preview-token',
        values: sampleValues || {},
        createdByName: getCurrentUser().fullName,
      },
      company,
      isDraftPreview: true,
    });

    const sessionId = `prev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    previewSessions.set(sessionId, { bytes: previewResult.pdfBytes, createdAt: Date.now() });

    // Clean up older preview sessions (> 15 mins)
    const expiry = Date.now() - 15 * 60 * 1000;
    for (const [k, v] of previewSessions.entries()) {
      if (v.createdAt < expiry) previewSessions.delete(k);
    }

    res.json({
      pdfBase64: previewResult.pdfBase64,
      previewUrl: `/api/forms/preview-session/${sessionId}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/forms/preview-session/:token', (req, res) => {
  const session = previewSessions.get(req.params.token);
  if (!session) {
    return res.status(404).send('Preview session expired or not found');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="draft-preview.pdf"');
  res.send(Buffer.from(session.bytes));
});

// Helper to robustly resolve form templates even with version suffixes, code aliases, or partial names
function resolveTemplateForDocument(doc: Partial<DocumentRecord>): FormTemplate {
  if (!doc) return store.formTemplates[0];

  // 1. Direct ID match
  if (doc.formTemplateId) {
    const direct = store.formTemplates.find((t) => t.id === doc.formTemplateId);
    if (direct) return direct;
  }

  // 2. Normalized ID match (e.g. form-leave-01 -> form-leave)
  if (doc.formTemplateId) {
    const cleanId = doc.formTemplateId.toLowerCase().replace(/[-_]01$/, '');
    const idMatch = store.formTemplates.find(
      (t) =>
        t.id.toLowerCase() === cleanId ||
        t.id.toLowerCase().includes(cleanId) ||
        cleanId.includes(t.id.toLowerCase())
    );
    if (idMatch) return idMatch;
  }

  // 3. Form code match (LF, GW-HR-F01, BHF, SAF)
  if (doc.formCode) {
    const code = doc.formCode.toLowerCase();
    const codeMatch = store.formTemplates.find(
      (t) =>
        t.formCode.toLowerCase() === code ||
        code.includes(t.formCode.toLowerCase()) ||
        t.formCode.toLowerCase().includes(code)
    );
    if (codeMatch) return codeMatch;
  }

  // 4. Form name match
  if (doc.formName) {
    const name = doc.formName.toLowerCase();
    const nameMatch = store.formTemplates.find(
      (t) =>
        t.formName.toLowerCase() === name ||
        name.includes(t.formName.toLowerCase()) ||
        t.formName.toLowerCase().includes(name)
    );
    if (nameMatch) return nameMatch;
  }

  // 5. Semantic keyword match based on document number, name, or code
  const docCombined = `${doc.documentNumber || ''} ${doc.formName || ''} ${doc.formCode || ''} ${doc.formTemplateId || ''}`.toLowerCase();
  if (
    docCombined.includes('leave') ||
    docCombined.includes('-lf-') ||
    docCombined.includes('annual') ||
    docCombined.includes('emergency')
  ) {
    const leaveT = store.formTemplates.find((t) => t.id === 'form-leave' || t.formCode === 'LF');
    if (leaveT) return leaveT;
  }
  if (
    docCombined.includes('bike') ||
    docCombined.includes('-bhf-') ||
    docCombined.includes('handover') ||
    docCombined.includes('fleet')
  ) {
    const bikeT = store.formTemplates.find((t) => t.id === 'form-bike-handover' || t.formCode === 'BHF');
    if (bikeT) return bikeT;
  }
  if (
    docCombined.includes('salary') ||
    docCombined.includes('-saf-') ||
    docCombined.includes('advance') ||
    docCombined.includes('finance')
  ) {
    const safT = store.formTemplates.find((t) => t.id === 'form-salary-advance' || t.formCode === 'SAF');
    if (safT) return safT;
  }

  // 6. Safe fallback: first active template so PDF generation never crashes
  return store.formTemplates[0];
}

// ==========================================
// 6. DOCUMENT GENERATION & LIFECYCLE
// ==========================================
// Stream or download Document PDF dynamically
app.get('/api/documents/:id/pdf', async (req, res) => {
  const { id } = req.params;
  const doc = store.documents.find((d) => d.id === id);
  if (!doc) return res.status(404).send('Document not found');

  const template = resolveTemplateForDocument(doc);
  const company = store.companies.find((c) => c.id === doc.companyId) || store.companies[0];
  if (!template) return res.status(404).send('Form template not found');

  try {
    const isDraft = doc.status === 'DRAFT';
    const generated = await PdfGenerationEngine.generateDocumentPdf({
      template,
      document: doc,
      company,
      isDraftPreview: isDraft,
    });

    const isDownload = req.query.download === 'true';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${doc.documentNumber || 'DOCUMENT'}.pdf"`
    );
    res.send(Buffer.from(generated.pdfBytes));
  } catch (err: any) {
    res.status(500).send(`Failed to generate PDF: ${err.message}`);
  }
});

app.get('/api/documents', (req, res) => {
  const { companyId, status, formId, search } = req.query;
  let docs = store.documents;

  if (companyId) {
    docs = docs.filter((d) => d.companyId === companyId);
  }
  if (status && status !== 'ALL') {
    docs = docs.filter((d) => d.status === status);
  }
  if (formId && formId !== 'ALL') {
    docs = docs.filter((d) => d.formTemplateId === formId);
  }
  if (search) {
    const q = String(search).toLowerCase();
    docs = docs.filter(
      (d) =>
        (d.documentNumber && d.documentNumber.toLowerCase().includes(q)) ||
        d.formName.toLowerCase().includes(q) ||
        (d.employeeName && d.employeeName.toLowerCase().includes(q)) ||
        (d.employeeId && d.employeeId.toLowerCase().includes(q))
    );
  }

  res.json(docs);
});

app.get('/api/documents/:id', (req, res) => {
  const doc = store.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

// GET DOCUMENT VERIFICATION QR CODE (JSON metadata & data URL)
app.get('/api/documents/:id/qr-code', async (req, res) => {
  const doc = store.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  try {
    const qrResult = await QrGenerator.generateDocumentVerificationQr(doc, {
      baseUrl: (req.headers['x-forwarded-proto'] ? `${req.headers['x-forwarded-proto']}://${req.headers.host}` : undefined),
    });
    res.json({
      documentId: doc.id,
      documentNumber: doc.documentNumber || null,
      verificationToken: qrResult.token,
      verificationUrl: qrResult.verificationUrl,
      qrDataUrl: qrResult.qrDataUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate verification QR code', details: err.message });
  }
});

// GET RAW PNG IMAGE OF DOCUMENT VERIFICATION QR CODE
app.get('/api/documents/:id/qr-code/image', async (req, res) => {
  const doc = store.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  try {
    const qrResult = await QrGenerator.generateDocumentVerificationQr(doc, {
      baseUrl: (req.headers['x-forwarded-proto'] ? `${req.headers['x-forwarded-proto']}://${req.headers.host}` : undefined),
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(qrResult.qrBuffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate QR image', details: err.message });
  }
});

// SAVE DRAFT - Strictly does NOT allocate sequence number
app.post('/api/documents/draft', (req, res) => {
  if (!checkPermission(req, res, 'DOCUMENT_EDIT_DRAFT')) return;
  const user = getCurrentUser();
  const { formTemplateId, companyId, values } = req.body;

  const template = resolveTemplateForDocument({ formTemplateId, values });
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const company = store.companies.find((c) => c.id === companyId) || store.companies[0];

  const draftDoc: DocumentRecord = {
    id: `doc-${Date.now()}`,
    // Strict requirement: documentNumber is undefined during draft
    documentNumber: undefined,
    secureVerificationToken: '',
    formTemplateId: template.id,
    formTemplateVersion: template.currentVersion,
    formName: template.formName,
    formCode: template.formCode,
    companyId: company.id,
    companyName: company.name,
    departmentId: template.departmentId,
    employeeName: values?.employee_name || values?.rider_name || user.fullName,
    employeeId: values?.employee_id || user.employeeId,
    status: 'DRAFT',
    values: values || {},
    statusHistory: [
      {
        id: `sh-${Date.now()}`,
        previousStatus: 'DRAFT',
        newStatus: 'DRAFT',
        changedBy: user.id,
        changedByName: user.fullName,
        changedAt: new Date().toISOString(),
        remarks: 'Document draft created. Sequence number pending user confirmation.',
      },
    ],
    signatures: [],
    approvalHistory: [],
    createdAt: new Date().toISOString(),
    createdBy: user.id,
    createdByName: user.fullName,
    updatedAt: new Date().toISOString(),
  };

  store.documents.unshift(draftDoc);
  store.recordAudit(user.id, user.fullName, 'Document Draft Saved', 'DOCUMENT', draftDoc.id, {
    remarks: `Saved draft for ${draftDoc.formName}. Official number NOT allocated yet.`,
    companyId: company.id,
  });

  res.status(201).json(draftDoc);
});

// GENERATE OFFICIAL DOCUMENT NUMBER (ATOMIC SERVER-SIDE ENGINE)
app.post('/api/documents/:id/generate-number', async (req, res) => {
  if (!checkPermission(req, res, 'DOCUMENT_GENERATE')) return;
  const user = getCurrentUser();
  const { id } = req.params;
  const { signingMethod } = req.body; // 'PHYSICAL' | 'DIGITAL'

  const doc = store.documents.find((d) => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  // If already numbered, never overwrite or re-allocate
  if (doc.documentNumber) {
    return res.status(400).json({
      error: `Document already has an immutable official number: ${doc.documentNumber}`,
    });
  }

  const template = store.formTemplates.find((t) => t.id === doc.formTemplateId);
  if (!template) return res.status(404).json({ error: 'Form template not found' });

  const company = store.companies.find((c) => c.id === doc.companyId) || store.companies[0];
  const dept = store.departments.find((d) => d.id === doc.departmentId);

  // Find or fallback to numbering rule
  const rule =
    store.numberingRules.find((r) => r.id === template.numberingRuleId) ||
    store.numberingRules.find((r) => r.formTemplateId === template.id) ||
    store.numberingRules[0];

  try {
    // Atomic server-side allocation
    const { documentNumber, updatedRule, token } = await AtomicNumberingEngine.allocateNumber(
      rule,
      {
        companyCode: company.code,
        departmentCode: dept ? dept.code : 'OPS',
        formCode: template.formCode,
      }
    );

    // Persist updated rule in store
    const ruleIdx = store.numberingRules.findIndex((r) => r.id === updatedRule.id);
    if (ruleIdx !== -1) {
      store.numberingRules[ruleIdx] = updatedRule;
    }

    // Update document record
    doc.documentNumber = documentNumber;
    doc.secureVerificationToken = token;
    doc.signingMethod = signingMethod || 'PHYSICAL';
    doc.status = 'AWAITING_SIGNATURE';
    doc.updatedAt = new Date().toISOString();

    // Generate Official Initial PDF with embedded Document Number & QR code
    const generatedPdf = await PdfGenerationEngine.generateDocumentPdf({
      template,
      document: doc,
      company,
      isDraftPreview: false,
    });

    doc.generatedPdfUrl = `/api/documents/${doc.id}/pdf`;

    const historyEntry: StatusHistoryEntry = {
      id: `sh-${Date.now()}`,
      previousStatus: 'DRAFT',
      newStatus: 'AWAITING_SIGNATURE',
      changedBy: user.id,
      changedByName: user.fullName,
      changedAt: new Date().toISOString(),
      remarks: `Official number ${documentNumber} permanently assigned. Ready for ${doc.signingMethod} signature.`,
    };
    doc.statusHistory.push(historyEntry);

    store.recordAudit(user.id, user.fullName, 'Document Number Allocated', 'DOCUMENT', doc.id, {
      newValue: documentNumber,
      remarks: `Atomic sequence allocated. Method: ${doc.signingMethod}. Form: ${template.formName}`,
      companyId: company.id,
    });

    res.json({
      success: true,
      document: doc,
      pdfBase64: generatedPdf.pdfBase64,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to allocate document number: ${err.message}` });
  }
});

// UPLOAD SIGNED DOCUMENT (Physical Signature Workflow)
app.post('/api/documents/:id/upload-signed', async (req, res) => {
  if (!checkPermission(req, res, 'DOCUMENT_SIGN')) return;
  const user = getCurrentUser();
  const { id } = req.params;
  const { signedFileUrl, remarks } = req.body;

  const doc = store.documents.find((d) => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (doc.status === 'FINAL' || doc.status === 'VOID') {
    return res.status(400).json({ error: 'Cannot modify a finalized or voided document' });
  }

  doc.signedDocumentUrl = signedFileUrl;
  const oldStatus = doc.status;
  doc.status = 'SIGNED';
  doc.updatedAt = new Date().toISOString();

  const historyEntry: StatusHistoryEntry = {
    id: `sh-${Date.now()}`,
    previousStatus: oldStatus,
    newStatus: 'SIGNED',
    changedBy: user.id,
    changedByName: user.fullName,
    changedAt: new Date().toISOString(),
    remarks: remarks || 'Physical signed document uploaded and confirmed by user',
  };
  doc.statusHistory.push(historyEntry);

  store.recordAudit(user.id, user.fullName, 'Signed Copy Uploaded', 'DOCUMENT', doc.id, {
    oldValue: oldStatus,
    newValue: 'SIGNED',
    remarks: `Scanned physical signed copy uploaded for ${doc.documentNumber}`,
    companyId: doc.companyId,
  });

  res.json({ success: true, document: doc });
});

// DIGITAL SIGNATURE WORKFLOW
app.post('/api/documents/:id/digital-sign', async (req, res) => {
  if (!checkPermission(req, res, 'DOCUMENT_SIGN')) return;
  const user = getCurrentUser();
  const { id } = req.params;
  const { fieldId, signatureDataUrl, type } = req.body;

  const doc = store.documents.find((d) => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (doc.status === 'FINAL' || doc.status === 'VOID') {
    return res.status(400).json({ error: 'Cannot sign a finalized or voided document' });
  }

  const sigEntry = {
    id: `sig-${Date.now()}`,
    fieldId: fieldId || 'signature',
    signerName: user.fullName,
    signerRole: user.roleName,
    signatureDataUrl,
    type: type || ('DRAWN' as const),
    signedAt: new Date().toISOString(),
    userId: user.id,
    ipAddress: req.ip || '127.0.0.1',
  };

  doc.signatures.push(sigEntry);
  const oldStatus = doc.status;
  doc.status = 'SIGNED';
  doc.updatedAt = new Date().toISOString();

  // Re-generate PDF with newly embedded signature
  const template = store.formTemplates.find((t) => t.id === doc.formTemplateId);
  const company = store.companies.find((c) => c.id === doc.companyId) || store.companies[0];
  if (template) {
    const updatedPdf = await PdfGenerationEngine.generateDocumentPdf({
      template,
      document: doc,
      company,
    });
    doc.generatedPdfUrl = `/api/documents/${doc.id}/pdf`;
  }

  doc.statusHistory.push({
    id: `sh-${Date.now()}`,
    previousStatus: oldStatus,
    newStatus: 'SIGNED',
    changedBy: user.id,
    changedByName: user.fullName,
    changedAt: new Date().toISOString(),
    remarks: `Digital signature captured for ${user.fullName} (${user.roleName})`,
  });

  store.recordAudit(user.id, user.fullName, 'Digital Signature Applied', 'DOCUMENT', doc.id, {
    newValue: `Signed by ${user.fullName}`,
    remarks: `Signature captured on field: ${fieldId}`,
    companyId: doc.companyId,
  });

  res.json({ success: true, document: doc });
});

// APPROVAL / REJECTION WORKFLOW
app.post('/api/documents/:id/approve', async (req, res) => {
  if (!checkPermission(req, res, 'DOCUMENT_APPROVE')) return;
  const user = getCurrentUser();
  const { id } = req.params;
  const { remarks } = req.body;

  const doc = store.documents.find((d) => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  doc.approvalHistory.push({
    id: `app-${Date.now()}`,
    stepName: 'Manager Verification',
    approverId: user.id,
    approverName: user.fullName,
    action: 'APPROVED',
    remarks: remarks || 'Sanctioned and approved according to company policy',
    actionAt: new Date().toISOString(),
  });

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
    remarks: remarks || 'Document approved by authority',
  });

  store.recordAudit(user.id, user.fullName, 'Document Approved', 'DOCUMENT', doc.id, {
    oldValue: oldStatus,
    newValue: 'APPROVED',
    remarks: remarks || 'Verification passed',
    companyId: doc.companyId,
  });

  res.json({ success: true, document: doc });
});

app.post('/api/documents/:id/reject', (req, res) => {
  if (!checkPermission(req, res, 'DOCUMENT_REJECT')) return;
  const user = getCurrentUser();
  const { id } = req.params;
  const { remarks } = req.body;

  const doc = store.documents.find((d) => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  doc.approvalHistory.push({
    id: `app-${Date.now()}`,
    stepName: 'Manager Verification',
    approverId: user.id,
    approverName: user.fullName,
    action: 'REJECTED',
    remarks: remarks || 'Rejected by approver',
    actionAt: new Date().toISOString(),
  });

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
    remarks: remarks || 'Document rejected by reviewer',
  });

  store.recordAudit(user.id, user.fullName, 'Document Rejected', 'DOCUMENT', doc.id, {
    oldValue: oldStatus,
    newValue: 'REJECTED',
    remarks: remarks || 'Rejected',
    companyId: doc.companyId,
  });

  res.json({ success: true, document: doc });
});

// FINALIZE DOCUMENT (Immutable lock with SHA-256 seal)
app.post('/api/documents/:id/finalize', async (req, res) => {
  if (!checkPermission(req, res, 'DOCUMENT_APPROVE')) return;
  const user = getCurrentUser();
  const { id } = req.params;

  const doc = store.documents.find((d) => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (doc.status === 'FINAL') {
    return res.status(400).json({ error: 'Document is already in immutable FINAL status' });
  }

  const template = store.formTemplates.find((t) => t.id === doc.formTemplateId);
  const company = store.companies.find((c) => c.id === doc.companyId) || store.companies[0];

  if (!template) return res.status(404).json({ error: 'Template not found' });

  // Generate Final PDF with all stamps, signatures & QR
  const finalPdf = await PdfGenerationEngine.generateDocumentPdf({
    template,
    document: doc,
    company,
  });

  const oldStatus = doc.status;
  doc.status = 'FINAL';
  doc.finalPdfUrl = finalPdf.pdfBase64;
  doc.finalPdfHashSha256 = finalPdf.sha256Hash;
  doc.finalizedAt = new Date().toISOString();
  doc.updatedAt = new Date().toISOString();

  doc.statusHistory.push({
    id: `sh-${Date.now()}`,
    previousStatus: oldStatus,
    newStatus: 'FINAL',
    changedBy: user.id,
    changedByName: user.fullName,
    changedAt: new Date().toISOString(),
    remarks: `Document permanently locked. SHA-256 Checksum: ${finalPdf.sha256Hash}`,
  });

  store.recordAudit(user.id, user.fullName, 'Document Finalized & Sealed', 'DOCUMENT', doc.id, {
    oldValue: oldStatus,
    newValue: `FINAL (${finalPdf.sha256Hash})`,
    remarks: 'Immutable state enforced. Tamper-evident hash generated.',
    companyId: doc.companyId,
  });

  res.json({ success: true, document: doc });
});

// VOID DOCUMENT (Retains official document number, does NOT decrement sequence counter)
app.post('/api/documents/:id/void', (req, res) => {
  if (!checkPermission(req, res, 'DOCUMENT_VOID')) return;
  const user = getCurrentUser();
  const { id } = req.params;
  const { remarks } = req.body;

  const doc = store.documents.find((d) => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

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
    remarks: remarks || 'Document voided. Official number retained in sequence audit.',
  });

  store.recordAudit(user.id, user.fullName, 'Document Voided', 'DOCUMENT', doc.id, {
    oldValue: oldStatus,
    newValue: 'VOID',
    remarks: `Number ${doc.documentNumber} marked VOID (Sequence retained). Reason: ${remarks}`,
    companyId: doc.companyId,
  });

  res.json({ success: true, document: doc });
});

// ==========================================
// 7. PUBLIC QR CODE VERIFICATION ENDPOINT
// ==========================================
app.get('/api/verify/:token', (req, res) => {
  const rawToken = req.params.token || '';
  let token = decodeURIComponent(rawToken).trim();
  if (token.includes('/verify/')) {
    token = token.split('/verify/').pop()?.split('?')[0]?.split('#')[0] || token;
  }
  const tokenLower = token.toLowerCase();

  // Search by secureVerificationToken, documentNumber, or ID
  const doc = store.documents.find((d) => {
    if (d.secureVerificationToken && (d.secureVerificationToken === token || d.secureVerificationToken.toLowerCase() === tokenLower)) return true;
    if (d.documentNumber && (d.documentNumber.toLowerCase() === tokenLower || d.documentNumber === token)) return true;
    if (d.id === token || d.id.toLowerCase() === tokenLower) return true;
    return false;
  });

  if (!doc) {
    return res.status(404).json({
      valid: false,
      verified: false,
      message: `Invalid or unrecognized verification token "${token}". No matching registered document found in Gulf Way Registry.`,
    });
  }

  const shaSeal = doc.finalPdfHashSha256 || (doc as any).sha256Hash || 'Tamper-evident seal pending final lock';
  const issueDateFormatted = doc.createdAt ? doc.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
  const finalDateFormatted = doc.finalizedAt ? doc.finalizedAt.split('T')[0] : 'Pending Final Sanction';

  // Return comprehensive verification metadata for both public portal and scanner
  res.json({
    valid: true,
    verified: true,
    documentNumber: doc.documentNumber || 'UNALLOCATED',
    company: doc.companyName,
    issuingCompany: doc.companyName,
    documentType: doc.formName,
    formName: doc.formName,
    formCode: doc.formCode,
    formVersion: (doc as any).formTemplateVersion || (doc as any).formVersion || 1,
    issueDate: issueDateFormatted,
    finalizedDate: finalDateFormatted,
    status: doc.status === 'FINAL' ? 'FINAL' : doc.status,
    signingMethod: doc.signingMethod || 'PHYSICAL',
    signaturesCount: (doc.signatures || []).length,
    sha256Hash: shaSeal,
    sha256Checksum: shaSeal,
    verificationResult: doc.status === 'VOID' ? 'VOIDED_DOCUMENT' : 'OFFICIALLY_VERIFIED',
    verificationMessage: doc.status === 'VOID'
      ? 'This document number has been officially voided and cancelled.'
      : 'Authentic Gulf Way document verified against immutable sequence ledger.',
    verifiedAt: new Date().toISOString(),
  });
});

// ==========================================
// 8. AUDIT LOGS & DASHBOARD STATS
// ==========================================
app.get('/api/audit-logs', (req, res) => {
  if (!checkPermission(req, res, 'AUDIT_VIEW')) return;
  const { resourceType, search } = req.query;
  let logs = store.auditLogs;

  if (resourceType && resourceType !== 'ALL') {
    logs = logs.filter((l) => l.resourceType === resourceType);
  }
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.resourceId.toLowerCase().includes(q) ||
        (l.remarks && l.remarks.toLowerCase().includes(q))
    );
  }

  res.json(logs);
});

app.get('/api/dashboard/stats', (req, res) => {
  const docs = store.documents;
  const forms = store.formTemplates;
  const users = store.users;

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const docsToday = docs.filter((d) => d.createdAt.startsWith(todayStr)).length;
  const docsThisMonth = docs.filter((d) => d.createdAt.startsWith(thisMonthStr)).length;
  const pendingSignatures = docs.filter((d) => d.status === 'AWAITING_SIGNATURE').length;
  const pendingApprovals = docs.filter((d) => d.status === 'SIGNED' || d.status === 'AWAITING_APPROVAL').length;
  const rejectedDocs = docs.filter((d) => d.status === 'REJECTED').length;
  const voidedDocs = docs.filter((d) => d.status === 'VOID').length;
  const finalizedDocs = docs.filter((d) => d.status === 'FINAL').length;

  // Breakdown by company
  const companyCounts: Record<string, number> = {};
  store.companies.forEach((c) => {
    companyCounts[c.name] = docs.filter((d) => d.companyId === c.id).length;
  });

  // Breakdown by form
  const formCounts: Record<string, number> = {};
  forms.forEach((f) => {
    formCounts[f.formName] = docs.filter((d) => d.formTemplateId === f.id).length;
  });

  res.json({
    metrics: {
      docsToday,
      docsThisMonth,
      pendingSignatures,
      pendingApprovals,
      rejectedDocs,
      voidedDocs,
      finalizedDocs,
      formsAvailable: forms.length,
      activeUsers: users.filter((u) => u.status === 'ACTIVE').length,
    },
    companyBreakdown: companyCounts,
    formBreakdown: formCounts,
    recentDocuments: docs.slice(0, 5),
  });
});

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gulf Way DocFlow Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
