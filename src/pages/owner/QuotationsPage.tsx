import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import type { Quotation, QuotationItem } from '../../core/types';

interface QuotationsData {
  items?: Quotation[];
  quotations?: Quotation[];
}

const EMPTY_ITEM: QuotationItem = { item_type: 'labor', name: '', quantity: 1, unit_price: 0 };

const QUOTATION_STATUSES = ['', 'draft', 'sent', 'approved', 'rejected', 'expired'] as const;

export function QuotationsPage() {
  const { shopId } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

  const url = shopId
    ? `${API.QUOTATIONS.SHOP_LIST(shopId)}${statusFilter ? `?status=${statusFilter}` : ''}`
    : null;
  const { data, loading, error, refetch } = useFetch<QuotationsData | Quotation[]>(url);

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ appointment_id: '', title: '', description: '', labor_cost: 0, parts_cost: 0, tax_amount: 0, discount_amount: 0, items: [{ ...EMPTY_ITEM }] });
  const [saving, setSaving] = useState(false);

  const quotations: Quotation[] = Array.isArray(data)
    ? data
    : (data as QuotationsData)?.items ?? (data as QuotationsData)?.quotations ?? [];

  const addItem = () => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: keyof QuotationItem, val: string | number) =>
    setForm({ ...form, items: form.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) });

  const create = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      await apiClient.post(API.QUOTATIONS.CREATE(shopId), {
        ...form,
        appointment_id: form.appointment_id ? parseInt(form.appointment_id) : undefined,
      });
      setCreateModal(false);
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    } finally { setSaving(false); }
  };

  const send = async (q: Quotation) => {
    if (!shopId || !confirm(`Send quotation #${q.id} to customer?`)) return;
    try {
      await apiClient.post(API.QUOTATIONS.SEND(shopId, q.id));
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    }
  };

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{quotations.length} quotation{quotations.length !== 1 ? 's' : ''}</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-500"
          >
            {QUOTATION_STATUSES.map((s) => (
              <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
          <Button size="sm" onClick={() => setCreateModal(true)}>+ Create Quotation</Button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : error ? <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div> : (
        <div className="space-y-3">
          {quotations.map((q) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">#{q.id} {q.title && `— ${q.title}`}</span>
                    <Badge variant={statusBadge(q.status)}>{q.status}</Badge>
                  </div>
                  {q.description && <p className="text-sm text-gray-600 mb-2">{q.description}</p>}
                  <div className="flex gap-4 text-sm text-gray-600">
                    {q.labor_cost != null && <span>Labor: ${Number(q.labor_cost).toFixed(2)}</span>}
                    {q.parts_cost != null && <span>Parts: ${Number(q.parts_cost).toFixed(2)}</span>}
                    {q.total_amount != null && <span className="font-semibold text-gray-900">Total: ${Number(q.total_amount).toFixed(2)}</span>}
                  </div>
                  {q.items && q.items.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {q.items.map((item, i) => (
                        <p key={i} className="text-xs text-gray-500">
                          [{item.item_type}] {item.name} × {item.quantity} @ ${Number(item.unit_price).toFixed(2)}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Created: {q.created_at ? new Date(q.created_at).toLocaleDateString() : '—'}</p>
                </div>
                {q.status === 'draft' && (
                  <Button size="sm" onClick={() => send(q)}>Send to Customer</Button>
                )}
              </div>
            </div>
          ))}
          {quotations.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">No quotations yet</div>
          )}
        </div>
      )}

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Quotation" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Appointment ID (optional)" type="number" value={form.appointment_id} onChange={(e) => setForm({ ...form, appointment_id: e.target.value })} placeholder="1" />
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Engine Repair Estimate" />
          </div>
          <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Line Items</label>
              <button onClick={addItem} className="text-sm text-blue-600 hover:underline">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-2">
                    <select value={item.item_type} onChange={(e) => updateItem(i, 'item_type', e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white">
                      <option value="labor">Labor</option>
                      <option value="part">Part</option>
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} placeholder="Item name" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                  </div>
                  <div className="col-span-1">
                    <button onClick={() => removeItem(i)} className="text-red-500 text-sm px-2 py-1.5">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Labor Cost" type="number" min="0" step="0.01" value={form.labor_cost} onChange={(e) => setForm({ ...form, labor_cost: parseFloat(e.target.value) || 0 })} />
            <Input label="Parts Cost" type="number" min="0" step="0.01" value={form.parts_cost} onChange={(e) => setForm({ ...form, parts_cost: parseFloat(e.target.value) || 0 })} />
            <Input label="Tax Amount" type="number" min="0" step="0.01" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: parseFloat(e.target.value) || 0 })} />
            <Input label="Discount Amount" type="number" min="0" step="0.01" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: parseFloat(e.target.value) || 0 })} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={create} loading={saving}>Create Quotation</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
