import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import type { Product, ProductForm, PaginatedResponse } from '../../core/types';

// category_id is optional per API doc — null means no category
const EMPTY: ProductForm = { name: '', description: '', price: 0, stock_quantity: 0, category_id: null, sku: '' };

export function ProductsPage() {
  const { shopId } = useAuth();
  const { data, loading, error, refetch } = useFetch<PaginatedResponse<Product> | Product[]>(
    shopId ? `${API.SHOPS.PRODUCTS(shopId)}?limit=100` : null
  );

  const [modal, setModal] = useState<{ product?: Product; open: boolean }>({ open: false });
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const products: Product[] = Array.isArray(data) ? data : (data as PaginatedResponse<Product>)?.items ?? [];

  const openCreate = () => { setForm(EMPTY); setModal({ open: true }); };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      stock_quantity: p.stock_quantity ?? 0,
      category_id: p.category_id ?? null,
      sku: p.sku ?? '',
    });
    setModal({ product: p, open: true });
  };

  const save = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      // Strip null category_id — API expects it omitted or as a number
      const body = { ...form, category_id: form.category_id || undefined };
      if (modal.product) {
        await apiClient.put(API.SHOPS.PRODUCT(shopId, modal.product.id), body);
      } else {
        await apiClient.post(API.SHOPS.PRODUCTS(shopId), body);
      }
      setModal({ open: false });
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`) || !shopId) return;
    try {
      await apiClient.delete(API.SHOPS.PRODUCT(shopId, p.id));
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    }
  };

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
          <Button size="sm" onClick={openCreate}>+ Add Product</Button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : error ? <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['ID', 'Name', 'SKU', 'Category', 'Price', 'Stock', 'Available', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{p.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category_id ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">${Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-700">{p.stock_quantity ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.is_available !== false ? 'success' : 'gray'}>
                      {p.is_available !== false ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      <button onClick={() => remove(p)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No products yet. Add your first product!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.product ? 'Edit Product' : 'Add Product'} size="md">
        <div className="space-y-4">
          <Input
            label="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Synthetic Oil 5W-30"
            required
          />
          <Textarea
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Full synthetic motor oil..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price *"
              type="number" min="0" step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Stock Qty"
              type="number" min="0"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="OIL-5W30"
            />
            <Input
              label="Category ID"
              type="number" min="1"
              value={form.category_id ?? ''}
              onChange={(e) => setForm({ ...form, category_id: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="e.g. 1 (optional)"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button onClick={save} loading={saving}>{modal.product ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
