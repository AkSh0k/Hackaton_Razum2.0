import { Toaster as SonnerToaster } from 'sonner'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import HRPanel from './pages/HRPanel';
import AdminPanel from './pages/AdminPanel';
import OrganizerProfile from './pages/OrganizerProfile';

function getHomeRoute(role) {
    if (role === 'organizer') return '/admin';
    if (role === 'observer') return '/hr-panel';
    return '/participant';
}

const RoleHome = () => {
    const { currentUser } = useAuth();
    return <Navigate to={getHomeRoute(currentUser?.role)} replace />;
};

const AuthenticatedApp = () => {
    const location = useLocation();
    const { currentUser, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
    const isLoginPage = location.pathname === '/login';

    if (isLoadingPublicSettings || isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (authError) {
        if (authError.type === 'user_not_registered') {
            return <UserNotRegisteredError />;
        } else if (authError.type === 'auth_required' && !isLoginPage) {
            return <Navigate to="/login" replace />;
        }
    }

    return (
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to={getHomeRoute(currentUser?.role)} replace /> : <Login />} />
            <Route element={<Layout />}>
                <Route path="/" element={<RoleHome />} />
                <Route path="/participant" element={<Dashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/create" element={<CreateEvent />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/hr-panel" element={<HRPanel />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/organizer/:id" element={<OrganizerProfile />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AuthenticatedApp />
            </Router>
            <SonnerToaster position="top-right" theme="dark" />
        </AuthProvider>
    );
}

export default App;
