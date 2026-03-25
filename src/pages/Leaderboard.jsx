import { useState, useEffect } from 'react';
import { usersClient } from '@/api/usersClient';
import { useAuth } from '@/lib/AuthContext';
import { Trophy, Medal, Crown, Search, Filter } from 'lucide-react';
import RankBadge from '../components/RankBadge';
import CategoryTag from '../components/CategoryTag';
import { motion } from 'framer-motion';

const CATEGORIES = ['Все', 'IT', 'Социальные проекты', 'Медиа', 'Наука', 'Лидерство', 'Спорт', 'Искусство'];

function getRank(points) {
    if (points >= 6000) return 'Diamond';
    if (points >= 3000) return 'Platinum';
    if (points >= 1500) return 'Gold';
    if (points >= 500) return 'Silver';
    return 'Bronze';
}

export default function Leaderboard() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    useEffect(() => {
        usersClient.leaderboard(100).then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, []);

    const filtered = users.filter(u => {
        const matchSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.city || '').toLowerCase().includes(search.toLowerCase());
        return matchSearch;
    });

    const myPosition = filtered.findIndex(u => u.id === currentUser?.id) + 1;

    const top3 = filtered.slice(0, 3);
    const rest = filtered.slice(3);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="w-8 h-8 text-gold" />
                    <h1 className="text-4xl font-bold gradient-text">Рейтинг участников</h1>
                    <Trophy className="w-8 h-8 text-gold" />
                </div>
                <p className="text-muted-foreground">Участники, отсортированные по количеству баллов</p>
                {myPosition > 0 && (
                    <div className="mt-3 inline-block bg-primary/10 border border-primary/20 text-primary text-sm px-4 py-1.5 rounded-full">
                        Ваше место: #{myPosition}
                    </div>
                )}
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Поиск участников..."
                        className="w-full pl-9 pr-4 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none transition-colors"
                    />
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-secondary rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <>
                    {/* Top 3 podium */}
                    {top3.length >= 3 && (
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {/* 2nd */}
                            <PodiumCard user={top3[1]} position={2} delay={0.1} isSelf={top3[1]?.id === currentUser?.id} />
                            {/* 1st */}
                            <PodiumCard user={top3[0]} position={1} delay={0} isSelf={top3[0]?.id === currentUser?.id} />
                            {/* 3rd */}
                            <PodiumCard user={top3[2]} position={3} delay={0.2} isSelf={top3[2]?.id === currentUser?.id} />
                        </div>
                    )}

                    {/* Rest of list */}
                    <div className="space-y-2">
                        {(top3.length >= 3 ? rest : filtered).map((user, idx) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                    user.id === currentUser?.id
                                        ? 'bg-primary/10 border-primary/30 glow-blue'
                                        : 'card-glass hover:border-border/80'
                                }`}
                            >
                                <div className="w-10 text-center">
                  <span className="text-lg font-bold text-muted-foreground">
                    #{top3.length >= 3 ? idx + 4 : idx + 1}
                  </span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                                    {(user.full_name || 'U')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm flex items-center gap-2">
                                        {user.full_name || 'Unknown'}
                                        {user.id === currentUser?.id && <span className="text-xs text-primary">(вы)</span>}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{user.city || '—'}</div>
                                </div>
                                <div className="hidden sm:block">
                                    <RankBadge rank={getRank(user.total_points || 0)} />
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-yellow-400">{user.total_points || 0}</div>
                                    <div className="text-xs text-muted-foreground">балл.</div>
                                </div>
                                <div className="hidden sm:block text-right">
                                    <div className="text-sm font-medium">{user.total_events || 0}</div>
                                    <div className="text-xs text-muted-foreground">участий</div>
                                </div>
                            </motion.div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                Участники не найдены
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function PodiumCard({ user, position, delay, isSelf }) {
    const configs = {
        1: { icon: <Crown className="w-6 h-6 text-yellow-400" />, color: 'border-yellow-500/40 bg-yellow-500/5', height: 'mt-0', badge: 'text-yellow-400' },
        2: { icon: <Medal className="w-5 h-5 text-slate-300" />, color: 'border-slate-400/30 bg-slate-400/5', height: 'mt-6', badge: 'text-slate-300' },
        3: { icon: <Medal className="w-5 h-5 text-orange-400" />, color: 'border-orange-500/30 bg-orange-500/5', height: 'mt-8', badge: 'text-orange-400' },
    };
    const c = configs[position];
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`${c.height} border rounded-2xl p-4 text-center ${c.color} ${isSelf ? 'ring-2 ring-primary' : ''}`}
        >
            <div className="flex justify-center mb-2">{c.icon}</div>
            <div className={`text-2xl font-black ${c.badge} mb-2`}>#{position}</div>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-lg mx-auto mb-2">
                {(user?.full_name || 'U')[0].toUpperCase()}
            </div>
            <div className="font-semibold text-sm truncate">{user?.full_name || 'Unknown'}</div>
            <div className="text-xs text-muted-foreground mb-2">{user?.city || '—'}</div>
            <div className="font-bold text-yellow-400 text-lg">{user?.total_points || 0}</div>
            <div className="text-xs text-muted-foreground">балл.</div>
        </motion.div>
    );
}
