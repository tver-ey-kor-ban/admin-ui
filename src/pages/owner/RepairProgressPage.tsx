import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select, Textarea } from '../../components/ui/Input';
import { REPAIR_STAGES, type RepairProgress, type RepairStage } from '../../core/types';

const STAGE_LABELS: Record<RepairStage, string> = {
  received: 'Received',
  diagnosed: 'Diagnosed',
  parts_ordered: 'Parts Ordered',
  in_repair: 'In Repair',
  quality_check: 'Quality Check',
  ready: 'Ready',
  delivered: 'Delivered',
};

const STAGE_COLORS: Record<RepairStage, string> = {
  received: 'bg-gray-300',
  diagnosed: 'bg-blue-400',
  parts_ordered: 'bg-yellow-400',
  in_repair: 'bg-orange-400',
  quality_check: 'bg-purple-400',
  ready: 'bg-green-400',
  delivered: 'bg-green-600',
};

function StageProgress({ stage }: { stage: RepairStage }) {
  const idx = REPAIR_STAGES.indexOf(stage);
  const pct = Math.round(((idx + 1) / REPAIR_STAGES.length) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{STAGE_LABELS[stage]}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${STAGE_COLORS[stage]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function RepairProgressPage() {
  const { shopId } = useAuth();
  const [apptIdInput, setApptIdInput] = useState('');
  const [apptId, setApptId] = useState<number | null>(null);
  const [repair, setRepair] = useState<RepairProgress | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [fetching, setFetching] = useState(false);

  const [startModal, setStartModal] = useState(false);
  const [advanceModal, setAdvanceModal] = useState(false);
  const [startForm, setStartForm] = useState({ stage: 'received' as RepairStage, notes: '' });
  const [advanceForm, setAdvanceForm] = useState({ stage: 'diagnosed' as RepairStage, notes: '' });
  const [saving, setSaving] = useState(false);

  const lookupRepair = async () => {
    const id = parseInt(apptIdInput);
    if (!shopId || !id) return;
    setFetching(true);
    setFetchError('');
    setRepair(null);
    setApptId(id);
    try {
      const res = await apiClient.get<RepairProgress>(API.REPAIR_PROGRESS.GET(shopId, id));
      setRepair(res.data);
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string }; status?: number } });
      if (detail.response?.status === 404) {
        setFetchError('No repair tracking found for this appointment.');
      } else {
        setFetchError(detail.response?.data?.detail ?? 'Failed to fetch repair progress');
      }
    } finally {
      setFetching(false);
    }
  };

  const startRepair = async () => {
    if (!shopId || !apptId) return;
    setSaving(true);
    try {
      const res = await apiClient.post<RepairProgress>(API.REPAIR_PROGRESS.CREATE(shopId, apptId), startForm);
      setRepair(res.data);
      setStartModal(false);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to start repair');
    } finally {
      setSaving(false); }
  };

  const advanceRepair = async () => {
    if (!shopId || !apptId) return;
    setSaving(true);
    try {
      const res = await apiClient.post<RepairProgress>(API.REPAIR_PROGRESS.ADVANCE(shopId, apptId), advanceForm);
      setRepair(res.data);
      setAdvanceModal(false);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed to advance stage');
    } finally {
      setSaving(false);
    }
  };

  const openAdvance = () => {
    if (!repair) return;
    const nextIdx = Math.min(REPAIR_STAGES.indexOf(repair.stage) + 1, REPAIR_STAGES.length - 1);
    setAdvanceForm({ stage: REPAIR_STAGES[nextIdx], notes: '' });
    setAdvanceModal(true);
  };

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      {/* Appointment lookup */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Appointment ID</label>
          <input
            type="number"
            value={apptIdInput}
            onChange={(e) => setApptIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookupRepair()}
            placeholder="Enter appointment ID..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <Button onClick={lookupRepair} loading={fetching} disabled={!apptIdInput}>Look Up</Button>
      </div>

      {/* Result */}
      {fetchError && (
        <div className="bg-red-50 rounded-xl p-4 text-red-600 text-sm flex items-center justify-between">
          <span>{fetchError}</span>
          {fetchError.includes('No repair') && (
            <Button size="sm" onClick={() => setStartModal(true)}>Start Tracking</Button>
          )}
        </div>
      )}

      {repair && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900">Appointment #{apptId}</p>
              <p className="text-xs text-gray-500 mt-0.5">Current stage: {STAGE_LABELS[repair.stage]}</p>
            </div>
            <div className="flex gap-2">
              {repair.stage !== 'delivered' && (
                <Button size="sm" onClick={openAdvance}>Advance Stage</Button>
              )}
            </div>
          </div>
          <StageProgress stage={repair.stage} />
          {repair.description && <p className="text-sm text-gray-600">{repair.description}</p>}
          {repair.updates && repair.updates.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">History</p>
              <div className="space-y-1">
                {repair.updates.map((u) => (
                  <div key={u.id} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleString() : ''}</span>
                    <span>{STAGE_LABELS[u.from_stage]} → {STAGE_LABELS[u.to_stage]}</span>
                    {u.note && <span className="text-gray-500">— {u.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start Modal */}
      <Modal isOpen={startModal} onClose={() => setStartModal(false)} title="Start Repair Tracking" size="sm">
        <div className="space-y-4">
          <Select label="Initial Stage" value={startForm.stage} onChange={(e) => setStartForm({ ...startForm, stage: e.target.value as RepairStage })}>
            {REPAIR_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </Select>
          <Textarea label="Notes (optional)" rows={2} value={startForm.notes} onChange={(e) => setStartForm({ ...startForm, notes: e.target.value })} placeholder="Vehicle received for inspection..." />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStartModal(false)}>Cancel</Button>
            <Button onClick={startRepair} loading={saving}>Start</Button>
          </div>
        </div>
      </Modal>

      {/* Advance Modal */}
      <Modal isOpen={advanceModal} onClose={() => setAdvanceModal(false)} title="Advance Repair Stage" size="sm">
        <div className="space-y-4">
          <Select label="New Stage" value={advanceForm.stage} onChange={(e) => setAdvanceForm({ ...advanceForm, stage: e.target.value as RepairStage })}>
            {REPAIR_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </Select>
          <Textarea label="Note (optional)" rows={2} value={advanceForm.notes} onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })} placeholder="Engine repair started..." />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAdvanceModal(false)}>Cancel</Button>
            <Button onClick={advanceRepair} loading={saving}>Advance</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
