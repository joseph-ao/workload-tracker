import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, deleteTask, acknowledgeTask } from '../api/tasks';
import { getUsers, type UserOption } from '../api/users';
import { getWorkload } from '../api/workload';
import type { Task, WorkloadEntry } from '../types';
import Layout from '../components/Layout';

const PRIORITY_BADGE: Record<string, string> = {
    High:   'bg-orange-50 text-orange-700',
    Medium: 'bg-blue-50 text-blue-700',
    Low:    'bg-emerald-50 text-emerald-700',
};
const STATUS_BADGE: Record<string, string> = {
    Pending:    'bg-zinc-100 text-zinc-600',
    InProgress: 'bg-violet-50 text-violet-700',
    Done:       'bg-emerald-50 text-emerald-700',
};

function getStatus(w: number): 'ok' | 'warn' | 'over' {
    return w <= 15 ? 'ok' : w <= 25 ? 'warn' : 'over';
}
const STATUS_BAR: Record<string, string> = { ok: '#4ade80', warn: '#facc15', over: '#f87171' };


function isOverdue(task: Task): boolean {
    return task.status !== 'Done' && new Date(task.dueDate) < new Date();
}

function TaskCreateModal({ open, onClose, users, workload, onCreate }: {
    open: boolean;
    onClose: () => void;
    users: UserOption[];
    workload: WorkloadEntry[];
    onCreate: (form: {
        title: string; description: string; priority: string;
        complexity: string; effortHours: number;
        startDate: string; dueDate: string; assignedUserId: string;
    }) => Promise<void>;
}) {
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '',
        priority: 'Medium', complexity: 'Medium',
        effortHours: 6, startDate: '', dueDate: '', assignedUserId: '',
    });

    useEffect(() => {
        if (open) {
            setStep(1);
            setForm({ title: '', description: '', priority: 'Medium', complexity: 'Medium', effortHours: 6, startDate: '', dueDate: '', assignedUserId: '' });
        }
    }, [open]);

    if (!open) return null;

    const PRIORITY_MULT: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
    const COMPLEXITY_MULT: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
    const previewWeight = form.effortHours * COMPLEXITY_MULT[form.complexity] * PRIORITY_MULT[form.priority];

    const scored = users.map(u => {
        const entry = workload.find(w => w.userId === u.id);
        const currentWeight = entry?.totalWeight ?? 0;
        const projected = currentWeight + previewWeight;
        const currentStatus = getStatus(currentWeight);
        const projectedStatus = getStatus(projected);
        let score = 100 - currentWeight * 2.5;
        if (projectedStatus === 'over') score -= 35;
        if (projectedStatus === 'warn') score -= 8;
        return { ...u, currentWeight, projected: +projected.toFixed(1), currentStatus, projectedStatus, score: Math.round(Math.max(0, Math.min(100, score))) };
    }).sort((a, b) => b.score - a.score);

    const tier = (s: number) => s >= 75 ? 'Best fit' : s >= 55 ? 'Good' : s >= 35 ? 'Fair' : 'Heavy';
    const tierColor = (s: number) => s >= 75 ? 'bg-violet-50 text-violet-700' : s >= 55 ? 'bg-emerald-50 text-emerald-700' : s >= 35 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';

    const handleSubmit = async () => {
        setSubmitting(true);
        try { await onCreate(form); onClose(); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
             style={{ background: 'rgba(24,24,27,0.32)', backdropFilter: 'blur(2px)' }}
             onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-[880px] max-w-[92vw] max-h-[92vh] overflow-hidden flex flex-col"
                 onClick={e => e.stopPropagation()}>

                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                    <div>
                        <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">Step {step} of 2</div>
                        <div className="text-[16px] font-semibold mt-0.5">{step === 1 ? 'New task' : 'Choose an assignee'}</div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition text-lg">✕</button>
                </div>

                {step === 1 && (
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                       className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                       placeholder="What needs to be done?" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                          rows={3} className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 resize-none"
                                          placeholder="Optional details..." />
                            </div>
                            <div>
                                <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Priority</label>
                                <div className="flex rounded-md border border-zinc-300 overflow-hidden">
                                    {['Low', 'Medium', 'High'].map(p => (
                                        <button key={p} onClick={() => setForm({ ...form, priority: p })}
                                                className={`flex-1 py-2 text-sm font-medium transition ${form.priority === p ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-xs text-zinc-400 mt-1 mono">×{PRIORITY_MULT[form.priority]} multiplier</div>
                            </div>
                            <div>
                                <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Complexity</label>
                                <div className="flex rounded-md border border-zinc-300 overflow-hidden">
                                    {['Low', 'Medium', 'High'].map(c => (
                                        <button key={c} onClick={() => setForm({ ...form, complexity: c })}
                                                className={`flex-1 py-2 text-sm font-medium transition ${form.complexity === c ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'}`}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-xs text-zinc-400 mt-1 mono">×{COMPLEXITY_MULT[form.complexity]} multiplier</div>
                            </div>
                            <div>
                                <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Estimated effort (hours)</label>
                                <input type="number" min={0.5} step={0.5} value={form.effortHours}
                                       onChange={e => setForm({ ...form, effortHours: Number(e.target.value) })}
                                       className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 mono" />
                            </div>
                            <div>
                                <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Start date</label>
                                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                                       className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                            </div>
                            <div>
                                <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Due date</label>
                                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                       className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                            </div>
                        </div>

                        <div className="mt-5 p-4 rounded-xl flex items-center justify-between" style={{ background: 'oklch(0.96 0.03 295)' }}>
                            <div>
                                <div className="text-[12.5px] font-medium" style={{ color: 'oklch(0.32 0.16 295)' }}>Calculated weight</div>
                                <div className="text-xs mono mt-1" style={{ color: 'oklch(0.42 0.16 295)' }}>
                                    {form.effortHours}h × {COMPLEXITY_MULT[form.complexity]} ({form.complexity}) × {PRIORITY_MULT[form.priority]} ({form.priority})
                                </div>
                            </div>
                            <div className="text-[32px] font-semibold mono" style={{ color: 'oklch(0.32 0.16 295)', letterSpacing: '-0.02em' }}>
                                {previewWeight.toFixed(1)}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-sm text-zinc-400">
                                Sorted by best fit · projected workload includes <span className="mono font-semibold text-zinc-900">+{previewWeight.toFixed(1)}</span> weight
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-violet-50 text-violet-700">✦ Smart suggest</span>
                        </div>
                        <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                            {scored.map((u, idx) => {
                                const picked = form.assignedUserId === u.id;
                                const curPct = Math.min(100, (u.currentWeight / 40) * 100);
                                const projPct = Math.min(100, (u.projected / 40) * 100);
                                return (
                                    <div key={u.id} onClick={() => setForm({ ...form, assignedUserId: u.id })}
                                         className={`p-4 rounded-xl border cursor-pointer transition-all ${picked ? 'border-violet-500 bg-violet-50/50' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                                        <div className="grid items-center gap-4" style={{ gridTemplateColumns: 'auto 1fr auto auto' }}>
                                            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold">
                                                {u.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-medium text-[13.5px]">{u.fullName}</span>
                                                    {idx === 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">Best fit</span>}
                                                </div>
                                                <div className="text-xs text-zinc-400">{u.role}</div>
                                                <div className="mt-2 h-1.5 bg-zinc-100 rounded-full relative overflow-hidden">
                                                    <div className="absolute inset-y-0 left-0 rounded-full opacity-50"
                                                         style={{ width: `${curPct}%`, background: STATUS_BAR[u.currentStatus] }} />
                                                    <div className="absolute inset-y-0 left-0 rounded-full opacity-40"
                                                         style={{ width: `${projPct}%`, background: STATUS_BAR[u.projectedStatus] }} />
                                                    <div className="absolute inset-y-0 w-px bg-zinc-900" style={{ left: `${curPct}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                                                    <span>now <span className="mono font-semibold text-zinc-700">{u.currentWeight.toFixed(1)}</span></span>
                                                    <span>after <span className="mono font-semibold text-zinc-900">{u.projected.toFixed(1)}</span>
                                                        {u.projectedStatus !== u.currentStatus && (
                                                            <span className={`ml-1 ${u.projectedStatus === 'over' ? 'text-red-500' : u.projectedStatus === 'warn' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                ({u.projectedStatus})
                              </span>
                                                        )}
                          </span>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mono ${tierColor(u.score)}`}>
                        {tier(u.score)}
                      </span>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${picked ? 'border-violet-600 bg-violet-600' : 'border-zinc-300'}`}>
                                                {picked && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between">
                    <div className="text-xs text-zinc-400">
                        {step === 2 && form.assignedUserId && (
                            <span>Assigning to <span className="font-semibold text-zinc-900">{users.find(u => u.id === form.assignedUserId)?.fullName}</span></span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step === 2 && <button onClick={() => setStep(1)} className="px-3 py-1.5 rounded-md border border-zinc-300 text-sm hover:bg-zinc-50 transition">Back</button>}
                        <button onClick={onClose} className="px-3 py-1.5 rounded-md text-sm text-zinc-500 hover:bg-zinc-100 transition">Cancel</button>
                        {step === 1 ? (
                            <button disabled={!form.title} onClick={() => setStep(2)}
                                    className="px-4 py-1.5 rounded-md text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-40 transition">
                                Continue →
                            </button>
                        ) : (
                            <button disabled={!form.assignedUserId || submitting} onClick={handleSubmit}
                                    className="px-4 py-1.5 rounded-md text-sm font-medium text-white disabled:opacity-40 transition"
                                    style={{ background: 'oklch(0.52 0.18 295)' }}>
                                {submitting ? 'Creating...' : '✓ Create task'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

//Main Tasks Page 
export default function DashboardPage() {
    const { isTeamLeader } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [workload, setWorkload] = useState<WorkloadEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        Promise.all([getTasks(), getUsers(), getWorkload()])
            .then(([t, u, w]) => { setTasks(t); setUsers(u); setWorkload(w); })
            .finally(() => setLoading(false));
    }, []);

    
    const statusCounts = useMemo(() => ({
        Pending:    tasks.filter(t => t.status === 'Pending').length,
        InProgress: tasks.filter(t => t.status === 'InProgress').length,
        Done:       tasks.filter(t => t.status === 'Done').length,
    }), [tasks]);

// the stats
    const quickStats = useMemo(() => {
        const totalWeight = tasks.reduce((s, t) => s + t.weight, 0);
        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + (7 - now.getDay()));
        weekEnd.setHours(23, 59, 59, 999);
        const dueThisWeek = tasks.filter(t => {
            const due = new Date(t.dueDate);
            return due >= now && due <= weekEnd && t.status !== 'Done';
        }).length;
        const overdueCount = tasks.filter(isOverdue).length;
        return { totalWeight, dueThisWeek, overdueCount };
    }, [tasks]);

    const visible = tasks.filter(t => filter === 'all' || t.status === filter);

    const handleCreate = async (form: {
        title: string; description: string; priority: string;
        complexity: string; effortHours: number;
        startDate: string; dueDate: string; assignedUserId: string;
    }) => {
        const t = await createTask({
            ...form,
            startDate: new Date(form.startDate).toISOString(),
            dueDate: new Date(form.dueDate).toISOString(),
        });
        setTasks(prev => [t, ...prev]);
        const updated = await getWorkload();
        setWorkload(updated);
    };

    const handleDelete = async (id: number) => {
        await deleteTask(id);
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleAck = async (id: number) => {
        await acknowledgeTask(id);
        alert('Acknowledged!');
    };

    const FILTERS = [['all', 'All'], ['Pending', 'Pending'], ['InProgress', 'In Progress'], ['Done', 'Done']];

    return (
        <Layout title="Tasks" topRight={
            isTeamLeader() ? (
                <button onClick={() => setModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white"
                        style={{ background: 'oklch(0.52 0.18 295)' }}>
                    + New task
                </button>
            ) : undefined
        }>

            {isTeamLeader() && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total tasks', value: tasks.length, sub: 'across all members' },
                        { label: 'Total weight', value: quickStats.totalWeight.toFixed(1), sub: 'combined task weight', mono: true },
                        { label: 'Due this week', value: quickStats.dueThisWeek, sub: 'not yet completed' },
                        { label: 'Overdue', value: quickStats.overdueCount, sub: quickStats.overdueCount > 0 ? 'needs attention' : 'all on track', warn: quickStats.overdueCount > 0 },
                    ].map(stat => (
                        <div key={stat.label} className={`bg-white border rounded-xl p-4 shadow-sm ${stat.warn ? 'border-red-200' : 'border-zinc-200'}`}>
                            <div className="text-[12.5px] text-zinc-400 font-medium">{stat.label}</div>
                            <div className={`text-[24px] font-semibold mt-1.5 tracking-tight ${stat.warn ? 'text-red-600' : ''} ${stat.mono ? 'mono' : ''}`}
                                 style={{ letterSpacing: '-0.02em' }}>
                                {stat.value}
                            </div>
                            <div className={`text-xs mt-1 ${stat.warn ? 'text-red-400' : 'text-zinc-400'}`}>{stat.sub}</div>
                        </div>
                    ))}
                </div>
            )}

    
            {tasks.length > 0 && (
                <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-[12.5px] font-medium text-zinc-600">Status breakdown</div>
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm inline-block bg-zinc-300" /> Pending {statusCounts.Pending}
              </span>
                            <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm inline-block bg-violet-400" /> In Progress {statusCounts.InProgress}
              </span>
                            <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm inline-block bg-emerald-400" /> Done {statusCounts.Done}
              </span>
                        </div>
                    </div>

                    <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                        {statusCounts.Pending > 0 && (
                            <div
                                onClick={() => setFilter('Pending')}
                                className="bg-zinc-300 hover:bg-zinc-400 transition cursor-pointer"
                                style={{ width: `${(statusCounts.Pending / tasks.length) * 100}%` }}
                                title={`${statusCounts.Pending} Pending`}
                            />
                        )}
                        {statusCounts.InProgress > 0 && (
                            <div
                                onClick={() => setFilter('InProgress')}
                                className="bg-violet-400 hover:bg-violet-500 transition cursor-pointer"
                                style={{ width: `${(statusCounts.InProgress / tasks.length) * 100}%` }}
                                title={`${statusCounts.InProgress} In Progress`}
                            />
                        )}
                        {statusCounts.Done > 0 && (
                            <div
                                onClick={() => setFilter('Done')}
                                className="bg-emerald-400 hover:bg-emerald-500 transition cursor-pointer"
                                style={{ width: `${(statusCounts.Done / tasks.length) * 100}%` }}
                                title={`${statusCounts.Done} Done`}
                            />
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-end justify-between mb-4">
                <div>
                    <div className="text-xs text-zinc-400 font-medium mb-1">{visible.length} task{visible.length !== 1 ? 's' : ''} shown</div>
                    <h2 className="text-[22px] font-semibold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Tasks</h2>
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

            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 text-sm text-zinc-400">Loading...</div>
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
                            {['Task', 'Assignee', 'Priority', 'Complexity', 'Effort', 'Weight', 'Status', ''].map(h => (
                                <th key={h} className="text-left text-[11.5px] font-medium text-zinc-400 uppercase tracking-wider px-4 py-3">{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {visible.map(task => (
              
                            <tr key={task.id}
                                className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors ${isOverdue(task) ? 'bg-red-50/40' : ''}`}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {isOverdue(task) && (
                                            <div className="w-1 h-8 rounded-full bg-red-400 flex-shrink-0" />
                                        )}
                                        <div>
                                            <div className="font-medium text-zinc-900 flex items-center gap-2">
                                                {task.title}
                                                {isOverdue(task) && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                              Overdue
                            </span>
                                                )}
                                            </div>
                                            {task.description && (
                                                <div className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs">{task.description}</div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-zinc-600 text-[13px]">{task.assignedUserName}</td>
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
                                <td className="px-4 py-3 text-right">
                                    {!isTeamLeader() && (
                                        <button onClick={() => handleAck(task.id)} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                                            Acknowledge
                                        </button>
                                    )}
                                    {isTeamLeader() && (
                                        <button onClick={() => handleDelete(task.id)} className="text-xs text-red-400 hover:text-red-600 font-medium">
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            <TaskCreateModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                users={users}
                workload={workload}
                onCreate={handleCreate}
            />
        </Layout>
    );
}