import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersClient } from '@/api/usersClient';
import { CalendarDays, Star, Trophy, ArrowLeft } from 'lucide-react';
import CategoryTag from '../components/CategoryTag';

export default function OrganizerProfile() {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        usersClient.organizerProfile(id, 20).then(({ profile, events }) => {
            setProfile(profile || null);
            setEvents(events || []);
            setLoading(false);
        });
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (!profile) return (
        <div className="text-center py-16 text-muted-foreground">Organizer not found</div>
    );

    const trustRating = profile.trust_rating || 4.5;
    const eventsOrganized = profile.events_organized || events.length;
    const categories = [...new Set(events.map(e => e.category).filter(Boolean))];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link to="/events" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
            </Link>

            {/* Profile card */}
            <div className="card-glass rounded-2xl p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary flex-shrink-0">
                        {(profile.full_name || 'O')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
                        <p className="text-sm text-muted-foreground capitalize mt-1">{profile.role}</p>
                        {profile.city && <p className="text-sm text-muted-foreground mt-1">📍 {profile.city}</p>}
                        {profile.bio && <p className="text-sm text-foreground/80 mt-3">{profile.bio}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{eventsOrganized}</div>
                        <div className="text-xs text-muted-foreground mt-1">Events Organized</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="text-2xl font-bold text-yellow-400">{trustRating.toFixed(1)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Trust Rating</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{categories.length}</div>
                        <div className="text-xs text-muted-foreground mt-1">Categories</div>
                    </div>
                </div>
            </div>

            {/* Category expertise */}
            {categories.length > 0 && (
                <div className="card-glass rounded-2xl p-6">
                    <h2 className="font-semibold mb-3">Activity Areas</h2>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(c => <CategoryTag key={c} category={c} />)}
                    </div>
                </div>
            )}

            {/* Events list */}
            <div className="card-glass rounded-2xl p-6">
                <h2 className="font-semibold mb-4">Events by this Organizer</h2>
                {events.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No events yet.</p>
                ) : (
                    <div className="space-y-3">
                        {events.map(event => (
                            <Link key={event.id} to={`/events/${event.id}`}
                                  className="flex items-center justify-between p-3 bg-secondary rounded-xl hover:bg-secondary/70 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <CalendarDays className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm group-hover:text-primary transition-colors">{event.title}</div>
                                        <div className="text-xs text-muted-foreground">{event.date} · {event.category}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.status === 'active' ? 'bg-green-500/10 text-green-400' :
                          event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-secondary text-muted-foreground'
                  }`}>{event.status}</span>
                                    <span className="text-yellow-400 font-semibold text-sm">{Math.round((event.base_points || 0) * (event.difficulty_coefficient || 1))} pts</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
