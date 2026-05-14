import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import type { ShopMember } from '../../core/types';

export function MembersPage() {
  const { shopId, isOwner, isAdmin } = useAuth();
  const { data, loading, error, refetch } = useFetch<ShopMember[]>(
    shopId ? API.SHOPS.MEMBERS(shopId) : null
  );

  const [addModal, setAddModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'mechanic' | 'owner'>('mechanic');
  const [saving, setSaving] = useState(false);

  const members: ShopMember[] = Array.isArray(data) ? data : [];
  const canManage = isOwner || isAdmin;

  const addMember = async () => {
    if (!shopId || !userId.trim()) return;
    setSaving(true);
    try {
      await apiClient.post(API.SHOPS.MEMBERS(shopId), { user_id: parseInt(userId), shop_id: shopId, role });
      setAddModal(false);
      setUserId('');
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to add member');
    } finally { setSaving(false); }
  };

  const changeRole = async (member: ShopMember, newRole: string) => {
    if (!shopId) return;
    try {
      await apiClient.put(API.SHOPS.MEMBER_ROLE(shopId, member.user_id), { role: newRole });
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    }
  };

  const removeMember = async (member: ShopMember) => {
    if (!confirm(`Remove ${member.full_name ?? member.username ?? `User #${member.user_id}`} from the team?`) || !shopId) return;
    try {
      await apiClient.delete(API.SHOPS.MEMBER_DELETE(shopId, member.user_id));
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    }
  };

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
          {canManage && <Button size="sm" onClick={() => setAddModal(true)}>+ Add Member</Button>}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : error ? <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['User ID', 'Username', 'Name', 'Email', 'Role', ...(canManage ? ['Actions'] : [])].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{m.user_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.username ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{m.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{m.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={m.role === 'owner' ? 'info' : 'default'}>{m.role}</Badge>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <select
                          value={m.role}
                          onChange={(e) => changeRole(m, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                          <option value="mechanic">Mechanic</option>
                          <option value="owner">Owner</option>
                        </select>
                        <button onClick={() => removeMember(m)} className="text-red-600 hover:underline text-xs">Remove</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-12 text-center text-gray-400">No team members yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Team Member" size="sm">
        <div className="space-y-4">
          <Input
            label="User ID"
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
          />
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as 'mechanic' | 'owner')}>
            <option value="mechanic">Mechanic</option>
            <option value="owner">Owner</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={addMember} loading={saving} disabled={!userId.trim()}>Add Member</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
