import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Building2, 
  RefreshCw, 
  Crown, 
  CheckCircle2, 
  AlertTriangle,
  Mail,
  Shield
} from 'lucide-react';
import { OwnerUserRecord } from '../../types';
import { api } from '../../services/api';

interface OwnerUsersTabProps {
  onRefreshTelemetry?: () => void;
}

export const OwnerUsersTab: React.FC<OwnerUsersTabProps> = ({ onRefreshTelemetry }) => {
  const [users, setUsers] = useState<OwnerUserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Edit user modal / quick action state
  const [selectedUser, setSelectedUser] = useState<OwnerUserRecord | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOwnerUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Failed to fetch platform users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserStatus = async (user: OwnerUserRecord) => {
    const nextStatus = !user.isActive;
    const confirmMsg = nextStatus 
      ? `Reactivate account for "${user.name}" (${user.email})?`
      : `Suspend account for "${user.name}" (${user.email})? They will immediately lose platform access.`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setUpdating(true);
      await api.updateOwnerUser(user.id, { isActive: nextStatus });
      setActionSuccess(`User ${user.email} is now ${nextStatus ? 'Active' : 'Suspended'}`);
      await fetchUsers();
      if (onRefreshTelemetry) onRefreshTelemetry();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Error updating user status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeUserRole = async (user: OwnerUserRecord, newRole: string) => {
    if (!window.confirm(`Change role of "${user.name}" to ${newRole.toUpperCase()} within ${user.organizationName}?`)) return;

    try {
      setUpdating(true);
      await api.updateOwnerUser(user.id, { role: newRole });
      setActionSuccess(`Updated ${user.name}'s role to ${newRole}`);
      await fetchUsers();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Error updating user role: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && u.isActive) ||
      (statusFilter === 'DISABLED' && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalAdminsCount = users.filter(u => u.role === 'admin').length;
  const totalActiveCount = users.filter(u => u.isActive).length;

  return (
    <div id="owner-users-container" className="space-y-6">
      
      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-100">{users.length}</div>
            <div className="text-xs text-stone-400">Total Platform Users Across Tenants</div>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-400">{totalAdminsCount}</div>
            <div className="text-xs text-stone-400">Tenant Organization Administrators</div>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-blue-400">{totalActiveCount}</div>
            <div className="text-xs text-stone-400">Active & Verified Accounts</div>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="user-search-input"
            type="text"
            placeholder="Search users by name, email, organization, title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-400 font-medium">Role:</span>
            <select
              id="user-role-filter"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="ALL">All Roles</option>
              <option value="admin">Organization Admin</option>
              <option value="staff">Staff Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-400 font-medium">Status:</span>
            <select
              id="user-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="ALL">All Accounts</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DISABLED">Suspended / Disabled</option>
            </select>
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
            title="Refresh user directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950/80 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-800">
              <tr>
                <th className="py-3 px-4">User & Contact</th>
                <th className="py-3 px-4">Tenant Organization</th>
                <th className="py-3 px-4">Role & Privileges</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400 text-xs">
                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                    Loading platform user accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400 text-xs">
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-100 flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {user.isPlatformOwner && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40" title="Platform Operator">
                            PLATFORM_OWNER
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-stone-500" />
                        <span>{user.email}</span>
                      </div>
                      {user.title && (
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          {user.title}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-200 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>{user.organizationName}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
                        Org ID: {user.organizationId ? user.organizationId.slice(0, 8) : 'N/A'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={e => handleChangeUserRole(user, e.target.value)}
                        disabled={updating}
                        className={`text-[11px] font-semibold rounded px-2 py-1 border transition-colors ${
                          user.role === 'admin'
                            ? 'bg-amber-950/70 text-amber-400 border-amber-800'
                            : user.role === 'staff'
                            ? 'bg-stone-800 text-stone-200 border-stone-700'
                            : 'bg-stone-900 text-stone-400 border-stone-800'
                        }`}
                      >
                        <option value="admin">Organization Admin</option>
                        <option value="staff">Staff Member</option>
                        <option value="viewer">Viewer Only</option>
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        user.isActive 
                          ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800' 
                          : 'bg-red-950/70 text-red-400 border-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-stone-400 text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        disabled={updating}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                          user.isActive
                            ? 'bg-red-950/60 text-red-400 hover:bg-red-900/60 border-red-800'
                            : 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 border-emerald-800'
                        }`}
                      >
                        {user.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
