import { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon, Clock, Plus, Trash2,
    ChevronLeft, ChevronRight, MapPin, Users,
    ArrowLeft, Filter, Search, Building2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

const HOURS = Array.from({ length: 15 }, (_, i) => `${i + 7}:00`); // 07:00 to 21:00

export default function RoomControl({ setView }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
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
    }, [selectedDate]);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('room_bookings')
                .select('*')
                .eq('date', selectedDate)
                .order('start_time', { ascending: true });

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
                .insert([{ ...formData, date: selectedDate }])
                .select();

            if (error) throw error;
            if (data) setBookings([...bookings, data[0]]);

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

    const getBookingForHour = (hour) => {
        const hourNum = parseInt(hour.split(':')[0]);
        return bookings.find(b => {
            const startStr = b.start_time.split(':')[0];
            const endStr = b.end_time.split(':')[0];
            const start = parseInt(startStr);
            const end = parseInt(endStr);
            return hourNum >= start && hourNum < end;
        });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('hub')}
                        className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Grade de Salas</h2>
                        <p className="text-slate-500 text-sm">Controle de Reuniões Klini</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <input
                            type="date"
                            className="bg-transparent px-4 py-2 text-sm font-bold text-slate-600 outline-none"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <Plus size={20} /> Novo
                    </button>
                </div>
            </div>

            {/* Grid View */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-slate-100">
                    {HOURS.map((hour) => {
                        const booking = getBookingForHour(hour);
                        const isStart = booking && booking.start_time.startsWith(hour.padStart(5, '0'));

                        return (
                            <div key={hour} className="flex group min-h-[80px]">
                                <div className="w-20 md:w-32 py-6 flex flex-col items-center justify-start border-r border-slate-100 bg-slate-50/30">
                                    <span className="text-sm font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{hour}</span>
                                </div>
                                <div className="flex-1 p-2 relative">
                                    {booking ? (
                                        isStart && (
                                            <div
                                                className="absolute inset-x-2 top-2 z-10 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between group/card hover:shadow-lg transition-all"
                                                style={{ height: `calc(${(parseInt(booking.end_time) - parseInt(booking.start_time)) * 80}px - 16px)` }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-10 bg-indigo-500 rounded-full"></div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-indigo-900">{booking.title}</h4>
                                                            {booking.sector && (
                                                                <span className="text-[10px] bg-indigo-200/50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                    {booking.sector}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-indigo-600/70 font-medium">
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={12} /> {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteBooking(booking.id)}
                                                    className="opacity-0 group-hover/card:opacity-100 p-2 text-indigo-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setFormData({ ...formData, start_time: hour.padStart(5, '0') });
                                                setShowModal(true);
                                            }}
                                            className="w-full h-full rounded-xl hover:bg-slate-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-all border-2 border-dashed border-transparent hover:border-slate-200"
                                        >
                                            <Plus size={20} className="text-slate-300" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative animate-in zoom-in duration-300">
                        <h3 className="text-3xl font-extrabold text-slate-800 mb-2">Agendar Sala</h3>
                        <p className="text-slate-500 mb-8 font-medium">Preencha os dados da reunião na Klini.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Assunto</label>
                                <input
                                    type="text" required
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                    placeholder="Ex: PDI Mensal"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Setor</label>
                                <div className="relative">
                                    <input
                                        type="text" required
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                        placeholder="Ex: Comercial"
                                        value={formData.sector}
                                        onChange={e => setFormData({ ...formData, sector: e.target.value })}
                                    />
                                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Início</label>
                                    <input
                                        type="time" required
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Fim</label>
                                    <input
                                        type="time" required
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold"
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 px-8 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
                                >
                                    Voltar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-8 py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
