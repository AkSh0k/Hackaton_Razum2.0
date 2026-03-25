import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsClient } from '@/api/eventsClient';
import { participationsClient } from '@/api/participationsClient';
import { useAuth } from '@/lib/AuthContext';
import { CalendarDays, MapPin, Users, Star, CheckCircle, Clock, XCircle, ArrowLeft, Trash2 } from 'lucide-react';
import CategoryTag from '../components/CategoryTag';
import { toast } from 'sonner';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [event, setEvent] = useState(null);
    const [participations, setParticipations] = useState([]);
    const [myParticipation, setMyParticipation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    const isAdmin = currentUser?.role === 'organizer';
    const isOwner = event?.organizer_id === currentUser?.id || currentUser?.role === 'organizer';

    useEffect(() => {
        async function load() {
            const [ev, parts] = await Promise.all([
                eventsClient.get(id),
                eventsClient.getParticipations(id, { sort: '-created_date', limit: 500 })
            ]);
            setEvent(ev);
            setParticipations(parts);
            if (currentUser) {
                const mine = parts.find(p => p.participant_id === currentUser.id);
                setMyParticipation(mine || null);
            }
            setLoading(false);
        }
        load();
    }, [id, currentUser]);

    async function joinEvent() {
        setJoining(true);
        const part = await eventsClient.join(id);
        setMyParticipation(part);
        setParticipations(prev => [...prev, part]);
        toast.success('Successfully registered! Awaiting verification.');
        setJoining(false);
    }

    async function verifyParticipant(participationId) {
        const points = Math.round((event.base_points || 0) * (event.difficulty_coefficient || 1));
        const updated = await participationsClient.verify(participationId);
        setParticipations(prev => prev.map(p => p.id === participationId ? updated : p));
        toast.success(`Verified! ${points} points awarded.`);
    }

    async function rejectParticipant(participationId) {
        const updated = await participationsClient.reject(participationId);
        setParticipations(prev => prev.map(p => p.id === participationId ? updated : p));
        toast.info('Participation rejected.');
    }

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
    if (!event) return <div className="text-center py-16 text-muted-foreground">Мероприятие не найдено</div>;

    const diff = event.difficulty_coefficient || 1;
    const points = Math.round((event.base_points || 0) * diff);
    const verified = participations.filter(p => p.status === 'verified').length;
    const pending = participations.filter(p => p.status === 'pending').length;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> К списку мероприятий
            </button>

            <div className="card-glass rounded-2xl p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <CategoryTag category={event.category} />
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                event.status === 'active' ? 'bg-green-500/10 text-green-400' :
                                    event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-secondary text-muted-foreground'
                            }`}>{event.status}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">{event.title}</h1>
                        {event.organizer_name && (
                            <p className="text-sm text-muted-foreground">by <span className="text-foreground">{event.organizer_name}</span></p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-yellow-400">{points}</div>
                        <div className="text-xs text-muted-foreground">балл.</div>
                    </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    <InfoBox icon={<CalendarDays className="w-4 h-4 text-blue-400" />} label="Date" value={event.date} />
                    {event.location && <InfoBox icon={<MapPin className="w-4 h-4 text-green-400" />} label="Location" value={event.location} />}
                    <InfoBox icon={<Star className="w-4 h-4 text-yellow-400" />} label="Difficulty" value={`×${diff}`} />
                </div>

                {event.description && (
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">Описание</h3>
                        <p className="text-foreground/80 leading-relaxed">{event.description}</p>
                    </div>
                )}

                {event.bonus_description && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6">
                        <h3 className="font-semibold text-yellow-400 text-sm mb-1">🎁 Дополнительные бонусы</h3>
                        <p className="text-sm text-foreground/80">{event.bonus_description}</p>
                    </div>
                )}

                {/* Join button */}
                {currentUser?.role === 'participant' && (
                    <div>
                        {!myParticipation ? (
                            <button
                                onClick={joinEvent}
                                disabled={joining || event.status === 'completed' || event.status === 'cancelled'}
                                className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {joining ? 'Регистрируем...' : 'Принять участие'}
                            </button>
                        ) : (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
                                myParticipation.status === 'verified' ? 'bg-green-500/10 text-green-400' :
                                    myParticipation.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                                        'bg-blue-500/10 text-blue-400'
                            }`}>
                                {myParticipation.status === 'verified' && <CheckCircle className="w-5 h-5" />}
                                {myParticipation.status === 'pending' && <Clock className="w-5 h-5" />}
                                {myParticipation.status === 'rejected' && <XCircle className="w-5 h-5" />}
                                <span className="font-medium capitalize">{statusLabel(myParticipation.status)}</span>
                                {myParticipation.status === 'verified' && <span className="text-sm">· +{myParticipation.points_earned} балл.</span>}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Participants management (organizer/admin) */}
            {isOwner && (
                <div className="card-glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-foreground">Участники</h2>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                            <span className="text-green-400">{verified} подтверждено</span>
                            <span className="text-blue-400">{pending} на проверке</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {participations.length === 0 && <p className="text-muted-foreground text-sm">Участников пока нет</p>}
                        {participations.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                                <div>
                                    <div className="font-medium text-sm">{p.participant_name}</div>
                                    <div className="text-xs text-muted-foreground">{p.participant_email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.status === 'verified' && <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> +{p.points_earned} балл.</span>}
                                    {p.status === 'rejected' && <span className="text-red-400 text-xs flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Отклонено</span>}
                                    {p.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => verifyParticipant(p.id)} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors">
                                                Подтвердить
                                            </button>
                                            <button onClick={() => rejectParticipant(p.id)} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                                                Отклонить
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoBox({ icon, label, value }) {
    return (
        <div className="bg-secondary rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
            <div className="font-semibold text-sm">{value}</div>
        </div>
    );
}

function statusLabel(status) {
    const map = {
        verified: 'подтверждено',
        pending: 'на проверке',
        rejected: 'отклонено',
        active: 'активно',
        upcoming: 'предстоит',
        completed: 'завершено',
        cancelled: 'отменено',
        draft: 'черновик',
    };
    return map[status] || status;
}
