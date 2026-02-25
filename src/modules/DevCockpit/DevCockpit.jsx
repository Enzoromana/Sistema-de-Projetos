import { useState, useEffect } from 'react';
import {
    Code2, Box, Database, GitBranch, Cpu, Layers,
    Plus, Play, Info, CheckCircle2, Layout,
    ChevronRight, ArrowUpRight, Zap, Target, Save,
    RefreshCw, Globe, Server, Shield, Smartphone, Activity,
    X, Maximize2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MermaidRenderer from '../../components/MermaidRenderer';

const MODULE_ARCHITECTURE = {
    auth: {
        title: 'Segurança & Identidade',
        stack: ['Supabase Auth', 'JWT', 'PostgreSQL RLS'],
        flow: `graph TD
    subgraph "Camada de Cliente (React)"
        APP[Aplicação Hub]
        HOOK[useSession Hook]
    end
    subgraph "Camada de Middleware (Supabase)"
        AUTH{Auth Service}
        JWT[Token JWT]
    end
    subgraph "Camada de Dados (Postgres)"
        RLS[Row Level Security]
        PROF[Tabela Profiles]
    end
    APP -->|Credenciais| AUTH
    AUTH -->|Assina| JWT
    JWT -->|Valida| RLS
    RLS -->|Filtra| PROF
    HOOK -->|Observa| AUTH`,
        description: 'Gestão robusta de acessos via RBAC e políticas RLS em nível de banco.',
        status: 'Auditado'
    },
    projects: {
        title: 'Ecossistema de Projetos',
        stack: ['React Query', 'Realtime', 'DND API'],
        flow: `graph TD
    subgraph "Interface Dinâmica"
        KB[Kanban Board]
        LIST[Lista Hierárquica]
    end
    subgraph "Estrutura Relacional"
        P[Projeto]
        T[Tarefas]
        S[Subtarefas]
    end
    subgraph "Mecanismo de Visualização"
        MD[Mermaid Engines]
    end
    KB -->|Drag & Drop| T
    P -->|1:N| T
    T -->|1:N| S
    LIST -->|Edição| P
    P -->|Mapeia| MD`,
        description: 'Sincronização em tempo real entre quadros kanban e listas de tarefas com mapeamento visual.',
        status: 'Vibrante'
    },
    junta: {
        title: 'Inteligência de Regulação',
        stack: ['PostgREST', 'jsPDF', 'Functions'],
        flow: `graph TB
    subgraph "Input & Triagem"
        REQ[Requisição Médica]
        AN[Motor de Análise]
    end
    subgraph "Processo Decisório"
        DIV{Divergência?}
        DES[Desempate Técnico]
    end
    subgraph "Output Legal"
        PDF[Relatório PDF Pro]
        AUD[Log de Auditoria]
    end
    REQ --> AN
    AN --> DIV
    DIV -->|Sim| DES
    DES --> PDF
    DIV -->|Não| PDF
    PDF --> AUD`,
        description: 'Fluxo técnico para desempate de condutas médicas com rastreabilidade total.',
        status: 'Crítico'
    },
    infra: {
        title: 'Infraestrutura Cloud',
        stack: ['Vercel High Perf', 'GitHub Actions', 'Edge Network'],
        flow: `graph LR
    subgraph "Developer Flow"
        GIT[GitHub Repo]
        CI[CI/CD Build]
    end
    subgraph "Runtime Environment"
        VR[Vercel Deployment]
        SB[Supabase Backend]
    end
    subgraph "Global Delivery"
        CDN[Edge CDN]
        USER[End User]
    end
    GIT --> CI
    CI --> VR
    VR <--> SB
    VR --> CDN
    CDN -->|Render| USER`,
        description: 'Stack moderna de deploy contínuo com backend as a service altamente escalável.',
        status: 'Estável'
    }
};

export default function DevCockpit() {
    const [activeTab, setActiveTab] = useState('overview');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProject, setEditingProject] = useState(null);
    const [viewingDiagram, setViewingDiagram] = useState(null);
    const [customDiagram, setCustomDiagram] = useState('graph TD\nA[Início] --> B{Processo}\nB -->|OK| C[Sucesso]\nB -->|Erro| D[Falha]');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setProjects(data);
        } catch (err) {
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDiagram = async () => {
        if (!editingProject) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update({ diagram_code: customDiagram })
                .eq('id', editingProject.id);

            if (error) throw error;

            setProjects(projects.map(p => p.id === editingProject.id ? { ...p, diagram_code: customDiagram } : p));
            setEditingProject(null);
        } catch (err) {
            alert('Erro ao salvar diagrama: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 md:p-12 animate-in fade-in duration-1000">
            {/* Modal de Detalhes - Versão Fullscreen */}
            {viewingDiagram && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in duration-300">
                    <div
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl"
                        onClick={() => setViewingDiagram(null)}
                    ></div>
                    <div className="relative bg-slate-900/50 border border-white/10 rounded-[3rem] w-full max-w-7xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl backdrop-blur-md">
                        <div className="flex items-center justify-between p-10 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-500/20 rounded-2xl text-indigo-400 border border-indigo-400/20 shadow-inner">
                                    <Maximize2 size={32} />
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black tracking-tight text-white">{viewingDiagram.title}</h3>
                                    <p className="text-indigo-400/60 font-black text-xs uppercase tracking-[0.3em] mt-1">{viewingDiagram.subtitle}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingDiagram(null)}
                                className="p-5 bg-white/5 hover:bg-white/10 rounded-3xl text-slate-400 hover:text-white transition-all ring-1 ring-white/10 shadow-xl"
                            >
                                <X size={28} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-12 bg-black/40 flex items-center justify-center custom-scrollbar">
                            <div className="w-full min-h-[500px]">
                                <MermaidRenderer chart={viewingDiagram.flow} id="modal-diagram-full" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dev Header */}
            <header className="mb-12 relative">
                <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -ml-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-400/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
                                Engineering Cockpit v2.1
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Infra Ativa</span>
                            </div>
                        </div>
                        <h1 className="text-6xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-400">
                            Central de Arquitetura
                        </h1>
                        <p className="text-slate-400 font-medium max-w-2xl text-lg leading-relaxed border-l-2 border-indigo-500/30 pl-6">
                            Mapeamento detalhado do ecossistema técnico.
                            Gerencie fluxos, infraestrutura e documentação visual em tempo real.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Stack Status</p>
                                <div className="flex gap-2">
                                    <Globe size={14} className="text-blue-400" />
                                    <Server size={14} className="text-indigo-400" />
                                    <Shield size={14} className="text-emerald-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-4 mb-10 bg-white/5 p-2 rounded-[2rem] border border-white/10 w-fit backdrop-blur-xl">
                {[
                    { id: 'overview', icon: <Layers size={18} />, label: 'Ecossistema Cloud' },
                    { id: 'projects', icon: <Box size={18} />, label: 'Fluxos de Projetos' },
                    { id: 'future', icon: <Cpu size={18} />, label: 'Dev Editor' }
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
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform shadow-inner">
                                                <Database size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black tracking-tight">{mod.title}</h3>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {mod.stack.map(s => (
                                                        <span key={s} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setViewingDiagram({
                                                    title: mod.title,
                                                    subtitle: 'Arquitetura de Módulo',
                                                    flow: mod.flow
                                                })}
                                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-600/20 transition-all shadow-lg active:scale-95"
                                            >
                                                <Maximize2 size={16} /> Ver Fullscreen
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 rounded-[2.5rem] border border-white/5 min-h-[450px] flex items-center justify-center relative overflow-hidden group-hover:bg-black/60 transition-colors p-10">
                                        <div className="absolute top-6 left-6 flex items-center gap-2 opacity-50">
                                            <Zap size={14} className="text-indigo-400" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Flow Architecture</span>
                                        </div>
                                        <MermaidRenderer chart={mod.flow} id={`chart-${key}`} />
                                    </div>
                                    <p className="mt-8 text-slate-500 text-sm font-medium leading-relaxed max-w-2xl border-l-2 border-slate-800 pl-6">
                                        {mod.description}
                                    </p>
                                </section>
                            ))}
                        </div>
                    )}

                    {activeTab === 'projects' && (loading ? (
                        <div className="flex items-center justify-center h-64 bg-white/5 border border-white/10 rounded-[3rem]">
                            <RefreshCw className="animate-spin text-indigo-500" size={48} />
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                            <h3 className="text-3xl font-black mb-10 flex items-center gap-6">
                                <GitBranch className="text-indigo-400" size={36} />
                                <span className="flex-1">Mapa de Fluxos Operacionais</span>
                                <span className="bg-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-black tracking-widest border border-indigo-500/20">
                                    {projects.length} PROJETOS
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {projects.map(p => (
                                    <div key={p.id} className="p-8 bg-black/40 border border-white/10 rounded-[2.5rem] hover:border-indigo-500/40 transition-all group flex flex-col">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="flex-1">
                                                <h4 className="font-black text-2xl mb-1 text-white group-hover:text-indigo-400 transition-colors">{p.name}</h4>
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ID: {String(p.id).substring(0, 8)}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setViewingDiagram({
                                                        title: p.name,
                                                        subtitle: 'Mapa Mental de Operação',
                                                        flow: p.diagram_code || 'graph LR\nA[Projeto] --> B[Início]'
                                                    })}
                                                    className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all ring-1 ring-white/10 shadow-lg"
                                                    title="Ver em detalhes"
                                                >
                                                    <Maximize2 size={20} />
                                                </button>
                                                <div className="p-4 bg-white/5 rounded-2xl text-slate-500 group-hover:text-indigo-400 transition-colors shadow-lg">
                                                    <ArrowUpRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-900/80 rounded-3xl p-8 mb-8 flex-1 min-h-[250px] flex items-center justify-center border border-white/5 shadow-inner">
                                            <MermaidRenderer chart={p.diagram_code || 'graph LR\nA[Projeto] --> B[Inificado]'} id={`p-chart-${p.id}`} />
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingProject(p);
                                                setCustomDiagram(p.diagram_code || 'graph TD\nA[Início] --> B[Fim]');
                                                setActiveTab('future');
                                            }}
                                            className="w-full py-5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-600/20 shadow-xl shadow-indigo-600/5 active:scale-95"
                                        >
                                            Editar Arquitetura Viva
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {activeTab === 'future' && (
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 space-y-10 animate-in slide-in-from-bottom duration-500">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                        <Cpu size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight text-white mb-1">Editor de Fluxos</h3>
                                        <p className="text-indigo-400/60 text-xs font-black uppercase tracking-widest">
                                            {editingProject ? `Syncing: ${editingProject.name}` : 'Sandbox Técnica'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    {editingProject && (
                                        <button
                                            onClick={() => setEditingProject(null)}
                                            className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/5"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSaveDiagram}
                                        disabled={!editingProject || saving}
                                        className="flex items-center gap-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white px-10 py-5 rounded-3xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20 transition-all active:scale-95"
                                    >
                                        {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                        {editingProject ? 'Sincronizar no Banco' : 'Visualizar Draft'}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="group relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                        <div className="relative p-1.5 bg-slate-900 border border-white/10 rounded-3xl">
                                            <textarea
                                                className="w-full bg-slate-950 border-none rounded-2xl p-8 font-mono text-sm text-indigo-300 focus:ring-0 outline-none min-h-[500px] scrollbar-hide shadow-inner"
                                                value={customDiagram}
                                                onChange={(e) => setCustomDiagram(e.target.value)}
                                                placeholder="Digite o código Mermaid..."
                                            />
                                        </div>
                                    </div>
                                    <div className="p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 backdrop-blur-sm">
                                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-3">
                                            <Info size={16} /> Arquitetura Mermaid Core
                                        </h5>
                                        <code className="text-[11px] text-slate-500 font-mono block leading-relaxed">
                                            {'graph TD\n  A[Frontend] --> B{API}\n  B -->|OK| C[(Postgres)]\n  B -->|NOK| D[Error]'}
                                        </code>
                                    </div>
                                </div>
                                <div className="bg-black/40 rounded-[3rem] p-12 border border-white/10 flex items-center justify-center overflow-auto shadow-2xl relative min-h-[500px]">
                                    <div className="absolute top-6 left-6 text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={12} className="text-emerald-500" /> Preview em Tempo Real
                                    </div>
                                    <div className="scale-110">
                                        <MermaidRenderer chart={customDiagram} id="live-editor-preview" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Section (Tasks & Meta) */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/80 backdrop-blur-3xl rounded-[3rem] p-12 border border-white/10 sticky top-32 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="flex items-center gap-6 mb-12 relative z-10">
                            <div className="p-5 bg-indigo-500/10 rounded-3xl text-indigo-400 border border-indigo-500/20 shadow-inner">
                                <Zap size={32} />
                            </div>
                            <div>
                                <h4 className="font-black text-2xl tracking-tight text-white">Active Roadmap</h4>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Sincronização de Meta</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {[
                                { title: 'DND API Integration', priority: 'Critical', status: 'Blocked', color: 'bg-red-500' },
                                { title: 'Mermaid live editor', priority: 'High', status: 'In Dev', color: 'bg-indigo-500' },
                                { title: 'PostgREST Cache Pro', priority: 'Medium', status: 'Pending', color: 'bg-amber-500' },
                                { title: 'RLS Audit Triggers', priority: 'Critical', status: 'Done', color: 'bg-emerald-500' }
                            ].map((task, idx) => (
                                <div key={idx} className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer shadow-lg active:scale-95">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-3 h-3 rounded-full ${task.color} shadow-[0_0_12px_rgba(0,0,0,0.5)]`}></div>
                                        <div>
                                            <p className="font-bold text-slate-200 group-hover:text-white transition-colors text-sm">{task.title}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{task.priority}</span>
                                                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                                <span className="text-[9px] font-bold text-indigo-400/60 uppercase">{task.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={20} className="text-slate-700 group-hover:text-indigo-400 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-12 bg-white text-slate-900 font-black py-6 rounded-3xl text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-indigo-400 hover:text-white shadow-2xl shadow-indigo-400/20 flex items-center justify-center gap-4 active:scale-95">
                            <Plus size={22} /> Nova Meta de Engenharia
                        </button>

                        <div className="mt-16 pt-12 border-t border-white/10 relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                    <Activity size={16} className="text-indigo-400" /> Server Performance
                                </span>
                                <span className="text-[10px] font-black text-emerald-500 tracking-[0.2em] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">99.9% UP</span>
                            </div>
                            <div className="space-y-5">
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 w-[88%] rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                    <span>Cloud Capacity</span>
                                    <span className="text-indigo-400">10.4GB / 12GB</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
