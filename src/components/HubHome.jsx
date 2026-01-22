import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Calendar, Users, Settings, Bell, Search,
    ArrowRight, CheckCircle2, AlertCircle, Clock, TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function HubHome({ setActiveModule }) {
    const [stats, setStats] = useState({
        projectsCount: 0,
        tasksCompleted: 0,
        totalTasks: 0,
        meetingsToday: 0,
        recentMeetings: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Projects count
            const { count: projCount } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true });

            // 2. Fetch Tasks stats
            const { data: tasks } = await supabase
                .from('tasks')
                .select('completed');

            const completed = tasks?.filter(t => t.completed).length || 0;
            const total = tasks?.length || 0;

            // 3. Fetch Meetings for today
            const today = new Date().toISOString().split('T')[0];
            const { data: meetings, count: meetCount } = await supabase
                .from('room_bookings')
                .select('*', { count: 'exact' })
                .eq('date', today)
                .order('start_time', { ascending: true });

            setStats({
                projectsCount: projCount || 0,
                tasksCompleted: completed,
                totalTasks: total,
                meetingsToday: meetCount || 0,
                recentMeetings: meetings?.slice(0, 3) || []
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const completionRate = stats.totalTasks > 0
        ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100)
        : 0;

    const modules = [
        {
            id: 'projects',
            title: 'Gestão de Projetos',
            description: 'Controle de tarefas, prazos e equipe em tempo real.',
            icon: <LayoutDashboard size={32} />,
            color: 'bg-teal-500',
            stats: `${stats.projectsCount} Projetos Ativos`
        },
        {
            id: 'rooms',
            title: 'Controle de Salas',
            description: 'Agendamento de salas de reunião e gestão de espaços.',
            icon: <Calendar size={32} />,
            color: 'bg-indigo-500',
            stats: `${stats.meetingsToday} Reuniões hoje`
        },
        {
            id: 'users',
            title: 'Colaboradores',
            description: 'Gestão de acessos, permissões e setores da Klini.',
            icon: <Users size={32} />,
            color: 'bg-blue-500',
            stats: 'Setores Klini',
            disabled: true
        },
        {
            id: 'settings',
            title: 'Configurações',
            description: 'Ajustes do sistema e customização da plataforma.',
            icon: <Settings size={32} />,
            color: 'bg-slate-500',
            stats: 'Sistema v1.1.0',
            disabled: true
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Section / Performance Pulse */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="px-4 py-1.5 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 rounded-full text-xs font-bold text-indigo-300 uppercase tracking-widest">
                                Klini Intelligence
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                            Performance <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">do Hub Klini.</span>
                        </h1>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
                            <div className="space-y-1">
                                <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-wider">Produtividade</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black">{completionRate}%</span>
                                    <TrendingUp size={16} className="text-emerald-400" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-wider">Total Projetos</p>
                                <span className="text-3xl font-black">{stats.projectsCount}</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-wider">Salas Hoje</p>
                                <span className="text-3xl font-black">{stats.meetingsToday}</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-wider">Tarefas OK</p>
                                <span className="text-3xl font-black">{stats.tasksCompleted}</span>
                            </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-8 space-y-2">
                            <div className="flex justify-between text-xs font-bold text-indigo-300/80 uppercase">
                                <span>Progresso Geral dos Projetos</span>
                                <span>{completionRate}%</span>
                            </div>
                            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                    style={{ width: `${completionRate}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Card: Upcoming Meetings */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-800">Próximas Reuniões</h3>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Calendar size={18} />
                        </div>
                    </div>

                    <div className="space-y-5 flex-1">
                        {stats.recentMeetings.length > 0 ? (
                            stats.recentMeetings.map((mtg, i) => (
                                <div key={mtg.id} className="group flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                        <span className="text-[10px] font-bold uppercase">{mtg.start_time.slice(0, 2)}h</span>
                                        <span className="text-[10px] opacity-70 underline">min</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-slate-800 truncate text-sm">{mtg.title}</h4>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mt-1">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-500">{mtg.sector || 'Geral'}</span>
                                            <span>{mtg.start_time.slice(0, 5)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50 space-y-3">
                                <Clock size={32} className="text-slate-300" />
                                <p className="text-sm font-medium text-slate-400">Sem reuniões hoje</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setActiveModule('rooms')}
                        className="w-full mt-6 py-4 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all"
                    >
                        Ver Agenda Completa
                    </button>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map((mod) => (
                    <div
                        key={mod.id}
                        onClick={() => !mod.disabled && setActiveModule(mod.id)}
                        className={`group p-8 rounded-[2rem] border transition-all duration-300 relative overflow-hidden ${mod.disabled ? 'bg-slate-50 border-slate-100 opacity-75 cursor-not-allowed' : 'bg-white border-slate-100 hover:shadow-2xl hover:-translate-y-2 cursor-pointer shadow-xl shadow-slate-200/50'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl ${mod.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-${mod.color.split('-')[1]}-200 group-hover:scale-110 transition-transform`}>
                            {mod.icon}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{mod.title}</h3>
                        <p className="text-slate-500 text-xs mb-8 leading-relaxed font-medium">
                            {mod.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-4 py-2 rounded-full">
                                {mod.stats}
                            </span>
                            {!mod.disabled && (
                                <div className="p-3 rounded-2xl bg-slate-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                    <ArrowRight size={18} />
                                </div>
                            )}
                        </div>

                        {mod.disabled && (
                            <div className="absolute top-6 right-6">
                                <span className="text-[9px] font-black bg-slate-200 text-slate-500 px-3 py-1 rounded-md tracking-tighter">EM BREVE</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick Actions & Recent Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="group bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-4 bg-teal-50 text-teal-600 rounded-3xl">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Caminho para o Sucesso</h3>
                            <p className="text-slate-400 font-medium text-sm">Próximos passos para seu crescimento.</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-indigo-600">1</div>
                            <span className="font-bold text-slate-700 flex-1">Complete seus projetos ativos</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-slate-400">2</div>
                            <span className="font-bold text-slate-400 flex-1">Agende novas reuniões estratégicas</span>
                        </div>
                    </div>
                </div>

                <div className="group bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-4 bg-orange-50 text-orange-600 rounded-3xl">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Alertas & Prazos</h3>
                            <p className="text-slate-400 font-medium text-sm">Fique atento aos compromissos da semana.</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center py-6 opacity-40">
                        <Search size={40} className="text-slate-300 mb-4" />
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Sem alertas pendentes</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
