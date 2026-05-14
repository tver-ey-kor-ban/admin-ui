import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import type { Invoice, InvoiceItem, Payment } from '../../core/types';

interface InvoicesData { items?: Invoice[]; invoices?: Invoice[] }
const EMPTY_ITEM: InvoiceItem = { item_type: 'labor', name: '', quantity: 1, unit_price: 0 };
const INVOICE_STATUSES = ['', 'draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'] as const;

export function InvoicesPage() {
  const { shopId } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

  const url = shopId
    ? `${API.INVOICES.SHOP_LIST(shopId)}${statusFilter ? `?status=${statusFilter}` : ''}`
    : null;
  const { data, loading, error, refetch } = useFetch<InvoicesData | Invoice[]>(url);

  const [createModal, setCreateModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ customer_id: '', appointment_id: '', labor_cost: 0, parts_cost: 0, tax_amount: 0, discount_amount: 0, total_amount: 0, due_date: '', items: [{ ...EMPTY_ITEM }] });
  const [payment, setPayment] = useState<Payment>({ amount: 0, method: 'cash', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const invoices: Invoice[] = Array.isArray(data) ? data : (data as InvoicesData)?.items ?? (data as InvoicesData)?.invoices ?? [];

  const addItem = () => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: keyof InvoiceItem, val: string | number) =>
    setForm({ ...form, items: form.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) });

  const createInvoice = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      await apiClient.post(API.INVOICES.CREATE(shopId), {
        ...form,
        customer_id: form.customer_id ? parseInt(form.customer_id) : undefined,
        appointment_id: form.appointment_id ? parseInt(form.appointment_id) : undefined,
        due_date: form.due_date || undefined,
      });
      setCreateModal(false);
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    } finally { setSaving(false); }
  };

  const sendInvoice = async (inv: Invoice) => {
    if (!shopId || !confirm(`Send invoice #${inv.id} to customer?`)) return;
    try {
      await apiClient.post(API.INVOICES.SEND(shopId, inv.id));
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    }
  };

  const recordPayment = async () => {
    if (!paymentModal || !shopId) return;
    setSaving(true);
    try {
      await apiClient.post(API.INVOICES.PAYMENT(shopId, paymentModal.id), payment);
      setPaymentModal(null);
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    } finally { setSaving(false); }
  };

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-500"
          >
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s ? s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All Statuses'}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
          <Button size="sm" onClick={() => setCreateModal(true)}>+ Create Invoice</Button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : error ? <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div> : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">Invoice #{inv.id}</span>
                    <Badge variant={statusBadge(inv.status)}>{inv.status}</Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    {inv.labor_cost != null && <span>Labor: ${Number(inv.labor_cost).toFixed(2)}</span>}
                    {inv.parts_cost != null && <span>Parts: ${Number(inv.parts_cost).toFixed(2)}</span>}
                    {inv.total_amount != null && <span className="font-semibold text-gray-900">Total: ${Number(inv.total_amount).toFixed(2)}</span>}
                  </div>
                  {inv.due_date && <p className="text-xs text-gray-500 mt-1">Due: {new Date(inv.due_date).toLocaleDateString()}</p>}
                  {inv.payments && inv.payments.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {inv.payments.map((p, i) => (
                        <p key={i} className="text-xs text-green-700">
                          Payment: ${Number(p.amount).toFixed(2)} ({p.method}) {p.paid_at ? `on ${new Date(p.paid_at).toLocaleDateString()}` : ''}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Created: {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {inv.status === 'draft' && <Button size="sm" onClick={() => sendInvoice(inv)}>Send</Button>}
                  {['sent', 'partially_paid', 'overdue'].includes(inv.status) && (
                    <Button size="sm" variant="success" onClick={() => { setPayment({ amount: 0, method: 'cash', reference: '', notes: '' }); setPaymentModal(inv); }}>
                      Record Payment
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {invoices.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">No invoices yet</div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Invoice" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Customer ID" type="number" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} placeholder="3" />
            <Input label="Appointment ID (optional)" type="number" value={form.appointment_id} onChange={(e) => setForm({ ...form, appointment_id: e.target.value })} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Line Items</label>
              <button onClick={addItem} className="text-sm text-blue-600 hover:underline">+ Add</button>
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
                    <input value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} placeholder="Name" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                  </div>
                  <div className="col-span-1">
                    <button onClick={() => removeItem(i)} className="text-red-500 px-2 py-1.5 text-sm">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Labor Cost" type="number" min="0" step="0.01" value={form.labor_cost} onChange={(e) => setForm({ ...form, labor_cost: parseFloat(e.target.value) || 0 })} />
            <Input label="Parts Cost" type="number" min="0" step="0.01" value={form.parts_cost} onChange={(e) => setForm({ ...form, parts_cost: parseFloat(e.target.value) || 0 })} />
            <Input label="Tax" type="number" min="0" step="0.01" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: parseFloat(e.target.value) || 0 })} />
            <Input label="Discount" type="number" min="0" step="0.01" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: parseFloat(e.target.value) || 0 })} />
            <Input label="Total Amount" type="number" min="0" step="0.01" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: parseFloat(e.target.value) || 0 })} />
            <Input label="Due Date" type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={createInvoice} loading={saving}>Create Invoice</Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title={`Record Payment — Invoice #${paymentModal?.id}`} size="sm">
        <div className="space-y-4">
          <Input label="Amount *" type="number" min="0" step="0.01" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: parseFloat(e.target.value) || 0 })} />
          <Select label="Method" value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value as Payment['method'] })}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Transfer</option>
            <option value="mobile_payment">Mobile Payment</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Reference" value={payment.reference ?? ''} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} placeholder="REF-001" />
          <Textarea label="Notes" rows={2} value={payment.notes ?? ''} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPaymentModal(null)}>Cancel</Button>
            <Button variant="success" onClick={recordPayment} loading={saving}>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
