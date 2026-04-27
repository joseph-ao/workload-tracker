import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/auth';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await loginUser(email, password);
            login(user);
            navigate('/workload');
        } catch {
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    const PREVIEW = [
        ['Sara', 18, 'warn'], ['Diego', 10, 'ok'],
        ['Marcus', 30, 'over'], ['Lin', 12, 'ok'],
    ] as const;

    const barColor = (s: string) =>
        s === 'ok' ? '#4ade80' : s === 'warn' ? '#facc15' : '#f87171';

    return (
        <div className="min-h-screen grid grid-cols-2 bg-white">
            <div className="relative flex flex-col justify-between p-14 overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, oklch(0.30 0.16 295), oklch(0.42 0.18 285))' }}>
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: 'radial-gradient(circle at 10% 20%, oklch(0.55 0.20 305 / 0.4) 0%, transparent 40%), radial-gradient(circle at 90% 80%, oklch(0.45 0.20 270 / 0.5) 0%, transparent 50%)' }} />

                <div className="relative z-10 flex items-center gap-2 font-semibold text-white text-[15px]">
                    <div className="w-6 h-6 rounded-md bg-white/20 relative flex-shrink-0">
                        <span className="absolute left-[8px] top-[6px] w-[3px] h-[12px] bg-white rounded-sm" />
                        <span className="absolute left-[13px] top-[10px] w-[3px] h-[8px] bg-white rounded-sm" />
                    </div>
                    Equitask
                </div>

                <div className="relative z-10">
                    <p className="text-[32px] font-semibold leading-tight tracking-tight text-white mb-3"
                       style={{ letterSpacing: '-0.02em' }}>
                        Distribute work by weight,<br />not by count.
                    </p>
                    <p className="text-white/70 text-sm leading-relaxed mb-10">
                        See how loaded every team member really is, and assign new work where it actually fits.
                    </p>
                    <div className="rounded-xl p-5 flex flex-col gap-3"
                         style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(4px)' }}>
                        <div className="text-white/60 text-xs mb-1">Live preview</div>
                        {PREVIEW.map(([name, val, status]) => (
                            <div key={name} className="grid items-center gap-3 text-white text-xs"
                                 style={{ gridTemplateColumns: '60px 1fr 36px' }}>
                                <span>{name}</span>
                                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                    <div className="h-full rounded-full" style={{ width: `${(val / 35) * 100}%`, background: barColor(status) }} />
                                </div>
                                <span className="mono text-right">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative z-10 text-white/50 text-xs">Equitask · 2026</div>
            </div>





            <div className="flex items-center justify-center p-14">
                <div className="w-full max-w-sm">
                    <h2 className="text-[22px] font-semibold tracking-tight text-zinc-900 mb-1">Welcome back</h2>
                    <p className="text-sm text-zinc-400 mb-7">Sign in to your team workspace</p>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                   className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition"
                                   placeholder="you@company.com" />
                        </div>
                        <div>
                            <label className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                                   className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition"
                                   placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={loading}
                                className="w-full py-[10px] rounded-md text-sm font-medium text-white transition disabled:opacity-50 mt-2"
                                style={{ background: 'oklch(0.52 0.18 295)' }}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                    <p className="mt-4 text-xs text-zinc-400 text-center">Use your registered credentials to sign in</p>
                </div>
            </div>
        </div>
    );
}