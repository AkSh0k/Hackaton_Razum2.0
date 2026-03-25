import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardClient } from '@/api/dashboardClient';
import { useAuth } from '@/lib/AuthContext';
import { CalendarDays, Trophy, TrendingUp, Users, ArrowRight, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import RankBadge from '../components/RankBadge';
import CategoryTag from '../components/CategoryTag';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (currentUser && currentUser.role !== 'participant') {
            navigate('/events', { replace: true });
        }
    }, [currentUser]);
    const [participations, setParticipations] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser && currentUser.role !== 'participant') return;
        async function load() {
            const data = await dashboardClient.participant();
            setEvents(data.events);
            setParticipations(data.participations);
            setTopUsers(data.topUsers);
            setLoading(false);
        }
        load();
    }, [currentUser]);

    const totalPoints = currentUser?.total_points || 0;
    const totalEvents = currentUser?.total_events || 0;
    const rankInfo = getRankInfo(totalPoints);

    // Build chart data from participations
    const chartData = buildChartData(participations);

    const categoryCounts = events.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
    }, {});

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    С возвращением, <span className="gradient-text">{currentUser?.full_name?.split(' ')[0] || 'участник'}</span>
                </h1>
                <p className="text-muted-foreground mt-1">Краткий обзор вашей активности</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Zap className="w-5 h-5 text-yellow-400" />} label="Всего баллов" value={totalPoints} color="yellow" />
                <StatCard icon={<CalendarDays className="w-5 h-5 text-blue-400" />} label="Участий в мероприятиях" value={totalEvents} color="blue" />
                <StatCard icon={<Trophy className="w-5 h-5 text-gold" />} label="Текущий ранг" value={rankInfo.name} color="gold" />
                <StatCard icon={<TrendingUp className="w-5 h-5 text-green-400" />} label="До следующего ранга" value={rankInfo.toNext > 0 ? `${rankInfo.toNext} балл.` : 'Максимум'} color="green" />
            </div>

            {/* Progress to next rank */}
            {rankInfo.toNext > 0 && (
                <div className="card-glass rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-muted-foreground">Прогресс до ранга <span className="text-foreground">{rankInfo.nextRank}</span></span>
                        <RankBadge rank={rankInfo.name} />
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${rankInfo.progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{totalPoints} балл.</span>
                        <span>{rankInfo.nextThreshold} балл.</span>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Activity chart */}
                <div className="lg:col-span-2 card-glass rounded-2xl p-6">
                    <h2 className="font-semibold mb-4 text-foreground">Рост рейтинга</h2>
                    {chartData.length > 1 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} />
                                <Area type="monotone" dataKey="points" stroke="#3b82f6" strokeWidth={2} fill="url(#colorPts)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                            Примите участие в мероприятиях, чтобы увидеть график прогресса
                        </div>
                    )}
                </div>

                {/* Top performers */}
                <div className="card-glass rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-foreground">Лидеры рейтинга</h2>
                        <Link to="/leaderboard" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Смотреть все <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {topUsers.map((u, i) => (
                            <div key={u.id} className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-gold/20 text-gold' : i === 1 ? 'bg-silver/20 text-silver' : i === 2 ? 'bg-bronze/20 text-bronze' : 'bg-secondary text-muted-foreground'}`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{u.full_name}</div>
                                    <div className="text-xs text-muted-foreground">{u.total_points || 0} балл.</div>
                                </div>
                            </div>
                        ))}
                        {topUsers.length === 0 && <p className="text-muted-foreground text-sm">Данных пока нет</p>}
                    </div>
                </div>
            </div>

            {/* Recent events */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-foreground text-lg">Последние мероприятия</h2>
                    <Link to="/events" className="text-sm text-primary hover:underline flex items-center gap-1">
                        Все мероприятия <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.slice(0, 6).map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </div>

            {/* Category cloud */}
            {Object.keys(categoryCounts).length > 0 && (
                <div className="card-glass rounded-2xl p-6">
                    <h2 className="font-semibold mb-4 text-foreground">Популярные направления</h2>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(categoryCounts).map(([cat, count]) => (
                            <CategoryTag key={cat} category={cat} count={count} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${color}-500/10`}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
    );
}

function EventCard({ event }) {
    const statusColors = {
        upcoming: 'text-blue-400 bg-blue-500/10',
        active: 'text-green-400 bg-green-500/10',
        completed: 'text-muted-foreground bg-secondary',
        draft: 'text-yellow-400 bg-yellow-500/10',
        cancelled: 'text-red-400 bg-red-500/10'
    };
    return (
        <Link to={`/events/${event.id}`} className="card-glass rounded-2xl p-5 hover:border-primary/30 transition-all duration-200 block group">
            <div className="flex justify-between items-start mb-3">
                <CategoryTag category={event.category} small />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[event.status] || 'text-muted-foreground bg-secondary'}`}>
          {event.status}
        </span>
            </div>
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">{event.title}</h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{event.date}</span>
                <span className="text-yellow-400 font-medium">{event.base_points} балл.</span>
            </div>
        </Link>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
            <div className="h-8 w-64 bg-secondary rounded-xl" />
            <div className="grid grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-28 bg-secondary rounded-2xl" />)}
            </div>
        </div>
    );
}

function getRankInfo(points) {
    const ranks = [
        { name: 'Bronze', threshold: 0, next: 500 },
        { name: 'Silver', threshold: 500, next: 1500 },
        { name: 'Gold', threshold: 1500, next: 3000 },
        { name: 'Platinum', threshold: 3000, next: 6000 },
        { name: 'Diamond', threshold: 6000, next: null }
    ];
    const current = [...ranks].reverse().find(r => points >= r.threshold) || ranks[0];
    const nextRank = ranks[ranks.indexOf(current) + 1];
    const progress = nextRank ? Math.round(((points - current.threshold) / (nextRank.threshold - current.threshold)) * 100) : 100;
    return {
        name: current.name,
        nextRank: nextRank?.name || null,
        nextThreshold: nextRank?.threshold || null,
        toNext: nextRank ? nextRank.threshold - points : 0,
        progress: Math.min(progress, 100)
    };
}

function buildChartData(participations) {
    const verified = participations.filter(p => p.status === 'verified');
    if (verified.length < 2) return [];
    const sorted = [...verified].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    let cumulative = 0;
    return sorted.map(p => {
        cumulative += p.points_earned || 0;
        return { date: new Date(p.created_date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }), points: cumulative };
    });
}
