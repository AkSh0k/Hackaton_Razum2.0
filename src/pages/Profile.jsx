import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '@/api/authClient';
import { participationsClient } from '@/api/participationsClient';
import { useAuth } from '@/lib/AuthContext';
import { Trophy, CalendarDays, Star, TrendingUp, Edit2, Check, X } from 'lucide-react';
import RankBadge from '../components/RankBadge';
import CategoryTag from '../components/CategoryTag';
import { toast } from 'sonner';

function getRankInfo(points) {
    const ranks = [
        { name: 'Bronze', threshold: 0 },
        { name: 'Silver', threshold: 500 },
        { name: 'Gold', threshold: 1500 },
        { name: 'Platinum', threshold: 3000 },
        { name: 'Diamond', threshold: 6000 }
    ];
    const current = [...ranks].reverse().find(r => points >= r.threshold) || ranks[0];
    const next = ranks[ranks.indexOf(current) + 1];
    const progress = next ? Math.round(((points - current.threshold) / (next.threshold - current.threshold)) * 100) : 100;
    return { name: current.name, next: next?.name, nextThreshold: next?.threshold, toNext: next ? next.threshold - points : 0, progress: Math.min(progress, 100) };
}

export default function Profile() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [participations, setParticipations] = useState([]);

    useEffect(() => {
        if (currentUser && currentUser.role !== 'participant') {
            navigate('/', { replace: true });
        }
    }, [currentUser]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ city: '', bio: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        setForm({ city: currentUser.city || '', bio: currentUser.bio || '' });
        participationsClient.list({ participantId: currentUser.id, sort: '-created_date', limit: 50 })
            .then(p => { setParticipations(p); setLoading(false); });
    }, [currentUser]);

    async function saveProfile() {
        setSaving(true);
        await authClient.updateMe(form);
        setEditing(false);
        setSaving(false);
        toast.success('Profile updated!');
    }

    const points = currentUser?.total_points || 0;
    const rankInfo = getRankInfo(points);
    const verified = participations.filter(p => p.status === 'verified');
    const pending = participations.filter(p => p.status === 'pending');

    const categoryBreakdown = verified.reduce((acc, p) => {
        if (p.event_category) acc[p.event_category] = (acc[p.event_category] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Мой профиль</h1>

            {/* Profile card */}
            <div className="card-glass rounded-2xl p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                            {(currentUser?.full_name || 'U')[0].toUpperCase()}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">{currentUser?.full_name}</h2>
                                <p className="text-muted-foreground text-sm">{currentUser?.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <RankBadge rank={rankInfo.name} size="md" />
                                    <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-0.5 rounded-full">{currentUser?.role}</span>
                                </div>
                            </div>
                            {!editing ? (
                                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary px-3 py-1.5 rounded-lg transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" /> Редактировать
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg transition-colors">
                                        <Check className="w-3.5 h-3.5" /> {saving ? 'Сохраняем...' : 'Сохранить'}
                                    </button>
                                    <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 text-xs bg-secondary text-muted-foreground px-3 py-1.5 rounded-lg transition-colors">
                                        <X className="w-3.5 h-3.5" /> Отмена
                                    </button>
                                </div>
                            )}
                        </div>

                        {editing ? (
                            <div className="mt-4 space-y-3">
                                <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                                       placeholder="Ваш город..." className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:border-primary outline-none" />
                                <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                                          placeholder="Краткая информация о себе..." rows={2} className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm focus:border-primary outline-none" />
                            </div>
                        ) : (
                            <div className="mt-3 space-y-1">
                                {currentUser?.city && <p className="text-sm text-muted-foreground">📍 {currentUser.city}</p>}
                                {currentUser?.bio && <p className="text-sm text-foreground/80 mt-2">{currentUser.bio}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBox label="Всего баллов" value={points} icon={<Star className="w-4 h-4 text-yellow-400" />} />
                <StatBox label="Участий" value={currentUser?.total_events || 0} icon={<CalendarDays className="w-4 h-4 text-blue-400" />} />
                <StatBox label="Подтверждено" value={verified.length} icon={<Trophy className="w-4 h-4 text-green-400" />} />
                <StatBox label="На проверке" value={pending.length} icon={<TrendingUp className="w-4 h-4 text-orange-400" />} />
            </div>

            {/* Progress to next rank */}
            {rankInfo.toNext > 0 && (
                <div className="card-glass rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium">Прогресс до ранга <span className="text-foreground font-semibold">{rankInfo.next}</span></span>
                        <span className="text-sm text-muted-foreground">Осталось {rankInfo.toNext} балл.</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-700"
                             style={{ width: `${rankInfo.progress}%` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{points} балл.</span>
                        <span>{rankInfo.nextThreshold} балл.</span>
                    </div>
                </div>
            )}

            {/* Category breakdown */}
            {Object.keys(categoryBreakdown).length > 0 && (
                <div className="card-glass rounded-2xl p-6">
                    <h2 className="font-semibold mb-4">Активность по направлениям</h2>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(categoryBreakdown).map(([cat, count]) => (
                            <CategoryTag key={cat} category={cat} count={count} />
                        ))}
                    </div>
                </div>
            )}

            {/* Achievements portfolio */}
            <div className="card-glass rounded-2xl p-6">
                <h2 className="font-semibold mb-4">Портфолио достижений</h2>
                {loading ? (
                    <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}</div>
                ) : verified.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        Пока нет подтвержденных участий. Участвуйте в мероприятиях, чтобы получить достижения.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {verified.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{p.event_title}</div>
                                        <div className="text-xs text-muted-foreground">{p.event_date} · {p.event_category}</div>
                                    </div>
                                </div>
                                <div className="text-yellow-400 font-bold text-sm">+{p.points_earned} балл.</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatBox({ label, value, icon }) {
    return (
        <div className="card-glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
}
