import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsClient } from '@/api/eventsClient';
import { ArrowLeft, CalendarDays, Save } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['IT', 'Социальные проекты', 'Медиа', 'Наука', 'Лидерство', 'Спорт', 'Искусство'];

export default function CreateEvent({ onCreated }) {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        date: '',
        end_date: '',
        category: 'IT',
        difficulty_coefficient: 1,
        base_points: 100,
        location: '',
        max_participants: '',
        status: 'upcoming',
        bonus_description: ''
    });

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title || !form.date) {
            toast.error('Название и дата обязательны');
            return;
        }
        setSaving(true);
        await eventsClient.create({
            ...form,
            difficulty_coefficient: parseFloat(form.difficulty_coefficient) || 1,
            base_points: parseInt(form.base_points) || 100,
            max_participants: form.max_participants ? parseInt(form.max_participants) : undefined
        });
        toast.success('Мероприятие создано');
        onCreated?.();
        navigate('/events');
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Назад
            </button>

            <div>
                <h1 className="text-3xl font-bold text-foreground">Создание мероприятия</h1>
                <p className="text-muted-foreground text-sm mt-1">Заполните данные нового мероприятия</p>
            </div>

            <form onSubmit={handleSubmit} className="card-glass rounded-2xl p-8 space-y-5">
                <Field label="Название мероприятия *">
                    <input value={form.title} onChange={e => set('title', e.target.value)}
                           placeholder="Введите название мероприятия" required
                           className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                </Field>

                <Field label="Описание">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Опишите мероприятие..." rows={4}
                    className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none resize-none" />
                </Field>

                <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Дата начала *">
                        <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
                               className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                    </Field>
                    <Field label="Дата окончания">
                        <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                               className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                    </Field>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Направление">
                        <select value={form.category} onChange={e => set('category', e.target.value)}
                                className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>
                    <Field label="Статус">
                        <select value={form.status} onChange={e => set('status', e.target.value)}
                                className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none">
                            {['draft', 'upcoming', 'active', 'completed', 'cancelled'].map(s => (
                                <option key={s} value={s}>{statusLabel(s)}</option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Базовые баллы" hint={`Итого: ${Math.round(form.base_points * form.difficulty_coefficient)} балл.`}>
                        <input type="number" min="1" value={form.base_points} onChange={e => set('base_points', e.target.value)}
                               className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                    </Field>
                    <Field label="Коэффициент сложности (×)" hint="Множитель баллов">
                        <input type="number" min="0.5" max="5" step="0.1" value={form.difficulty_coefficient} onChange={e => set('difficulty_coefficient', e.target.value)}
                               className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                    </Field>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                    <span className="text-primary font-semibold">Формула рейтинга: {form.base_points} × {form.difficulty_coefficient} = </span>
                    <span className="text-yellow-400 font-bold text-lg">{Math.round(parseFloat(form.base_points || 0) * parseFloat(form.difficulty_coefficient || 1))} балл.</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Место проведения">
                        <input value={form.location} onChange={e => set('location', e.target.value)}
                               placeholder="Город / Онлайн"
                               className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                    </Field>
                    <Field label="Максимум участников">
                        <input type="number" min="1" value={form.max_participants} onChange={e => set('max_participants', e.target.value)}
                               placeholder="Без ограничений"
                               className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                    </Field>
                </div>

                <Field label="Дополнительные бонусы (необязательно)">
                    <input value={form.bonus_description} onChange={e => set('bonus_description', e.target.value)}
                           placeholder="Например: стажировка, сертификат..."
                           className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm border border-border focus:border-primary outline-none" />
                </Field>

                <button type="submit" disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {saving ? 'Создаем...' : 'Создать мероприятие'}
                </button>
            </form>
        </div>
    );
}

function Field({ label, hint, children }) {
    return (
        <div>
            <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">{label}</label>
                {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
            </div>
            {children}
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
