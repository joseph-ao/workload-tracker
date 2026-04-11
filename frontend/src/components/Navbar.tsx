import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <span className="font-bold text-blue-600 text-lg">WorkloadTracker</span>
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">Tasks</Link>
                <Link to="/workload" className="text-sm text-gray-600 hover:text-blue-600">Workload</Link>
                <Link to="/change-requests" className="text-sm text-gray-600 hover:text-blue-600">Change Requests</Link>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{user?.fullName} · {user?.role}</span>
                <button
                    onClick={handleLogout}
                    className="text-sm text-red-500 hover:text-red-700"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}