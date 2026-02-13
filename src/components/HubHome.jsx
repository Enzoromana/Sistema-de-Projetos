import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Calendar, Users, Settings, Bell, Search,
    ArrowRight, CheckCircle2, AlertCircle, Clock, TrendingUp, Activity, Presentation
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function HubHome({ setActiveModule, userProfile }) {
    const modules = [
        {
            id: 'projects',
            title: 'Gestão de Projetos',
            description: 'Controle de tarefas, prazos e equipe em tempo real.',
            icon: <LayoutDashboard size={32} />,
            color: 'bg-teal-500',
            permission: userProfile?.access_projects
        },
        {
            id: 'rooms',
            title: 'Sala de Reunião',
            description: 'Agendamento de salas de reunião e gestão de espaços.',
            icon: <Calendar size={32} />,
            color: 'bg-indigo-500',
            permission: userProfile?.access_rooms
        },
        {
            id: 'audit',
            title: 'Auditoria & Acessos',
            description: 'Gestão de permissões, aprovações e controle de usuários.',
            icon: <Users size={32} />,
            color: 'bg-blue-500',
            permission: userProfile?.access_audit || userProfile?.role === 'admin'
        },
        {
            id: 'medical',
            title: 'Junta Médica',
            description: 'Módulo técnico para regulação e análise de divergências.',
            icon: <Activity size={32} />,
            color: 'bg-[#1D7874]',
            permission: userProfile?.access_medical || userProfile?.role === 'admin'
        },
        {
            id: 'sheet-to-slide',
            title: 'Conversor de Propostas Comerciais',
            description: 'Converta planilhas Excel em apresentações de slides profissionais.',
            icon: <Presentation size={32} />,
            color: 'bg-orange-500',
            permission: userProfile?.access_sheet_to_slide || userProfile?.role === 'admin'
        },
        {
            id: 'settings',
            title: 'Configurações',
            description: 'Ajustes do sistema e customização da plataforma.',
            icon: <Settings size={32} />,
            color: 'bg-slate-500',
            permission: true,
            disabled: true
        }
    ].filter(m => m.permission || m.disabled);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Cleaner Welcome Header */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 max-w-3xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-200">
                            Ambiente Corporativo Klini
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                        Olá, <span className="text-indigo-300">{userProfile?.full_name?.split(' ')[0] || 'Colaborador'}</span>. 👋
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed font-medium">
                        Seja bem-vindo ao Hub Manager. Utilize o menu abaixo para acessar os módulos liberados para o seu perfil.
                    </p>
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
