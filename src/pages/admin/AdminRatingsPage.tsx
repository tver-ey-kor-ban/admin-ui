import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';

interface RatingItem {
  id: number;
  rating: number;
  review?: string;
  type: 'product' | 'service';
  item_name?: string;
  user_id?: number;
  created_at?: string;
}

interface RatingsData {
  items?: RatingItem[];
  total?: number;
}

export function AdminRatingsPage() {
  const { data, loading, error, refetch } = useFetch<RatingsData>(API.ADMIN.RATINGS);
  const ratings: RatingItem[] = data?.items ?? (Array.isArray(data) ? (data as RatingItem[]) : []);

  const deleteRating = async (r: RatingItem) => {
    if (!confirm('Delete this rating?')) return;
    try {
      const url = r.type === 'product' ? API.ADMIN.RATING_PRODUCT_DELETE(r.id) : API.ADMIN.RATING_SERVICE_DELETE(r.id);
      await apiClient.delete(url);
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    }
  };

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <LoadingSpinner /> : error ? <div className="p-6 text-red-600">{error}</div> : (
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
                  <td className="px-4 py-3 capitalize text-gray-700">{r.type}</td>
                  <td className="px-4 py-3 text-gray-700">{r.item_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.user_id ?? '—'}</td>
                  <td className="px-4 py-3 text-yellow-500 font-mono">{stars(r.rating)}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.review ?? '—'}</td>
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
        )}
      </div>
    </div>
  );
}
