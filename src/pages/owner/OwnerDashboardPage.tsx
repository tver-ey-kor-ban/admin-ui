import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import type { PendingBookingsResponse, PendingOrder } from '../../core/types';

function QuickStat({ label, value, to, color }: { label: string; value: number | string; to: string; color: string }) {
  return (
    <Link to={to} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export function OwnerDashboardPage() {
  const { shopId, shops, user } = useAuth();
  const shop = shops.find((s) => s.shop_id === shopId);

  const { data: bookingsData, loading: bLoading } = useFetch<PendingBookingsResponse>(
    shopId ? API.MECHANIC.PENDING_BOOKINGS(shopId) : null
  );
  const { data: ordersData, loading: oLoading } = useFetch<{ total: number; items: PendingOrder[] }>(
    shopId ? API.MECHANIC.PENDING_ORDERS(shopId) : null
  );

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">No shop selected</h2>
        <p className="text-gray-500 text-sm mt-1">You don't have any shops assigned yet.</p>
      </div>
    );
  }

  const pendingBookings = bookingsData?.total ?? 0;
  const orders = ordersData?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Shop header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <p className="text-blue-200 text-sm">Welcome back, {user?.full_name ?? user?.username}</p>
        <h2 className="text-2xl font-bold mt-1">{shop?.shop_name ?? 'Your Shop'}</h2>
        <p className="text-blue-200 text-sm mt-1">Shop ID: {shopId}</p>
      </div>

      {/* Stats */}
      {(bLoading || oLoading) ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickStat
            label="Pending Bookings"
            value={pendingBookings}
            to="/owner/bookings/pending"
            color={pendingBookings > 0 ? 'text-yellow-600' : 'text-gray-900'}
          />
          <QuickStat
            label="Pending Orders"
            value={orders.length}
            to="/owner/orders"
            color={orders.length > 0 ? 'text-orange-600' : 'text-gray-900'}
          />
          <QuickStat
            label="Products"
            value="Manage"
            to="/owner/products"
            color="text-blue-600"
          />
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { to: '/owner/bookings/today', label: "Today's Bookings", icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { to: '/owner/services', label: 'Services', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
          { to: '/owner/quotations', label: 'Quotations', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { to: '/owner/invoices', label: 'Invoices', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
          { to: '/owner/repairs', label: 'Repair Progress', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
          { to: '/owner/performance', label: 'Performance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { to: '/owner/members', label: 'Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { to: '/owner/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:shadow-md hover:border-blue-200 transition-all text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-700">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
