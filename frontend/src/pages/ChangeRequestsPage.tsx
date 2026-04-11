import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getChangeRequests, createChangeRequest, approveChangeRequest, rejectChangeRequest } from '../api/changeRequests';
import { getTasks } from '../api/tasks';
import type { ChangeRequest, Task } from '../types';
import Navbar from '../components/Navbar';

export default function ChangeRequestsPage() {
    const { isTeamLeader, user } = useAuth();
    const [requests, setRequests] = useState<ChangeRequest[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state for creating a new request
    const [taskId, setTaskId] = useState('');
    const [newValue, setNewValue] = useState('Pending');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        Promise.all([getChangeRequests(), getTasks()])
            .then(([reqs, tsks]) => {
                setRequests(reqs);
                setTasks(tsks);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        if (!taskId) return;
        const selectedTask = tasks.find(t => t.id === parseInt(taskId));
        if (!selectedTask) return;

        setSubmitting(true);
        try {
            const newRequest = await createChangeRequest({
                taskId: parseInt(taskId),
                changeType: 'StatusChange',
                oldValue: selectedTask.status,
                newValue
            });
            setRequests([newRequest, ...requests]);
            setTaskId('');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id: number) => {
        await approveChangeRequest(id);
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    };

    const handleReject = async (id: number) => {
        await rejectChangeRequest(id);
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    };

    const getStatusColor = (status: string) => {
        if (status === 'Approved') return 'bg-green-100 text-green-700';
        if (status === 'Rejected') return 'bg-red-100 text-red-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Change Requests</h1>

                {/* Create a new change request — only for Members */}
                {!isTeamLeader() && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
                        <h2 className="font-semibold text-gray-700 mb-4">Request a Status Change</h2>
                        <div className="flex gap-3 flex-wrap">
                            <select
                                value={taskId}
                                onChange={e => setTaskId(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
                            >
                                <option value="">Select a task...</option>
                                {tasks.map(t => (
                                    <option key={t.id} value={t.id}>{t.title} (currently {t.status})</option>
                                ))}
                            </select>
                            <select
                                value={newValue}
                                onChange={e => setNewValue(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="Pending">Pending</option>
                                <option value="InProgress">InProgress</option>
                                <option value="Done">Done</option>
                            </select>
                            <button
                                onClick={handleCreate}
                                disabled={submitting || !taskId}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                )}

                {/* List of all change requests */}
                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : requests.length === 0 ? (
                    <p className="text-gray-500">No change requests yet.</p>
                ) : (
                    <div className="space-y-3">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800">{req.taskTitle}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Status change: <span className="font-medium">{req.oldValue}</span> → <span className="font-medium">{req.newValue}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                                        {isTeamLeader() && req.status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}