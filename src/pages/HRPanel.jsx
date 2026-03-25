import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrClient } from '@/api/hrClient';
import { useAuth } from '@/lib/AuthContext';
import { Search, Filter, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import RankBadge from '../components/RankBadge';
import CategoryTag from '../components/CategoryTag';

function getRank(pts) {
    if (pts >= 6000) return 'Diamond';
    if (pts >= 3000) return 'Platinum';
    if (pts >= 1500) return 'Gold';
    if (pts >= 500) return 'Silver';
    return 'Bronze';
}

function getRankLabel(rank) {
    const map = {
        Bronze: 'Бронза',
        Silver: 'Серебро',
        Gold: 'Золото',
        Platinum: 'Платина',
        Diamond: 'Алмаз',
    };
    return map[rank] || rank;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export default function HRPanel() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [participations, setParticipations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [minEvents, setMinEvents] = useState('');
    const [minPoints, setMinPoints] = useState('');
    const [sortBy, setSortBy] = useState('total_points');
    const [sortDir, setSortDir] = useState('desc');
    const [selected, setSelected] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        if (currentUser?.role !== 'observer') {
            navigate('/');
            return;
        }
        hrClient.candidates().then(({ users, participations }) => {
            setUsers(users);
            setParticipations(participations);
            setLoading(false);
        });
    }, [currentUser, navigate]);

    function getParticipationsFor(userId) {
        return participations.filter(p => p.participant_id === userId && p.status === 'verified');
    }

    const cities = [...new Set(users.map(u => u.city).filter(Boolean))];

    let filtered = users.filter(u => {
        const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        const matchCity = !cityFilter || u.city === cityFilter;
        const matchEvents = !minEvents || (u.total_events || 0) >= parseInt(minEvents);
        const matchPoints = !minPoints || (u.total_points || 0) >= parseInt(minPoints);
        return matchSearch && matchCity && matchEvents && matchPoints;
    });

    filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    function toggleSort(field) {
        if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortBy(field); setSortDir('desc'); }
    }

    function exportCSV() {
        const rows = [['ФИО', 'Электронная почта', 'Город', 'Баллы', 'Мероприятия', 'Ранг']];
        filtered.forEach(u => {
            rows.push([
                u.full_name || '',
                u.email || '',
                u.city || '',
                u.total_points || 0,
                u.total_events || 0,
                getRankLabel(getRank(u.total_points || 0)),
            ]);
        });
        const csv = rows
            .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';'))
            .join('\n');
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'otchet-kadrovogo-inspektora.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    async function exportPDF() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '1000px';
        container.style.background = '#ffffff';
        container.style.color = '#111827';
        container.style.padding = '24px';
        container.style.fontFamily = 'Arial, sans-serif';

        const rows = filtered.map((u) => `
            <tr>
                <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;">${escapeHtml(u.full_name || '')}</td>
                <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;">${escapeHtml(u.city || '—')}</td>
                <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;">${u.total_points || 0}</td>
                <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;">${u.total_events || 0}</td>
                <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;">${getRankLabel(getRank(u.total_points || 0))}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div style="font-size:24px;font-weight:700;margin-bottom:8px;">Отчет кадрового инспектора</div>
            <div style="font-size:12px;color:#4b5563;margin-bottom:16px;">Сформировано: ${new Date().toLocaleDateString('ru-RU')}</div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead>
                    <tr>
                        <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #111827;">ФИО</th>
                        <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #111827;">Город</th>
                        <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #111827;">Баллы</th>
                        <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #111827;">Мероприятия</th>
                        <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #111827;">Ранг</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        document.body.appendChild(container);

        try {
            const doc = new jsPDF();
            await doc.html(container, {
                margin: [12, 12, 12, 12],
                autoPaging: 'text',
                callback: (generatedDoc) => {
                    generatedDoc.save('otchet-kadrovogo-inspektora.pdf');
                },
            });
        } finally {
            document.body.removeChild(container);
        }
    }

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return null;
        return sortDir === 'desc' ? <ChevronDown className="w-3.5 h-3.5 inline ml-1" /> : <ChevronUp className="w-3.5 h-3.5 inline ml-1" />;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Панель кадрового инспектора</h1>
                    <p className="text-muted-foreground text-sm mt-1">Кандидатов: {filtered.length}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportCSV} className="flex items-center gap-2 bg-secondary border border-border text-foreground px-4 py-2.5 rounded-xl text-sm hover:bg-secondary/70 transition-colors">
                        <Download className="w-4 h-4" />
                        CSV
                    </button>
                    <button onClick={exportPDF} className="flex items-center gap-2 bg-secondary border border-border text-foreground px-4 py-2.5 rounded-xl text-sm hover:bg-secondary/70 transition-colors">
                        <FileText className="w-4 h-4" />
                        PDF
                    </button>
                </div>
            </div>

            <div className="card-glass rounded-2xl p-4 space-y-3">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                               placeholder="Поиск по имени или электронной почте..."
                               className="w-full pl-9 pr-4 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                    </div>
                    <button onClick={() => setShowFilters(f => !f)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
                        <Filter className="w-4 h-4" /> Фильтры
                    </button>
                </div>

                {showFilters && (
                    <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-border">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Город</label>
                            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none">
                                <option value="">Все города</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Мин. мероприятий</label>
                            <input type="number" min="0" value={minEvents} onChange={e => setMinEvents(e.target.value)}
                                   placeholder="0"
                                   className="w-full px-3 py-2 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Мин. баллов</label>
                            <input type="number" min="0" value={minPoints} onChange={e => setMinPoints(e.target.value)}
                                   placeholder="0"
                                   className="w-full px-3 py-2 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-6">
                <div className={`flex-1 card-glass rounded-2xl overflow-hidden ${selected ? 'hidden lg:block' : ''}`}>
                    <div className="grid grid-cols-12 text-xs text-muted-foreground font-medium uppercase tracking-wider px-5 py-3 border-b border-border">
                        <div className="col-span-4">ФИО</div>
                        <div className="col-span-2">Город</div>
                        <div className="col-span-2 cursor-pointer hover:text-foreground" onClick={() => toggleSort('total_events')}>
                            Мероприятия <SortIcon field="total_events" />
                        </div>
                        <div className="col-span-2 cursor-pointer hover:text-foreground" onClick={() => toggleSort('total_points')}>
                            Баллы <SortIcon field="total_points" />
                        </div>
                        <div className="col-span-2">Ранг</div>
                    </div>
                    <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                        {loading
                            ? Array(6).fill(0).map((_, i) => <div key={i} className="h-14 animate-pulse bg-secondary/30 m-2 rounded-xl" />)
                            : filtered.map(user => (
                                <div key={user.id}
                                     onClick={() => setSelected(user)}
                                     className={`grid grid-cols-12 items-center px-5 py-3.5 cursor-pointer hover:bg-secondary/50 transition-colors ${selected?.id === user.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}>
                                    <div className="col-span-4 flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                                            {user.full_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{user.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">{user.city || '—'}</div>
                                    <div className="col-span-2 text-sm">{user.total_events || 0}</div>
                                    <div className="col-span-2 text-sm font-semibold text-yellow-400">{user.total_points || 0}</div>
                                    <div className="col-span-2"><RankBadge rank={getRank(user.total_points || 0)} /></div>
                                </div>
                            ))
                        }
                        {!loading && filtered.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">Кандидаты не найдены</div>
                        )}
                    </div>
                </div>

                {selected && (
                    <div className="w-full lg:w-80 flex-shrink-0">
                        <CandidateDetail user={selected} participations={getParticipationsFor(selected.id)} onClose={() => setSelected(null)} />
                    </div>
                )}
            </div>
        </div>
    );
}

function CandidateDetail({ user, participations, onClose }) {
    const rank = getRank(user.total_points || 0);
    const categories = [...new Set(participations.map(p => p.event_category).filter(Boolean))];

    return (
        <div className="card-glass rounded-2xl p-6 space-y-4 sticky top-8">
            <div className="flex justify-between items-start">
                <h3 className="font-semibold">Профиль кандидата</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕ Закрыть</button>
            </div>

            <div className="text-center py-4 border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-3">
                    {user.full_name?.[0] || '?'}
                </div>
                <h4 className="font-bold text-foreground">{user.full_name}</h4>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                {user.city && <p className="text-xs text-muted-foreground mt-1">📍 {user.city}</p>}
                <div className="mt-2"><RankBadge rank={rank} size="md" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-yellow-400">{user.total_points || 0}</div>
                    <div className="text-xs text-muted-foreground">Баллы</div>
                </div>
                <div className="bg-secondary rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-blue-400">{user.total_events || 0}</div>
                    <div className="text-xs text-muted-foreground">Мероприятия</div>
                </div>
            </div>

            {categories.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground mb-2">Направления активности</p>
                    <div className="flex flex-wrap gap-1.5">
                        {categories.map(c => <CategoryTag key={c} category={c} small />)}
                    </div>
                </div>
            )}

            {participations.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground mb-2">Последние активности</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {participations.slice(0, 10).map(p => (
                            <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-secondary rounded-lg">
                                <span className="truncate mr-2 text-foreground/80">{p.event_title}</span>
                                <span className="text-yellow-400 font-semibold flex-shrink-0">+{p.points_earned}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
