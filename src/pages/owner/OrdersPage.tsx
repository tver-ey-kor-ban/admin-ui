import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import type { PendingOrder } from '../../core/types';

interface OrdersData {
  orders?: PendingOrder[];
  count?: number;
}

export function OrdersPage() {
  const { shopId } = useAuth();
  const url = shopId ? API.MECHANIC.PENDING_ORDERS(shopId) : null;

  const { data, loading, error, refetch } = useFetch<OrdersData | PendingOrder[]>(url);

  const [rejectModal, setRejectModal] = useState<PendingOrder | null>(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const orders: PendingOrder[] = Array.isArray(data)
    ? data
    : (data as OrdersData)?.orders ?? [];

  const handleAccept = async (order: PendingOrder) => {
    if (!shopId) return;
    setActing(true);
    try {
      await apiClient.post(API.MECHANIC.ORDER_ACTION(shopId, order.id), { action: 'accept' });
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to accept order');
    } finally {
      setActing(false);
    }
  };

  const handleReject = (order: PendingOrder) => {
    setReason('');
    setRejectModal(order);
  };

  const confirmReject = async () => {
    if (!rejectModal || !shopId) return;
    setActing(true);
    try {
      await apiClient.post(API.MECHANIC.ORDER_ACTION(shopId, rejectModal.id), { action: 'reject', reason });
      setRejectModal(null);
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to reject order');
    } finally {
      setActing(false);
    }
  };

  const markReady = async (order: PendingOrder) => {
    if (!shopId) return;
    setActing(true);
    try {
      await apiClient.put(API.MECHANIC.ORDER_READY(shopId, order.id));
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to mark order ready');
    } finally {
      setActing(false);
    }
  };

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>

      {loading ? <LoadingSpinner /> : error ? (
        <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">Order #{o.id}</span>
                    <Badge variant={statusBadge(o.status)}>{o.status}</Badge>
                  </div>
                  {o.customer && (
                    <p className="text-sm text-gray-600">Customer: {o.customer.name}</p>
                  )}
                  {o.total_amount != null && (
                    <p className="text-sm text-gray-700 font-medium mt-1">Total: ${Number(o.total_amount).toFixed(2)}</p>
                  )}
                  {o.items && o.items.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">Items:</p>
                      <div className="space-y-0.5">
                        {o.items.map((item, i) => (
                          <p key={i} className="text-xs text-gray-600">
                            {item.product_name ?? `Product #${item.product_id}`} × {item.quantity}
                            {item.unit_price != null ? ` @ $${Number(item.unit_price).toFixed(2)}` : ''}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {o.status === 'pending' && (
                    <>
                      <Button variant="success" size="sm" onClick={() => handleAccept(o)} loading={acting}>Accept</Button>
                      <Button variant="danger" size="sm" onClick={() => handleReject(o)}>Reject</Button>
                    </>
                  )}
                  {(o.status === 'confirmed' || o.status === 'processing') && (
                    <Button variant="primary" size="sm" onClick={() => markReady(o)} loading={acting}>Mark Ready</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
              No pending orders
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title={`Reject Order #${rejectModal?.id}`} size="sm">
        <div className="space-y-4">
          <Textarea
            label="Rejection reason (optional)"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Out of stock..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmReject} loading={acting}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
