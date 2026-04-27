import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkload } from '../api/workload';
import { getTasks } from '../api/tasks';
import type { WorkloadEntry, Task } from '../types';
import Layout from '../components/Layout';


function getStatus(w: number): 'ok' | 'warn' | 'over' {
    return w <= 15 ? 'ok' : w <= 25 ? 'warn' : 'over';
}

const STATUS = {
    ok:   { bar: '#4ade80', label: 'Available',  badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400' },
    warn: { bar: '#facc15', label: 'Moderate',   badge: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-400' },
    over: { bar: '#f87171', label: 'Overloaded', badge: 'bg-red-50 text-red-700',         dot: 'bg-red-400' },
};

const AVATAR_COLORS = [
    'bg-violet-100 text-violet-700',
    'bg-orange-100 text-orange-700',
    'bg-teal-100 text-teal-700',
    'bg-pink-100 text-pink-700',
    'bg-sky-100 text-sky-700',
    'bg-amber-100 text-amber-700',
    'bg-lime-100 text-lime-700',
    'bg-rose-100 text-rose-700',
];

function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function getWeekStart(offset: number): Date {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getWeekEnd(weekStart: Date): Date {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}

function formatWeekLabel(weekStart: Date, offset: number): string {
    if (offset === 0) return 'This week';
    if (offset === 1) return 'Next week';
    return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function formatDateRange(weekStart: Date): string {
    const end = getWeekEnd(weekStart);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(weekStart)} — ${fmt(end)}`;
}

function filterTasksByWeek(tasks: Task[], weekStart: Date): Task[] {
    const weekEnd = getWeekEnd(weekStart);
    return tasks.filter(t => {
        const due = new Date(t.dueDate);
        const start = new Date(t.startDate);
        return (due >= weekStart && due <= weekEnd) ||
            (start <= weekEnd && due >= weekStart);
    });
}

function calcWorkload(tasks: Task[], allWorkload: WorkloadEntry[]): WorkloadEntry[] {
    const map = new Map<string, { userId: string; fullName: string; taskCount: number; totalWeight: number; totalHours: number }>();

    allWorkload.forEach(w => {
        map.set(w.userId, { userId: w.userId, fullName: w.fullName, taskCount: 0, totalWeight: 0, totalHours: 0 });
    });

    tasks.forEach(t => {
        const existing = map.get(t.assignedUserId);
        if (existing) {
            existing.taskCount++;
            existing.totalWeight += t.weight;
            existing.totalHours += t.effortHours;
        }
    });

    return Array.from(map.values())
        .filter(w => w.taskCount > 0)
        .sort((a, b) => b.totalWeight - a.totalWeight);
}

// emloyee of the month

function EomChart({ tasks, allWorkload }: { tasks: Task[]; allWorkload: WorkloadEntry[] }) {
    const doneTasks = tasks.filter(t => t.status === 'Done');

    const map = new Map<string, { userId: string; fullName: string; completedWeight: number; completedTasks: number }>();

    allWorkload.forEach(w => {
        map.set(w.userId, { userId: w.userId, fullName: w.fullName, completedWeight: 0, completedTasks: 0 });
    });

    doneTasks.forEach(t => {
        const existing = map.get(t.assignedUserId);
        if (existing) {
            existing.completedWeight += t.weight;
            existing.completedTasks++;
        }
    });

    const ranked = Array.from(map.values())
        .filter(m => m.completedWeight > 0)
        .sort((a, b) => b.completedWeight - a.completedWeight);

    if (ranked.length === 0) {
        return (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-10 text-center">
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-sm font-medium text-zinc-600">No completed tasks yet</div>
                <div className="text-xs text-zinc-400 mt-1">Complete tasks to see the leaderboard.</div>
            </div>
        );
    }


    const winner = ranked[0];
    const maxWeight = winner.completedWeight;
    const medals = ['🥇', '🥈', '🥉'];

    return (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                        🏆 Employee of the Month
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                        Ranked by completed task weight · all time
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                     style={{ background: 'oklch(0.96 0.06 85)' }}>
                    <span className="text-lg">👑</span>
                    <div>
                        <div className="text-[11px] font-medium" style={{ color: 'oklch(0.45 0.12 85)' }}>
                            Top performer
                        </div>
                        <div className="text-[13px] font-semibold" style={{ color: 'oklch(0.35 0.12 85)' }}>
                            {winner.fullName}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
                {ranked.map((member, idx) => {
                    const pct = (member.completedWeight / maxWeight) * 100;
                    const isWinner = idx === 0;

                    const avatarIdx = allWorkload.findIndex(w => w.userId === member.userId);
                    const colorClass = AVATAR_COLORS[avatarIdx % AVATAR_COLORS.length];

                    const barColor = isWinner
                        ? 'linear-gradient(90deg, oklch(0.75 0.15 85), oklch(0.82 0.18 85))'
                        : idx === 1
                            ? 'linear-gradient(90deg, oklch(0.55 0.18 295), oklch(0.62 0.16 295))'
                            : 'linear-gradient(90deg, #d4d4d8, #a1a1aa)';

                    return (
                        <div key={member.userId} className="flex items-center gap-3">
                            <div className="w-8 text-center flex-shrink-0">
                                {idx < 3
                                    ? <span className="text-lg">{medals[idx]}</span>
                                    : <span className="text-sm font-mono text-zinc-400">{idx + 1}</span>
                                }
                            </div>

                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${colorClass} ${isWinner ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
                                {initials(member.fullName)}
                            </div>

                            <div className="w-36 flex-shrink-0">
                                <div className={`text-[13px] font-medium truncate ${isWinner ? 'text-zinc-900' : 'text-zinc-600'}`}>
                                    {member.fullName}
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                    {member.completedTasks} task{member.completedTasks !== 1 ? 's' : ''} done
                                </div>
                            </div>

                            <div className="flex-1 relative h-8 bg-zinc-100 rounded-lg overflow-hidden">
                                <div
                                    className="h-full rounded-lg transition-all duration-700 flex items-center"
                                    style={{ width: `${pct}%`, background: barColor, minWidth: '2px' }}
                                />
                                <div
                                    className="absolute inset-y-0 flex items-center text-xs font-semibold mono"
                                    style={{
                                        left: pct > 25 ? undefined : `calc(${pct}% + 6px)`,
                                        right: pct > 25 ? '8px' : undefined,
                                        color: pct > 25 ? 'rgba(255,255,255,0.85)' : '#52525b',
                                    }}>
                                    {member.completedWeight.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="px-6 py-3 border-t border-zinc-100 text-xs text-zinc-400">
                Weight = effort hours × complexity multiplier × priority multiplier · completed tasks only
            </div>
        </div>
    );
}
// Member Detail Panel

function MemberPanel({ member, tasks, colorClass, onClose }: {
    member: WorkloadEntry & { totalHours?: number };
    tasks: Task[];
    colorClass: string;
    onClose: () => void;
}) {
    const memberTasks = tasks.filter(t => t.assignedUserId === member.userId);
    const s = getStatus(member.totalWeight);

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

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end"
             style={{ background: 'rgba(24,24,27,0.25)', backdropFilter: 'blur(2px)' }}
             onClick={onClose}>
            <div className="bg-white h-full w-[480px] max-w-full flex flex-col shadow-2xl"
                 onClick={e => e.stopPropagation()}>

                <div className="flex items-center gap-4 px-6 py-5 border-b border-zinc-200">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-semibold flex-shrink-0 ${colorClass}`}>
                        {initials(member.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[15px]">{member.fullName}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS[s].badge}`}>
                                {STATUS[s].label}
                            </span>
                            <span className="text-xs text-zinc-400">{member.taskCount} tasks · {(member as any).totalHours ?? 0}h effort</span>
                        </div>
                    </div>
                    <button onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 transition text-lg">
                        ✕
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between"
                     style={{ background: 'oklch(0.97 0.02 295)' }}>
                    <div>
                        <div className="text-[12px] font-medium" style={{ color: 'oklch(0.42 0.16 295)' }}>Total weight</div>
                        <div className="text-[30px] font-semibold mono" style={{ letterSpacing: '-0.02em', color: 'oklch(0.30 0.16 295)' }}>
                            {member.totalWeight.toFixed(1)}
                        </div>
                    </div>
                    <div className="w-32">
                        <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                                 style={{ width: `${Math.min(100, (member.totalWeight / 40) * 100)}%`, background: STATUS[s].bar }} />
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1 text-right">of 40 cap</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="text-[12px] font-medium text-zinc-400 uppercase tracking-widest mb-3">
                        Assigned tasks
                    </div>
                    {memberTasks.length === 0 ? (
                        <div className="text-sm text-zinc-400 py-8 text-center">No tasks in this period.</div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {memberTasks.map(task => (
                                <div key={task.id} className="border border-zinc-200 rounded-xl p-4 bg-white hover:border-zinc-300 transition">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="font-medium text-[13.5px] text-zinc-900">{task.title}</div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[task.status]}`}>
                                            {task.status}
                                        </span>
                                    </div>
                                    {task.description && (
                                        <div className="text-xs text-zinc-400 mt-1">{task.description}</div>
                                    )}
                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority]}`}>
                                            {task.priority}
                                        </span>
                                        <span className="text-xs text-zinc-400">{task.complexity} complexity</span>
                                        <span className="text-xs text-zinc-400">{task.effortHours}h</span>
                                        <span className="text-xs font-semibold mono text-zinc-700 ml-auto">w {task.weight.toFixed(1)}</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-400 mt-2">
                                        Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


//  Main Workload Page

export default function WorkloadPage() {
    const [allWorkload, setAllWorkload] = useState<WorkloadEntry[]>([]);
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedMember, setSelectedMember] = useState<(WorkloadEntry & { totalHours?: number; colorClass?: string }) | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([getWorkload(), getTasks()])
            .then(([w, t]) => { setAllWorkload(w); setAllTasks(t); })
            .finally(() => setLoading(false));
    }, []);

    const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset]);
    const weekTasks = useMemo(() => filterTasksByWeek(allTasks, weekStart), [allTasks, weekStart]);
    const workload = useMemo(() => calcWorkload(weekTasks, allWorkload), [weekTasks, allWorkload]);

    const totalWeight = workload.reduce((s, w) => s + w.totalWeight, 0);
    const totalEffortHours = weekTasks.reduce((s, t) => s + t.effortHours, 0);
    const overloaded = workload.filter(w => getStatus(w.totalWeight) === 'over').length;
    const maxWeight = Math.max(...workload.map(w => w.totalWeight), 1);

    const KPIs = [
        {
            label: 'Total weight',
            value: totalWeight.toFixed(1),
            sub: `across ${workload.length} members · avg ${workload.length ? (totalWeight / workload.length).toFixed(1) : 0}`,
        },
        {
            label: 'Total effort',
            value: `${totalEffortHours}h`,
            sub: `${weekTasks.length} tasks in this week's window`,
        },
        {
            label: 'Active tasks',
            value: weekTasks.length,
            sub: "in this week's window",
        },
        {
            label: 'Overloaded members',
            value: overloaded,
            sub: overloaded > 0 ? 'Consider rebalancing' : 'Workload is healthy',
            warn: overloaded > 0,
        },
    ];

    const WEEKS = [0, 1, 2];

    return (
        <Layout title="Workload" topRight={
            <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white"
                    style={{ background: 'oklch(0.52 0.18 295)' }}>
                + New task
            </button>
        }>
            <div className="flex items-end justify-between mb-6">
                <div>
                    <div className="text-xs text-zinc-400 font-medium mb-1">
                        {formatDateRange(weekStart)} · Engineering Team
                    </div>
                    <h2 className="text-[26px] font-semibold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                        Team workload
                    </h2>
                </div>
                <div className="flex bg-white border border-zinc-200 rounded-lg p-0.5 gap-0.5">
                    {WEEKS.map(offset => {
                        const ws = getWeekStart(offset);
                        return (
                            <button key={offset} onClick={() => setWeekOffset(offset)}
                                    className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium transition
                                    ${weekOffset === offset ? 'text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'}`}
                                    style={weekOffset === offset ? { background: 'oklch(0.52 0.18 295)' } : {}}>
                                {formatWeekLabel(ws, offset)}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                {KPIs.map(k => (
                    <div key={k.label} className={`bg-white border rounded-xl p-5 shadow-sm ${k.warn ? 'border-red-200' : 'border-zinc-200'}`}>
                        <div className="text-[12.5px] text-zinc-400 font-medium">{k.label}</div>
                        <div className={`text-[28px] font-semibold mono tracking-tight mt-2 ${k.warn ? 'text-red-600' : ''}`}
                             style={{ letterSpacing: '-0.02em' }}>
                            {k.value}
                        </div>
                        <div className={`text-xs mt-1.5 ${k.warn ? 'text-red-400' : 'text-zinc-400'}`}>{k.sub}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm mb-6">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                    <div>
                        <div className="text-sm font-semibold">Workload distribution</div>
                        <div className="text-xs text-zinc-400 mt-0.5">Total weight per member · click a member to drill in</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block bg-emerald-400" /> Available ≤15</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block bg-amber-400" /> Moderate ≤25</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block bg-red-400" /> Overloaded 26+</span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-sm text-zinc-400">Loading...</div>
                ) : workload.length === 0 ? (
                    <div className="p-10 text-sm text-zinc-400 text-center">No tasks in this week's window.</div>
                ) : (
                    <div className="p-6 grid grid-cols-4 gap-4">
                        {workload.map((entry, idx) => {
                            const s = getStatus(entry.totalWeight);
                            const pct = Math.min(100, (entry.totalWeight / maxWeight) * 100);
                            const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                            const memberHours = weekTasks
                                .filter(t => t.assignedUserId === entry.userId)
                                .reduce((sum, t) => sum + t.effortHours, 0);

                            return (
                                <div key={entry.userId}
                                     onClick={() => setSelectedMember({ ...entry, totalHours: memberHours, colorClass })}
                                     className="border border-zinc-200 rounded-xl p-4 cursor-pointer hover:border-zinc-300 hover:shadow-md transition-all bg-white">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0 ${colorClass}`}>
                                            {initials(entry.fullName)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[13px] font-semibold truncate">{entry.fullName}</div>
                                            <div className="text-[11px] text-zinc-400">{entry.taskCount} tasks · {memberHours}h</div>
                                        </div>
                                    </div>
                                    <div className="text-[28px] font-semibold mono mb-2" style={{ letterSpacing: '-0.02em' }}>
                                        {entry.totalWeight.toFixed(1)}
                                    </div>
                                    <div className="h-[6px] bg-zinc-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-300"
                                             style={{ width: `${pct}%`, background: STATUS[s].bar }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>



            {!loading && (
                <>
                    <EomChart tasks={allTasks} allWorkload={allWorkload} />

                    <div className="mt-6 flex justify-center">
                        <iframe
                            src="https://tenor.com/embed/21639621"
                            width="500"
                            height="280"
                            frameBorder="0"
                            allowFullScreen
                            className="rounded-xl shadow-md"
                            title="The Office Pam Beesly GIF"
                        ></iframe>
                    </div>
                </>
            )}


            {selectedMember && (
                <MemberPanel
                    member={selectedMember}
                    tasks={weekTasks}
                    colorClass={selectedMember.colorClass ?? AVATAR_COLORS[0]}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </Layout>
    );
}