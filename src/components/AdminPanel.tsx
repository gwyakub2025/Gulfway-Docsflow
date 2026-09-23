import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  Lock,
  CheckCircle,
  XCircle,
  Save,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Layers,
  FileText,
  Sliders,
  AlertCircle,
  HelpCircle,
  Search,
  Filter,
  Check,
  X,
  UserCheck,
  UserX,
  Briefcase,
  Mail,
  Phone,
  Hash,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  Company,
  Department,
  User,
  Role,
  PermissionCode,
} from '../types/index.js';
import { api } from '../api.js';

interface AdminPanelProps {
  currentUser: User | null;
  companies: Company[];
  departments: Department[];
  users: User[];
  roles: Role[];
  onCompanyCreated: (c: Company) => void;
  onCompanyUpdated: (c: Company) => void;
  onCompanyDeleted: (id: string) => void;
  onUserCreated: (u: User) => void;
  onUserUpdated: (u: User) => void;
  onUserDeleted: (id: string) => void;
  onRoleCreated: (r: Role) => void;
  onRoleUpdated: (r: Role) => void;
  onRoleDeleted: (id: string) => void;
  onDepartmentCreated?: (d: Department) => void;
  onDepartmentDeleted?: (id: string) => void;
}

interface ModuleCapability {
  code: PermissionCode;
  name: string;
  category: 'Operational Workflow' | 'Document Authority' | 'Administrative Governance';
  description: string;
}

const SYSTEM_CAPABILITIES: ModuleCapability[] = [
  // Operational Workflow
  {
    code: 'DOCUMENT_VIEW',
    name: 'View Dashboard, Register & Documents',
    category: 'Operational Workflow',
    description: 'Inspect document registers, search files, read details and review form entries',
  },
  {
    code: 'DOCUMENT_CREATE',
    name: 'Initiate & Fill New Documents',
    category: 'Operational Workflow',
    description: 'Create new document requests from active form templates',
  },
  {
    code: 'DOCUMENT_EDIT_DRAFT',
    name: 'Modify Draft Submissions',
    category: 'Operational Workflow',
    description: 'Edit saved draft entries before final numbering and generation',
  },
  {
    code: 'DOCUMENT_GENERATE',
    name: 'Issue Official Serial Number',
    category: 'Operational Workflow',
    description: 'Generate immutable sequential numbering and lock submission content',
  },
  {
    code: 'DOCUMENT_DOWNLOAD',
    name: 'Download Official PDF with QR',
    category: 'Operational Workflow',
    description: 'Export and print authorized PDF with SHA-256 verification seal and QR code',
  },

  // Document Authority
  {
    code: 'DOCUMENT_SIGN',
    name: 'Affix Digital & Wet-Ink Signatures',
    category: 'Document Authority',
    description: 'Sign documents as Employee, Signer, or Department Representative',
  },
  {
    code: 'DOCUMENT_APPROVE',
    name: 'Authorize & Approve Documents',
    category: 'Document Authority',
    description: 'Grant final managerial sign-off and sanction approval on requests',
  },
  {
    code: 'DOCUMENT_REJECT',
    name: 'Reject & Deny Document Requests',
    category: 'Document Authority',
    description: 'Decline requests with mandatory rejection reasoning',
  },
  {
    code: 'DOCUMENT_VOID',
    name: 'Void & Invalidate Issued Documents',
    category: 'Document Authority',
    description: 'Mark compromised or cancelled documents as VOID in immutable registry',
  },
  {
    code: 'DOCUMENT_DELETE',
    name: 'Permanently Delete Documents',
    category: 'Document Authority',
    description: 'Permanently remove draft, voided, or test document records from database',
  },
  {
    code: 'COMPANY_STAMP',
    name: 'Affix Official Corporate Stamp',
    category: 'Document Authority',
    description: 'Imprint official group stamp seal onto approved PDF documents',
  },

  // Administrative Governance
  {
    code: 'FORM_VIEW',
    name: 'View Form Templates Catalog',
    category: 'Administrative Governance',
    description: 'Browse all company forms, templates, instructions and layouts',
  },
  {
    code: 'FORM_CREATE',
    name: 'Create & Design Form Templates',
    category: 'Administrative Governance',
    description: 'Design new forms using visual drag-and-drop coordinate builder',
  },
  {
    code: 'FORM_EDIT',
    name: 'Edit Template Fields & Rules',
    category: 'Administrative Governance',
    description: 'Modify form fields, dimensions, company scope, and instructions',
  },
  {
    code: 'FORM_DELETE',
    name: 'Archive & Delete Form Templates',
    category: 'Administrative Governance',
    description: 'Remove deprecated templates or clean up draft forms',
  },
  {
    code: 'NUMBERING_MANAGE',
    name: 'Configure Sequential Numbering Rules',
    category: 'Administrative Governance',
    description: 'Manage pattern prefixes, padding length, and annual reset cycles',
  },
  {
    code: 'COMPANY_MANAGE',
    name: 'Manage Operating Entities & Companies',
    category: 'Administrative Governance',
    description: 'Register real legal companies, trade licenses, TRNs, logos, and seals',
  },
  {
    code: 'DEPARTMENT_MANAGE',
    name: 'Manage Corporate Departments',
    category: 'Administrative Governance',
    description: 'Configure corporate department hierarchy and routing codes',
  },
  {
    code: 'USER_VIEW',
    name: 'Access User Directory',
    category: 'Administrative Governance',
    description: 'View list of corporate employees, riders, managers, and system users',
  },
  {
    code: 'USER_CREATE',
    name: 'Create New User Accounts',
    category: 'Administrative Governance',
    description: 'Provision credentials and company assignments for new staff members',
  },
  {
    code: 'USER_EDIT',
    name: 'Edit User Roles & Assignments',
    category: 'Administrative Governance',
    description: 'Update user profiles, assigned departments, and access tiers',
  },
  {
    code: 'USER_DISABLE',
    name: 'Deactivate / Disable Users',
    category: 'Administrative Governance',
    description: 'Suspend staff accounts and terminate active operational sessions',
  },
  {
    code: 'ROLE_MANAGE',
    name: 'Manage RBAC Roles & Module Access',
    category: 'Administrative Governance',
    description: 'Define custom roles and toggle module permissions across the enterprise',
  },
  {
    code: 'AUDIT_VIEW',
    name: 'Inspect SHA-256 Audit Trail & Logs',
    category: 'Administrative Governance',
    description: 'Audit forensic activity logs, digital signatures, and system mutations',
  },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  companies,
  departments,
  users,
  roles,
  onCompanyCreated,
  onCompanyUpdated,
  onCompanyDeleted,
  onUserCreated,
  onUserUpdated,
  onUserDeleted,
  onRoleCreated,
  onRoleUpdated,
  onRoleDeleted,
  onDepartmentCreated,
  onDepartmentDeleted,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'users' | 'roles' | 'companies' | 'departments'>('matrix');

  // Matrix Editing State: roleId -> Set of PermissionCodes
  const [matrixState, setMatrixState] = useState<Record<string, Set<PermissionCode>>>(() => {
    const initial: Record<string, Set<PermissionCode>> = {};
    roles.forEach((r) => {
      initial[r.id] = new Set(r.permissions || []);
    });
    return initial;
  });

  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('ALL');
  const [userFilterCompany, setUserFilterCompany] = useState('ALL');

  // User Form fields
  const [userFullName, setUserFullName] = useState('');
  const [userEmpId, setUserEmpId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userCompanyId, setUserCompanyId] = useState('');
  const [userDeptId, setUserDeptId] = useState('');
  const [userRoleId, setUserRoleId] = useState('');
  const [userDesignation, setUserDesignation] = useState('');
  const [userStatus, setUserStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Custom Role Creation State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Department Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  // Toggle permission in matrix
  const handleTogglePermission = (roleId: string, perm: PermissionCode) => {
    setMatrixState((prev) => {
      const currentSet = new Set(prev[roleId] || []);
      if (currentSet.has(perm)) {
        currentSet.delete(perm);
      } else {
        currentSet.add(perm);
      }
      return {
        ...prev,
        [roleId]: currentSet,
      };
    });
  };

  // Quick preset actions
  const handleApplyPreset = (roleId: string, preset: 'ALL' | 'CLEAR' | 'APPROVER' | 'EMPLOYEE') => {
    setMatrixState((prev) => {
      let newSet = new Set<PermissionCode>();
      if (preset === 'ALL') {
        SYSTEM_CAPABILITIES.forEach((c) => newSet.add(c.code));
      } else if (preset === 'CLEAR') {
        newSet = new Set();
      } else if (preset === 'APPROVER') {
        newSet = new Set([
          'DOCUMENT_VIEW',
          'DOCUMENT_SIGN',
          'DOCUMENT_APPROVE',
          'DOCUMENT_REJECT',
          'DOCUMENT_DOWNLOAD',
          'COMPANY_STAMP',
        ]);
      } else if (preset === 'EMPLOYEE') {
        newSet = new Set([
          'FORM_VIEW',
          'DOCUMENT_VIEW',
          'DOCUMENT_CREATE',
          'DOCUMENT_EDIT_DRAFT',
          'DOCUMENT_SIGN',
          'DOCUMENT_DOWNLOAD',
        ]);
      }
      return {
        ...prev,
        [roleId]: newSet,
      };
    });
  };

  // Save role permissions
  const handleSaveRolePermissions = async (roleId: string) => {
    try {
      setSavingRoleId(roleId);
      const permsArray = Array.from(matrixState[roleId] || []) as PermissionCode[];
      const roleObj = roles.find((r) => r.id === roleId);
      if (!roleObj) throw new Error('Role not found');

      const updated = await api.updateRole(roleId, {
        permissions: permsArray,
      });

      onRoleUpdated(updated);
      showToast(`Access rules for "${roleObj.name}" saved to database and synchronized successfully.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save access permissions', true);
    } finally {
      setSavingRoleId(null);
    }
  };

  // Save all roles
  const handleSaveAllRoles = async () => {
    try {
      setSavingRoleId('ALL');
      for (const r of roles) {
        const permsArray = Array.from(matrixState[r.id] || []) as PermissionCode[];
        const updated = await api.updateRole(r.id, {
          permissions: permsArray,
        });
        onRoleUpdated(updated);
      }
      showToast('All role access control matrices successfully saved to database!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save all role matrices', true);
    } finally {
      setSavingRoleId(null);
    }
  };

  // User modal open
  const openUserModal = (user?: User) => {
    if (user) {
      setUserToEdit(user);
      setUserFullName(user.fullName);
      setUserEmpId(user.employeeId);
      setUserEmail(user.email);
      setUserPhone(user.phone || '');
      setUserCompanyId(user.companyId || (companies[0]?.id || ''));
      setUserDeptId(user.departmentId || (departments[0]?.id || ''));
      setUserRoleId(user.roleId || (roles[0]?.id || ''));
      setUserDesignation(user.designation);
      setUserStatus(user.status || 'ACTIVE');
    } else {
      setUserToEdit(null);
      setUserFullName('');
      setUserEmpId(`EMP-${Math.floor(100 + Math.random() * 900)}`);
      setUserEmail('');
      setUserPhone('');
      setUserCompanyId(companies[0]?.id || '');
      setUserDeptId(departments[0]?.id || '');
      setUserRoleId(roles.find((r) => r.code === 'USER')?.id || roles[0]?.id || '');
      setUserDesignation('Operational Specialist');
      setUserStatus('ACTIVE');
    }
    setShowUserModal(true);
  };

  // Submit User
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName.trim()) {
      showToast('User full name is required', true);
      return;
    }
    if (!userEmail.trim()) {
      showToast('User email address is required', true);
      return;
    }

    try {
      setIsSubmittingUser(true);
      const selectedRole = roles.find((r) => r.id === userRoleId) || roles[0];
      const selectedCompany = companies.find((c) => c.id === userCompanyId);

      const payload: Partial<User> = {
        fullName: userFullName.trim(),
        employeeId: userEmpId.trim(),
        email: userEmail.trim().toLowerCase(),
        phone: userPhone.trim(),
        companyId: userCompanyId,
        companyIds: userCompanyId ? [userCompanyId] : [],
        departmentId: userDeptId,
        designation: userDesignation.trim() || 'Staff',
        roleId: selectedRole?.id || '',
        roleName: selectedRole?.name || 'User',
        permissions: selectedRole?.permissions || [],
        status: userStatus,
      };

      if (userToEdit) {
        const updated = await api.updateUser(userToEdit.id, payload);
        onUserUpdated(updated);
        showToast(`User account "${updated.fullName}" updated in database.`);
      } else {
        const created = await api.createUser(payload);
        onUserCreated(created);
        showToast(`New user account "${created.fullName}" created in database.`);
      }

      setShowUserModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save user account', true);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Delete User
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(userToDelete.id);
      onUserDeleted(userToDelete.id);
      showToast(`User account "${userToDelete.fullName}" removed.`);
      setUserToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', true);
    }
  };

  // Submit Role
  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      showToast('Role name is required', true);
      return;
    }

    try {
      setIsSubmittingRole(true);
      const generatedCode = roleCode.trim()
        ? roleCode.trim().toUpperCase()
        : roleName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');

      const created = await api.createRole({
        name: roleName.trim(),
        code: generatedCode,
        description: roleDesc.trim() || 'Custom user role',
        permissions: ['DOCUMENT_VIEW', 'DOCUMENT_DOWNLOAD'],
      });

      onRoleCreated(created);
      setMatrixState((prev) => ({
        ...prev,
        [created.id]: new Set(created.permissions),
      }));

      showToast(`Custom role "${created.name}" created and ready for permission assignment.`);
      setShowRoleModal(false);
      setRoleName('');
      setRoleCode('');
      setRoleDesc('');
    } catch (err: any) {
      showToast(err.message || 'Failed to create role', true);
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Delete Role
  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await api.deleteRole(roleToDelete.id);
      onRoleDeleted(roleToDelete.id);
      showToast(`Role "${roleToDelete.name}" deleted.`);
      setRoleToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete role', true);
    }
  };

  // Submit Department
  const handleSubmitDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) {
      showToast('Department name is required', true);
      return;
    }

    try {
      setIsSubmittingDept(true);
      const code = deptCode.trim()
        ? deptCode.trim().toUpperCase()
        : deptName.trim().substring(0, 3).toUpperCase();

      const created = await api.createDepartment({
        name: deptName.trim(),
        code,
      });

      if (onDepartmentCreated) onDepartmentCreated(created);
      showToast(`Department "${created.name}" (${created.code}) created.`);
      setShowDeptModal(false);
      setDeptName('');
      setDeptCode('');
    } catch (err: any) {
      showToast(err.message || 'Failed to create department', true);
    } finally {
      setIsSubmittingDept(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(userSearch.toLowerCase());

    const matchesRole = userFilterRole === 'ALL' || u.roleId === userFilterRole;
    const matchesCompany = userFilterCompany === 'ALL' || u.companyId === userFilterCompany;

    return matchesSearch && matchesRole && matchesCompany;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorToast && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold border border-blue-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role-Based Access Control (RBAC) & Governance Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Enterprise Administration & Module Access
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Control which system modules, features, signature authorities, and form builders are accessible to each user role. Changes are persistently committed to the live database in real time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleSaveAllRoles}
              disabled={savingRoleId === 'ALL'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingRoleId === 'ALL' ? 'Saving Matrices...' : 'Save All Access Rules'}</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'matrix'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Module Access Matrix</span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'users'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roles')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'roles'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Role Profiles ({roles.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('departments')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSubTab === 'departments'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Departments ({departments.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: MODULE ACCESS MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Granular Permission Matrix by Role</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle checkmarks to grant or revoke specific operational modules and authority levels.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Quick Legend:</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" /> Authorized
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                <X className="w-3 h-3 text-slate-400" /> Denied
              </span>
            </div>
          </div>

          {/* Matrix Grid Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs border-b border-slate-800">
                    <th className="py-3.5 px-4 font-semibold w-80 sticky left-0 bg-slate-900 z-10">
                      Module & System Capability
                    </th>
                    {roles.map((r) => (
                      <th key={r.id} className="py-3 px-3 font-semibold text-center min-w-[140px] border-l border-slate-800">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-white whitespace-nowrap">{r.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {r.isSystem ? 'System Defined' : 'Custom Role'}
                          </span>
                          {/* Role presets & save */}
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => handleApplyPreset(r.id, 'ALL')}
                              title="Grant All Capabilities"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                            >
                              All
                            </button>
                            <button
                              onClick={() => handleApplyPreset(r.id, 'CLEAR')}
                              title="Clear All Capabilities"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                            >
                              None
                            </button>
                            <button
                              onClick={() => handleSaveRolePermissions(r.id)}
                              disabled={savingRoleId === r.id}
                              title="Save this role's permissions to database"
                              className="text-[10px] px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1"
                            >
                              <Save className="w-2.5 h-2.5" />
                              <span>{savingRoleId === r.id ? '...' : 'Save'}</span>
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* Group Capabilities by Category */}
                  {(['Operational Workflow', 'Document Authority', 'Administrative Governance'] as const).map((category) => {
                    const groupItems = SYSTEM_CAPABILITIES.filter((c) => c.category === category);
                    return (
                      <React.Fragment key={category}>
                        <tr className="bg-slate-50/90 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                          <td colSpan={roles.length + 1} className="py-2.5 px-4 bg-slate-100/80 border-y border-slate-200">
                            {category} ({groupItems.length} modules)
                          </td>
                        </tr>

                        {groupItems.map((cap) => (
                          <tr key={cap.code} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-100">
                              <div className="font-semibold text-slate-800">{cap.name}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{cap.description}</div>
                              <code className="text-[10px] text-blue-600 font-mono mt-0.5 inline-block">{cap.code}</code>
                            </td>

                            {roles.map((r) => {
                              const isGranted = matrixState[r.id]?.has(cap.code) || false;
                              return (
                                <td key={r.id} className="py-3 px-3 text-center border-l border-slate-100">
                                  <button
                                    onClick={() => handleTogglePermission(r.id, cap.code)}
                                    className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                      isGranted
                                        ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/20 hover:bg-emerald-600'
                                        : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                                    }`}
                                    title={`${isGranted ? 'Revoke' : 'Grant'} ${cap.name} for ${r.name}`}
                                  >
                                    {isGranted ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: USER ACCOUNTS DIRECTORY */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Enterprise User Accounts & Access Credentials</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create and manage individual user accounts, assign them to operating companies and departments with specific roles.
              </p>
            </div>

            <button
              onClick={() => openUserModal()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New User</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user name, email, employee ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Role:</span>
              <select
                value={userFilterRole}
                onChange={(e) => setUserFilterRole(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-1.5 px-2.5 text-slate-700 font-medium"
              >
                <option value="ALL">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Company:</span>
              <select
                value={userFilterCompany}
                onChange={(e) => setUserFilterCompany(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-1.5 px-2.5 text-slate-700 font-medium"
              >
                <option value="ALL">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">User & Contact</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Company & Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No users found</p>
                      <p className="text-[11px] text-slate-400">Create the first real corporate user account above.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const comp = companies.find((c) => c.id === u.companyId);
                    const dept = departments.find((d) => d.id === u.departmentId);
                    const role = roles.find((r) => r.id === u.roleId);
                    const isCurrentUser = currentUser?.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {u.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <span>{u.fullName}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold">
                                    Current Session
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {u.employeeId}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Shield className="w-3 h-3" />
                            <span>{role?.name || u.roleName}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {comp ? `${comp.code} - ${comp.name}` : 'All Group Entities'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {dept ? dept.name : u.designation}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{u.status || 'ACTIVE'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openUserModal(u)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit User Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={isCurrentUser}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              title={isCurrentUser ? 'Cannot delete current logged-in user' : 'Delete User'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ROLE PROFILES */}
      {activeSubTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Enterprise Security Roles</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define functional authorization profiles. Custom roles can be tailored to match specific corporate job families.
              </p>
            </div>

            <button
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => {
              const assignedUserCount = users.filter((u) => u.roleId === r.id).length;
              return (
                <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm">{r.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.isSystem
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {r.isSystem ? 'System Core' : 'Custom Defined'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{r.description}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
                      <div className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{assignedUserCount} assigned users</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{r.permissions?.length || 0} permissions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setActiveSubTab('matrix');
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Edit Permissions</span>
                    </button>

                    {!r.isSystem && (
                      <button
                        onClick={() => setRoleToDelete(r)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DEPARTMENTS */}
      {activeSubTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Corporate Department Directory</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Departments route document numbering, approvals, and user organization across all group operating companies.
              </p>
            </div>

            <button
              onClick={() => setShowDeptModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {departments.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center">
                <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 text-xs">No Departments Configured Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "Add Department" above to create real operational departments (e.g. Operations, HR, Finance).</p>
              </div>
            ) : (
              departments.map((d) => {
                const userCount = users.filter((u) => u.departmentId === d.id).length;
                return (
                  <div key={d.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{d.name}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px]">
                          {d.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{userCount} staff members</p>
                    </div>

                    <button
                      onClick={() => setDeptToDelete(d)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>{userToEdit ? 'Edit User Account' : 'Create New User Account'}</span>
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal / Employee Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mansoor"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID / Badge <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-102"
                    value={userEmpId}
                    onChange={(e) => setUserEmpId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Title / Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Fleet Supervisor"
                    value={userDesignation}
                    onChange={(e) => setUserDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@gulfway.ae"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+971 50 123 4567"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operating Company
                  </label>
                  <select
                    value={userCompanyId}
                    onChange={(e) => setUserCompanyId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    <option value="">-- All Group Companies --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={userDeptId}
                    onChange={(e) => setUserDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    <option value="">-- Unassigned --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Role & Access Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={userRoleId}
                    onChange={(e) => setUserRoleId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-semibold text-blue-700"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                  >
                    <option value="ACTIVE">ACTIVE (Authorized)</option>
                    <option value="INACTIVE">INACTIVE (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs">
                <div className="font-semibold flex items-center gap-1.5 mb-0.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Role Permissions Note</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-normal">
                  The user will inherit the exact module permissions configured for this role in the Module Access Matrix.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmittingUser ? 'Saving...' : userToEdit ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROLE MODAL */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>Create Custom Role Profile</span>
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRole} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fleet Quality Auditor"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unique Role Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. FLEET_AUDITOR"
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Description & Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the operational responsibilities of users assigned this role..."
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmittingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Add Corporate Department</span>
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDept} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fleet Operations"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Short Code (2-4 letters)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. OPS, HR, FIN"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDept}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmittingDept ? 'Creating...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE USER MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">Delete User Account?</h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{userToDelete.fullName}</span>? This will revoke their access to the system.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE ROLE MODAL */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">Delete Role Profile?</h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{roleToDelete.name}</span>?
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setRoleToDelete(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRole}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DEPARTMENT MODAL */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">Delete Department?</h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{deptToDelete.name}</span> ({deptToDelete.code})?
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setDeptToDelete(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.deleteDepartment(deptToDelete.id);
                    if (onDepartmentDeleted) onDepartmentDeleted(deptToDelete.id);
                    showToast(`Department "${deptToDelete.name}" deleted.`);
                    setDeptToDelete(null);
                  } catch (err: any) {
                    showToast(err.message || 'Failed to delete department', true);
                  }
                }}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
