import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Building2,
  Lock,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Info,
  CheckSquare,
  Square,
  Save,
  UserCheck,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { User, Role, Company, PermissionCode } from '../types/index.js';
import { api } from '../api.js';

export const PERMISSION_GROUPS: {
  id: string;
  label: string;
  description: string;
  permissions: { code: PermissionCode; label: string; desc: string }[];
}[] = [
  {
    id: 'user',
    label: 'User Directory & RBAC',
    description: 'Manage employee accounts, system logins, and role allocations',
    permissions: [
      { code: 'USER_VIEW', label: 'View Users', desc: 'Browse user directory and profiles' },
      { code: 'USER_CREATE', label: 'Create Users', desc: 'Register new employee and staff accounts' },
      { code: 'USER_EDIT', label: 'Edit Users', desc: 'Modify user profiles, roles, and entities' },
      { code: 'USER_DISABLE', label: 'Disable Users', desc: 'Suspend and deactivate accounts' },
    ],
  },
  {
    id: 'forms',
    label: 'Forms & Templates',
    description: 'Design, modify, and publish corporate form schemas',
    permissions: [
      { code: 'FORM_VIEW', label: 'View Forms', desc: 'Browse available corporate form templates' },
      { code: 'FORM_CREATE', label: 'Create Forms', desc: 'Design new form templates in visual builder' },
      { code: 'FORM_EDIT', label: 'Edit Forms', desc: 'Modify fields, coordinates, and schemas' },
      { code: 'FORM_DELETE', label: 'Delete Forms', desc: 'Permanently remove draft templates' },
      { code: 'FORM_PUBLISH', label: 'Publish Forms', desc: 'Activate forms for live issuance' },
    ],
  },
  {
    id: 'documents',
    label: 'Document Lifecycle & Signatures',
    description: 'Draft, allocate numbers, apply digital/wet-ink signatures, and approve',
    permissions: [
      { code: 'DOCUMENT_CREATE', label: 'Draft Documents', desc: 'Initiate and submit document requests' },
      { code: 'DOCUMENT_VIEW', label: 'View Documents', desc: 'Access document register and audit timelines' },
      { code: 'DOCUMENT_EDIT_DRAFT', label: 'Edit Drafts', desc: 'Modify pending drafts prior to numbering' },
      { code: 'DOCUMENT_GENERATE', label: 'Generate PDF', desc: 'Allocate sequential number and produce PDF' },
      { code: 'DOCUMENT_SIGN', label: 'Sign Documents', desc: 'Apply digital canvas or wet-ink scan' },
      { code: 'DOCUMENT_APPROVE', label: 'Approve Documents', desc: 'Grant management sanction & sign off' },
      { code: 'DOCUMENT_REJECT', label: 'Reject Documents', desc: 'Decline requests with compliance remarks' },
      { code: 'DOCUMENT_VOID', label: 'Void Documents', desc: 'Revoke and void official serial numbers' },
      { code: 'DOCUMENT_DOWNLOAD', label: 'Download PDF', desc: 'Download cryptographically sealed PDF copies' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration & Numbering',
    description: 'Operating companies, sequential registers, and audit verification',
    permissions: [
      { code: 'COMPANY_MANAGE', label: 'Manage Companies', desc: 'Add or modify group operating entities' },
      { code: 'NUMBERING_MANAGE', label: 'Numbering Rules', desc: 'Configure sequential register patterns' },
      { code: 'AUDIT_VIEW', label: 'Audit Inspection', desc: 'Access immutable SHA-256 compliance logs' },
      { code: 'SETTINGS_MANAGE', label: 'System Settings', desc: 'Configure system-wide parameters' },
      { code: 'COMPANY_STAMP', label: 'Authorize Stamp', desc: 'Affix official corporate verification seal' },
    ],
  },
];

interface UsersRolesViewProps {
  users: User[];
  roles: Role[];
  companies: Company[];
  currentUser?: User | null;
  onUserCreated?: (newUser: User) => void;
  onUserUpdated?: (updatedUser: User) => void;
  onUserDeleted?: (deletedUserId: string) => void;
  onRoleCreated?: (newRole: Role) => void;
  onRoleUpdated?: (updatedRole: Role) => void;
  onRoleDeleted?: (deletedRoleId: string) => void;
}

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({
  users: initialUsers,
  roles: initialRoles,
  companies,
  currentUser,
  onUserCreated,
  onUserUpdated,
  onUserDeleted,
  onRoleCreated,
  onRoleUpdated,
  onRoleDeleted,
}) => {
  const [usersList, setUsersList] = useState<User[]>(initialUsers);
  const [rolesList, setRolesList] = useState<Role[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    initialRoles[0]?.id || ''
  );

  useEffect(() => {
    setUsersList(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    setRolesList(initialRoles);
    if (!selectedRoleId && initialRoles.length > 0) {
      setSelectedRoleId(initialRoles[0].id);
    }
  }, [initialRoles, selectedRoleId]);

  const selectedRole =
    rolesList.find((r) => r.id === selectedRoleId) || rolesList[0];

  // User Modals State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // User Form State
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormEmployeeId, setUserFormEmployeeId] = useState('');
  const [userFormDesignation, setUserFormDesignation] = useState('');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormRoleId, setUserFormRoleId] = useState('');
  const [userFormCompanyId, setUserFormCompanyId] = useState('ALL');
  const [userFormStatus, setUserFormStatus] = useState<'ACTIVE' | 'DISABLED'>('ACTIVE');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Role Modals / Configuration State
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [draftPermissions, setDraftPermissions] = useState<PermissionCode[]>([]);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [isSavingRole, setIsSavingRole] = useState(false);

  // New Role Form State
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<PermissionCode[]>([
    'DOCUMENT_VIEW',
    'DOCUMENT_DOWNLOAD',
  ]);
  const [newRoleError, setNewRoleError] = useState<string | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Open Add User Modal
  const handleOpenAddUser = () => {
    setUserFormName('');
    setUserFormEmail('');
    setUserFormEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    setUserFormDesignation('Operations Specialist');
    setUserFormPhone('');
    setUserFormRoleId(rolesList[0]?.id || '');
    setUserFormCompanyId(companies[0]?.id || 'ALL');
    setUserFormStatus('ACTIVE');
    setUserFormError(null);
    setShowAddUserModal(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u: User) => {
    setUserToEdit(u);
    setUserFormName(u.fullName);
    setUserFormEmail(u.email);
    setUserFormEmployeeId(u.employeeId);
    setUserFormDesignation(u.designation || '');
    setUserFormPhone(u.phone || '');
    setUserFormRoleId(u.roleId);
    setUserFormCompanyId(u.companyId || 'ALL');
    setUserFormStatus(u.status);
    setUserFormError(null);
  };

  // Save Add User
  const handleSaveAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName.trim() || !userFormEmail.trim()) {
      setUserFormError('Full name and email address are required.');
      return;
    }
    setIsSubmittingUser(true);
    setUserFormError(null);

    try {
      const selectedRoleObj = rolesList.find((r) => r.id === userFormRoleId) || rolesList[0];
      const payload: Partial<User> = {
        fullName: userFormName.trim(),
        email: userFormEmail.trim().toLowerCase(),
        employeeId: userFormEmployeeId.trim() || `EMP-${Date.now().toString().slice(-4)}`,
        designation: userFormDesignation.trim() || 'Staff',
        phone: userFormPhone.trim(),
        roleId: selectedRoleObj.id,
        roleName: selectedRoleObj.name,
        companyId: userFormCompanyId,
        companyIds: [userFormCompanyId],
        status: userFormStatus,
      };

      const created = await api.createUser(payload);
      setUsersList((prev) => [...prev, created]);
      if (onUserCreated) onUserCreated(created);
      setShowAddUserModal(false);
    } catch (err: any) {
      console.error('Failed to create user:', err);
      setUserFormError(err.message || 'Failed to create user account');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Save Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    if (!userFormName.trim() || !userFormEmail.trim()) {
      setUserFormError('Full name and email address are required.');
      return;
    }
    setIsSubmittingUser(true);
    setUserFormError(null);

    try {
      const selectedRoleObj = rolesList.find((r) => r.id === userFormRoleId) || rolesList[0];
      const payload: Partial<User> = {
        fullName: userFormName.trim(),
        email: userFormEmail.trim().toLowerCase(),
        employeeId: userFormEmployeeId.trim(),
        designation: userFormDesignation.trim(),
        phone: userFormPhone.trim(),
        roleId: selectedRoleObj.id,
        roleName: selectedRoleObj.name,
        companyId: userFormCompanyId,
        companyIds: [userFormCompanyId],
        status: userFormStatus,
      };

      const updated = await api.updateUser(userToEdit.id, payload);
      setUsersList((prev) => prev.map((u) => (u.id === userToEdit.id ? updated : u)));
      if (onUserUpdated) onUserUpdated(updated);
      setUserToEdit(null);
    } catch (err: any) {
      console.error('Failed to update user:', err);
      setUserFormError(err.message || 'Failed to update user account');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Delete User Action
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmittingUser(true);
    try {
      await api.deleteUser(userToDelete.id);
      setUsersList((prev) => prev.filter((u) => u.id !== userToDelete.id));
      if (onUserDeleted) onUserDeleted(userToDelete.id);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete user:', err);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Start Configuring Permissions for Selected Role
  const handleStartEditingPermissions = () => {
    if (!selectedRole) return;
    setDraftPermissions([...selectedRole.permissions]);
    setEditRoleName(selectedRole.name);
    setEditRoleDescription(selectedRole.description);
    setIsEditingPermissions(true);
  };

  // Toggle Single Permission in Draft
  const handleTogglePermission = (code: PermissionCode) => {
    setDraftPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  // Toggle All Permissions in a Group
  const handleToggleGroup = (groupPermissions: { code: PermissionCode }[]) => {
    const codes = groupPermissions.map((p) => p.code);
    const allSelected = codes.every((c) => draftPermissions.includes(c));
    if (allSelected) {
      // Remove all
      setDraftPermissions((prev) => prev.filter((p) => !codes.includes(p)));
    } else {
      // Add all missing
      const toAdd = codes.filter((c) => !draftPermissions.includes(c));
      setDraftPermissions((prev) => [...prev, ...toAdd]);
    }
  };

  // Save Configured Permissions for Role
  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    setIsSavingRole(true);
    try {
      const payload: Partial<Role> = {
        name: editRoleName.trim() || selectedRole.name,
        description: editRoleDescription.trim() || selectedRole.description,
        permissions: draftPermissions,
      };

      const updated = await api.updateRole(selectedRole.id, payload);
      setRolesList((prev) =>
        prev.map((r) => (r.id === selectedRole.id ? updated : r))
      );
      // Re-sync permissions in usersList
      setUsersList((prev) =>
        prev.map((u) =>
          u.roleId === selectedRole.id
            ? { ...u, roleName: updated.name, permissions: updated.permissions }
            : u
        )
      );
      if (onRoleUpdated) onRoleUpdated(updated);
      setIsEditingPermissions(false);
    } catch (err: any) {
      console.error('Failed to update role permissions:', err);
    } finally {
      setIsSavingRole(false);
    }
  };

  // Open Create Role Modal
  const handleOpenAddRole = () => {
    setNewRoleName('');
    setNewRoleCode('');
    setNewRoleDescription('');
    setNewRolePermissions(['DOCUMENT_VIEW', 'DOCUMENT_DOWNLOAD']);
    setNewRoleError(null);
    setShowAddRoleModal(true);
  };

  // Save Create Role
  const handleSaveCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setNewRoleError('Role name is required.');
      return;
    }
    setIsCreatingRole(true);
    setNewRoleError(null);

    try {
      const code =
        newRoleCode.trim().toUpperCase() ||
        newRoleName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const payload: Partial<Role> = {
        name: newRoleName.trim(),
        code,
        description:
          newRoleDescription.trim() ||
          `Custom role with ${newRolePermissions.length} configured permissions`,
        permissions: newRolePermissions,
      };

      const created = await api.createRole(payload);
      setRolesList((prev) => [...prev, created]);
      setSelectedRoleId(created.id);
      if (onRoleCreated) onRoleCreated(created);
      setShowAddRoleModal(false);
    } catch (err: any) {
      console.error('Failed to create role:', err);
      setNewRoleError(err.message || 'Failed to create role');
    } finally {
      setIsCreatingRole(false);
    }
  };

  // Delete Role Action
  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    const assignedUser = usersList.find((u) => u.roleId === roleToDelete.id);
    if (assignedUser) {
      alert(
        `Cannot delete role "${roleToDelete.name}" because user "${assignedUser.fullName}" is assigned to it. Please reassign the user first.`
      );
      setRoleToDelete(null);
      return;
    }

    try {
      await api.deleteRole(roleToDelete.id);
      const remaining = rolesList.filter((r) => r.id !== roleToDelete.id);
      setRolesList(remaining);
      if (selectedRoleId === roleToDelete.id && remaining.length > 0) {
        setSelectedRoleId(remaining[0].id);
      }
      if (onRoleDeleted) onRoleDeleted(roleToDelete.id);
      setRoleToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      alert(err.message || 'Failed to delete role');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
              ROLE-BASED ACCESS CONTROL (RBAC)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Users, Directory & Permissions
          </h2>
          <p className="text-xs text-slate-500">
            Manage active user credentials, entity isolation, and configure granular system roles.
          </p>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddRole}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>+ New Role</span>
          </button>

          <button
            id="btn-open-add-user"
            type="button"
            onClick={handleOpenAddUser}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add User</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Users Directory */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Active User Accounts ({usersList.length})
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-medium">
                {usersList.filter((u) => u.status === 'ACTIVE').length} Active
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Use top navbar to switch sessions
            </span>
          </div>

          {usersList.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                No Users in Directory
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All sample users have been cleared. Register your real team members and staff to begin assigning documents.
              </p>
              <button
                type="button"
                onClick={handleOpenAddUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First User</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">User Details</th>
                    <th className="py-2.5 px-4">System Role</th>
                    <th className="py-2.5 px-4">Entity Assignment</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => {
                    const company = companies.find((c) => c.id === u.companyId);
                    const isCurrentUser = currentUser?.id === u.id;

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0">
                              {u.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="truncate">{u.fullName}</span>
                                {isCurrentUser && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {u.email}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                ID: {u.employeeId} {u.designation && `• ${u.designation}`}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            <Shield className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate">{u.roleName}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {u.companyId === 'ALL' || !u.companyId ? (
                            <span className="text-blue-700 font-bold text-[11px] bg-blue-50 px-2 py-0.5 rounded">
                              All Entities
                            </span>
                          ) : (
                            <span className="font-medium text-slate-800 flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {company ? `${company.code} - ${company.name}` : u.companyId}
                              </span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {u.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Disabled
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              title="Edit user details & role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              title={`Delete ${u.fullName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 5 cols: Granular Permissions Matrix & Configurator */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Role Permission Inspector
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select a role to inspect or configure granted system privileges.
                </p>
              </div>

              {!isEditingPermissions ? (
                <button
                  type="button"
                  onClick={handleStartEditingPermissions}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Configure capabilities for this role"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Configure</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingPermissions(false)}
                  className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Role Pills Selector */}
            <div className="flex flex-wrap gap-1.5">
              {rolesList.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRoleId(r.id);
                    setIsEditingPermissions(false);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedRoleId === r.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>

            {selectedRole && (
              <div className="space-y-4 text-xs">
                {/* Role Details */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {isEditingPermissions ? (
                        <input
                          type="text"
                          value={editRoleName}
                          onChange={(e) => setEditRoleName(e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 w-full"
                          placeholder="Role Name"
                        />
                      ) : (
                        selectedRole.name
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                        {selectedRole.code}
                      </span>
                      {!selectedRole.isSystem && (
                        <button
                          type="button"
                          onClick={() => setRoleToDelete(selectedRole)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete custom role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingPermissions ? (
                    <textarea
                      value={editRoleDescription}
                      onChange={(e) => setEditRoleDescription(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 mt-1"
                      placeholder="Role description..."
                    />
                  ) : (
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {selectedRole.description}
                    </p>
                  )}
                </div>

                {/* Capabilities List / Configurator */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      System Capabilities ({isEditingPermissions ? draftPermissions.length : selectedRole.permissions.length} Granted)
                    </span>
                    {isEditingPermissions && (
                      <span className="text-[10px] text-blue-600 font-medium">
                        Click checkboxes to toggle privileges
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {PERMISSION_GROUPS.map((group) => {
                      const allGroupSelected = group.permissions.every((p) =>
                        (isEditingPermissions
                          ? draftPermissions
                          : selectedRole.permissions
                        ).includes(p.code)
                      );

                      return (
                        <div
                          key={group.id}
                          className="border border-slate-200 rounded-xl overflow-hidden bg-white"
                        >
                          <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">
                              {group.label}
                            </span>
                            {isEditingPermissions && (
                              <button
                                type="button"
                                onClick={() => handleToggleGroup(group.permissions)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                              >
                                {allGroupSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            )}
                          </div>

                          <div className="divide-y divide-slate-100">
                            {group.permissions.map((perm) => {
                              const isGranted = (
                                isEditingPermissions
                                  ? draftPermissions
                                  : selectedRole.permissions
                              ).includes(perm.code);

                              return (
                                <div
                                  key={perm.code}
                                  onClick={() => {
                                    if (isEditingPermissions) {
                                      handleTogglePermission(perm.code);
                                    }
                                  }}
                                  className={`p-2.5 flex items-center justify-between transition-colors ${
                                    isEditingPermissions
                                      ? 'cursor-pointer hover:bg-blue-50/50'
                                      : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-2 min-w-0">
                                    {isEditingPermissions && (
                                      <div className="mt-0.5 text-blue-600">
                                        {isGranted ? (
                                          <CheckSquare className="w-4 h-4" />
                                        ) : (
                                          <Square className="w-4 h-4 text-slate-300" />
                                        )}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-semibold text-slate-800 text-xs">
                                        {perm.label}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {perm.code} • {perm.desc}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0 ml-2">
                                    {isGranted ? (
                                      <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                        GRANTED
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">
                                        DENIED
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save Permissions Action Bar */}
                {isEditingPermissions && (
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingPermissions(false)}
                      disabled={isSavingRole}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRolePermissions}
                      disabled={isSavingRole}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingRole ? 'Saving...' : 'Save Capabilities'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Permissions are authoritatively enforced server-side. Number allocation, PDF stamp application, and document approval require verified role permissions.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Register New User Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add team member and configure their role & operating company.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userFormError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{userFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormName}
                    onChange={(e) => setUserFormName(e.target.value)}
                    placeholder="e.g. Tariq Mansoor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormEmail}
                    onChange={(e) => setUserFormEmail(e.target.value)}
                    placeholder="e.g. tariq.m@gulfway.ae"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={userFormEmployeeId}
                    onChange={(e) => setUserFormEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-2041"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Designation / Job Title
                  </label>
                  <input
                    type="text"
                    value={userFormDesignation}
                    onChange={(e) => setUserFormDesignation(e.target.value)}
                    placeholder="e.g. Fleet Coordinator"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    System Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userFormRoleId}
                    onChange={(e) => setUserFormRoleId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs font-medium"
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Entity Assignment
                  </label>
                  <select
                    value={userFormCompanyId}
                    onChange={(e) => setUserFormCompanyId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs font-medium"
                  >
                    <option value="ALL">All Group Entities (Cross-Entity)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Account Status
                </label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="add_user_status"
                      value="ACTIVE"
                      checked={userFormStatus === 'ACTIVE'}
                      onChange={() => setUserFormStatus('ACTIVE')}
                    />
                    <span className="text-slate-800 font-medium">Active (Can Login & Sign)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="add_user_status"
                      value="DISABLED"
                      checked={userFormStatus === 'DISABLED'}
                      onChange={() => setUserFormStatus('DISABLED')}
                    />
                    <span className="text-slate-500">Disabled / Suspended</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  disabled={isSubmittingUser}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmittingUser ? 'Registering...' : 'Register User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {userToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit User Profile & Role
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Modify permissions, designations, and entity assignments.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserToEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userFormError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{userFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormName}
                    onChange={(e) => setUserFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormEmail}
                    onChange={(e) => setUserFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={userFormEmployeeId}
                    onChange={(e) => setUserFormEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Designation / Job Title
                  </label>
                  <input
                    type="text"
                    value={userFormDesignation}
                    onChange={(e) => setUserFormDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    System Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userFormRoleId}
                    onChange={(e) => setUserFormRoleId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs font-medium"
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Entity Assignment
                  </label>
                  <select
                    value={userFormCompanyId}
                    onChange={(e) => setUserFormCompanyId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs font-medium"
                  >
                    <option value="ALL">All Group Entities (Cross-Entity)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Account Status
                </label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_user_status"
                      value="ACTIVE"
                      checked={userFormStatus === 'ACTIVE'}
                      onChange={() => setUserFormStatus('ACTIVE')}
                    />
                    <span className="text-slate-800 font-medium">Active</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_user_status"
                      value="DISABLED"
                      checked={userFormStatus === 'DISABLED'}
                      onChange={() => setUserFormStatus('DISABLED')}
                    />
                    <span className="text-slate-500">Disabled / Suspended</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  disabled={isSubmittingUser}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmittingUser ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete User Account?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <strong>{userToDelete.fullName}</strong> ({userToDelete.email})?
                  This user will no longer be able to log in, sign, or generate documents.
                </p>
                {currentUser?.id === userToDelete.id && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 font-medium">
                    Note: You are currently switched into this user account.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isSubmittingUser}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isSubmittingUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSubmittingUser ? 'Deleting...' : 'Yes, Delete User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW ROLE MODAL */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Create Custom System Role
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define custom role credentials and select granular system capabilities.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newRoleError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{newRoleError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCreateRole} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => {
                      setNewRoleName(e.target.value);
                      if (!newRoleCode) {
                        setNewRoleCode(
                          e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_')
                        );
                      }
                    }}
                    placeholder="e.g. Finance Auditor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Role Code / Token
                  </label>
                  <input
                    type="text"
                    value={newRoleCode}
                    onChange={(e) => setNewRoleCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AUDITOR"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Role Description
                </label>
                <input
                  type="text"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="e.g. Inspects financial records and audits document serial allocation"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden text-xs"
                />
              </div>

              {/* Checkboxes for Capabilities */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">
                  Select Role Capabilities ({newRolePermissions.length} selected)
                </label>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {PERMISSION_GROUPS.map((group) => {
                    const allSelected = group.permissions.every((p) =>
                      newRolePermissions.includes(p.code)
                    );

                    return (
                      <div key={group.id} className="space-y-1.5">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                          <span className="font-bold text-slate-800 text-[11px]">
                            {group.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const codes = group.permissions.map((p) => p.code);
                              if (allSelected) {
                                setNewRolePermissions((prev) =>
                                  prev.filter((p) => !codes.includes(p))
                                );
                              } else {
                                const missing = codes.filter(
                                  (c) => !newRolePermissions.includes(c)
                                );
                                setNewRolePermissions((prev) => [...prev, ...missing]);
                              }
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {group.permissions.map((perm) => {
                            const isChecked = newRolePermissions.includes(perm.code);
                            return (
                              <label
                                key={perm.code}
                                className="flex items-start gap-2 p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setNewRolePermissions((prev) =>
                                      isChecked
                                        ? prev.filter((p) => p !== perm.code)
                                        : [...prev, perm.code]
                                    );
                                  }}
                                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-800 text-[11px]">
                                    {perm.label}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {perm.desc}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  disabled={isCreatingRole}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>{isCreatingRole ? 'Creating...' : 'Create Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ROLE MODAL */}
      {roleToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete Custom Role?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently remove the role{' '}
                  <strong>{roleToDelete.name}</strong> ({roleToDelete.code})?
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRole}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Role</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
