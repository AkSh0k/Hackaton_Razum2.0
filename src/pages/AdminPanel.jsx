import { useState, useEffect } from 'react';
import { eventsClient } from '@/api/eventsClient';
import { usersClient } from '@/api/usersClient';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import CreateEvent from './CreateEvent';

const TABS = ['Мероприятия', 'Пользователи', 'Настройки баллов'];

const roleLabels = {
    participant: 'Участник',
    organizer: 'Организатор',
    observer: 'Наблюдатель',
    admin: 'Администратор',
};

export default function AdminPanel() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('Мероприятия');
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [config, setConfig] = useState({
        it_weight: 1.5, social_weight: 1.2, media_weight: 1.0,
        science_weight: 1.3, leadership_weight: 1.4, sport_weight: 1.0, arts_weight: 1.0
    });

    useEffect(() => {
        if (!currentUser) return;
        if (currentUser?.role !== 'organizer') {
            navigate('/');
            return;
        }
        Promise.all([
            eventsClient.list({ sort: '-created_date', limit: 50 }),
            usersClient.list({ sort: '-created_date', limit: 100 })
        ]).then(([evs, usrs]) => {
            setEvents(evs);
            setUsers(usrs);
            setLoading(false);
        });
    }, [currentUser]);

    async function deleteEvent(id) {
        await eventsClient.delete(id);
        setEvents(prev => prev.filter(e => e.id !== id));
        toast.success('Мероприятие удалено');
    }

    async function updateEventStatus(id, status) {
        await eventsClient.update(id, { status });
        setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
        toast.success('Статус обновлен');
    }

    async function changeUserRole(userId, role) {
        await usersClient.update(userId, { role });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        toast.success('Роль обновлена');
    }

    const stats = {
        total_events: events.length,
        active_events: events.filter(e => e.status === 'active').length,
        total_users: users.length,
        participants: users.filter(u => u.role === 'participant' || !u.role).length
    };

    if (showCreate) {
        return <CreateEvent onCreated={() => { setShowCreate(false); eventsClient.list({ sort: '-created_date', limit: 50 }).then(setEvents); }} />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Панель управления</h1>
                    <p className="text-muted-foreground text-sm">Управление системой</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MiniStat label="Всего мероприятий" value={stats.total_events} />
                <MiniStat label="Активных мероприятий" value={stats.active_events} accent="green" />
                <MiniStat label="Всего пользователей" value={stats.total_users} accent="blue" />
                <MiniStat label="Участников" value={stats.participants} accent="purple" />
            </div>

            <div className="flex gap-1 border-b border-border">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {tab === 'Мероприятия' && (
                        <div className="space-y-3">
                            <button onClick={() => setShowCreate(true)}
                                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                                + Создать мероприятие
                            </button>
                            {events.map(event => (
                                <div key={event.id} className="card-glass rounded-xl p-4 flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{event.title}</div>
                                        <div className="text-xs text-muted-foreground">{event.date} · {event.category} · организатор: {event.organizer_name || 'Не указан'}</div>
                                    </div>
                                    <select value={event.status} onChange={e => updateEventStatus(event.id, e.target.value)}
                                            className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs focus:border-primary outline-none">
                                        {['draft','upcoming','active','completed','cancelled'].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                                    </select>
                                    <button onClick={() => navigate(`/events/${event.id}`)}
                                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => deleteEvent(event.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {events.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Мероприятий пока нет</p>}
                        </div>
                    )}

                    {tab === 'Пользователи' && (
                        <div className="card-glass rounded-2xl overflow-hidden">
                            <div className="grid grid-cols-12 text-xs text-muted-foreground font-medium uppercase tracking-wider px-5 py-3 border-b border-border">
                                <div className="col-span-4">Пользователь</div>
                                <div className="col-span-2">Баллы</div>
                                <div className="col-span-2">Мероприятия</div>
                                <div className="col-span-4">Роль</div>
                            </div>
                            <div className="divide-y divide-border max-h-96 overflow-y-auto">
                                {users.map(user => (
                                    <div key={user.id} className="grid grid-cols-12 items-center px-5 py-3.5">
                                        <div className="col-span-4">
                                            <div className="font-medium text-sm">{user.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </div>
                                        <div className="col-span-2 text-sm text-yellow-400 font-semibold">
                                            {user.role === 'participant' ? (user.total_points || 0) : '—'}
                                        </div>
                                        <div className="col-span-2 text-sm">
                                            {user.role === 'participant' ? (user.total_events || 0) : user.role === 'organizer' ? (user.events_organized || 0) : '—'}
                                        </div>
                                        <div className="col-span-4">
                                            <select value={user.role || 'participant'} onChange={e => changeUserRole(user.id, e.target.value)}
                                                    className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs focus:border-primary outline-none">
                                                {['participant', 'organizer'].map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'Настройки баллов' && (
                        <div className="card-glass rounded-2xl p-6 space-y-4 max-w-lg">
                            <p className="text-sm text-muted-foreground">Настройка коэффициентов сложности, используемых в формуле начисления баллов.</p>
                            <div className="space-y-3">
                                {Object.entries(config).map(([key, val]) => {
                                    const label = key.replace('_weight', '').replace(/^\w/, c => c.toUpperCase());
                                    return (
                                        <div key={key} className="flex items-center justify-between">
                                            <label className="text-sm font-medium capitalize">{label}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" min="0.5" max="5" step="0.1" value={val}
                                                       onChange={e => setConfig(c => ({ ...c, [key]: parseFloat(e.target.value) }))}
                                                       className="w-20 px-2 py-1.5 bg-secondary rounded-lg text-sm border border-border focus:border-primary outline-none text-center" />
                                                <span className="text-xs text-muted-foreground">×</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button onClick={() => toast.success('Настройки сохранены')}
                                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                                Сохранить настройки
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function statusLabel(status) {
    const map = {
        draft: 'Черновик',
        upcoming: 'Предстоит',
        active: 'Активно',
        completed: 'Завершено',
        cancelled: 'Отменено',
    };
    return map[status] || status;
}

function MiniStat({ label, value, accent }) {
    const colors = { green: 'text-green-400', blue: 'text-blue-400', purple: 'text-purple-400' };
    return (
        <div className="card-glass rounded-xl p-4">
            <div className={`text-2xl font-bold ${colors[accent] || 'text-foreground'}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
    );
}
