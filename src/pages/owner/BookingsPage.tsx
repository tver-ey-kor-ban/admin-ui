import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import type { PendingBookingsResponse, PendingBooking } from '../../core/types';

export function BookingsPage() {
  const { shopId } = useAuth();
  const { data, loading, error, refetch } = useFetch<PendingBookingsResponse>(
    shopId ? API.MECHANIC.PENDING_BOOKINGS(shopId) : null
  );

  const [modal, setModal] = useState<{ booking: PendingBooking; action: 'accept' | 'reject' } | null>(null);
  const [notes, setNotes] = useState('');
  const [acting, setActing] = useState(false);

  const bookings = data?.bookings ?? [];
  const fmt = (d?: string) => d ? new Date(d).toLocaleString() : '—';

  const openModal = (booking: PendingBooking, action: 'accept' | 'reject') => {
    setNotes('');
    setModal({ booking, action });
  };

  const handleAction = async () => {
    if (!modal || !shopId) return;
    setActing(true);
    try {
      const body: Record<string, string> = { action: modal.action };
      if (modal.action === 'accept' && notes) body.notes = notes;
      if (modal.action === 'reject' && notes) body.reason = notes;
      await apiClient.post(API.MECHANIC.BOOKING_ACTION(shopId, modal.booking.appointment_id), body);
      setModal(null);
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Action failed');
    } finally {
      setActing(false);
    }
  };

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data?.count ?? 0} pending bookings</p>
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>

      {loading ? <LoadingSpinner /> : error ? <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['ID', 'Customer', 'Phone', 'Vehicle', 'Date', 'Amount', 'Notes', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.appointment_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{b.appointment_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.customer.name}</td>
                  <td className="px-4 py-3 text-gray-600">{b.customer.phone}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{b.vehicle_info ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(b.appointment_date)}</td>
                  <td className="px-4 py-3 text-gray-700">{b.total_amount != null ? `$${Number(b.total_amount).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{b.notes ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="success" size="sm" onClick={() => openModal(b, 'accept')}>Accept</Button>
                      <Button variant="danger" size="sm" onClick={() => openModal(b, 'reject')}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No pending bookings</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={`${modal?.action === 'accept' ? 'Accept' : 'Reject'} Booking #${modal?.booking.appointment_id}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <p><span className="font-medium">Customer:</span> {modal?.booking.customer.name}</p>
            <p><span className="font-medium">Vehicle:</span> {modal?.booking.vehicle_info ?? '—'}</p>
            <p><span className="font-medium">Date:</span> {fmt(modal?.booking.appointment_date)}</p>
          </div>
          <Textarea
            label={modal?.action === 'accept' ? 'Notes (optional)' : 'Rejection reason (optional)'}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={modal?.action === 'accept' ? "We'll start at 10 AM" : 'Fully booked that day'}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button
              variant={modal?.action === 'accept' ? 'success' : 'danger'}
              onClick={handleAction}
              loading={acting}
            >
              {modal?.action === 'accept' ? 'Accept' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
