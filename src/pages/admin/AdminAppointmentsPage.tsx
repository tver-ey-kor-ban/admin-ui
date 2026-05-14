import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { AdminAppointment, PaginatedResponse } from '../../core/types';

export function AdminAppointmentsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, loading, error, refetch } = useFetch<PaginatedResponse<AdminAppointment>>(
    `${API.ADMIN.APPOINTMENTS}?skip=${(page - 1) * limit}&limit=${limit}`
  );

  const appointments: AdminAppointment[] = data?.items ?? (Array.isArray(data) ? (data as AdminAppointment[]) : []);
  const total = data?.total ?? appointments.length;

  const fmt = (d?: string) => d ? new Date(d).toLocaleString() : '—';

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
                  {['ID', 'Customer', 'Shop', 'Vehicle', 'Date', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{a.id}</td>
                    <td className="px-4 py-3 text-gray-700">{a.customer_id ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{a.shop_id ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{a.vehicle_info ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(a.appointment_date)}</td>
                    <td className="px-4 py-3 text-gray-700">{a.total_amount != null ? `$${Number(a.total_amount).toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3"><Badge variant={statusBadge(a.status)}>{a.status}</Badge></td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No appointments found</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
              <span>Total: {total}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="flex items-center px-2">Page {page}</span>
                <Button variant="secondary" size="sm" disabled={appointments.length < limit} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
