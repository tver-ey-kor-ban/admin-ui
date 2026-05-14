import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { apiClient } from '../../core/api/apiClient';
import { API } from '../../core/api/apiConstants';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { REPAIR_STAGES, type RepairProgress, type RepairStage } from '../../core/types';

interface RepairsData { repairs?: RepairProgress[]; items?: RepairProgress[] }

const STAGE_LABELS: Record<RepairStage, string> = {
  received: 'Received',
  diagnosing: 'Diagnosing',
  waiting_parts: 'Waiting Parts',
  in_progress: 'In Progress',
  quality_check: 'Quality Check',
  ready_for_pickup: 'Ready for Pickup',
  completed: 'Completed',
};

const STAGE_COLORS: Record<RepairStage, string> = {
  received: 'bg-gray-200',
  diagnosing: 'bg-blue-400',
  waiting_parts: 'bg-yellow-400',
  in_progress: 'bg-orange-400',
  quality_check: 'bg-purple-400',
  ready_for_pickup: 'bg-green-400',
  completed: 'bg-green-600',
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
  const [stageFilter, setStageFilter] = useState<RepairStage | ''>('');

  const url = shopId
    ? `${API.REPAIR_PROGRESS.SHOP_LIST(shopId)}${stageFilter ? `?stage=${stageFilter}` : ''}`
    : null;
  const { data, loading, error, refetch } = useFetch<RepairsData | RepairProgress[]>(url);

  const [createModal, setCreateModal] = useState(false);
  const [updateModal, setUpdateModal] = useState<RepairProgress | null>(null);
  const [createForm, setCreateForm] = useState({ appointment_id: '', stage: 'received' as RepairStage, description: '', estimated_completion: '' });
  const [updateForm, setUpdateForm] = useState({ stage: 'received' as RepairStage, note: '', estimated_completion: '' });
  const [saving, setSaving] = useState(false);

  const repairs: RepairProgress[] = Array.isArray(data) ? data : (data as RepairsData)?.repairs ?? (data as RepairsData)?.items ?? [];

  const createRepair = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      await apiClient.post(API.REPAIR_PROGRESS.CREATE(shopId), {
        ...createForm,
        appointment_id: parseInt(createForm.appointment_id),
        estimated_completion: createForm.estimated_completion || undefined,
      });
      setCreateModal(false);
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    } finally { setSaving(false); }
  };

  const openUpdate = (r: RepairProgress) => {
    setUpdateForm({ stage: r.stage, note: '', estimated_completion: '' });
    setUpdateModal(r);
  };

  const updateRepair = async () => {
    if (!updateModal || !shopId) return;
    setSaving(true);
    try {
      await apiClient.put(API.REPAIR_PROGRESS.UPDATE(shopId, updateModal.id), {
        ...updateForm,
        estimated_completion: updateForm.estimated_completion || undefined,
      });
      setUpdateModal(null);
      refetch();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Failed');
    } finally { setSaving(false); }
  };

  if (!shopId) return <div className="text-gray-500">No shop selected.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{repairs.length} repair{repairs.length !== 1 ? 's' : ''}</p>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as RepairStage | '')}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Stages</option>
            {REPAIR_STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
          <Button size="sm" onClick={() => setCreateModal(true)}>+ Start Repair</Button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : error ? <div className="text-red-600 bg-red-50 rounded-lg p-4">{error}</div> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {repairs.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">Repair #{r.id}</p>
                  {r.appointment_id && <p className="text-xs text-gray-500">Appointment #{r.appointment_id}</p>}
                </div>
                <Button size="sm" variant="secondary" onClick={() => openUpdate(r)}>Update Stage</Button>
              </div>
              <StageProgress stage={r.stage} />
              {r.description && <p className="text-sm text-gray-600 mt-3">{r.description}</p>}
              {r.estimated_completion && (
                <p className="text-xs text-gray-500 mt-1">Est. completion: {new Date(r.estimated_completion).toLocaleString()}</p>
              )}
            </div>
          ))}
          {repairs.length === 0 && (
            <div className="col-span-2 bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
              No active repairs
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Start Repair Progress" size="sm">
        <div className="space-y-4">
          <Input label="Appointment ID *" type="number" value={createForm.appointment_id} onChange={(e) => setCreateForm({ ...createForm, appointment_id: e.target.value })} placeholder="1" />
          <Select label="Initial Stage" value={createForm.stage} onChange={(e) => setCreateForm({ ...createForm, stage: e.target.value as RepairStage })}>
            {REPAIR_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </Select>
          <Textarea label="Description" rows={2} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Vehicle received for inspection..." />
          <Input label="Est. Completion (optional)" type="datetime-local" value={createForm.estimated_completion} onChange={(e) => setCreateForm({ ...createForm, estimated_completion: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={createRepair} loading={saving} disabled={!createForm.appointment_id}>Start</Button>
          </div>
        </div>
      </Modal>

      {/* Update Modal */}
      <Modal isOpen={!!updateModal} onClose={() => setUpdateModal(null)} title={`Update Repair #${updateModal?.id}`} size="sm">
        <div className="space-y-4">
          <Select label="New Stage" value={updateForm.stage} onChange={(e) => setUpdateForm({ ...updateForm, stage: e.target.value as RepairStage })}>
            {REPAIR_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </Select>
          <Textarea label="Note (optional)" rows={2} value={updateForm.note} onChange={(e) => setUpdateForm({ ...updateForm, note: e.target.value })} placeholder="Engine repair started..." />
          <Input label="Est. Completion (optional)" type="datetime-local" value={updateForm.estimated_completion} onChange={(e) => setUpdateForm({ ...updateForm, estimated_completion: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setUpdateModal(null)}>Cancel</Button>
            <Button onClick={updateRepair} loading={saving}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
