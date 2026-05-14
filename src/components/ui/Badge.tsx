type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-purple-100 text-purple-800',
  gray: 'bg-gray-100 text-gray-700',
};

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}

export function statusBadge(status: string): Variant {
  switch (status.toLowerCase()) {
    case 'pending': return 'warning';
    case 'confirmed':
    case 'accepted':
    case 'approved':
    case 'paid':
    case 'completed':
    case 'ready':
    case 'ready_for_pickup': return 'success';
    case 'rejected':
    case 'cancelled':
    case 'overdue': return 'danger';
    case 'sent': return 'info';
    case 'draft': return 'gray';
    case 'processing':
    case 'in_progress':
    case 'diagnosing':
    case 'waiting_parts':
    case 'quality_check': return 'info';
    default: return 'default';
  }
}
