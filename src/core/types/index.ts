// Auth
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  full_name: string;
  roles: string;
  is_active: boolean;
  created_at?: string;
}

export interface ShopRole {
  shop_id: number;
  role: string;
}

export interface UserRolesResponse {
  username: string;
  roles: string[];
  is_superuser: boolean;
  shop_roles: ShopRole[];
}

// My Shops
export interface MyShop {
  shop_id: number;
  shop_name: string;
  role: string;
  is_active: boolean;
}

// Shop
export interface Shop {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Admin
export interface AdminStats {
  users: { total: number; active: number; inactive: number; admins: number };
  shops: { total: number; active: number; inactive: number };
  catalog: { products: number; services: number };
  appointments: { total: number; pending: number; completed: number; cancelled: number };
  orders: { total: number; pending: number; completed: number; cancelled: number };
  revenue: { appointments: number; orders: number; total: number };
}

export interface AdminDailyStats {
  period_days: number;
  start_date: string;
  end_date: string;
  new_users: number;
  new_shops: number;
  new_appointments: number;
  new_orders: number;
  revenue: { appointments: number; orders: number; total: number };
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  roles: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at?: string;
}

export interface AdminAppointment {
  id: number;
  customer_id?: number;
  shop_id?: number;
  service_id?: number;
  status: string;
  appointment_date?: string;
  vehicle_info?: string;
  total_amount?: number;
  created_at?: string;
}

export interface AdminOrder {
  id: number;
  customer_id?: number;
  shop_id?: number;
  status: string;
  total_amount?: number;
  created_at?: string;
}

// Products
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock_quantity?: number;
  category_id?: number;
  sku?: string;
  is_available?: boolean;
  created_at?: string;
}

export interface ProductForm {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category_id: number | null;
  sku: string;
}

// Services
export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  service_type?: 'shop_based' | 'mobile' | 'pickup_drop';
  mobile_service_fee?: number;
  is_available?: boolean;
  created_at?: string;
}

export interface ServiceForm {
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  service_type: 'shop_based' | 'mobile' | 'pickup_drop';
  mobile_service_fee: number;
}

// Shop Members
export interface ShopMember {
  user_id: number;
  username?: string;
  full_name?: string;
  email?: string;
  role: 'owner' | 'mechanic';
}

// Bookings
export interface PendingBooking {
  appointment_id: number;
  customer: { id: number; name: string; phone: string };
  vehicle_info?: string;
  appointment_date?: string;
  total_amount?: number;
  notes?: string;
  service_name?: string;
}

export interface PendingBookingsResponse {
  count: number;
  bookings: PendingBooking[];
}

// Orders
export interface PendingOrder {
  id: number;
  customer?: { id: number; name: string };
  items?: OrderItem[];
  total_amount?: number;
  status: string;
  created_at?: string;
}

export interface OrderItem {
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price?: number;
}

// Quotations
export interface Quotation {
  id: number;
  appointment_id?: number;
  title?: string;
  description?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  labor_cost?: number;
  parts_cost?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  items?: QuotationItem[];
  created_at?: string;
  sent_at?: string;
}

export interface QuotationItem {
  item_type: 'labor' | 'part';
  name: string;
  quantity: number;
  unit_price: number;
}

// Invoices
export interface Invoice {
  id: number;
  customer_id?: number;
  appointment_id?: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  labor_cost?: number;
  parts_cost?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  due_date?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  created_at?: string;
}

export interface InvoiceItem {
  item_type: 'labor' | 'part';
  name: string;
  quantity: number;
  unit_price: number;
}

export interface Payment {
  id?: number;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'mobile_payment' | 'other';
  reference?: string;
  notes?: string;
  paid_at?: string;
}

// Repair Progress
export type RepairStage =
  | 'received'
  | 'diagnosed'
  | 'parts_ordered'
  | 'in_repair'
  | 'quality_check'
  | 'ready'
  | 'delivered';

export const REPAIR_STAGES: RepairStage[] = [
  'received',
  'diagnosed',
  'parts_ordered',
  'in_repair',
  'quality_check',
  'ready',
  'delivered',
];

export interface RepairProgress {
  id: number;
  appointment_id?: number;
  stage: RepairStage;
  description?: string;
  estimated_completion?: string;
  updates?: RepairUpdate[];
}

export interface RepairUpdate {
  id: number;
  from_stage: RepairStage;
  to_stage: RepairStage;
  note?: string;
  created_at?: string;
}

// Notifications
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  status: 'read' | 'unread';
  appointment_id?: number;
  created_at?: string;
  read_at?: string | null;
}

export interface NotificationsResponse {
  unread_count: number;
  notifications: Notification[];
}

// Mechanic Performance
export interface PerformanceResponse {
  shop_summary?: {
    total_jobs: number;
    total_revenue: number;
    mechanic_count: number;
  };
  mechanics?: MechanicStats[];
  total_mechanics?: number;
}

export interface MechanicStats {
  mechanic_id: number;
  mechanic_name?: string;
  total_jobs?: number;
  total_revenue?: number;
  average_rating?: number;
  rank?: number;
}
