import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface RatingItem {
  id: number;
  rating: number;
  review?: string;
  comment?: string;
  user_id?: number;
  product_id?: number;
  service_id?: number;
  item_name?: string;
  created_at?: string;
  // injected client-side
  type: 'product' | 'service';
}

interface RatingsResponse {
  product_ratings?: RatingItem[];
  service_ratings?: RatingItem[];
  // fallback if backend wraps in items
  items?: RatingItem[];
}

const LIMIT = 100;

export function AdminRatingsPage() {
  const [skip, setSkip] = useState(0);
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');

  const { data, loading, error, refetch } = useFetch<RatingsResponse>(
    `${API.ADMIN.RATINGS}?skip=${skip}&limit=${LIMIT}`
  );

  // Normalise the two-array shape the API returns
  const productRatings: RatingItem[] = (data?.product_ratings ?? []).map(r => ({ ...r, type: 'product' as const }));
  const serviceRatings: RatingItem[] = (data?.service_ratings ?? []).map(r => ({ ...r, type: 'service' as const }));
  const allRatings: RatingItem[] = [...productRatings, ...serviceRatings];

  const ratings = typeFilter === 'all'
    ? allRatings
    : allRatings.filter(r => r.type === typeFilter);

  const deleteRating = async (r: RatingItem) => {
    if (!confirm('Delete this rating?')) return;
    try {
      const url = r.type === 'product'
        ? API.ADMIN.RATING_PRODUCT_DELETE(r.id)
        : API.ADMIN.RATING_SERVICE_DELETE(r.id);
      await apiClient.delete(url);
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    }
  };

  const stars = (n: number) => '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n)));

  const page = Math.floor(skip / LIMIT) + 1;
  const hasNext = allRatings.length === LIMIT;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        {/* Type filter */}
        <div className="flex gap-1">
          {(['all', 'product', 'service'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="flex-1 text-sm text-gray-500">
          {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
          {typeFilter !== 'all' && ` (${typeFilter})`}
        </p>
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : error ? <div className="p-6 text-red-600">{error}</div> : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['ID', 'Type', 'Item', 'User', 'Rating', 'Review', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ratings.map((r) => (
                  <tr key={`${r.type}-${r.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{r.id}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.type === 'product' ? 'default' : 'info'}>
                        {r.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.item_name ?? (r.product_id ? `Product #${r.product_id}` : r.service_id ? `Service #${r.service_id}` : '—')}</td>
                    <td className="px-4 py-3 text-gray-500">{r.user_id ?? '—'}</td>
                    <td className="px-4 py-3 text-yellow-500 font-mono text-xs">{stars(r.rating)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.review ?? r.comment ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteRating(r)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
                {ratings.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No ratings found</td></tr>
                )}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
              <span>Page {page}</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={skip === 0} onClick={() => setSkip(s => Math.max(0, s - LIMIT))}>Prev</Button>
                <Button variant="secondary" size="sm" disabled={!hasNext} onClick={() => setSkip(s => s + LIMIT)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
