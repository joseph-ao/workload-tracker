import { useEffect, useState } from 'react';
import { getWorkload } from '../api/workload';
import type { WorkloadEntry } from '../types';
import Navbar from '../components/Navbar';

export default function WorkloadPage() {
    const [workload, setWorkload] = useState<WorkloadEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getWorkload()
            .then(setWorkload)
            .finally(() => setLoading(false));
    }, []);

    const maxWeight = Math.max(...workload.map(w => w.totalWeight), 1);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Team Workload</h1>

                {loading ? (
                    <p className="text-gray-500">Loading workload...</p>
                ) : workload.length === 0 ? (
                    <p className="text-gray-500">No active tasks found.</p>
                ) : (
                    <div className="space-y-4">
                        {workload.map((entry, index) => (
                            <div key={entry.userId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                                        <span className="font-semibold text-gray-800">{entry.fullName}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-blue-600">{entry.totalWeight} pts</span>
                                        <span className="text-xs text-gray-400 ml-2">{entry.taskCount} task{entry.taskCount !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>

                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(entry.totalWeight / maxWeight) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}