import { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon, Clock, Plus, Trash2,
    ChevronLeft, ChevronRight, Room, MeetingRoom,
    LayoutDashboard, Info, AlertCircle, CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

export default function RoomControl() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        description: ''
    });

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('room_bookings')
                .select('*')
                .order('date', { ascending: true })
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
        if (!formData.title.trim()) return;

        try {
            const { data, error } = await supabase
                .from('room_bookings')
                .insert([formData])
                .select();

            if (error) throw error;
            if (data) {
                setBookings([...bookings, data[0]].sort((a, b) => {
                    if (a.date !== b.date) return a.date.localeCompare(b.date);
                    return a.start_time.localeCompare(b.start_time);
                }));
            }
            setShowModal(false);
            setFormData({
                title: '',
                date: new Date().toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '10:00',
                description: ''
            });
        } catch (e) {
            alert('Erro ao salvar agendamento: ' + e.message);
        }
    };

    const deleteBooking = async (id) => {
        if (!confirm('Excluir este agendamento?')) return;
        try {
            const { error } = await supabase.from('room_bookings').delete().eq('id', id);
            if (error) throw error;
            setBookings(bookings.filter(b => b.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Salas de Reunião</h2>
                    <p className="text-slate-500">Agendamentos e disponibilidade</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                    <Plus size={20} /> Novo Agendamento
                </button>
            </div>

            {/* Bookings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                        <CalendarIcon size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Nenhuma reunião agendada</h3>
                        <p className="text-slate-400">Comece agendando uma nova reunião</p>
                    </div>
                ) : (
                    bookings.map(booking => (
                        <div key={booking.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{booking.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-1">{booking.description}</p>
                                </div>
                                <button
                                    onClick={() => deleteBooking(booking.id)}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg">
                                    <CalendarIcon size={16} className="text-indigo-500" />
                                    <span className="text-sm font-medium">{formatDate(booking.date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg">
                                    <Clock size={16} className="text-indigo-500" />
                                    <span className="text-sm font-medium">{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">Agendar Reunião</h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                    placeholder="Ex: Alinhamento de Projeto"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Início</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Fim</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Descrição (Opcional)</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
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
