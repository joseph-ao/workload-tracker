import type {ReactNode} from 'react';
import Sidebar from './Sidebar';

interface Props {
    title?: string;
    breadcrumbs?: { label: string; onClick?: () => void }[];
    topRight?: ReactNode;
    children: ReactNode;
}

export default function Layout({ title, breadcrumbs, topRight, children }: Props) {
    return (
        <div className="flex min-h-screen bg-[#fafafa]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-14 border-b border-zinc-200 bg-white flex items-center px-6 sticky top-0 z-10 gap-3">
                    {breadcrumbs ? (
                        <div className="text-[13px] text-zinc-400 flex items-center gap-1">
                            {breadcrumbs.map((c, i) => (
                                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-zinc-300 mx-1">/</span>}
                                    {c.onClick
                                        ? <button onClick={c.onClick} className="hover:text-zinc-600 transition-colors">{c.label}</button>
                                        : <span className={i === breadcrumbs.length - 1 ? 'text-zinc-900 font-medium' : ''}>{c.label}</span>
                                    }
                </span>
                            ))}
                        </div>
                    ) : (
                        <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        {topRight}
                    </div>
                </div>
                <div className="p-8 w-full max-w-300">
                    {children}
                </div>
            </div>
        </div>
    );
}