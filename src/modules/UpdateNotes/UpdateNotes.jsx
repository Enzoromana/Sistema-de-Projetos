import { useState } from 'react';
import {
    Bell, Rocket, Sparkles, Bug, Zap, ArrowLeft,
    Smartphone, LayoutDashboard, Calendar, ShieldCheck, Activity,
    Presentation, BookOpen, Code2, Users, Lock, Globe,
    FileText, Database, CheckCircle2, ChevronDown, ChevronUp, Paperclip
} from 'lucide-react';

const CHANGELOG = [
    {
        version: '2.3.0',
        date: '07 Mar 2026',
        title: 'Refinamento Premium & Gestão de Junta',
        highlight: true,
        badge: 'ATUALIZAÇÃO',
        badgeColor: 'bg-[#259591]',
        entries: [
            {
                type: 'feature',
                items: [
                    { text: 'Novos Seletores Customizados para Status e Especialidade (Dashboard)', icon: <LayoutDashboard size={16} /> },
                    { text: 'Numerador dinâmico de pendências no botão de Conclusão do Parecer', icon: <Sparkles size={16} /> },
                    { text: 'Controle Administrativo de Reedição para médicos desempatadores', icon: <Lock size={16} /> },
                ]
            },
            {
                type: 'improvement',
                items: [
                    { text: 'Padronização de Nomenclatura: "Profissional Assistente" e "Conselho/UF"', icon: <Users size={16} /> },
                    { text: 'Campos de justificativa expandidos (textarea) para maior clareza técnica', icon: <FileText size={16} /> },
                    { text: 'Visualização de "Anexos Gerais" integrada ao Modal de Status', icon: <Paperclip size={16} /> },
                ]
            },
            {
                type: 'fix',
                items: [
                    { text: 'Correção de quebra de linha e truncamento no nome do médico (PDF Final)', icon: <CheckCircle2 size={16} /> },
                    { text: 'Ajuste de alinhamento vertical nos campos Nome/CRM do cabeçalho', icon: <Activity size={16} /> },
                ]
            }
        ]
    },
    {
        version: '2.2.0',
        date: '06 Mar 2026',
        title: 'Desempate Externo & Otimizações Gerais',
        highlight: false,
        badge: 'ATUALIZAÇÃO',
        badgeColor: 'bg-emerald-600',
        entries: [
            {
                type: 'feature',
                items: [
                    { text: 'Fluxo de Desempate Externo na Junta Médica com links independentes', icon: <Activity size={16} /> },
                    { text: 'Gerenciamento visual da visibilidade de módulos liberados no Dev Cockpit', icon: <ShieldCheck size={16} /> },
                    { text: 'Arquivamento lógico de processos de teste (Junta Médica)', icon: <Database size={16} /> },
                ]
            },
            {
                type: 'improvement',
                items: [
                    { text: 'Transição automática de "Terceira Opinião" para "Desempate" após rascunho', icon: <ArrowLeft size={16} /> },
                    { text: 'Refinamento avançado de UI no Pipeline (estilo de cards e filtro por corretor)', icon: <LayoutDashboard size={16} /> },
                    { text: 'Atualização completa da Base de Dados do Guia Médico (Março)', icon: <BookOpen size={16} /> },
                ]
            },
            {
                type: 'fix',
                items: [
                    { text: 'Salvamento persistente de permissões e cargos no Módulo de Auditoria (RLS)', icon: <Lock size={16} /> },
                    { text: 'Correção de visibilidade do botão de salvar RLS no Dev Cockpit', icon: <Bug size={16} /> },
                    { text: 'Prevenção contra a geração de senhas em branco em resets temporários', icon: <CheckCircle2 size={16} /> },
                ]
            }
        ]
    },
    {
        version: '2.1.0',
        date: '27 Fev 2026',
        title: 'Adaptação Mobile Completa',
        highlight: false,
        badge: 'NOVO',
        badgeColor: 'bg-purple-600',
        entries: [
            {
                type: 'feature',
                items: [
                    { text: 'Menu hamburger com navegação slide-down para mobile', icon: <Smartphone size={16} /> },
                    { text: 'Interface responsiva em todos os módulos principais', icon: <Smartphone size={16} /> },
                    { text: 'Login e Signup otimizados para telas pequenas', icon: <Lock size={16} /> },
                    { text: 'Módulo de Notas de Atualização com histórico completo', icon: <Bell size={16} /> },
                    { text: 'Popup de novidades para anúncios de versão', icon: <Sparkles size={16} /> },
                ]
            },
            {
                type: 'improvement',
                items: [
                    { text: 'Layout 95vw no mobile para melhor aproveitamento de tela', icon: <Smartphone size={16} /> },
                    { text: 'Padding e espaçamento adaptáveis por breakpoint', icon: <Zap size={16} /> },
                    { text: 'WeekView e MonthView com scroll horizontal na Sala de Reunião', icon: <Calendar size={16} /> },
                    { text: 'Botões de permissão no Auditoria com tamanho responsivo', icon: <ShieldCheck size={16} /> },
                    { text: 'Stats do Projetos em grid 2 colunas no mobile', icon: <LayoutDashboard size={16} /> },
                ]
            },
        ]
    },
    {
        version: '2.0.0',
        date: '24 Fev 2026',
        title: 'Cockpit de Arquitetura',
        badge: 'MÓDULO',
        badgeColor: 'bg-slate-800',
        entries: [
            {
                type: 'module',
                items: [
                    { text: 'Cockpit de Arquitetura com diagramas Mermaid interativos', icon: <Code2 size={16} /> },
                    { text: 'Visualização de fluxos de infraestrutura e projetos', icon: <Code2 size={16} /> },
                    { text: 'Modal fullscreen para visualização detalhada de diagramas', icon: <Code2 size={16} /> },
                ]
            },
        ]
    },
    {
        version: '1.9.0',
        date: '25 Fev 2026',
        title: 'Guia Médico — Módulo Completo',
        badge: 'MÓDULO',
        badgeColor: 'bg-teal-600',
        entries: [
            {
                type: 'module',
                items: [
                    { text: 'Módulo Guia Médico para geração de guias em PDF', icon: <BookOpen size={16} /> },
                    { text: 'Análise comparativa de rede credenciada', icon: <BookOpen size={16} /> },
                    { text: 'Modais acoplados com navegação por abas', icon: <BookOpen size={16} /> },
                ]
            },
            {
                type: 'fix',
                items: [
                    { text: 'Correção de contagem de municípios nos produtos', icon: <Database size={16} /> },
                    { text: 'Limpeza de conflitos Git no produtos.json', icon: <FileText size={16} /> },
                ]
            }
        ]
    },
    {
        version: '1.8.0',
        date: '23 Fev 2026',
        title: 'Conversor Comercial (Sheet to Slide)',
        badge: 'MÓDULO',
        badgeColor: 'bg-orange-500',
        entries: [
            {
                type: 'module',
                items: [
                    { text: 'Módulo Conversor Comercial para transformar planilhas em apresentações', icon: <Presentation size={16} /> },
                    { text: 'Upload de arquivos Excel com pré-visualização', icon: <Presentation size={16} /> },
                    { text: 'Geração automática de slides profissionais', icon: <Presentation size={16} /> },
                ]
            },
        ]
    },
    {
        version: '1.7.0',
        date: '20 Fev 2026',
        title: 'Junta Médica — Módulo Completo',
        badge: 'MÓDULO',
        badgeColor: 'bg-[#1D7874]',
        entries: [
            {
                type: 'module',
                items: [
                    { text: 'Módulo completo de Junta Médica para regulação técnica', icon: <Activity size={16} /> },
                    { text: 'Sistema de pareceres e desempate com formulário externo', icon: <Activity size={16} /> },
                    { text: 'Dashboard com análise de divergências em tempo real', icon: <Activity size={16} /> },
                ]
            },
        ]
    },
    {
        version: '1.5.0',
        date: '15 Fev 2026',
        title: 'Auditoria de Usuários',
        badge: 'MÓDULO',
        badgeColor: 'bg-blue-600',
        entries: [
            {
                type: 'module',
                items: [
                    { text: 'Módulo de Auditoria com controle granular de permissões', icon: <ShieldCheck size={16} /> },
                    { text: 'Log de alterações com diff visual (antes vs depois)', icon: <Database size={16} /> },
                    { text: 'Filtros por colaborador, ação, tabela e data', icon: <Users size={16} /> },
                    { text: 'Aprovação e reset de senha de usuários', icon: <Lock size={16} /> },
                ]
            },
        ]
    },
    {
        version: '1.3.0',
        date: '10 Fev 2026',
        title: 'Sala de Reunião',
        badge: 'MÓDULO',
        badgeColor: 'bg-indigo-500',
        entries: [
            {
                type: 'module',
                items: [
                    { text: 'Módulo de reserva de salas com views Dia, Semana e Mês', icon: <Calendar size={16} /> },
                    { text: 'Agendamento visual com arrastar em slots de horário', icon: <Calendar size={16} /> },
                    { text: 'Controle de conflitos e disponibilidade em tempo real', icon: <Calendar size={16} /> },
                ]
            },
        ]
    },
    {
        version: '1.0.0',
        date: '01 Fev 2026',
        title: 'Hub Manager — Lançamento',
        badge: 'LANÇAMENTO',
        badgeColor: 'bg-indigo-600',
        entries: [
            {
                type: 'module',
                items: [
                    { text: 'Hub Manager Klini — plataforma corporativa central', icon: <LayoutDashboard size={16} /> },
                    { text: 'Sistema de autenticação com Supabase (Login/Signup)', icon: <Lock size={16} /> },
                    { text: 'Gestão de Projetos com visualização Lista e Kanban', icon: <LayoutDashboard size={16} /> },
                    { text: 'Dashboard HubHome com cards de módulos', icon: <LayoutDashboard size={16} /> },
                    { text: 'Timeout de sessão de 4 horas por segurança', icon: <ShieldCheck size={16} /> },
                ]
            },
            {
                type: 'fix',
                items: [
                    { text: 'CORS configurado para hub-manager.klinisaude.com.br', icon: <Globe size={16} /> },
                    { text: 'Correção de conexão Supabase com fallback e mensagens', icon: <Database size={16} /> },
                ]
            }
        ]
    },
];

const TYPE_CONFIG = {
    module: { label: 'Novos Módulos', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <Rocket size={14} /> },
    feature: { label: 'Funcionalidades', color: 'text-purple-600', bg: 'bg-purple-50', icon: <Sparkles size={14} /> },
    improvement: { label: 'Melhorias', color: 'text-teal-600', bg: 'bg-teal-50', icon: <Zap size={14} /> },
    fix: { label: 'Correções', color: 'text-orange-600', bg: 'bg-orange-50', icon: <Bug size={14} /> },
};

export default function UpdateNotes() {
    const [expandedVersions, setExpandedVersions] = useState(
        CHANGELOG.reduce((acc, c, i) => ({ ...acc, [c.version]: i < 3 }), {})
    );
    const [filter, setFilter] = useState('all');

    const toggleVersion = (version) => {
        setExpandedVersions(prev => ({ ...prev, [version]: !prev[version] }));
    };

    const stats = {
        modules: CHANGELOG.reduce((sum, c) => sum + c.entries.filter(e => e.type === 'module').reduce((s, e) => s + e.items.length, 0), 0),
        features: CHANGELOG.reduce((sum, c) => sum + c.entries.filter(e => e.type === 'feature').reduce((s, e) => s + e.items.length, 0), 0),
        improvements: CHANGELOG.reduce((sum, c) => sum + c.entries.filter(e => e.type === 'improvement').reduce((s, e) => s + e.items.length, 0), 0),
        fixes: CHANGELOG.reduce((sum, c) => sum + c.entries.filter(e => e.type === 'fix').reduce((s, e) => s + e.items.length, 0), 0),
    };

    const filteredChangelog = filter === 'all'
        ? CHANGELOG
        : CHANGELOG.map(c => ({
            ...c,
            entries: c.entries.filter(e => e.type === filter)
        })).filter(c => c.entries.length > 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-14 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-10 -mb-10 blur-3xl"></div>
                <div className="relative z-10 max-w-3xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                            <Bell size={28} />
                        </div>
                        <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                            v{CHANGELOG[0].version} • Última atualização
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                        Notas de <span className="text-indigo-300">Atualização</span>
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
                        Histórico completo de versões, módulos, funcionalidades e melhorias do Hub Manager Klini.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Módulos', value: stats.modules, color: 'text-indigo-600', bg: 'bg-indigo-50', borderColor: 'border-indigo-100' },
                    { label: 'Funcionalidades', value: stats.features, color: 'text-purple-600', bg: 'bg-purple-50', borderColor: 'border-purple-100' },
                    { label: 'Melhorias', value: stats.improvements, color: 'text-teal-600', bg: 'bg-teal-50', borderColor: 'border-teal-100' },
                    { label: 'Correções', value: stats.fixes, color: 'text-orange-600', bg: 'bg-orange-50', borderColor: 'border-orange-100' },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} p-5 md:p-6 rounded-2xl md:rounded-[1.5rem] border ${stat.borderColor} shadow-sm`}>
                        <div className={`text-2xl md:text-3xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                {[
                    { id: 'all', label: 'Tudo' },
                    { id: 'module', label: 'Módulos' },
                    { id: 'feature', label: 'Funcionalidades' },
                    { id: 'improvement', label: 'Melhorias' },
                    { id: 'fix', label: 'Correções' },
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 md:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="space-y-6">
                {filteredChangelog.map((release) => (
                    <div key={release.version} className={`bg-white rounded-[1.5rem] md:rounded-[2rem] border shadow-sm overflow-hidden transition-all duration-300 ${release.highlight ? 'border-indigo-200 shadow-lg shadow-indigo-50' : 'border-slate-100'}`}>
                        {/* Version header */}
                        <button
                            onClick={() => toggleVersion(release.version)}
                            className="w-full px-6 md:px-10 py-5 md:py-7 flex items-center justify-between hover:bg-slate-50/50 transition-all"
                        >
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${release.badgeColor} text-white flex items-center justify-center font-black text-xs md:text-sm shadow-lg`}>
                                        v{release.version.split('.')[0]}.{release.version.split('.')[1]}
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                        <h3 className="text-base md:text-lg font-black text-slate-800">{release.title}</h3>
                                        {release.highlight && (
                                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] font-black rounded-md uppercase tracking-widest">Mais Recente</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{release.date} • {release.badge}</p>
                                </div>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-50 text-slate-400 shrink-0">
                                {expandedVersions[release.version] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </button>

                        {/* Version content */}
                        {expandedVersions[release.version] && (
                            <div className="px-6 md:px-10 pb-6 md:pb-8 space-y-5 border-t border-slate-50 pt-5 animate-in slide-in-from-top duration-300">
                                {release.entries.map((entry, eIdx) => {
                                    const config = TYPE_CONFIG[entry.type];
                                    return (
                                        <div key={eIdx}>
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg} ${config.color} text-[10px] font-black uppercase tracking-widest mb-3`}>
                                                {config.icon} {config.label}
                                            </div>
                                            <div className="space-y-2 ml-1">
                                                {entry.items.map((item, iIdx) => (
                                                    <div key={iIdx} className="flex items-start gap-3 py-2">
                                                        <div className={`p-1.5 rounded-lg ${config.bg} ${config.color} shrink-0 mt-0.5`}>
                                                            {item.icon}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-600 leading-relaxed">{item.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="text-center py-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-100 rounded-2xl">
                    <Rocket size={16} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Hub Manager Klini • Desde Fev 2026</span>
                </div>
            </div>
        </div>
    );
}
