import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getChangeRequests, createChangeRequest, approveChangeRequest, rejectChangeRequest } from '../api/changeRequests';
import { getTasks } from '../api/tasks';
import type { ChangeRequest, Task } from '../types';
import Layout from '../components/Layout';

const STATUS_BADGE: Record<string, string> = {
    Pending:  'bg-amber-50 text-amber-700',
    Approved: 'bg-emerald-50 text-emerald-700',
    Rejected: 'bg-red-50 text-red-700',
};

type FilterKey = 'Pending' | 'Approved' | 'Rejected' | 'all';

export default function ChangeRequestsPage() {
    const { isTeamLeader } = useAuth();
    const [requests, setRequests] = useState<ChangeRequest[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterKey>('Pending');
    const [taskId, setTaskId] = useState('');
    const [newValue, setNewValue] = useState('InProgress');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getChangeRequests(), getTasks()])
            .then(([r, t]) => { setRequests(r); setTasks(t); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2400);
        return () => clearTimeout(t);
    }, [toast]);

    const visible = requests.filter(r => filter === 'all' || r.status === filter);
    const pending = requests.filter(r => r.status === 'Pending').length;

    const handleCreate = async () => {
        if (!taskId) return;
        const selected = tasks.find(t => t.id === parseInt(taskId));
        if (!selected) return;
        setSubmitting(true);
        try {
            const r = await createChangeRequest({ taskId: parseInt(taskId), changeType: 'StatusChange', oldValue: selected.status, newValue });
            setRequests(prev => [r, ...prev]);
            setTaskId('');
            setToast('Change request submitted');
        } finally { setSubmitting(false); }
    };

    const handleApprove = async (id: number) => {
        await approveChangeRequest(id);
        setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
        setToast('Request approved');
    };

    const handleReject = async (id: number) => {
        await rejectChangeRequest(id);
        setRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
        setToast('Request rejected');
    };

    const FILTERS: [FilterKey, string][] = [['Pending', 'Pending'], ['Approved', 'Approved'], ['Rejected', 'Rejected'], ['all', 'All']];

    return (
        <Layout title="Approvals">
            <div className="flex items-end justify-between mb-6">
                <div>
                    <div className="text-xs text-zinc-400 font-medium mb-1">{pending} pending</div>
                    <h2 className="text-[26px] font-semibold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Change requests</h2>
                </div>
                <div className="flex bg-zinc-100 border border-zinc-200 rounded-md p-0.5 gap-0.5">
                    {FILTERS.map(([k, l]) => (
                        <button key={k} onClick={() => setFilter(k)}
                                className={`px-3 py-1.5 rounded-sm text-[12.5px] font-medium transition ${filter === k ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Submit form for Members */}
            {!isTeamLeader() && (
                <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-800 mb-4">Request a status change</div>
                    <div className="flex gap-3 flex-wrap items-end">
                        <div className="flex-1 min-w-48">
                            <label className="block text-[12.5px] font-medium text-zinc-600 mb-1.5">Task</label>
                            <select value={taskId} onChange={e => setTaskId(e.target.value)}
                                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500">
                                <option value="">Select a task...</option>
                                {tasks.map(t => <option key={t.id} value={t.id}>{t.title} — {t.status}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[12.5px] font-medium text-zinc-600 mb-1.5">New status</label>
                            <select value={newValue} onChange={e => setNewValue(e.target.value)}
                                    className="border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500">
                                <option value="Pending">Pending</option>
                                <option value="InProgress">InProgress</option>
                                <option value="Done">Done</option>
                            </select>
                        </div>
                        <button onClick={handleCreate} disabled={submitting || !taskId}
                                className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 transition"
                                style={{ background: 'oklch(0.52 0.18 295)' }}>
                            {submitting ? 'Submitting...' : 'Submit request'}
                        </button>
                    </div>
                </div>
            )}

            {/* Cards */}
            {loading ? (
                <div className="text-sm text-zinc-400 p-8">Loading...</div>
            ) : visible.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-xl p-14 text-center shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 text-lg mx-auto mb-3">✉</div>
                    <div className="font-medium text-zinc-600">No {filter === 'all' ? '' : filter.toLowerCase()} requests</div>
                    <div className="text-xs text-zinc-400 mt-1">You're all caught up.</div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {visible.map(req => (
                        <div key={req.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 flex-shrink-0 text-sm">⇄</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-zinc-900">{req.taskTitle}</span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[req.status] ?? 'bg-zinc-100 text-zinc-600'}`}>{req.status}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                                        <span>Status change</span>
                                        <span className="text-zinc-300">·</span>
                                        <span className="mono text-xs font-medium text-zinc-600">{req.oldValue}</span>
                                        <span className="text-zinc-300">→</span>
                                        <span className="mono text-xs font-semibold text-zinc-900">{req.newValue}</span>
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-2">
                                        Requested {new Date(req.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                {isTeamLeader() && req.status === 'Pending' && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => handleReject(req.id)}
                                                className="px-3 py-1.5 rounded-md border border-zinc-300 text-xs font-medium hover:bg-zinc-50 transition">
                                            ✕ Reject
                                        </button>
                                        <button onClick={() => handleApprove(req.id)}
                                                className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-700 transition">
                                            ✓ Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[13px] font-medium px-4 py-2.5 rounded-lg shadow-xl z-50 flex items-center gap-2">
                    ✓ {toast}
                </div>
            )}
        </Layout>
    );
}