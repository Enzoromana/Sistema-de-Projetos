import { LayoutDashboard, Calendar, Users, Settings, Bell, Search, ArrowRight } from 'lucide-react';

export default function HubHome({ setActiveModule }) {
    const modules = [
        {
            id: 'projects',
            title: 'Gestão de Projetos',
            description: 'Controle de tarefas, prazos e equipe em tempo real.',
            icon: <LayoutDashboard size={32} />,
            color: 'bg-teal-500',
            stats: '12 Ativos'
        },
        {
            id: 'rooms',
            title: 'Controle de Salas',
            description: 'Agendamento de salas de reunião e gestão de espaços.',
            icon: <Calendar size={32} />,
            color: 'bg-indigo-500',
            stats: '4 Reuniões hoje'
        },
        {
            id: 'users',
            title: 'Colaboradores',
            description: 'Gestão de acessos, permissões e setores da Klini.',
            icon: <Users size={32} />,
            color: 'bg-blue-500',
            stats: '24 Ativos',
            disabled: true
        },
        {
            id: 'settings',
            title: 'Configurações',
            description: 'Ajustes do sistema e customização da plataforma.',
            icon: <Settings size={32} />,
            color: 'bg-slate-500',
            stats: 'v1.0.2',
            disabled: true
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-10 -mb-10 blur-3xl"></div>

                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        Bem-vindo ao <span className="text-indigo-300">Hub Manager.</span>
                    </h1>
                    <p className="text-lg text-indigo-100/80 mb-8 leading-relaxed">
                        A plataforma centralizada de gestão da Klini. Gerencie seus projetos, agende espaços e otimize o fluxo de trabalho da sua equipe.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium border border-white/10">
                            <Bell size={16} className="text-indigo-300" />
                            3 Novas notificações
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map((mod) => (
                    <div
                        key={mod.id}
                        onClick={() => !mod.disabled && setActiveModule(mod.id)}
                        className={`group p-6 rounded-[2rem] border border-slate-100 transition-all duration-300 relative overflow-hidden ${mod.disabled ? 'bg-slate-50 opacity-75 cursor-not-allowed' : 'bg-white hover:shadow-2xl hover:-translate-y-2 cursor-pointer shadow-xl shadow-slate-200/50'}`}
                    >
                        <div className={`w-14 h-14 rounded-2xl ${mod.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-${mod.color.split('-')[1]}-200 group-hover:scale-110 transition-transform`}>
                            {mod.icon}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{mod.title}</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            {mod.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                {mod.stats}
                            </span>
                            {!mod.disabled && (
                                <div className="p-2 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <ArrowRight size={18} />
                                </div>
                            )}
                        </div>

                        {mod.disabled && (
                            <div className="absolute top-4 right-4">
                                <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 border border-slate-200 rounded-md">EM BREVE</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick Actions / Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Search size={20} className="text-indigo-600" />
                        Atalhos Rápidos
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {['Criar Projeto', 'Agendar Sala', 'Minhas Tarefas', 'Equipe', 'Relatórios', 'Perfil'].map((action) => (
                            <button key={action} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all text-center">
                                {action}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Bell size={20} className="text-indigo-600" />
                        Atividades
                    </h3>
                    <div className="space-y-6">
                        {[
                            { text: 'Novo projeto criado', time: '10 min atrás' },
                            { text: 'Sala de reunião ocupada', time: '1h atrás' },
                            { text: 'Tarefa concluída por Enzo', time: '2h atrás' }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{item.text}</p>
                                    <p className="text-xs text-slate-400">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
