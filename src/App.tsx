import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { Dashboard } from './components/Dashboard.js';
import { FormBuilder } from './components/FormBuilder.js';
import { DocumentCreator } from './components/DocumentCreator.js';
import { DocumentRegister } from './components/DocumentRegister.js';
import { DocumentDetails } from './components/DocumentDetails.js';
import { PhysicalSignatureModal } from './components/PhysicalSignatureModal.js';
import { DigitalSignatureModal } from './components/DigitalSignatureModal.js';
import { PublicVerifyPage } from './components/PublicVerifyPage.js';
import { CompaniesView } from './components/CompaniesView.js';
import { NumberingRulesView } from './components/NumberingRulesView.js';
import { UsersRolesView } from './components/UsersRolesView.js';
import { AuditLogsView } from './components/AuditLogsView.js';
import { ArchitectureView } from './components/ArchitectureView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import {
  FileText,
  Trash2,
  Plus,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import {
  Company,
  Department,
  NumberingRule,
  FormTemplate,
  DocumentRecord,
  AuditLog,
  User,
  Role,
} from './types/index.js';
import { api } from './api.js';

export function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isPublicVerifyMode, setIsPublicVerifyMode] = useState<boolean>(false);
  const [verifyToken, setVerifyToken] = useState<string>('vt_sample_leave_001024');

  // Multi-Company Filter State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');

  // Application Data States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsersList, setAllUsersList] = useState<Array<{ id: string; fullName: string; roleName: string; email: string }>>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [numberingRules, setNumberingRules] = useState<NumberingRule[]>([]);
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Form deletion state
  const [formToDelete, setFormToDelete] = useState<FormTemplate | null>(null);
  const [isDeletingForm, setIsDeletingForm] = useState(false);

  // Workflow Active Objects
  const [activeFormForFill, setActiveFormForFill] = useState<FormTemplate | null>(null);
  const [activeFormForEdit, setActiveFormForEdit] = useState<FormTemplate | null>(null);
  const [activeDocumentDetails, setActiveDocumentDetails] = useState<DocumentRecord | null>(null);
  const [physicalSignModalDoc, setPhysicalSignModalDoc] = useState<{ doc: DocumentRecord; pdfBase64?: string } | null>(null);
  const [digitalSignModalDoc, setDigitalSignModalDoc] = useState<DocumentRecord | null>(null);

  // Loading indicator
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial master data
  const loadInitialData = async () => {
    try {
      const [
        meData,
        compData,
        deptData,
        rulesData,
        formsData,
        docsData,
        logsData,
        usersData,
        rolesData,
        statsData,
      ] = await Promise.all([
        api.getMe(),
        api.getCompanies(),
        api.getDepartments(),
        api.getNumberingRules(),
        api.getForms(),
        api.getDocuments(),
        api.getAuditLogs(),
        api.getUsers(),
        api.getRoles(),
        api.getDashboardStats(),
      ]);

      setCurrentUser(meData.user);
      setAllUsersList(meData.allUsers || []);
      setCompanies(compData);
      setDepartments(deptData);
      setNumberingRules(rulesData);
      setForms(formsData);
      setDocuments(docsData);
      setAuditLogs(logsData);
      setUsers(usersData);
      setRoles(rolesData);
      setDashboardStats(statsData);
    } catch (err) {
      console.error('Failed to load application data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if URL points to a public verification endpoint (e.g. /verify/:token, ?token=:token, or #/verify/:token)
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      let detectedToken = '';
      if (pathname.includes('/verify/')) {
        detectedToken = pathname.split('/verify/').pop()?.split('/')[0]?.split('?')[0] || '';
      } else if (searchParams.get('token')) {
        detectedToken = searchParams.get('token') || '';
      } else if (searchParams.get('verify')) {
        detectedToken = searchParams.get('verify') || '';
      } else if (hash.includes('/verify/')) {
        detectedToken = hash.split('/verify/').pop()?.split('/')[0]?.split('?')[0] || '';
      }

      if (detectedToken) {
        setVerifyToken(decodeURIComponent(detectedToken));
        setIsPublicVerifyMode(true);
      }
    }

    loadInitialData();
  }, []);

  // Refresh documents and stats after key actions
  const refreshDocumentsAndStats = async () => {
    try {
      const [docsData, statsData, logsData] = await Promise.all([
        api.getDocuments(),
        api.getDashboardStats(),
        api.getAuditLogs(),
      ]);
      setDocuments(docsData);
      setDashboardStats(statsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to refresh documents', err);
    }
  };

  // User Switching for testing RBAC
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await api.switchUser(userId);
      if (res.success) {
        setCurrentUser(res.user);
        await refreshDocumentsAndStats();
      }
    } catch (err) {
      console.error('User switch error', err);
    }
  };

  // Compute pending counts for sidebar badges
  const pendingSignaturesCount = documents.filter(
    (d) => d.status === 'AWAITING_SIGNATURE' || d.status === 'NUMBER_ASSIGNED'
  ).length;

  const pendingApprovalsCount = documents.filter(
    (d) => d.status === 'SIGNED' || d.status === 'AWAITING_APPROVAL'
  ).length;

  // Render Public Verification Page if active
  if (isPublicVerifyMode) {
    return (
      <PublicVerifyPage
        initialToken={verifyToken}
        onBackToApp={() => setIsPublicVerifyMode(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 animate-pulse">
          GW
        </div>
        <div className="text-sm font-semibold tracking-wide">
          Loading Gulf Way DocFlow System...
        </div>
        <p className="text-xs text-slate-400">
          Mounting Atomic Sequential Engine & Multi-Company Directory
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900 antialiased">
      {/* Primary Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setActiveDocumentDetails(null);
          if (tab === 'create-document') {
            setActiveFormForFill(null);
          }
          if (tab === 'form-builder') {
            setActiveFormForEdit(null);
          }
        }}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={setSelectedCompanyId}
        pendingSignaturesCount={pendingSignaturesCount}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          allUsers={allUsersList}
          onSwitchUser={handleSwitchUser}
          onOpenQuickVerify={() => {
            setVerifyToken('vt_sample_leave_001024');
            setIsPublicVerifyMode(true);
          }}
          onQuickCreate={() => {
            setActiveFormForFill(forms[0] || null);
            setCurrentTab('create-document');
            setActiveDocumentDetails(null);
          }}
        />

        {/* Scrollable Work View Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {/* Active Document Details View */}
          {activeDocumentDetails ? (
            <DocumentDetails
              document={activeDocumentDetails}
              currentUser={currentUser}
              onBack={() => setActiveDocumentDetails(null)}
              onOpenPhysicalSign={(doc) => setPhysicalSignModalDoc({ doc })}
              onOpenDigitalSign={(doc) => setDigitalSignModalDoc(doc)}
              onDocumentUpdated={async (updatedDoc) => {
                setActiveDocumentDetails(updatedDoc);
                await refreshDocumentsAndStats();
              }}
              onOpenPublicVerify={(token) => {
                setVerifyToken(token);
                setIsPublicVerifyMode(true);
              }}
            />
          ) : (
            <>
              {/* DASHBOARD TAB */}
              {currentTab === 'dashboard' && (
                <Dashboard
                  stats={dashboardStats}
                  forms={forms}
                  onSelectForm={(form) => {
                    setActiveFormForFill(form);
                    setCurrentTab('create-document');
                  }}
                  onViewDocument={(doc) => setActiveDocumentDetails(doc)}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                />
              )}

              {/* FORMS CATALOG TAB */}
              {currentTab === 'form-library' && (
                <div className="p-8 max-w-7xl mx-auto space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Company Forms & Templates Catalog
                      </h2>
                      <p className="text-xs text-slate-500">
                        Browse active templates, view field mappings, or launch new document requests.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveFormForEdit(null);
                        setCurrentTab('form-builder');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Form</span>
                    </button>
                  </div>

                  {forms.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-2xs">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">
                          No Form Templates Configured
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                          Your catalog is empty. Build custom forms with dynamic fields, approvals, and numbering links using our Form Builder.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFormForEdit(null);
                            setCurrentTab('form-builder');
                          }}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Build Your First Form</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {forms.map((form) => (
                        <div
                          key={form.id}
                          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-blue-400 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                                {form.formCode}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-slate-500">
                                  v{form.currentVersion}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setFormToDelete(form)}
                                  className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                  title="Delete Form Template"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <h3 className="font-bold text-slate-900 text-base mt-2.5">
                              {form.formName}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {form.description}
                            </p>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-slate-400">{form.fields.length} Mapped Fields</span>
                              <span className="text-blue-600 font-semibold">{form.category}</span>
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setActiveFormForEdit(form);
                                setCurrentTab('form-builder');
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Edit Fields
                            </button>
                            <button
                              onClick={() => {
                                setActiveFormForFill(form);
                                setCurrentTab('create-document');
                              }}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                            >
                              Fill Form →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CREATE DOCUMENT TAB */}
              {currentTab === 'create-document' && (
                <DocumentCreator
                  forms={forms}
                  companies={companies}
                  selectedForm={activeFormForFill}
                  onSelectForm={(form) => setActiveFormForFill(form)}
                  onDocumentCreated={async (newDoc) => {
                    await refreshDocumentsAndStats();
                    setActiveDocumentDetails(newDoc);
                  }}
                  onCancel={() => setActiveFormForFill(null)}
                  onNavigateToFormBuilder={() => setCurrentTab('form-builder')}
                />
              )}

              {/* DOCUMENT REGISTER TAB */}
              {currentTab === 'document-register' && (
                <DocumentRegister
                  documents={documents}
                  companies={companies}
                  forms={forms}
                  currentUser={currentUser}
                  onViewDocument={(doc) => setActiveDocumentDetails(doc)}
                  onOpenPhysicalSign={(doc) => setPhysicalSignModalDoc({ doc })}
                  onOpenDigitalSign={(doc) => setDigitalSignModalDoc(doc)}
                  onDocumentUpdated={async () => {
                    await refreshDocumentsAndStats();
                  }}
                  selectedCompanyId={selectedCompanyId}
                />
              )}

              {/* PENDING SIGNATURES TAB */}
              {currentTab === 'pending-signatures' && (
                <DocumentRegister
                  documents={documents.filter(
                    (d) => d.status === 'AWAITING_SIGNATURE' || d.status === 'NUMBER_ASSIGNED'
                  )}
                  companies={companies}
                  forms={forms}
                  currentUser={currentUser}
                  onViewDocument={(doc) => setActiveDocumentDetails(doc)}
                  onOpenPhysicalSign={(doc) => setPhysicalSignModalDoc({ doc })}
                  onOpenDigitalSign={(doc) => setDigitalSignModalDoc(doc)}
                  onDocumentUpdated={async () => {
                    await refreshDocumentsAndStats();
                  }}
                  selectedCompanyId={selectedCompanyId}
                />
              )}

              {/* PENDING APPROVALS TAB */}
              {currentTab === 'pending-approvals' && (
                <DocumentRegister
                  documents={documents.filter(
                    (d) => d.status === 'SIGNED' || d.status === 'AWAITING_APPROVAL'
                  )}
                  companies={companies}
                  forms={forms}
                  currentUser={currentUser}
                  onViewDocument={(doc) => setActiveDocumentDetails(doc)}
                  onOpenPhysicalSign={(doc) => setPhysicalSignModalDoc({ doc })}
                  onOpenDigitalSign={(doc) => setDigitalSignModalDoc(doc)}
                  onDocumentUpdated={async () => {
                    await refreshDocumentsAndStats();
                  }}
                  selectedCompanyId={selectedCompanyId}
                />
              )}

              {/* FORM BUILDER TAB */}
              {currentTab === 'form-builder' && (
                <FormBuilder
                  companies={companies}
                  departments={departments}
                  numberingRules={numberingRules}
                  existingForm={activeFormForEdit}
                  onSaveSuccess={async (savedForm) => {
                    const updatedForms = await api.getForms();
                    setForms(updatedForms);
                    setActiveFormForEdit(null);
                    setCurrentTab('form-library');
                  }}
                  onCancel={() => {
                    setActiveFormForEdit(null);
                    setCurrentTab('form-library');
                  }}
                />
              )}

              {/* NUMBERING RULES TAB */}
              {currentTab === 'numbering-rules' && (
                <NumberingRulesView
                  rules={numberingRules}
                  companies={companies}
                  onRuleCreated={async (newRule) => {
                    setNumberingRules([...numberingRules, newRule]);
                  }}
                  onRuleUpdated={(updatedRule) => {
                    setNumberingRules(
                      numberingRules.map((r) => (r.id === updatedRule.id ? updatedRule : r))
                    );
                  }}
                  onRuleDeleted={(deletedId) => {
                    setNumberingRules(numberingRules.filter((r) => r.id !== deletedId));
                  }}
                />
              )}

              {/* COMPANIES TAB */}
              {currentTab === 'companies' && (
                <CompaniesView
                  companies={companies}
                  departments={departments}
                  onCompanyCreated={async (newComp) => {
                    setCompanies([...companies, newComp]);
                    await refreshDocumentsAndStats();
                  }}
                  onCompanyUpdated={(updatedComp) => {
                    setCompanies(
                      companies.map((c) => (c.id === updatedComp.id ? updatedComp : c))
                    );
                  }}
                  onCompanyDeleted={(deletedId) => {
                    setCompanies(companies.filter((c) => c.id !== deletedId));
                    if (selectedCompanyId === deletedId) {
                      setSelectedCompanyId('ALL');
                    }
                  }}
                  onDepartmentCreated={(newDept) => {
                    setDepartments([...departments, newDept]);
                  }}
                  onDepartmentDeleted={(deletedId) => {
                    setDepartments(departments.filter((d) => d.id !== deletedId));
                  }}
                  onResetAllData={async () => {
                    await loadInitialData();
                    setSelectedCompanyId('ALL');
                  }}
                />
              )}

              {/* USERS & ROLES TAB */}
              {currentTab === 'users-roles' && (
                <UsersRolesView
                  users={users}
                  roles={roles}
                  companies={companies}
                  currentUser={currentUser}
                  onUserCreated={(newUser) => {
                    setUsers([...users, newUser]);
                    setAllUsersList([
                      ...allUsersList,
                      {
                        id: newUser.id,
                        fullName: newUser.fullName,
                        employeeId: newUser.employeeId,
                        roleName: newUser.roleName,
                        email: newUser.email,
                      },
                    ]);
                  }}
                  onUserUpdated={(updatedUser) => {
                    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
                    setAllUsersList(
                      allUsersList.map((u) =>
                        u.id === updatedUser.id
                          ? {
                              id: updatedUser.id,
                              fullName: updatedUser.fullName,
                              employeeId: updatedUser.employeeId,
                              roleName: updatedUser.roleName,
                              email: updatedUser.email,
                            }
                          : u
                      )
                    );
                    if (currentUser?.id === updatedUser.id) {
                      setCurrentUser(updatedUser);
                    }
                  }}
                  onUserDeleted={(deletedId) => {
                    const remaining = users.filter((u) => u.id !== deletedId);
                    setUsers(remaining);
                    setAllUsersList(allUsersList.filter((u) => u.id !== deletedId));
                    if (currentUser?.id === deletedId && remaining.length > 0) {
                      setCurrentUser(remaining[0]);
                    }
                  }}
                  onRoleCreated={(newRole) => {
                    setRoles([...roles, newRole]);
                  }}
                  onRoleUpdated={(updatedRole) => {
                    setRoles(roles.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
                    if (currentUser?.roleId === updatedRole.id) {
                      setCurrentUser({
                        ...currentUser,
                        roleName: updatedRole.name,
                        permissions: updatedRole.permissions,
                      });
                    }
                  }}
                  onRoleDeleted={(deletedId) => {
                    setRoles(roles.filter((r) => r.id !== deletedId));
                  }}
                />
              )}

              {/* AUDIT LOGS TAB */}
              {currentTab === 'audit-logs' && <AuditLogsView logs={auditLogs} />}

              {/* ANALYTICS TAB */}
              {currentTab === 'analytics' && (
                <AnalyticsView
                  documents={documents}
                  companies={companies}
                  forms={forms}
                  auditLogs={auditLogs}
                  onViewDocument={(doc) => setActiveDocumentDetails(doc)}
                  onNavigateToTab={(tab) => setCurrentTab(tab)}
                />
              )}

              {/* SETTINGS / ARCHITECTURE TAB */}
              {currentTab === 'settings' && (
                <ArchitectureView onNavigate={(tab) => setCurrentTab(tab)} />
              )}
            </>
          )}
        </main>
      </div>

      {/* DELETE FORM CONFIRMATION MODAL */}
      {formToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3.5 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete Form Template?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <strong className="text-slate-900 font-mono">"{formToDelete.formName}"</strong> ({formToDelete.formCode})? Existing finalized documents created with this form will be preserved in audit records.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingForm}
                onClick={() => setFormToDelete(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingForm}
                onClick={async () => {
                  setIsDeletingForm(true);
                  try {
                    await api.deleteForm(formToDelete.id);
                    setForms(forms.filter((f) => f.id !== formToDelete.id));
                    setFormToDelete(null);
                  } catch (err: any) {
                    alert(`Error deleting form: ${err.message}`);
                  } finally {
                    setIsDeletingForm(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingForm ? 'Deleting...' : 'Delete Form'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHYSICAL SIGNATURE MODAL */}
      {physicalSignModalDoc && (
        <PhysicalSignatureModal
          document={physicalSignModalDoc.doc}
          pdfBase64={physicalSignModalDoc.pdfBase64}
          onSuccess={async (updatedDoc) => {
            console.log('[App] Physical signature success callback received - transitioning to next step:', {
              documentId: updatedDoc.id,
              documentNumber: updatedDoc.documentNumber,
              previousStatus: physicalSignModalDoc.doc.status,
              newStatus: updatedDoc.status,
              signaturesCount: updatedDoc.signatures?.length,
              signedDocumentUrlPresent: !!updatedDoc.signedDocumentUrl,
            });
            setPhysicalSignModalDoc(null);
            setActiveDocumentDetails(updatedDoc);
            await refreshDocumentsAndStats();
          }}
          onClose={() => setPhysicalSignModalDoc(null)}
        />
      )}

      {/* DIGITAL SIGNATURE MODAL */}
      {digitalSignModalDoc && (
        <DigitalSignatureModal
          document={digitalSignModalDoc}
          currentUser={currentUser}
          onSuccess={async (updatedDoc) => {
            console.log('[App] Digital signature success callback received - transitioning to next step:', {
              documentId: updatedDoc.id,
              documentNumber: updatedDoc.documentNumber,
              previousStatus: digitalSignModalDoc.status,
              newStatus: updatedDoc.status,
              signaturesCount: updatedDoc.signatures?.length,
            });
            setDigitalSignModalDoc(null);
            setActiveDocumentDetails(updatedDoc);
            await refreshDocumentsAndStats();
          }}
          onClose={() => setDigitalSignModalDoc(null)}
        />
      )}
    </div>
  );
}
export default App;
