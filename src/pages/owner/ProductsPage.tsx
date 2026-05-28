import { useState, useRef } from 'react';
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

const EMPTY: ProductForm = {
  name: '', description: '', price: 0, stock_quantity: 0,
  category_id: null, sku: '', image_url: '',
};

function ProductImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Product Image</label>

      {/* Preview / drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        className="relative cursor-pointer group border-2 border-dashed border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 transition-colors"
        style={{ height: 160 }}
      >
        {value ? (
          <>
            <img src={value} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Change image</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Click to upload image</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* URL input as alternative */}
      <Input
        label=""
        placeholder="Or paste image URL..."
        value={value.startsWith('data:') ? '' : value}
        onChange={(e) => onChange(e.target.value)}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-red-500 hover:underline"
        >
          Remove image
        </button>
      )}
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete }: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative bg-gray-50" style={{ height: 160 }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={product.is_available !== false ? 'success' : 'gray'}>
            {product.is_available !== false ? 'In Stock' : 'Unavailable'}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-lg font-bold text-blue-600">${Number(product.price).toFixed(2)}</span>
          <span className="text-xs text-gray-500">
            {product.stock_quantity != null ? `${product.stock_quantity} in stock` : '—'}
          </span>
        </div>
        {product.sku && (
          <p className="text-xs text-gray-400 font-mono">SKU: {product.sku}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(product)}>Edit</Button>
        <Button variant="danger" size="sm" className="flex-1" onClick={() => onDelete(product)}>Delete</Button>
      </div>
    </div>
  );
}

export function ProductsPage() {
  const { shopId } = useAuth();
  const { data, loading, error, refetch } = useFetch<PaginatedResponse<Product> | Product[]>(
    shopId ? `${API.SHOPS.PRODUCTS(shopId)}?limit=100` : null
  );

  const [modal, setModal] = useState<{ product?: Product; open: boolean }>({ open: false });
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const products: Product[] = Array.isArray(data) ? data : (data as PaginatedResponse<Product>)?.items ?? [];
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(EMPTY); setModal({ open: true }); };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      stock_quantity: p.stock_quantity ?? 0,
      category_id: p.category_id ?? null,
      sku: p.sku ?? '',
      image_url: p.image_url ?? '',
    });
    setModal({ product: p, open: true });
  };

  const save = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        category_id: form.category_id || undefined,
        image_url: form.image_url || undefined,
      };
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm"
        />
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
        <Button size="sm" onClick={openCreate}>+ Add Product</Button>
      </div>

      <p className="text-xs text-gray-400">{filtered.length} of {products.length} product{products.length !== 1 ? 's' : ''}</p>

      {/* Grid */}
      {loading ? <LoadingSpinner /> : error ? (
        <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">{search ? 'No products match your search' : 'No products yet'}</p>
          {!search && <p className="text-gray-400 text-sm mt-1">Add your first product to get started.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onEdit={openEdit} onDelete={remove} />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.product ? 'Edit Product' : 'New Product'}
        size="md"
      >
        <div className="space-y-4">
          <ProductImageUpload
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
          />

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
              placeholder="optional"
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
