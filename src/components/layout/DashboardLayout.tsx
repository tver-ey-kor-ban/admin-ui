import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';

const TITLE_MAP: Record<string, string> = {
  '/admin': 'Admin Dashboard',
  '/admin/users': 'Users',
  '/admin/shops': 'All Shops',
  '/admin/appointments': 'All Appointments',
  '/admin/orders': 'All Orders',
  '/admin/ratings': 'Ratings',
  '/owner': 'Shop Dashboard',
  '/owner/bookings/pending': 'Pending Bookings',
  '/owner/bookings/today': "Today's Bookings",
  '/owner/orders': 'Orders',
  '/owner/products': 'Products',
  '/owner/services': 'Services',
  '/owner/quotations': 'Quotations',
  '/owner/invoices': 'Invoices',
  '/owner/repairs': 'Repair Progress',
  '/owner/performance': 'Mechanic Performance',
  '/owner/members': 'Team Members',
  '/owner/notifications': 'Notifications',
};

export function DashboardLayout() {
  const { pathname } = useLocation();
  const { logout, isAdmin, isMechanic, isOwner } = useAuth();
  const title = TITLE_MAP[pathname] ?? 'Garage Admin';
  const showNotificationsLink = isOwner || isMechanic || isAdmin;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

          <div className="flex items-center gap-2">
            {/* Notifications shortcut */}
            {showNotificationsLink && (
              <Link
                to="/owner/notifications"
                title="Notifications"
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
