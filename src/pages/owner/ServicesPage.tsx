import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import type { Service, ServiceForm, PaginatedResponse } from '../../core/types';

const EMPTY: ServiceForm = {
  name: '',
  description: '',
  price: 0,
  duration_minutes: 30,
  service_type: 'shop_based',
  mobile_service_fee: 0,
};

export function ServicesPage() {
  const { shopId } = useAuth();
  const { data, loading, error, refetch } = useFetch<PaginatedResponse<Service> | Service[]>(
    shopId ? `${API.SHOPS.SERVICES(shopId)}?limit=100` : null
  );

  const [modal, setModal] = useState<{ service?: Service; open: boolean }>({ open: false });
  const [form, setForm] = useState<ServiceForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const services: Service[] = Array.isArray(data) ? data : (data as PaginatedResponse<Service>)?.items ?? [];

  const openCreate = () => { setForm(EMPTY); setModal({ open: true }); };
  const openEdit = (s: Service) => {
    setForm({
      name: s.name,
      description: s.description ?? '',
      price: s.price,
      duration_minutes: s.duration_minutes ?? 30,
      service_type: s.service_type ?? 'shop_based',
      mobile_service_fee: s.mobile_service_fee ?? 0,
    });
    setModal({ service: s, open: true });
  };

  const save = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      if (modal.service) {
        await apiClient.put(API.SHOPS.SERVICE(shopId, modal.service.id), form);
      } else {
        await apiClient.post(API.SHOPS.SERVICES(shopId), form);
      }
      setModal({ open: false });
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    } finally { setSaving(false); }
  };

  const remove = async (s: Service) => {
    if (!confirm(`Delete "${s.name}"?`) || !shopId) return;
    try {
      await apiClient.delete(API.SHOPS.SERVICE(shopId, s.id));
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    }
  };

  const typeLabel = (t?: string) => ({ shop_based: 'Shop Based', mobile: 'Mobile', pickup_drop: 'Pickup & Drop' }[t ?? ''] ?? t ?? '—');

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{services.length} service{services.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
          <Button size="sm" onClick={openCreate}>+ Add Service</Button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : error ? <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['ID', 'Name', 'Price', 'Duration', 'Type', 'Available', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{s.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-700">${Number(s.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{s.duration_minutes ? `${s.duration_minutes} min` : '—'}</td>
                  <td className="px-4 py-3"><Badge variant="default">{typeLabel(s.service_type)}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={s.is_available !== false ? 'success' : 'gray'}>{s.is_available !== false ? 'Yes' : 'No'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      <button onClick={() => remove(s)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No services yet. Add your first service!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.service ? 'Edit Service' : 'Add Service'}>
        <div className="space-y-4">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Oil Change" />
          <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full oil change with filter replacement..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price *" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            <Input label="Duration (min)" type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 30 })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Service Type" value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value as ServiceForm['service_type'] })}>
              <option value="shop_based">Shop Based</option>
              <option value="mobile">Mobile</option>
              <option value="pickup_drop">Pickup & Drop</option>
            </Select>
            <Input label="Mobile Fee" type="number" min="0" step="0.01" value={form.mobile_service_fee} onChange={(e) => setForm({ ...form, mobile_service_fee: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button onClick={save} loading={saving}>{modal.service ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
