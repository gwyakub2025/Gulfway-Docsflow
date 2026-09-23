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
import { OnboardingWizard } from './components/OnboardingWizard.js';
import { AdminPanel } from './components/AdminPanel.js';
import { ImpersonationBanner } from './components/ImpersonationBanner.js';
import { ImpersonateModal } from './components/ImpersonateModal.js';
import { UserScreenOverviewModal } from './components/UserScreenOverviewModal.js';
import {
  FileText,
  Trash2,
  Plus,
  AlertTriangle,
  FolderOpen,
  CheckSquare,
  Square,
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
import { subscribeToRealtimeDocuments } from './firebase.js';

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

  // Bulk template selection & deletion state
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  // Workflow Active Objects
  const [activeFormForFill, setActiveFormForFill] = useState<FormTemplate | null>(null);
  const [activeFormForEdit, setActiveFormForEdit] = useState<FormTemplate | null>(null);
  const [activeDocumentDetails, setActiveDocumentDetails] = useState<DocumentRecord | null>(null);
  const [physicalSignModalDoc, setPhysicalSignModalDoc] = useState<{ doc: DocumentRecord; pdfBase64?: string } | null>(null);
  const [digitalSignModalDoc, setDigitalSignModalDoc] = useState<DocumentRecord | null>(null);

  // Onboarding Wizard state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Impersonation States
  const [originalAdminUser, setOriginalAdminUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('docflow_impersonating_admin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState<boolean>(false);
  const [isScreenOverviewModalOpen, setIsScreenOverviewModalOpen] = useState<boolean>(false);

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
      if (meData.impersonatedBy) {
        setOriginalAdminUser(meData.impersonatedBy);
        try {
          sessionStorage.setItem('docflow_impersonating_admin', JSON.stringify(meData.impersonatedBy));
        } catch {}
      }
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

      // If database is clean/empty (no companies registered yet), launch onboarding wizard automatically
      if (compData.length === 0) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('Failed to load application data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingCompleted = async (data: {
    company: Company;
    departments: Department[];
    numberingRule?: NumberingRule;
  }) => {
    setCompanies((prev) => {
      const exists = prev.some((c) => c.id === data.company.id);
      return exists ? prev : [...prev, data.company];
    });
    setDepartments((prev) => {
      const newDepts = data.departments.filter((d) => !prev.some((p) => p.id === d.id));
      return [...prev, ...newDepts];
    });
    if (data.numberingRule) {
      setNumberingRules((prev) => {
        const exists = prev.some((r) => r.id === data.numberingRule!.id);
        return exists ? prev : [...prev, data.numberingRule!];
      });
    }
    setShowOnboarding(false);
    await refreshDocumentsAndStats();
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

    // Subscribe to realtime changes in Firebase Firestore
    const unsub = subscribeToRealtimeDocuments((updatedDocs) => {
      if (updatedDocs && updatedDocs.length > 0) {
        setDocuments((prevDocs) => {
          const map = new Map<string, DocumentRecord>();
          prevDocs.forEach((d) => map.set(d.id, d));
          updatedDocs.forEach((d) => map.set(d.id, d));
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsub();
    };
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

  // Bulk Delete Form Templates action
  const handleBulkDeleteForms = async () => {
    if (selectedFormIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await api.bulkDeleteForms(selectedFormIds);
      if (res.success) {
        setForms(forms.filter((f) => !selectedFormIds.includes(f.id)));
        setSelectedFormIds([]);
        setIsBulkDeleteModalOpen(false);
        await refreshDocumentsAndStats();
      }
    } catch (err) {
      console.error('Failed to bulk delete forms', err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelectForm = (id: string) => {
    setSelectedFormIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllForms = () => {
    if (selectedFormIds.length === forms.length) {
      setSelectedFormIds([]);
    } else {
      setSelectedFormIds(forms.map((f) => f.id));
    }
  };

  // User Switching for testing RBAC
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await api.switchUser(userId);
      if (res.success) {
        setCurrentUser(res.user);
        setOriginalAdminUser(null);
        try {
          sessionStorage.removeItem('docflow_impersonating_admin');
        } catch {}
        await refreshDocumentsAndStats();
      }
    } catch (err) {
      console.error('User switch error', err);
    }
  };

  // Start Impersonation
  const handleStartImpersonation = async (targetUserId: string) => {
    try {
      const adminToRecord = originalAdminUser || currentUser;
      if (adminToRecord) {
        setOriginalAdminUser(adminToRecord);
        try {
          sessionStorage.setItem('docflow_impersonating_admin', JSON.stringify(adminToRecord));
        } catch {}
      }
      const res = await api.impersonateUser(targetUserId, adminToRecord?.id);
      if (res.success) {
        setCurrentUser(res.user);
        if (res.impersonatedBy) {
          setOriginalAdminUser(res.impersonatedBy);
          try {
            sessionStorage.setItem('docflow_impersonating_admin', JSON.stringify(res.impersonatedBy));
          } catch {}
        }
        await refreshDocumentsAndStats();
      }
    } catch (err) {
      console.error('Failed to impersonate user', err);
    }
  };

  // Exit Impersonation and return to administrator
  const handleExitImpersonation = async () => {
    try {
      const adminId = originalAdminUser?.id || 'usr-admin';
      const res = await api.exitImpersonation(adminId);
      if (res.success) {
        setCurrentUser(res.user);
        setOriginalAdminUser(null);
        try {
          sessionStorage.removeItem('docflow_impersonating_admin');
        } catch {}
        await refreshDocumentsAndStats();
      }
    } catch (err) {
      console.error('Failed to exit impersonation', err);
    }
  };

  // Compute pending counts for sidebar badges
  const pendingSignaturesCount = documents.filter(
    (d) => d.status === 'AWAITING_SIGNATURE' || d.status === 'NUMBER_ASSIGNED'
  ).length;

  const pendingApprovalsCount = documents.filter(
    (d) => d.status === 'SIGNED' || d.status === 'AWAITING_APPROVAL'
  ).length;

  // Compute user-specific pending counts for active user/screen
  const userSpecificPendingApprovals = documents.filter((d) => {
    if (!currentUser) return false;
    if (d.status !== 'SIGNED' && d.status !== 'AWAITING_APPROVAL') return false;
    const role = roles.find((r) => r.id === currentUser.roleId || r.name === currentUser.roleName);
    const canApprove =
      currentUser.roleName.toLowerCase().includes('admin') ||
      (Array.isArray(currentUser.permissions) && currentUser.permissions.includes('DOCUMENT_APPROVE')) ||
      (role && Array.isArray(role.permissions) && role.permissions.includes('DOCUMENT_APPROVE'));
    return canApprove && (currentUser.companyId ? d.companyId === currentUser.companyId : true);
  }).length;

  const userSpecificPendingSignatures = documents.filter((d) => {
    if (!currentUser) return false;
    if (d.status !== 'AWAITING_SIGNATURE' && d.status !== 'NUMBER_ASSIGNED') return false;
    return (
      d.employeeName === currentUser.fullName ||
      d.employeeId === currentUser.employeeId ||
      d.createdBy === currentUser.id ||
      (currentUser.companyId ? d.companyId === currentUser.companyId : true)
    );
  }).length;

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

  // Capability checkers based on assigned role permissions
  const canCreateForm = !currentUser || currentUser.roleName === 'Super Admin' || currentUser.permissions?.includes('FORM_CREATE');
  const canEditForm = !currentUser || currentUser.roleName === 'Super Admin' || currentUser.permissions?.includes('FORM_EDIT');
  const canDeleteForm = currentUser?.roleName === 'Super Admin' || (Array.isArray(currentUser?.permissions) && currentUser.permissions.includes('FORM_DELETE'));

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
        currentUser={currentUser}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Impersonation Banner when admin is viewing as another user */}
        {originalAdminUser && currentUser && (
          <ImpersonationBanner
            currentUser={currentUser}
            originalAdmin={originalAdminUser}
            pendingApprovalsCount={userSpecificPendingApprovals}
            pendingSignaturesCount={userSpecificPendingSignatures}
            onExitImpersonation={handleExitImpersonation}
            onOpenScreenOverview={() => setIsScreenOverviewModalOpen(true)}
            onNavigateToApprovals={() => {
              setCurrentTab('pending-approvals');
              setActiveDocumentDetails(null);
            }}
            onNavigateToSignatures={() => {
              setCurrentTab('pending-signatures');
              setActiveDocumentDetails(null);
            }}
            onNavigateToCreateDoc={() => {
              setActiveFormForFill(forms[0] || null);
              setCurrentTab('create-document');
              setActiveDocumentDetails(null);
            }}
          />
        )}

        {/* Top Header */}
        <Header
          currentUser={currentUser}
          allUsers={allUsersList}
          onSwitchUser={handleSwitchUser}
          isImpersonating={Boolean(originalAdminUser)}
          originalAdmin={originalAdminUser}
          onOpenImpersonateModal={() => setIsImpersonateModalOpen(true)}
          onExitImpersonation={handleExitImpersonation}
          onOpenOnboarding={() => setShowOnboarding(true)}
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
              onDocumentDeleted={async () => {
                setActiveDocumentDetails(null);
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
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                        <span>Company Forms & Templates Catalog</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                          {forms.length} {forms.length === 1 ? 'Template' : 'Templates'}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        Browse active templates, select multiple to bulk delete obsolete forms, or launch new document requests.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {forms.length > 0 && selectedFormIds.length > 0 && canDeleteForm && (
                        <button
                          type="button"
                          onClick={() => setIsBulkDeleteModalOpen(true)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 animate-in fade-in"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Bulk Delete ({selectedFormIds.length})</span>
                        </button>
                      )}

                      {canCreateForm && (
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
                      )}
                    </div>
                  </div>

                  {forms.length > 0 && canDeleteForm && (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleSelectAllForms}
                          className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer select-none"
                        >
                          {selectedFormIds.length === forms.length && forms.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <span>
                            {selectedFormIds.length === forms.length && forms.length > 0
                              ? 'Deselect All'
                              : 'Select All Templates'}
                          </span>
                        </button>
                        {selectedFormIds.length > 0 && (
                          <span className="text-slate-400 font-medium">
                            • {selectedFormIds.length} of {forms.length} selected
                          </span>
                        )}
                      </div>

                      {selectedFormIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedFormIds([])}
                          className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                  )}

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
                      {canCreateForm && (
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
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {forms.map((form) => {
                        const isSelected = selectedFormIds.includes(form.id);
                        return (
                          <div
                            key={form.id}
                            className={`bg-white border rounded-xl p-5 shadow-2xs transition-all flex flex-col justify-between group relative ${
                              isSelected
                                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                                : 'border-slate-200 hover:border-blue-400'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {canDeleteForm && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleSelectForm(form.id)}
                                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                      title="Select for bulk actions"
                                    />
                                  )}
                                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                                    {form.formCode}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-semibold text-slate-500">
                                    v{form.currentVersion}
                                  </span>
                                  {canDeleteForm && (
                                    <button
                                      type="button"
                                      onClick={() => setFormToDelete(form)}
                                      className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                      title="Delete Form Template"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
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
                              {canEditForm && (
                                <button
                                  onClick={() => {
                                    setActiveFormForEdit(form);
                                    setCurrentTab('form-builder');
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Edit Fields
                                </button>
                              )}
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
                        );
                      })}
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
                  onDocumentDeleted={async () => {
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
                  onDocumentDeleted={async () => {
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
                  onDocumentDeleted={async () => {
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
                  onOpenOnboarding={() => setShowOnboarding(true)}
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
                  onSwitchToMatrix={() => setCurrentTab('admin-panel')}
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
                  onImpersonateUser={handleStartImpersonation}
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

              {/* ADMIN CONTROL PANEL / RBAC MATRIX TAB */}
              {currentTab === 'admin-panel' && (
                <AdminPanel
                  currentUser={currentUser}
                  companies={companies}
                  departments={departments}
                  users={users}
                  roles={roles}
                  onCompanyCreated={async (newComp) => {
                    setCompanies((prev) => [...prev, newComp]);
                    await refreshDocumentsAndStats();
                  }}
                  onCompanyUpdated={(updatedComp) => {
                    setCompanies((prev) =>
                      prev.map((c) => (c.id === updatedComp.id ? updatedComp : c))
                    );
                  }}
                  onCompanyDeleted={(deletedId) => {
                    setCompanies((prev) => prev.filter((c) => c.id !== deletedId));
                    if (selectedCompanyId === deletedId) {
                      setSelectedCompanyId('ALL');
                    }
                  }}
                  onUserCreated={(newUser) => {
                    setUsers((prev) => [...prev, newUser]);
                    setAllUsersList((prev) => [
                      ...prev,
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
                    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
                    setAllUsersList((prev) =>
                      prev.map((u) =>
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
                    setAllUsersList((prev) => prev.filter((u) => u.id !== deletedId));
                    if (currentUser?.id === deletedId && remaining.length > 0) {
                      setCurrentUser(remaining[0]);
                    }
                  }}
                  onRoleCreated={(newRole) => {
                    setRoles((prev) => [...prev, newRole]);
                  }}
                  onRoleUpdated={(updatedRole) => {
                    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
                    if (currentUser?.roleId === updatedRole.id) {
                      setCurrentUser({
                        ...currentUser,
                        roleName: updatedRole.name,
                        permissions: updatedRole.permissions,
                      });
                    }
                  }}
                  onRoleDeleted={(deletedId) => {
                    setRoles((prev) => prev.filter((r) => r.id !== deletedId));
                  }}
                  onDepartmentCreated={(newDept) => {
                    setDepartments((prev) => [...prev, newDept]);
                  }}
                  onDepartmentDeleted={(deletedId) => {
                    setDepartments((prev) => prev.filter((d) => d.id !== deletedId));
                  }}
                />
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
                    setSelectedFormIds((prev) => prev.filter((id) => id !== formToDelete.id));
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

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3.5 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Confirm Bulk Deletion</h3>
                <p className="text-xs text-slate-500">
                  You are about to delete <strong className="text-slate-900 font-semibold">{selectedFormIds.length}</strong> obsolete form template{selectedFormIds.length === 1 ? '' : 's'}.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              The selected form templates will be permanently removed from the catalog. Any documents previously generated and signed from these templates will remain intact in the document register.
            </p>

            <div className="max-h-48 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
              {forms
                .filter((f) => selectedFormIds.includes(f.id))
                .map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-800">{f.formName}</span>
                    <span className="font-mono text-[11px] font-bold text-slate-600 px-2 py-0.5 bg-white border border-slate-200 rounded">
                      {f.formCode}
                    </span>
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDeleteForms}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBulkDeleting ? 'Deleting Templates...' : `Delete ${selectedFormIds.length} Templates`}</span>
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

      {/* ONBOARDING WIZARD */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onCompleted={handleOnboardingCompleted}
        existingCompaniesCount={companies.length}
      />

      {/* IMPERSONATE USER MODAL */}
      {isImpersonateModalOpen && (
        <ImpersonateModal
          currentUser={currentUser}
          allUsers={users}
          companies={companies}
          departments={departments}
          roles={roles}
          documents={documents}
          onImpersonate={async (targetUserId) => {
            await handleStartImpersonation(targetUserId);
          }}
          onClose={() => setIsImpersonateModalOpen(false)}
        />
      )}

      {/* USER SCREEN OVERVIEW & APPROVAL STATUS MODAL */}
      {isScreenOverviewModalOpen && currentUser && originalAdminUser && (
        <UserScreenOverviewModal
          currentUser={currentUser}
          originalAdmin={originalAdminUser}
          companies={companies}
          departments={departments}
          roles={roles}
          documents={documents}
          onClose={() => setIsScreenOverviewModalOpen(false)}
          onViewDocument={(doc) => {
            setActiveDocumentDetails(doc);
            setIsScreenOverviewModalOpen(false);
          }}
          onOpenDigitalSign={(doc) => {
            setDigitalSignModalDoc(doc);
            setIsScreenOverviewModalOpen(false);
          }}
          onOpenPhysicalSign={(doc) => {
            setPhysicalSignModalDoc({ doc });
            setIsScreenOverviewModalOpen(false);
          }}
          onDocumentUpdated={async () => {
            await refreshDocumentsAndStats();
          }}
          onNavigateToTab={(tab) => {
            setCurrentTab(tab);
            setActiveDocumentDetails(null);
            setIsScreenOverviewModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
export default App;
