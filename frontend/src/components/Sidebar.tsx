import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
    { key: '/workload', label: 'Workload' },
    { key: '/dashboard', label: 'Tasks' },
    { key: '/change-requests', label: 'Approvals' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const initials = user?.fullName.split(' ').map(n => n[0]).join('').toUpperCase() ?? '?';

    return (
        <aside className="w-[232px] bg-white border-r border-zinc-200 flex flex-col p-[18px_14px] sticky top-0 h-screen gap-1">
            <div className="flex items-center gap-2 px-2 pb-5 pt-1 font-semibold text-[15px] tracking-tight">
                <div className="w-[22px] h-[22px] rounded-md bg-violet-600 flex-shrink-0 relative">
                    <span className="absolute left-[7px] top-[5px] w-[3px] h-[12px] bg-white/90 rounded-sm" />
                    <span className="absolute left-[12px] top-[9px] w-[3px] h-[8px] bg-white/90 rounded-sm" />
                </div>
                Equitask
            </div>

            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.06em] px-2 pb-1">
                Workspace
            </div>

            {NAV.map(n => {
                const active = location.pathname.startsWith(n.key);
                return (
                    <button key={n.key} onClick={() => navigate(n.key)}
                            className={`flex items-center gap-2 px-[9px] py-[7px] rounded-md text-[13.5px] font-[450] transition-colors w-full text-left
              ${active ? 'bg-violet-50 text-violet-900 font-medium' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                        {n.label}
                    </button>
                );
            })}

            <div className="mt-auto flex items-center gap-2 pt-3 border-t border-zinc-200 px-2">
                <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium truncate">{user?.fullName}</div>
                    <div className="text-[11px] text-zinc-400">{user?.role}</div>
                </div>
                <button onClick={() => { logout(); navigate('/login'); }}
                        className="text-[12px] text-zinc-400 hover:text-red-500 transition-colors">
                    Sign out
                </button>
            </div>
        </aside>
    );
}