import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, acknowledgeTask } from '../api/tasks';
import { getChangeRequests, createChangeRequest } from '../api/changeRequests';
import type { Task, ChangeRequest } from '../types';
import Layout from '../components/Layout';

const STATUS_BADGE: Record<string, string> = {
    Pending:    'bg-zinc-100 text-zinc-600',
    InProgress: 'bg-violet-50 text-violet-700',
    Done:       'bg-emerald-50 text-emerald-700',
};

const PRIORITY_BADGE: Record<string, string> = {
    High:   'bg-orange-50 text-orange-700',
    Medium: 'bg-blue-50 text-blue-700',
    Low:    'bg-emerald-50 text-emerald-700',
};

function isOverdue(task: Task): boolean {
    return task.status !== 'Done' && new Date(task.dueDate) < new Date();
}

// ── Request Status Change Modal ───────────────────────────────
// This is the same flow as the Team Leader's change requests page.
// Member picks a task, picks a new status, submits — Team Leader sees it in Approvals.
function RequestModal({ open, onClose, tasks, onSubmit }: {
    open: boolean;
    onClose: () => void;
    tasks: Task[];
    onSubmit: (taskId: number, oldStatus: string, newStatus: string) => Promise<void>;
}) {
    const [taskId, setTaskId] = useState('');
    const [newStatus, setNewStatus] = useState('InProgress');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) { setTaskId(''); setNewStatus('InProgress'); }
    }, [open]);

    if (!open) return null;

    const selected = tasks.find(t => t.id === parseInt(taskId));

    const handleSubmit = async () => {
        if (!selected) return;
        setSubmitting(true);
        try {
            await onSubmit(selected.id, selected.status, newStatus);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
             style={{ background: 'rgba(24,24,27,0.32)', backdropFilter: 'blur(2px)' }}
             onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[92vw] overflow-hidden flex flex-col"
                 onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                    <div>
                        <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">Change request</div>
                        <div className="text-[16px] font-semibold mt-0.5">Request a status change</div>
                    </div>
                    <button onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 transition text-lg">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-4">
                    {/* Info box explaining what this does */}
                    <div className="bg-violet-50 border border-violet-100 rounded-lg px-4 py-3 text-xs text-violet-700 leading-relaxed">
                        This request will be sent to your Team Leader for approval.
                        The task status will only change once they approve it.
                    </div>

                    {/* Task picker */}
                    <div>
                        <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Task</label>
                        <select value={taskId} onChange={e => setTaskId(e.target.value)}
                                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100">
                            <option value="">Select a task...</option>
                            {tasks.filter(t => t.status !== 'Done').map(t => (
                                <option key={t.id} value={t.id}>{t.title} — currently {t.status}</option>
                            ))}
                        </select>
                    </div>

                    {/* If task selected, show current → new status */}
                    {selected && (
                        <div>
                            <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Request new status</label>
                            <div className="flex items-center gap-3">
                                {/* Current status — read only */}
                                <div className="flex-1 border border-zinc-200 rounded-md px-3 py-2 text-sm bg-zinc-50 text-zinc-500">
                                    {selected.status}
                                </div>
                                <span className="text-zinc-300 font-mono">→</span>
                                {/* New status picker */}
                                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                                        className="flex-1 border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100">
                                    {['Pending', 'InProgress', 'Done']
                                        .filter(s => s !== selected.status)
                                        .map(s => <option key={s} value={s}>{s}</option>)
                                    }
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Task details preview */}
                    {selected && (
                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                            <div className="text-[12px] font-medium text-zinc-400 uppercase tracking-widest mb-2">Task details</div>
                            <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[selected.priority]}`}>
                  {selected.priority}
                </span>
                                <span className="text-xs text-zinc-500">{selected.complexity} complexity</span>
                                <span className="text-xs text-zinc-500">{selected.effortHours}h</span>
                                <span className="text-xs font-semibold mono text-zinc-600 ml-auto">weight {selected.weight.toFixed(1)}</span>
                            </div>
                            <div className="text-xs text-zinc-400 mt-2">
                                Due {new Date(selected.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-end gap-2">
                    <button onClick={onClose}
                            className="px-3 py-1.5 rounded-md text-sm text-zinc-500 hover:bg-zinc-100 transition">
                        Cancel
                    </button>
                    <button
                        disabled={!selected || submitting}
                        onClick={handleSubmit}
                        className="px-4 py-1.5 rounded-md text-sm font-medium text-white disabled:opacity-40 transition"
                        style={{ background: 'oklch(0.52 0.18 295)' }}>
                        {submitting ? 'Submitting...' : 'Submit request'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Member Page ──────────────────────────────────────────
export default function MemberPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [requests, setRequests] = useState<ChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [acknowledged, setAcknowledged] = useState<Set<number>>(new Set());
    const [modalOpen, setModalOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getTasks(), getChangeRequests()])
            .then(([t, r]) => { setTasks(t); setRequests(r); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(t);
    }, [toast]);

    // Acknowledge — sends POST /api/tasks/{id}/acknowledge
    // Records that the member has seen and accepted the task.
    // Like a read receipt. Does NOT change status.
    const handleAcknowledge = async (taskId: number) => {
        await acknowledgeTask(taskId);
        setAcknowledged(prev => new Set([...prev, taskId]));
        setToast('Task acknowledged');
    };

    // Submit change request — calls POST /api/change-requests
    // Team Leader sees this in the Approvals page and can approve or reject.
    const handleSubmitRequest = async (taskId: number, oldStatus: string, newStatus: string) => {
        const newReq = await createChangeRequest({
            taskId,
            changeType: 'StatusChange',
            oldValue: oldStatus,
            newValue: newStatus,
        });
        setRequests(prev => [newReq, ...prev]);
        setToast('Change request submitted — awaiting approval');
    };

    const FILTERS = [['all', 'All'], ['Pending', 'Pending'], ['InProgress', 'In Progress'], ['Done', 'Done']];
    const visible = tasks.filter(t => filter === 'all' || t.status === filter);

    const pending    = tasks.filter(t => t.status === 'Pending').length;
    const inProgress = tasks.filter(t => t.status === 'InProgress').length;
    const done       = tasks.filter(t => t.status === 'Done').length;
    const overdue    = tasks.filter(isOverdue).length;

    // Only show this member's own change requests
    const myRequests = requests.filter(r => r.requestedBy === user?.userId);

    return (
        <Layout title="My Tasks" topRight={
            <button onClick={() => setModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white"
                    style={{ background: 'oklch(0.52 0.18 295)' }}>
                ⇄ Request status change
            </button>
        }>

            <div className="mb-6">
                <div className="text-xs text-zinc-400 font-medium mb-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <h2 className="text-[26px] font-semibold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                    {user?.fullName.split(' ')[0]} 👋
                </h2>
            </div>

            {/* Quick stats  */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Pending',     value: pending,    warn: false },
                    { label: 'In Progress', value: inProgress, warn: false },
                    { label: 'Done',        value: done,        warn: false },
                    { label: 'Overdue',     value: overdue,     warn: overdue > 0 },
                ].map(s => (
                    <div key={s.label} className={`bg-white border rounded-xl p-4 shadow-sm ${s.warn ? 'border-red-200' : 'border-zinc-200'}`}>
                        <div className="text-[12.5px] text-zinc-400 font-medium">{s.label}</div>
                        <div className={`text-[28px] font-semibold mono mt-1.5 ${s.warn ? 'text-red-600' : ''}`}
                             style={{ letterSpacing: '-0.02em' }}>
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex items-end justify-between mb-4">
                <div>
                    <div className="text-xs text-zinc-400 font-medium mb-1">{visible.length} task{visible.length !== 1 ? 's' : ''} shown</div>
                    <h2 className="text-[22px] font-semibold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Tasks</h2>
                </div>
                <div className="flex bg-zinc-100 border border-zinc-200 rounded-md p-0.5 gap-0.5">
                    {FILTERS.map(([k, l]) => (
                        <button key={k} onClick={() => setFilter(k)}
                                className={`px-3 py-1.5 rounded-sm text-[12.5px] font-medium transition
                ${filter === k ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Task table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden mb-8">
                {loading ? (
                    <div className="p-10 text-sm text-zinc-400">Loading your tasks...</div>
                ) : visible.length === 0 ? (
                    <div className="p-14 text-center">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 text-lg mx-auto mb-3">✓</div>
                        <div className="font-medium text-zinc-600">No {filter === 'all' ? '' : filter} tasks</div>
                        <div className="text-xs text-zinc-400 mt-1">All caught up.</div>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                            {['Task', 'Priority', 'Complexity', 'Effort', 'Weight', 'Status', 'Due', ''].map(h => (
                                <th key={h} className="text-left text-[11.5px] font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {visible.map(task => {
                            const overdue = isOverdue(task);
                            const acked = acknowledged.has(task.id);

                            return (
                                <tr key={task.id}
                                    className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors
                      ${overdue ? 'bg-red-50/40' : ''}`}>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {overdue && <div className="w-1 h-8 rounded-full bg-red-400 flex-shrink-0" />}
                                            <div>
                                                <div className="font-medium text-zinc-900 flex items-center gap-2">
                                                    {task.title}
                                                    {overdue && (
                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                                Overdue
                              </span>
                                                    )}
                                                </div>
                                                {task.description && (
                                                    <div className="text-xs text-zinc-400 mt-0.5 truncate max-w-[200px]">{task.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[task.priority] ?? 'bg-zinc-100 text-zinc-600'}`}>
                        {task.priority}
                      </span>
                                    </td>

                                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
                        {task.complexity}
                      </span>
                                    </td>

                                    <td className="px-4 py-3 mono text-xs text-zinc-500">{task.effortHours}h</td>

                                    <td className="px-4 py-3 mono text-xs font-semibold text-zinc-700">{task.weight.toFixed(1)}</td>

                                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[task.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                        {task.status}
                      </span>
                                    </td>

                                    <td className="px-4 py-3 text-xs text-zinc-400">
                                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                        {acked ? (
                                            <span className="text-[11.5px] text-emerald-600 font-medium">✓ Acknowledged</span>
                                        ) : (
                                            <button
                                                onClick={() => handleAcknowledge(task.id)}
                                                className="text-xs text-zinc-400 hover:text-violet-600 font-medium border border-zinc-200 hover:border-violet-300 px-2.5 py-1 rounded-md transition"
                                                title="Confirm you've seen and accepted this task">
                                                Acknowledge
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* My change requests */}
            {myRequests.length > 0 && (
                <div>
                    <div className="text-sm font-semibold text-zinc-800  mt-3 mb-3">
                        My change requests
                        <span className="ml-2 p-8 text-xs font-normal text-zinc-400">
              {myRequests.filter(r => r.status === 'Pending').length} pending
            </span>
                    </div>
                    <div className="flex flex-col gap-3">
                        {myRequests.map(req => (
                            <div key={req.id} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 flex-shrink-0 text-sm">⇄</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-medium text-zinc-900">{req.taskTitle}</div>
                                    <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                                        <span className="mono">{req.oldValue}</span>
                                        <span className="text-zinc-300">→</span>
                                        <span className="mono font-medium text-zinc-600">{req.newValue}</span>
                                        <span className="text-zinc-300 mx-1">·</span>
                                        {new Date(req.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0
                  ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700'
                                    : req.status === 'Rejected' ? 'bg-red-50 text-red-700'
                                        : 'bg-amber-50 text-amber-700'}`}>
                  {req.status}
                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Request  */}
            <RequestModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                tasks={tasks}
                onSubmit={handleSubmitRequest}
            />

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[13px] font-medium px-4 py-2.5 rounded-lg shadow-xl z-50">
                    ✓ {toast}
                </div>
            )}
        </Layout>
    );
}