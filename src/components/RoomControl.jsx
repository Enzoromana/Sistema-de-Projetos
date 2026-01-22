import { useState, useEffect, useMemo } from 'react';
import {
    Calendar as CalendarIcon, Clock, Plus, Trash2,
    ChevronLeft, ChevronRight, MapPin, Users,
    ArrowLeft, Filter, Search, Building2, Grid3X3,
    CalendarDays, CalendarRange, List
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

const HOURS = Array.from({ length: 15 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`); // 07:00 to 21:00
const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function RoomControl({ setView }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [formData, setFormData] = useState({
        title: '',
        sector: '',
        date: selectedDate,
        start_time: '09:00',
        end_time: '10:00',
        description: ''
    });

    useEffect(() => {
        loadBookings();
    }, [selectedDate, viewMode]);

    const loadBookings = async () => {
        setLoading(true);
        try {
            let query = supabase.from('room_bookings').select('*');

            // Logic to fetch range based on viewMode
            const date = new Date(selectedDate);
            if (viewMode === 'day') {
                query = query.eq('date', selectedDate);
            } else if (viewMode === 'week') {
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
                const start = new Date(date.setDate(diff)).toISOString().split('T')[0];
                const end = new Date(date.setDate(diff + 6)).toISOString().split('T')[0];
                query = query.gte('date', start).lte('date', end);
            } else if (viewMode === 'month') {
                const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
                query = query.gte('date', start).lte('date', end);
            }

            const { data, error } = await query.order('start_time', { ascending: true });

            if (error) throw error;
            setBookings(data || []);
        } catch (e) {
            console.error('Erro ao carregar agendamentos:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('room_bookings')
                .insert([{ ...formData }])
                .select();

            if (error) throw error;
            loadBookings(); // Refresh view
            setShowModal(false);
            setFormData({ title: '', sector: '', date: selectedDate, start_time: '09:00', end_time: '10:00', description: '' });
        } catch (e) {
            alert('Erro: ' + e.message);
        }
    };

    const deleteBooking = async (id) => {
        if (!confirm('Excluir agendamento?')) return;
        try {
            await supabase.from('room_bookings').delete().eq('id', id);
            setBookings(bookings.filter(b => b.id !== id));
        } catch (e) { console.error(e); }
    };

    const navigateDate = (dir) => {
        const d = new Date(selectedDate);
        if (viewMode === 'day') d.setDate(d.getDate() + dir);
        else if (viewMode === 'week') d.setDate(d.getDate() + (dir * 7));
        else if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    // View Components
    const DayView = () => (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
            <div className="grid grid-cols-1 divide-y divide-slate-100">
                {HOURS.map((hour) => {
                    const booking = bookings.find(b => b.start_time.startsWith(hour) && b.date === selectedDate);
                    return (
                        <div key={hour} className="flex group min-h-[90px] relative">
                            <div className="w-24 md:w-32 py-8 flex flex-col items-center justify-start border-r border-slate-100 bg-slate-50/20">
                                <span className="text-sm font-black text-slate-400 group-hover:text-indigo-600 transition-colors">{hour}</span>
                            </div>
                            <div className="flex-1 p-3">
                                {booking ? (
                                    <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all group/card border-l-4 border-l-indigo-600">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-black text-slate-800">{booking.title}</h4>
                                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-black uppercase tracking-widest">{booking.sector}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                                                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-500" /> {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteBooking(booking.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/card:opacity-100">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setFormData({ ...formData, start_time: hour, date: selectedDate });
                                            setShowModal(true);
                                        }}
                                        className="w-full h-full rounded-2xl border-2 border-dashed border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all flex items-center justify-center group/btn"
                                    >
                                        <Plus className="text-slate-200 group-hover/btn:text-indigo-300 transition-colors" size={24} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const WeekView = () => {
        const date = new Date(selectedDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(date.setDate(diff));

        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            return d;
        });

        return (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
                <div className="grid grid-cols-8 divide-x divide-slate-100">
                    <div className="bg-slate-50/50">
                        <div className="h-20 border-b border-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400 uppercase tracking-widest">Hora</div>
                        {HOURS.map(h => (
                            <div key={h} className="h-24 flex items-center justify-center border-b border-slate-50 text-xs font-black text-slate-400">{h}</div>
                        ))}
                    </div>
                    {days.map((d, i) => {
                        const dateStr = d.toISOString().split('T')[0];
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        return (
                            <div key={i} className={`flex-1 ${isToday ? 'bg-indigo-50/20' : ''}`}>
                                <div className={`h-20 border-b border-slate-100 flex flex-col items-center justify-center ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-50/50'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">{DAYS_OF_WEEK[i]}</span>
                                    <span className="text-xl font-black tracking-tighter">{d.getDate()}</span>
                                </div>
                                {HOURS.map(h => {
                                    const booking = bookings.find(b => b.date === dateStr && b.start_time.startsWith(h));
                                    return (
                                        <div key={h} className="h-24 border-b border-slate-50 p-1 relative">
                                            {booking ? (
                                                <div className="h-full w-full bg-indigo-600 rounded-lg p-2 text-[9px] text-white flex flex-col justify-between shadow-lg shadow-indigo-100 overflow-hidden">
                                                    <p className="font-black leading-tight uppercase line-clamp-2">{booking.title}</p>
                                                    <p className="font-bold opacity-70">{booking.sector}</p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setFormData({ ...formData, date: dateStr, start_time: h });
                                                        setShowModal(true);
                                                    }}
                                                    className="w-full h-full hover:bg-indigo-50/50 rounded-lg transition-all"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const MonthView = () => {
        const date = new Date(selectedDate);
        const y = date.getFullYear();
        const m = date.getMonth();
        const firstDay = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();

        const adjFirstDay = firstDay === 0 ? 6 : firstDay - 1;
        const days = [];

        // Add empty slots
        for (let i = 0; i < adjFirstDay; i++) days.push(null);
        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(y, m, i));

        return (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
                <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
                    {DAYS_OF_WEEK.map(d => (
                        <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.slice(0, 3)}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {days.map((d, i) => {
                        if (!d) return <div key={i} className="h-32 border-b border-r border-slate-50 bg-slate-50/10"></div>;
                        const dateStr = d.toISOString().split('T')[0];
                        const dayBookings = bookings.filter(b => b.date === dateStr);
                        const isToday = dateStr === new Date().toISOString().split('T')[0];

                        return (
                            <div key={i} className={`h-32 border-b border-r border-slate-100 p-3 group hover:bg-slate-50 transition-all ${isToday ? 'bg-indigo-50/30' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                                        {d.getDate()}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setFormData({ ...formData, date: dateStr });
                                            setShowModal(true);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-indigo-600 bg-indigo-50 rounded-lg transition-all"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="space-y-1 overflow-y-auto max-h-[60px] custom-scrollbar">
                                    {dayBookings.slice(0, 3).map(b => (
                                        <div key={b.id} className="text-[9px] bg-indigo-100/50 text-indigo-700 px-2 py-1 rounded-md font-black flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-indigo-600"></div>
                                            <span className="truncate">{b.title}</span>
                                        </div>
                                    ))}
                                    {dayBookings.length > 3 && (
                                        <div className="text-[9px] text-slate-400 font-black pl-2">+{dayBookings.length - 3} mais...</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right duration-700 pb-20">
            {/* Professional Branding Header */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => setView('hub')}
                                className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all group"
                            >
                                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="px-5 py-2 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/20 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-200">
                                Unidade Corporativa Klini
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
                            Grade de Horários
                        </h1>
                        <p className="text-xl text-indigo-200/60 font-medium">Sala de Reunião mesanino</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-white/10">
                            {[
                                { id: 'day', label: 'Hoje', icon: <CalendarIcon size={16} /> },
                                { id: 'week', label: 'Semana', icon: <CalendarRange size={16} /> },
                                { id: 'month', label: 'Mês', icon: <CalendarDays size={16} /> }
                            ].map(mod => (
                                <button
                                    key={mod.id}
                                    onClick={() => setViewMode(mod.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === mod.id ? 'bg-white text-indigo-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {mod.icon} {mod.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-white/10">
                            <button onClick={() => navigateDate(-1)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="px-4 font-black text-sm uppercase tracking-widest min-w-[150px] text-center">
                                {viewMode === 'day' ? formatDate(selectedDate) : viewMode === 'week' ? 'Esta Semana' : new Date(selectedDate).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => navigateDate(1)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <Plus size={20} /> Novo Agendamento
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic View Content */}
            {loading ? (
                <div className="h-[600px] flex flex-col items-center justify-center gap-6 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Sincronizando Grade...</p>
                </div>
            ) : (
                <>
                    {viewMode === 'day' && <DayView />}
                    {viewMode === 'week' && <WeekView />}
                    {viewMode === 'month' && <MonthView />}
                </>
            )}

            {/* Visual Policy Accent */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white/50 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl text-emerald-400">
                        <Users size={24} />
                    </div>
                    <p className="text-sm font-medium">Todos os colaboradores podem visualizar as reservas de salas para melhor coordenação.</p>
                </div>
                <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold`}>{String.fromCharCode(64 + i)}</div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">+8</div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 shadow-2xl relative animate-in zoom-in duration-300 border border-white/20">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                                <Plus size={32} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Nova Reserva</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Agendamento Mesanino</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Assunto da Reunião</label>
                                <input
                                    type="text" required
                                    className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-black text-slate-700 placeholder:text-slate-300"
                                    placeholder="Ex: Alinhamento de Metas"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Setor Solicitante</label>
                                <div className="relative">
                                    <input
                                        type="text" required
                                        className="w-full pl-16 pr-8 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-black text-slate-700 placeholder:text-slate-300"
                                        placeholder="Ex: Comercial / TI"
                                        value={formData.sector}
                                        onChange={e => setFormData({ ...formData, sector: e.target.value })}
                                    />
                                    <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Data</label>
                                    <input
                                        type="date" required
                                        className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-black text-slate-700"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Início</label>
                                    <input
                                        type="time" required
                                        className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-black text-slate-700"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Término Estimado</label>
                                <input
                                    type="time" required
                                    className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-black text-slate-700"
                                    value={formData.end_time}
                                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-6 pt-8">
                                <button
                                    type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 px-10 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-10 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest text-white bg-indigo-600 hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-100"
                                >
                                    Agendar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
