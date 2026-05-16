import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Input';
import type { AdminUser } from '../../core/types';

interface UsersData {
  items?: AdminUser[];
  total?: number;
}

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  if (filterActive !== '') params.set('is_active', filterActive);

  const { data, loading, error, refetch } = useFetch<UsersData>(`${API.ADMIN.USERS}?${params}`);
  const [roleModal, setRoleModal] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState('user');
  const [acting, setActing] = useState(false);

  const users: AdminUser[] = data?.items ?? (Array.isArray(data) ? (data as AdminUser[]) : []);
  const total = data?.total ?? users.length;

  const toggleStatus = async (user: AdminUser) => {
    setActing(true);
    try {
      await apiClient.put(`${API.ADMIN.USER_STATUS(user.id)}?is_active=${!user.is_active}`);
      refetch();
    } finally {
      setActing(false);
    }
  };

  const changeRole = async () => {
    if (!roleModal) return;
    setActing(true);
    try {
      await apiClient.put(`${API.ADMIN.USER_ROLE(roleModal.id)}?is_superuser=${newRole === 'admin'}`);
      setRoleModal(null);
      refetch();
    } finally {
      setActing(false);
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(API.ADMIN.USER_DELETE(user.id));
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search username, email, name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <select
          value={filterActive}
          onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['ID', 'Username', 'Full Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{u.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.username}
                      {u.is_superuser && <span className="ml-1.5 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Admin</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{u.roles}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge(u.is_active ? 'active' : 'inactive')}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setNewRole(u.roles); setRoleModal(u); }}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Role
                        </button>
                        <button
                          onClick={() => toggleStatus(u)}
                          disabled={acting}
                          className={`text-xs hover:underline ${u.is_active ? 'text-yellow-600' : 'text-green-600'}`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        {!u.is_superuser && (
                          <button onClick={() => deleteUser(u)} className="text-red-600 hover:underline text-xs">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
              <span>Total: {total}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="flex items-center px-2">Page {page}</span>
                <Button variant="secondary" size="sm" disabled={users.length < limit} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Role Modal */}
      <Modal isOpen={!!roleModal} onClose={() => setRoleModal(null)} title={`Change role — ${roleModal?.username}`} size="sm">
        <div className="space-y-4">
          <Select
            label="New Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin (superuser)</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRoleModal(null)}>Cancel</Button>
            <Button onClick={changeRole} loading={acting}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
