import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkloadPage from './pages/WorkloadPage';
import ChangeRequestsPage from './pages/ChangeRequestsPage';

function App() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
            <Route path="/workload" element={user ? <WorkloadPage /> : <Navigate to="/login" />} />
            <Route path="/change-requests" element={user ? <ChangeRequestsPage /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
    );
}

export default App;