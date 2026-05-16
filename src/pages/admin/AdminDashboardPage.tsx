import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { AdminStats, AdminDailyStats } from '../../core/types';

function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function DeltaCard({ label, value, prefix = '' }: { label: string; value: number; prefix?: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
      <p className="text-2xl font-bold text-gray-900">{prefix}{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

const DAY_OPTIONS = [7, 30, 90] as const;
type DayOption = typeof DAY_OPTIONS[number];

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function AdminDashboardPage() {
  const [days, setDays] = useState<DayOption>(30);

  const { data: stats, loading: statsLoading, error: statsError } =
    useFetch<AdminStats>(API.ADMIN.STATISTICS);

  const { data: daily, loading: dailyLoading, error: dailyError } =
    useFetch<AdminDailyStats>(`${API.ADMIN.STATISTICS_DAILY}?days=${days}`);

  if (statsLoading) return <LoadingSpinner />;
  if (statsError) return <div className="text-red-600 bg-red-50 rounded-lg p-4">{statsError}</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">

      {/* Platform totals */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Platform Totals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Users"
            value={stats.users.total}
            sub={`${stats.users.active} active · ${stats.users.admins} admins`}
            color="bg-blue-100"
            icon={<svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          />
          <StatCard
            label="Shops"
            value={stats.shops.total}
            sub={`${stats.shops.active} active · ${stats.shops.inactive} inactive`}
            color="bg-purple-100"
            icon={<svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>}
          />
          <StatCard
            label="Appointments"
            value={stats.appointments.total}
            sub={`${stats.appointments.pending} pending · ${stats.appointments.completed} done`}
            color="bg-yellow-100"
            icon={<svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <StatCard
            label="Total Revenue"
            value={fmt(stats.revenue.total)}
            sub={`Appts ${fmt(stats.revenue.appointments)} · Orders ${fmt(stats.revenue.orders)}`}
            color="bg-green-100"
            icon={<svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        {/* Catalog strip */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Products listed</span>
            <span className="font-bold text-gray-900">{stats.catalog.products.toLocaleString()}</span>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Services listed</span>
            <span className="font-bold text-gray-900">{stats.catalog.services.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Period stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Last {days} Days
            {daily && (
              <span className="ml-2 font-normal normal-case text-gray-400">
                ({new Date(daily.start_date).toLocaleDateString()} – {new Date(daily.end_date).toLocaleDateString()})
              </span>
            )}
          </h2>
          <div className="flex gap-1">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  days === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {dailyLoading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : dailyError ? (
          <div className="text-red-600 bg-red-50 rounded-lg p-4 text-sm">{dailyError}</div>
        ) : daily ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <DeltaCard label="New Users" value={daily.new_users} />
            <DeltaCard label="New Shops" value={daily.new_shops} />
            <DeltaCard label="New Appointments" value={daily.new_appointments} />
            <DeltaCard label="New Orders" value={daily.new_orders} />
            <DeltaCard label="Appt Revenue" value={daily.revenue.appointments} prefix="$" />
            <DeltaCard label="Total Revenue" value={daily.revenue.total} prefix="$" />
          </div>
        ) : null}
      </div>

    </div>
  );
}
