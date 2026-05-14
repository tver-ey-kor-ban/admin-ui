import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { NotificationsResponse } from '../../core/types';

export function NotificationsPage() {
  const { token } = useAuth();
  const { data, loading, error, refetch } = useFetch<NotificationsResponse>(
    token ? API.MECHANIC.NOTIFICATIONS : null
  );

  const notifications = data?.notifications ?? [];

  const markRead = async (id: number) => {
    try {
      await apiClient.put(API.MECHANIC.NOTIFICATION_READ(id));
      refetch();
    } catch {
      // ignore
    }
  };

  const typeColor = (type: string) => {
    if (type.includes('booking')) return 'info';
    if (type.includes('order')) return 'warning';
    if (type.includes('payment')) return 'success';
    return 'default';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {data?.unread_count ? (
              <span className="text-blue-600 font-medium">{data.unread_count} unread</span>
            ) : 'All caught up'}
            {' '}&mdash; {notifications.length} total
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>

      {loading ? <LoadingSpinner /> : error ? <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div> : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-xl shadow-sm border p-4 flex items-start gap-4 ${
                n.status === 'unread' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-gray-900 text-sm">{n.title}</span>
                  <Badge variant={typeColor(n.type) as 'default' | 'info' | 'warning' | 'success'}>{n.type.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</p>
              </div>
              {n.status === 'unread' && (
                <button
                  onClick={() => markRead(n.id)}
                  className="text-xs text-blue-600 hover:underline flex-shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
              No notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
}
