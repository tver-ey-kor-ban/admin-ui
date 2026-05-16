import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Shop, PaginatedResponse } from '../../core/types';

export function AdminShopsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 20;

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);

  const { data, loading, error, refetch } = useFetch<PaginatedResponse<Shop>>(
    `${API.ADMIN.SHOPS}?${params}`
  );

  const shops: Shop[] = data?.items ?? (Array.isArray(data) ? (data as Shop[]) : []);
  const total = data?.total ?? shops.length;

  const toggleShopStatus = async (shop: Shop) => {
    try {
      await apiClient.put(`${API.ADMIN.SHOP_STATUS(shop.id)}?is_active=${!shop.is_active}`);
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to update shop status');
    }
  };

  const deleteShop = async (shop: Shop) => {
    if (!confirm(`Delete shop "${shop.name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(API.ADMIN.SHOP_DELETE(shop.id));
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to delete shop');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>

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
                  {['ID', 'Name', 'Address', 'Phone', 'Email', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{shop.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{shop.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{shop.address ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{shop.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{shop.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={shop.is_active ? 'success' : 'gray'}>
                        {shop.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleShopStatus(shop)}
                          className={`text-xs hover:underline ${shop.is_active ? 'text-yellow-600' : 'text-green-600'}`}
                        >
                          {shop.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteShop(shop)} className="text-red-600 hover:underline text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shops.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No shops found</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
              <span>Total: {total}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="flex items-center px-2">Page {page}</span>
                <Button variant="secondary" size="sm" disabled={shops.length < limit} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
