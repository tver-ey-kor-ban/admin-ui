import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UsersPage } from './pages/admin/UsersPage';
import { AdminShopsPage } from './pages/admin/AdminShopsPage';
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminRatingsPage } from './pages/admin/AdminRatingsPage';
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { BookingsPage } from './pages/owner/BookingsPage';
import { TodayBookingsPage } from './pages/owner/TodayBookingsPage';
import { OrdersPage } from './pages/owner/OrdersPage';
import { ProductsPage } from './pages/owner/ProductsPage';
import { ServicesPage } from './pages/owner/ServicesPage';
import { QuotationsPage } from './pages/owner/QuotationsPage';
import { InvoicesPage } from './pages/owner/InvoicesPage';
import { RepairProgressPage } from './pages/owner/RepairProgressPage';
import { PerformancePage } from './pages/owner/PerformancePage';
import { MembersPage } from './pages/owner/MembersPage';
import { NotificationsPage } from './pages/owner/NotificationsPage';

function RootRedirect() {
  const { isAdmin, isOwner, token, isLoading } = useAuth();
  if (isLoading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isOwner) return <Navigate to="/owner" replace />;
  // Logged in but no dashboard role (customer / mechanic)
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* All dashboard routes require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>

              {/* Admin only */}
              <Route element={<ProtectedRoute requireAdmin />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/shops" element={<AdminShopsPage />} />
                <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/ratings" element={<AdminRatingsPage />} />
              </Route>

              {/* Admin + Shop Owner */}
              <Route element={<ProtectedRoute requireOwner />}>
                <Route path="/owner" element={<OwnerDashboardPage />} />
                <Route path="/owner/bookings/pending" element={<BookingsPage />} />
                <Route path="/owner/bookings/today" element={<TodayBookingsPage />} />
                <Route path="/owner/orders" element={<OrdersPage />} />
                <Route path="/owner/products" element={<ProductsPage />} />
                <Route path="/owner/services" element={<ServicesPage />} />
                <Route path="/owner/quotations" element={<QuotationsPage />} />
                <Route path="/owner/invoices" element={<InvoicesPage />} />
                <Route path="/owner/repairs" element={<RepairProgressPage />} />
                <Route path="/owner/performance" element={<PerformancePage />} />
                <Route path="/owner/members" element={<MembersPage />} />
                <Route path="/owner/notifications" element={<NotificationsPage />} />
              </Route>

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
