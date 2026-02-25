import { useState, useEffect } from 'react';
import {
    Code2, Box, Database, GitBranch, Cpu, Layers,
    Plus, Play, Info, CheckCircle2, Layout,
    ChevronRight, ArrowUpRight, Zap, Target
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import MermaidRenderer from '../components/MermaidRenderer';

const MODULE_ARCHITECTURE = {
    auth: {
        title: 'Core & Autenticação',
        flow: 'graph LR\n  A[App] --> B[Supabase Auth]\n  B --> C[Public Profiles]\n  C --> D[RBAC Check]',
        description: 'Gestão de permissões e segurança de sessão.',
        status: 'Estável'
    },
    projects: {
        title: 'Ecossistema de Projetos',
        flow: 'graph TD\n  P[Project] --> T1[Task 1]\n  P --> T2[Task 2]\n  T1 --> S1[Subtask]\n  T2 --> S2[Subtask]',
        description: 'Hierarquia de projetos, tarefas e subtarefas.',
        status: 'Customizando'
    },
    junta: {
        title: 'Junta Médica (Regulação)',
        flow: 'graph TB\n  Req[Requisição] --> An[Análise]\n  An -->|Divergência| D[Desempate]\n  D --> R[Relatório PDF]',
        description: 'Fluxo técnico de regulação assistencial.',
        status: 'Legado'
    }
};

export default function DevCockpit() {
    const [activeTab, setActiveTab] = useState('overview');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [customDiagram, setCustomDiagram] = useState('graph TD\nA[Módulo] --> B[Fluxo]\nB --> C{Decisão}\nC -->|Sim| D[Resultado OK]\nC -->|Não| E[Erro]');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (data) setProjects(data);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 md:p-12 animate-in fade-in duration-1000">
            {/* Dev Header */}
            <header className="mb-12 relative">
                <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -ml-20 -mt-20"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-400/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
                            Architecture Cockpit v1.0
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Schema</span>
                        </div>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500">
                        Cockpit de Desenvolvimento
                    </h1>
                    <p className="text-slate-400 font-medium max-w-2xl text-lg leading-relaxed">
                        Visualização técnica do ecossistema Klini. Mapeie fluxos, monitore diagramas e gerencie o roadmap de arquitetura.
                    </p>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-4 mb-10 bg-white/5 p-2 rounded-[2rem] border border-white/10 w-fit backdrop-blur-xl">
                {[
                    { id: 'overview', icon: <Layers size={18} />, label: 'Arquitetura Geral' },
                    { id: 'projects', icon: <Box size={18} />, label: 'Mapa de Projetos' },
                    { id: 'future', icon: <Cpu size={18} />, label: 'Roadmap Futuro' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </nav>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Visual Section (Diagrams) */}
                <div className="lg:col-span-8 space-y-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {Object.entries(MODULE_ARCHITECTURE).map(([key, mod]) => (
                                <section key={key} className="group bg-white/5 border border-white/10 rounded-[2.5rem] p-10 hover:border-indigo-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                                <Database size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black tracking-tight">{mod.title}</h3>
                                                <p className="text-slate-500 text-sm font-medium">{mod.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-4 py-1.5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-full border border-white/10">
                                                {mod.status}
                                            </span>
                                            <button className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/10">
                                                <Play size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 min-h-[300px] flex items-center justify-center relative overflow-hidden group-hover:bg-black/60 transition-colors">
                                        <MermaidRenderer chart={mod.flow} id={`chart-${key}`} />
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                                <GitBranch className="text-indigo-400" /> Fluxo de Projetos Ativos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projects.map(p => (
                                    <div key={p.id} className="p-8 bg-black/40 border border-white/10 rounded-[2rem] hover:border-indigo-500/40 transition-all group">
                                        <h4 className="font-black text-lg mb-4 flex items-center justify-between">
                                            {p.name}
                                            <ArrowUpRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                        </h4>
                                        <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                                            <MermaidRenderer chart={p.diagram_code || 'graph LR\nA[Task] --> B[Done]'} id={`p-chart-${p.id}`} />
                                        </div>
                                        <button className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-600/20">
                                            Gerenciar Diagrama
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'future' && (
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black tracking-tight">Arquitetura Futura</h3>
                                <button className="flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest">
                                    <Plus size={16} /> Novo Draft
                                </button>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="p-8 bg-black/40 rounded-[2.5rem] border border-indigo-500/20">
                                    <textarea
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-6 font-mono text-xs text-indigo-300 focus:border-indigo-500 outline-none min-h-[150px] mb-6"
                                        value={customDiagram}
                                        onChange={(e) => setCustomDiagram(e.target.value)}
                                        placeholder="Digite o código Mermaid aqui..."
                                    />
                                    <div className="bg-white/5 rounded-3xl p-10">
                                        <MermaidRenderer chart={customDiagram} id="custom-diagram" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Section (Tasks & Meta) */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10 sticky top-32">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 bg-white/10 rounded-2xl text-indigo-400">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-xl tracking-tight">Quick Dev Tasks</h4>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Ações Rápidas</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { title: 'Refatorar RLS Profiles', priority: 'High', status: 'Blocked' },
                                { title: 'Implementar Webhooks', priority: 'Medium', status: 'Pending' },
                                { title: 'Deploy v2.1.0 (Fixes)', priority: 'High', status: 'Done' }
                            ].map((task, idx) => (
                                <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${task.status === 'Done' ? 'bg-emerald-500' : task.status === 'Blocked' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[150px]">{task.title}</p>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{task.priority} Priority</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-700 group-hover:text-white transition-colors" />
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2">
                            <Plus size={18} /> Nova Task de Dev
                        </button>

                        <div className="mt-12 pt-10 border-t border-white/5">
                            <div className="flex items-center gap-3 mb-6">
                                <Info size={16} className="text-indigo-400" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Health</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-600 uppercase mb-1">API Latency</p>
                                    <p className="text-sm font-black text-emerald-400">124ms</p>
                                </div>
                                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Build Status</p>
                                    <p className="text-sm font-black text-indigo-400">Success</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
