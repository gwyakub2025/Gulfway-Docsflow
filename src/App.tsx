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
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      + Create New Form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {forms.map((form) => (
                      <div
                        key={form.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-blue-400 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                              {form.formCode}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              Version {form.currentVersion}
                            </span>
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
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                          >
                            Edit Fields
                          </button>
                          <button
                            onClick={() => {
                              setActiveFormForFill(form);
                              setCurrentTab('create-document');
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                          >
                            Fill Form →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                />
              )}

              {/* COMPANIES TAB */}
              {currentTab === 'companies' && (
                <CompaniesView
                  companies={companies}
                  onCompanyCreated={async (newComp) => {
                    setCompanies([...companies, newComp]);
                  }}
                />
              )}

              {/* USERS & ROLES TAB */}
              {currentTab === 'users-roles' && (
                <UsersRolesView users={users} roles={roles} companies={companies} />
              )}

              {/* AUDIT LOGS TAB */}
              {currentTab === 'audit-logs' && <AuditLogsView logs={auditLogs} />}

              {/* SETTINGS / ARCHITECTURE TAB */}
              {currentTab === 'settings' && <ArchitectureView />}
            </>
          )}
        </main>
      </div>

      {/* PHYSICAL SIGNATURE MODAL */}
      {physicalSignModalDoc && (
        <PhysicalSignatureModal
          document={physicalSignModalDoc.doc}
          pdfBase64={physicalSignModalDoc.pdfBase64}
          onSuccess={async (updatedDoc) => {
            setPhysicalSignModalDoc(null);
            if (activeDocumentDetails?.id === updatedDoc.id) {
              setActiveDocumentDetails(updatedDoc);
            }
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
            setDigitalSignModalDoc(null);
            if (activeDocumentDetails?.id === updatedDoc.id) {
              setActiveDocumentDetails(updatedDoc);
            }
            await refreshDocumentsAndStats();
          }}
          onClose={() => setDigitalSignModalDoc(null)}
        />
      )}
    </div>
  );
}
export default App;
