import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, deleteTask, acknowledgeTask } from '../api/tasks';
import type { Task } from '../types';
import Navbar from '../components/Navbar';

export default function DashboardPage() {
    const { isTeamLeader, user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [complexity, setComplexity] = useState('Medium');
    const [effortHours, setEffortHours] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assignedUserId, setAssignedUserId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getTasks()
            .then(setTasks)
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        if (!title || !assignedUserId || !startDate || !dueDate) return;
        setSubmitting(true);
        try {
            const newTask = await createTask({
                title,
                description,
                priority,
                complexity,
                effortHours,
                startDate: new Date(startDate).toISOString(),
                dueDate: new Date(dueDate).toISOString(),
                assignedUserId
            });
            setTasks([newTask, ...tasks]);
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setComplexity('Medium');
            setEffortHours(1);
            setStartDate('');
            setDueDate('');
            setAssignedUserId('');
            setShowForm(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        await deleteTask(id);
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleAcknowledge = async (id: number) => {
        await acknowledgeTask(id);
        alert('Task acknowledged!');
    };

    const getPriorityColor = (priority: string) => {
        if (priority === 'High') return 'bg-red-100 text-red-700';
        if (priority === 'Medium') return 'bg-yellow-100 text-yellow-700';
        return 'bg-green-100 text-green-700';
    };

    const getStatusColor = (status: string) => {
        if (status === 'Done') return 'bg-green-100 text-green-700';
        if (status === 'InProgress') return 'bg-blue-100 text-blue-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
                    {isTeamLeader() && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                            {showForm ? 'Cancel' : '+ New Task'}
                        </button>
                    )}
                </div>

                {showForm && isTeamLeader() && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
                        <h2 className="font-semibold text-gray-700 mb-4">Create New Task</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="Task title"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    rows={2}
                                    placeholder="Task description"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
                                <select value={complexity} onChange={e => setComplexity(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Effort Hours</label>
                                <input
                                    type="number"
                                    value={effortHours}
                                    onChange={e => setEffortHours(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    min={0.5}
                                    step={0.5}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To (User ID)</label>
                                <input
                                    type="text"
                                    value={assignedUserId}
                                    onChange={e => setAssignedUserId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="User ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={submitting}
                            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                )}

                {loading ? (
                    <p className="text-gray-500">Loading tasks...</p>
                ) : tasks.length === 0 ? (
                    <p className="text-gray-500">No tasks found.</p>
                ) : (
                    <div className="space-y-4">
                        {tasks.map(task => (
                            <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="font-semibold text-gray-800">{task.title}</h2>
                                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                        <p className="text-sm text-gray-400 mt-1">Assigned to: {task.assignedUserName}</p>
                                    </div>
                                    <div className="flex gap-2 flex-wrap justify-end">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-400">
                    Weight: <strong>{task.weight}</strong> · {task.effortHours}h · Due {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                                    <div className="flex gap-2">
                                        {!isTeamLeader() && (
                                            <button
                                                onClick={() => handleAcknowledge(task.id)}
                                                className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100"
                                            >
                                                Acknowledge
                                            </button>
                                        )}
                                        {isTeamLeader() && (
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100"
                                            >
                                                Delete
                                            </button>
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