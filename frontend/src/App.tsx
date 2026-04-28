import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkloadPage from './pages/WorkloadPage';
import ChangeRequestsPage from './pages/ChangeRequestsPage';
import MemberPage from './pages/MemberPage';

function App() {
    const { user, isTeamLeader } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={isTeamLeader() ? "/workload" : "/my-tasks"} />} />

            {/* Team Leader routes */}
            <Route path="/workload" element={user && isTeamLeader() ? <WorkloadPage /> : <Navigate to={user ? "/my-tasks" : "/login"} />} />
            <Route path="/dashboard" element={user && isTeamLeader() ? <DashboardPage /> : <Navigate to={user ? "/my-tasks" : "/login"} />} />
            <Route path="/change-requests" element={user && isTeamLeader() ? <ChangeRequestsPage /> : <Navigate to={user ? "/my-tasks" : "/login"} />} />

            {/* Member routes */}
            <Route path="/my-tasks" element={user && !isTeamLeader() ? <MemberPage /> : <Navigate to={user ? "/workload" : "/login"} />} />

            <Route path="*" element={<Navigate to={user ? (isTeamLeader() ? "/workload" : "/my-tasks") : "/login"} />} />
        </Routes>
    );
}

export default App;