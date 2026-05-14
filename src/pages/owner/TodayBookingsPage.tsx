import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface TodayBooking {
  appointment_id: number;
  customer?: { id: number; name: string; phone: string };
  vehicle_info?: string;
  appointment_date?: string;
  status?: string;
  notes?: string;
  total_amount?: number;
}

interface TodayBookingsResponse {
  count?: number;
  bookings?: TodayBooking[];
}

export function TodayBookingsPage() {
  const { shopId } = useAuth();
  const { data, loading, error, refetch } = useFetch<TodayBookingsResponse | TodayBooking[]>(
    shopId ? API.MECHANIC.TODAY_BOOKINGS(shopId) : null
  );

  const bookings: TodayBooking[] = Array.isArray(data)
    ? data
    : (data as TodayBookingsResponse)?.bookings ?? [];

  const fmt = (d?: string) => d ? new Date(d).toLocaleString() : '—';

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''} today — {new Date().toLocaleDateString()}
        </p>
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>

      {loading ? <LoadingSpinner /> : error ? <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['ID', 'Customer', 'Phone', 'Vehicle', 'Time', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.appointment_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{b.appointment_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.customer?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{b.customer?.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{b.vehicle_info ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(b.appointment_date)}</td>
                  <td className="px-4 py-3 text-gray-700">{b.total_amount != null ? `$${Number(b.total_amount).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3">
                    {b.status ? <Badge variant={statusBadge(b.status)}>{b.status}</Badge> : '—'}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No bookings scheduled for today</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
