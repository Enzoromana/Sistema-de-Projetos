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

const isBookingInHour = (booking, hour) => {
    const hStart = parseInt(hour.split(':')[0]);
    const hEnd = hStart + 1;

    const bStartParts = booking.start_time.split(':');
    const bStartDec = parseInt(bStartParts[0]) + (parseInt(bStartParts[1] || 0) / 60);

    const bEndParts = booking.end_time.split(':');
    const bEndDec = parseInt(bEndParts[0]) + (parseInt(bEndParts[1] || 0) / 60);

    return Math.max(bStartDec, hStart) < Math.min(bEndDec, hEnd);
};

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
        <div className="max-w-5xl mx-auto bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
            <div className="grid grid-cols-1 divide-y divide-slate-100">
                {HOURS.map((hour) => {
                    const hourBookings = bookings.filter(b => b.date === selectedDate && isBookingInHour(b, hour));
                    return (
                        <div key={hour} className="flex group min-h-[70px] relative transition-all">
                            <div className="w-20 md:w-28 py-6 flex flex-col items-center justify-start border-r border-slate-100 bg-slate-50/20">
                                <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600 transition-colors tracking-tighter">{hour}</span>
                            </div>
                            <div className="flex-1 p-2 space-y-2">
                                {hourBookings.length > 0 ? (
                                    hourBookings.map((booking) => (
                                        <div key={booking.id} className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all group/card border-l-4 border-l-indigo-600">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="font-black text-sm text-slate-800 tracking-tight">{booking.title}</h4>
                                                        <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">{booking.sector}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                                                        <span className="flex items-center gap-1.5"><Clock size={12} className="text-indigo-500" /> {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => deleteBooking(booking.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/card:opacity-100">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))
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
            <div className="max-w-6xl mx-auto bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
                <div className="grid grid-cols-8 divide-x divide-slate-100">
                    <div className="bg-slate-50/50">
                        <div className="h-14 border-b border-slate-100 flex items-center justify-center font-black text-[9px] text-slate-400 uppercase tracking-widest">Hora</div>
                        {HOURS.map(h => (
                            <div key={h} className="h-20 flex items-center justify-center border-b border-slate-50 text-[10px] font-black text-slate-400">{h}</div>
                        ))}
                    </div>
                    {days.map((d, i) => {
                        const dateStr = d.toISOString().split('T')[0];
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        return (
                            <div key={i} className={`flex-1 ${isToday ? 'bg-indigo-50/20' : ''}`}>
                                <div className={`h-14 border-b border-slate-100 flex flex-col items-center justify-center ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-50/50'}`}>
                                    <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">{DAYS_OF_WEEK[i].slice(0, 3)}</span>
                                    <span className="text-lg font-black tracking-tighter">{d.getDate()}</span>
                                </div>
                                {HOURS.map(h => {
                                    const hourBookings = bookings.filter(b => b.date === dateStr && isBookingInHour(b, h));
                                    return (
                                        <div key={h} className="h-20 border-b border-slate-50 p-1 relative overflow-hidden">
                                            {hourBookings.length > 0 ? (
                                                <div className="flex flex-col gap-1 h-full">
                                                    {hourBookings.map(booking => (
                                                        <div key={booking.id} className="flex-1 min-h-0 bg-indigo-600 rounded-lg p-1.5 text-[8px] text-white flex flex-col justify-between shadow-md shadow-indigo-100 overflow-hidden">
                                                            <p className="font-black leading-tight uppercase truncate">{booking.title}</p>
                                                            <p className="font-bold opacity-70 truncate">{booking.sector}</p>
                                                        </div>
                                                    ))}
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
            <div className="max-w-6xl mx-auto bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-500">
                <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
                    {DAYS_OF_WEEK.map(d => (
                        <div key={d} className="py-2 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">{d.slice(0, 3)}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {days.map((d, i) => {
                        if (!d) return <div key={i} className="h-24 border-b border-r border-slate-50 bg-slate-50/10"></div>;
                        const dateStr = d.toISOString().split('T')[0];
                        const dayBookings = bookings.filter(b => b.date === dateStr);
                        const isToday = dateStr === new Date().toISOString().split('T')[0];

                        return (
                            <div key={i} className={`h-24 border-b border-r border-slate-100 p-2 group hover:bg-slate-50 transition-all ${isToday ? 'bg-indigo-50/30' : ''}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                                        {d.getDate()}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setFormData({ ...formData, date: dateStr });
                                            setShowModal(true);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-indigo-600 bg-indigo-50 rounded-lg transition-all"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                                <div className="space-y-0.5 overflow-hidden">
                                    {dayBookings.slice(0, 2).map(b => (
                                        <div key={b.id} className="text-[8px] bg-indigo-100/50 text-indigo-700 px-1.5 py-0.5 rounded font-black truncate max-w-full">
                                            {b.title}
                                        </div>
                                    ))}
                                    {dayBookings.length > 2 && (
                                        <div className="text-[8px] text-slate-400 font-black pl-1">+{dayBookings.length - 2}</div>
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
        <div className="space-y-6 animate-in slide-in-from-right duration-700 pb-20">
            {/* Professional Branding Header */}
            <div className="max-w-6xl mx-auto bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <button
                                onClick={() => setView('hub')}
                                className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all group"
                            >
                                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="px-4 py-1.5 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/20 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-200">
                                Unidade Corporativa Klini
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-1 tracking-tight">
                            Grade de Horários
                        </h1>
                        <p className="text-lg text-indigo-200/60 font-medium">Sala de Reunião mesanino</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-white/5 backdrop-blur-xl p-1 rounded-[1.25rem] border border-white/10">
                            {[
                                { id: 'day', label: 'Hoje', icon: <CalendarIcon size={14} /> },
                                { id: 'week', label: 'Semana', icon: <CalendarRange size={14} /> },
                                { id: 'month', label: 'Mês', icon: <CalendarDays size={14} /> }
                            ].map(mod => (
                                <button
                                    key={mod.id}
                                    onClick={() => setViewMode(mod.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mod.id ? 'bg-white text-indigo-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {mod.icon} {mod.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1 bg-white/5 backdrop-blur-xl p-1 rounded-[1.25rem] border border-white/10">
                            <button onClick={() => navigateDate(-1)} className="p-2.5 hover:bg-white/10 rounded-xl transition-all">
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-2 font-black text-[11px] uppercase tracking-widest min-w-[120px] text-center">
                                {viewMode === 'day' ? formatDate(selectedDate) : viewMode === 'week' ? 'Esta Semana' : new Date(selectedDate).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => navigateDate(1)} className="p-2.5 hover:bg-white/10 rounded-xl transition-all">
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <Plus size={18} /> Novo
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center gap-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm max-w-6xl mx-auto">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Sincronizando Grade...</p>
                </div>
            ) : (
                <>
                    {viewMode === 'day' && <DayView />}
                    {viewMode === 'week' && <WeekView />}
                    {viewMode === 'month' && <MonthView />}
                </>
            )}

            {/* Visual Policy Accent */}
            <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl p-6 text-white/50 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 rounded-xl text-emerald-400">
                        <Users size={20} />
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">Todos os colaboradores podem visualizar as reservas de salas para melhor coordenação.</p>
                </div>
                <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold`}>{String.fromCharCode(64 + i)}</div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">+8</div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 md:p-10 shadow-2xl relative animate-in zoom-in duration-300 border border-white/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                                <Plus size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nova Reserva</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Agendamento Mesanino</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Assunto da Reunião</label>
                                <input
                                    type="text" required
                                    className="w-full px-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="Ex: Alinhamento de Metas"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Setor Solicitante</label>
                                <div className="relative">
                                    <input
                                        type="text" required
                                        className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300"
                                        placeholder="Ex: Comercial / TI"
                                        value={formData.sector}
                                        onChange={e => setFormData({ ...formData, sector: e.target.value })}
                                    />
                                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Data</label>
                                    <input
                                        type="date" required
                                        className="w-full px-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-700"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Início</label>
                                    <input
                                        type="time" required
                                        className="w-full px-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-700"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Término Estimado</label>
                                <input
                                    type="time" required
                                    className="w-full px-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-700"
                                    value={formData.end_time}
                                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 px-8 py-4 rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-8 py-4 rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest text-white bg-indigo-600 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
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
