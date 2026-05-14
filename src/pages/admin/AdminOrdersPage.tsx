import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { AdminOrder, PaginatedResponse } from '../../core/types';

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, loading, error, refetch } = useFetch<PaginatedResponse<AdminOrder>>(
    `${API.ADMIN.ORDERS}?skip=${(page - 1) * limit}&limit=${limit}`
  );

  const orders: AdminOrder[] = data?.items ?? (Array.isArray(data) ? (data as AdminOrder[]) : []);
  const total = data?.total ?? orders.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Total: {total}</p>
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : error ? <div className="p-6 text-red-600">{error}</div> : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['ID', 'Customer', 'Shop', 'Amount', 'Status', 'Created'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{o.id}</td>
                    <td className="px-4 py-3 text-gray-700">{o.customer_id ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{o.shop_id ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{o.total_amount != null ? `$${Number(o.total_amount).toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3"><Badge variant={statusBadge(o.status)}>{o.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
              <span>Total: {total}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="flex items-center px-2">Page {page}</span>
                <Button variant="secondary" size="sm" disabled={orders.length < limit} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
