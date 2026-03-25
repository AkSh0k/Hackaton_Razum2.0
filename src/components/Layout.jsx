import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
    LayoutDashboard, CalendarDays, Trophy, User, Users, Settings,
    Menu, X, LogOut, Star, BarChart3, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { path: '/participant', label: 'Главная', icon: LayoutDashboard, roles: ['participant'] },
    { path: '/events', label: 'Мероприятия', icon: CalendarDays, roles: ['participant', 'organizer', 'observer'] },
    { path: '/leaderboard', label: 'Рейтинг', icon: Trophy, roles: ['participant', 'organizer', 'observer'] },
    { path: '/profile', label: 'Мой профиль', icon: User, roles: ['participant'] },
    { path: '/hr-panel', label: 'Панель кадрового инспектора', icon: BarChart3, roles: ['observer'] },
    { path: '/admin', label: 'Панель управления', icon: Shield, roles: ['organizer'] },
];

const roleLabels = {
    participant: 'Участник',
    organizer: 'Организатор',
    observer: 'Наблюдатель',
    admin: 'Администратор',
};

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const userRole = currentUser?.role || '';

    const visibleNav = navItems.filter(item =>
        item.roles.includes('all') || item.roles.includes(userRole)
    );

    return (
        <div className="min-h-screen bg-background font-inter flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300",
                "border-r border-border",
                "bg-sidebar",
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Logo */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                            <Star className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <div className="font-bold text-sm text-foreground leading-tight">Платформа рейтинга активности</div>
                            <div className="text-xs text-muted-foreground">для молодежного парламента</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {visibleNav.map(item => {
                        const Icon = item.icon;
                        const active = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    active
                                        ? "bg-primary/15 text-primary border border-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                )}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User footer */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-3">
                        {userRole === 'participant' ? (
                            <Link to="/profile" onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold hover:ring-2 hover:ring-primary/40 transition-all">
                                {currentUser?.full_name?.[0] || ''}
                            </Link>
                        ) : userRole === 'organizer' ? (
                            <Link to={`/organizer/${currentUser?.id}`} onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold hover:ring-2 hover:ring-primary/40 transition-all">
                                {currentUser?.full_name?.[0] || ''}
                            </Link>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                                {currentUser?.full_name?.[0] || ''}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{currentUser?.full_name || '—'}</div>
                            <div className="text-xs text-muted-foreground">{roleLabels[userRole] || 'Пользователь'}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Выйти
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                {/* Top bar mobile */}
                <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-primary" />
                        <span className="font-bold text-sm">Платформа рейтинга активности</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-secondary">
                        <Menu className="w-5 h-5" />
                    </button>
                </header>

                <main className="flex-1 p-4 lg:p-8 animate-fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
