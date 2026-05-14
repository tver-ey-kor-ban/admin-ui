import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import type { PerformanceResponse, MechanicStats } from '../../core/types';

function StarRating({ rating }: { rating?: number }) {
  if (rating == null) return <span className="text-gray-400 text-sm">—</span>;
  const r = Math.round(rating * 10) / 10;
  return <span className="text-yellow-500 font-medium">{r} ★</span>;
}

export function PerformancePage() {
  const { shopId, isOwner, isAdmin } = useAuth();
  // Owners/admins see full team performance; mechanics see own
  const url = shopId && (isOwner || isAdmin)
    ? API.SHOPS.MECHANICS_PERFORMANCE(shopId)
    : shopId
    ? API.SHOPS.MY_PERFORMANCE(shopId)
    : null;

  const { data, loading, error, refetch } = useFetch<PerformanceResponse | MechanicStats[]>(url);

  const isTeam = isOwner || isAdmin;
  const resp = data as PerformanceResponse;
  const mechanics: MechanicStats[] = isTeam
    ? resp?.mechanics ?? (Array.isArray(data) ? data : [])
    : [];
  const summary = resp?.shop_summary;

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{isTeam ? 'Team Performance' : 'My Performance'}</p>
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>

      {loading ? <LoadingSpinner /> : error ? <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div> : (
        <>
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Jobs', value: summary.total_jobs },
                { label: 'Total Revenue', value: `$${Number(summary.total_revenue).toLocaleString('en', { minimumFractionDigits: 2 })}` },
                { label: 'Mechanics', value: summary.mechanic_count },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Mechanics table */}
          {isTeam && mechanics.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Rank', 'Mechanic', 'Total Jobs', 'Revenue', 'Rating'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mechanics.map((m, i) => (
                    <tr key={m.mechanic_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 font-mono">#{m.rank ?? i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{m.mechanic_name ?? `Mechanic #${m.mechanic_id}`}</td>
                      <td className="px-4 py-3 text-gray-700">{m.total_jobs ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{m.total_revenue != null ? `$${Number(m.total_revenue).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3"><StarRating rating={m.average_rating} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Own performance for mechanic */}
          {!isTeam && data && !Array.isArray(data) && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-4">My Stats</h2>
              <pre className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}

          {isTeam && mechanics.length === 0 && !loading && (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
              No performance data available
            </div>
          )}
        </>
      )}
    </div>
  );
}
