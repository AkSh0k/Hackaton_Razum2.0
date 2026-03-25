import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsClient } from '@/api/eventsClient';
import { useAuth } from '@/lib/AuthContext';
import { CalendarDays, Search, Filter, Plus, MapPin, Star } from 'lucide-react';
import CategoryTag from '../components/CategoryTag';

const CATEGORIES = ['Все', 'IT', 'Социальные проекты', 'Медиа', 'Наука', 'Лидерство', 'Спорт', 'Искусство'];
const STATUSES = ['Все', 'upcoming', 'active', 'completed'];

export default function Events() {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Все');
    const [status, setStatus] = useState('Все');

    useEffect(() => {
        eventsClient.list({ sort: '-date', limit: 50 }).then(evs => {
            setEvents(evs);
            setLoading(false);
        });
    }, []);

    const filtered = events.filter(e => {
        const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase());
        const matchCat = category === 'Все' || e.category === category;
        const matchStatus = status === 'Все' || e.status === status;
        return matchSearch && matchCat && matchStatus;
    });

    const canCreate = currentUser?.role === 'organizer';

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Мероприятия</h1>
                    <p className="text-muted-foreground text-sm mt-1">Найдено мероприятий: {filtered.length}</p>
                </div>
                {canCreate && (
                    <Link to="/events/create" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
                        <Plus className="w-4 h-4" />
                        Создать мероприятие
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="card-glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Поиск мероприятий..."
                            className="w-full pl-9 pr-4 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none transition-colors"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none"
                    >
                        {STATUSES.map(s => <option key={s} value={s}>{s === 'Все' ? 'Все статусы' : statusLabel(s)}</option>)}
                    </select>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                                category === cat
                                    ? 'bg-primary/20 text-primary border-primary/30'
                                    : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-52 bg-secondary rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(event => <EventCard key={event.id} event={event} />)}
                    {filtered.length === 0 && (
                        <div className="col-span-3 text-center py-16 text-muted-foreground">
                            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            Мероприятия не найдены
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function EventCard({ event }) {
    const statusColors = {
        upcoming: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        active: 'text-green-400 bg-green-500/10 border-green-500/20',
        completed: 'text-muted-foreground bg-secondary border-border',
        draft: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        cancelled: 'text-red-400 bg-red-500/10 border-red-500/20'
    };
    const diff = event.difficulty_coefficient || 1;
    const points = Math.round((event.base_points || 0) * diff);

    return (
        <Link to={`/events/${event.id}`} className="card-glass rounded-2xl p-5 hover:border-primary/30 transition-all duration-200 block group flex flex-col">
            <div className="flex justify-between items-start mb-3">
                <CategoryTag category={event.category} small />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColors[event.status] || ''}`}>
          {statusLabel(event.status)}
        </span>
            </div>

            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">{event.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">{event.description}</p>

            <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{event.date}</span>
                </div>
                {event.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{event.location}</span>
                    </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Сложность: ×{diff}</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-400">{points} балл.</span>
                </div>
            </div>
        </Link>
    );
}

function statusLabel(status) {
    const map = {
        upcoming: 'Предстоит',
        active: 'Активно',
        completed: 'Завершено',
        draft: 'Черновик',
        cancelled: 'Отменено'
    };
    return map[status] || status;
}
