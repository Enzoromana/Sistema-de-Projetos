import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users, ShieldCheck, ShieldAlert, CheckCircle2,
    XCircle, Lock, Eye,
    LayoutDashboard, Calendar, Search, User, Activity, Key, Briefcase, Presentation,
    BookOpen, FileText, Network, BarChart3,
    History, Filter, Database, ArrowRight, Clock, Trash2, Edit3, Plus, ChevronRight, X
} from 'lucide-react';

function LogDetailModal({ log, onClose }) {
    if (!log) return null;

    const renderDiff = () => {
        const oldData = log.old_data || {};
        const newData = log.new_data || {};
        const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div>Campo</div>
                    <div>Antes</div>
                    <div>Depois</div>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-auto pr-2 custom-scrollbar">
                    {allKeys.map(key => {
                        const isChanged = JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]);
                        if (!isChanged && log.action === 'UPDATE') return null;

                        return (
                            <div key={key} className={`grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3 px-4 rounded-xl border ${isChanged ? 'bg-indigo-50/30 border-indigo-100/50' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="font-mono text-[11px] font-bold text-slate-500 break-all">{key}</div>
                                <div className="font-mono text-[11px] text-red-500 break-all bg-red-50/50 p-2 rounded-lg">
                                    {oldData[key] !== undefined ? (typeof oldData[key] === 'object' ? JSON.stringify(oldData[key]) : String(oldData[key])) : '-'}
                                </div>
                                <div className="font-mono text-[11px] text-teal-600 break-all bg-teal-50/50 p-2 rounded-lg font-bold">
                                    {newData[key] !== undefined ? (typeof newData[key] === 'object' ? JSON.stringify(newData[key]) : String(newData[key])) : '-'}
                                </div>
                            </div>
                        );
                    })}
                    {allKeys.length === 0 && (
                        <div className="py-10 text-center text-slate-400 text-xs font-medium">
                            Nenhum detalhe de campo disponível.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] w-full max-w-5xl shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in duration-500 overflow-hidden max-h-[90vh]">
                <div className="p-4 md:p-8 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <Database size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight">Rastreabilidade de Alteração</h3>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                                Registro: {log.record_id} • Tabela: <span className="text-indigo-400 font-black">{log.table_name}</span> • Ação: {log.action}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 p-8 bg-white">
                    {renderDiff()}
                </div>

                <div className="p-8 bg-slate-50 flex justify-end gap-4 border-t border-slate-100">
                    <p className="mr-auto self-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Executado em: {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                    <button
                        onClick={onClose}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function UserAudit() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    // Traceability State
    const [activeTab, setActiveTab] = useState('users'); // users | logs
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [logFilters, setLogFilters] = useState({
        user_id: '',
        action: '',
        table_name: '',
        date: ''
    });

    useEffect(() => {
        loadProfiles();
    }, []);

    useEffect(() => {
        if (activeTab === 'logs') {
            loadAuditLogs();
        }
    }, [activeTab, logFilters]);

    const loadProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setProfiles(data);
        setLoading(false);
    };

    const loadAuditLogs = async () => {
        setLogsLoading(true);
        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (logFilters.action) query = query.eq('action', logFilters.action);
        if (logFilters.table_name) query = query.eq('table_name', logFilters.table_name);
        if (logFilters.user_id) query = query.eq('user_id', logFilters.user_id);
        if (logFilters.date) {
            query = query.gte('created_at', `${logFilters.date}T00:00:00Z`)
                .lte('created_at', `${logFilters.date}T23:59:59Z`);
        }

        const { data, error } = await query;
        if (error) {
            console.error(error);
        } else {
            // Em vez de depender do join PostgREST no banco (que causa o PGRST200),
            // juntamos com a lista de profiles que já carregamos na memória do JS:
            const enrichedLogs = data.map(log => {
                const profileMatch = profiles.find(p => p.id === log.user_id);
                return {
                    ...log,
                    profiles: profileMatch || { full_name: 'Sistema/Desconhecido', email: '-' }
                };
            });
            setLogs(enrichedLogs);
        }
        setLogsLoading(false);
    };

    const togglePermission = async (profileId, field, currentValue) => {
        let newValue;
        if (field === 'role') {
            newValue = currentValue === 'admin' ? 'user' : 'admin';
        } else {
            newValue = !currentValue;
        }

        // Atualização otimista imediata na UI
        setProfiles(prev => prev.map(p =>
            p.id === profileId ? { ...p, [field]: newValue } : p
        ));

        const { data, error } = await supabase
            .from('profiles')
            .update({ [field]: newValue })
            .eq('id', profileId)
            .select();

        if (error) {
            // Reverte a atualização otimista
            setProfiles(prev => prev.map(p =>
                p.id === profileId ? { ...p, [field]: currentValue } : p
            ));
            alert('Erro ao salvar permissão: ' + error.message);
            return;
        }

        // Se nenhuma linha foi afetada, o RLS bloqueou a operação
        if (!data || data.length === 0) {
            // Reverte a atualização otimista
            setProfiles(prev => prev.map(p =>
                p.id === profileId ? { ...p, [field]: currentValue } : p
            ));
            alert('Permissão negada: Somente administradores podem alterar permissões de outros usuários. Verifique se seu perfil possui role "admin" no banco de dados.');
            return;
        }
    };

    const approveUser = async (profileId) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_approved: true })
            .eq('id', profileId);

        if (error) alert(error.message);
        else {
            setProfiles(profiles.map(p =>
                p.id === profileId ? { ...p, is_approved: true } : p
            ));
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.setor?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in slide-in-from-right duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Painel de Auditoria</h2>
                        <p className="text-slate-400 font-medium">Controle de acessos e rastreabilidade total de ações.</p>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Users size={16} /> Usuários
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <History size={16} /> Rastreabilidade
                    </button>
                </div>
            </div>

            {activeTab === 'users' ? (
                <>
                    {/* Search & Statistics */}
                    <div className="flex flex-col md:flex-row gap-6 mt-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-600 shadow-sm"
                                placeholder="Buscar colaborador por nome, e-mail ou setor..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                        </div>
                        <div className="bg-white px-8 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{filteredProfiles.length} COLABORADORES</span>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="overflow-x-auto pb-4">
                            <table className="w-[1200px] xl:w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Módulos Ativos</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredProfiles.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 text-lg uppercase">
                                                        {(p.full_name || p.email).charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{p.full_name || 'Usuário em Configuração'}</p>
                                                        <p className="text-xs text-slate-400 font-medium">{p.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-600 font-bold bg-slate-50 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest w-fit border border-slate-100">
                                                    <Briefcase size={14} className="text-indigo-600" />
                                                    {p.setor || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {p.is_approved ? (
                                                    <span className="flex items-center gap-2 text-teal-600 bg-teal-50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-teal-100">
                                                        <CheckCircle2 size={14} /> Ativo
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-orange-100">
                                                        <ShieldAlert size={14} /> Pendente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6 min-w-[420px]">
                                                <div className="flex items-center justify-start gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => togglePermission(p.id, 'role', p.role)}
                                                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${p.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                                                        title={p.role === 'admin' ? 'Admin' : 'Tornar Admin'}
                                                    >
                                                        <ShieldCheck size={16} />
                                                    </button>
                                                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                                    <button
                                                        onClick={() => togglePermission(p.id, 'access_projects', p.access_projects)}
                                                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${p.access_projects ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                                                        title="Projetos"
                                                    >
                                                        <LayoutDashboard size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => togglePermission(p.id, 'access_rooms', p.access_rooms)}
                                                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${p.access_rooms ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                                                        title="Salas"
                                                    >
                                                        <Calendar size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => togglePermission(p.id, 'access_audit', p.access_audit)}
                                                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${p.access_audit ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                                                        title="Auditoria"
                                                    >
                                                        <History size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => togglePermission(p.id, 'access_medical', p.access_medical)}
                                                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${p.access_medical ? 'bg-teal-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                                                        title="Médico"
                                                    >
                                                        <Activity size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => togglePermission(p.id, 'access_sheet_to_slide', p.access_sheet_to_slide)}
                                                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${p.access_sheet_to_slide ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                                                        title="Conversor Comercial"
                                                    >
                                                        <Presentation size={16} />
                                                    </button>

                                                    <div className="w-px h-5 bg-slate-200 mx-1"></div>

                                                    <button
                                                        onClick={() => togglePermission(p.id, 'access_guia_medico', p.access_guia_medico)}
                                                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${p.access_guia_medico ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                                                        title="Guia Médico"
                                                    >
                                                        <BookOpen size={16} />
                                                    </button>

                                                    {/* Opções filhas só aparecem se o Guia Médico (Pai) estiver ativo */}
                                                    {p.access_guia_medico && (
                                                        <>
                                                            <div className="w-px h-5 bg-slate-200/60 mx-1"></div>
                                                            <button
                                                                onClick={() => togglePermission(p.id, 'access_guia_gerador', p.access_guia_gerador)}
                                                                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${p.access_guia_gerador ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                                                                title="Guia: Gerador"
                                                            >
                                                                <FileText size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => togglePermission(p.id, 'access_guia_rede', p.access_guia_rede)}
                                                                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${p.access_guia_rede ? 'bg-fuchsia-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                                                                title="Guia: Rede"
                                                            >
                                                                <Network size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => togglePermission(p.id, 'access_guia_analise', p.access_guia_analise)}
                                                                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${p.access_guia_analise ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'}`}
                                                                title="Guia: Análise"
                                                            >
                                                                <BarChart3 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!p.is_approved ? (
                                                        <button
                                                            onClick={() => approveUser(p.id)}
                                                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-slate-200"
                                                        >
                                                            Aprovar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            onClick={() => togglePermission(p.id, 'is_approved', true)}
                                                            title="Bloquear Acesso"
                                                        >
                                                            <Lock size={20} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(p);
                                                            setShowResetModal(true);
                                                            setNewPassword('');
                                                        }}
                                                        className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="Redefinir Senha"
                                                    >
                                                        <Key size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    {/* Log Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <User size={12} /> Colaborador
                            </label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                                value={logFilters.user_id}
                                onChange={e => setLogFilters({ ...logFilters, user_id: e.target.value })}
                            >
                                <option value="">Todos</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Activity size={12} /> Ação
                            </label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                                value={logFilters.action}
                                onChange={e => setLogFilters({ ...logFilters, action: e.target.value })}
                            >
                                <option value="">Todas</option>
                                <option value="INSERT">Inclusão (INSERT)</option>
                                <option value="UPDATE">Alteração (UPDATE)</option>
                                <option value="DELETE">Exclusão (DELETE)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Database size={12} /> Tabela
                            </label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                                value={logFilters.table_name}
                                onChange={e => setLogFilters({ ...logFilters, table_name: e.target.value })}
                            >
                                <option value="">Todas</option>
                                <option value="profiles">Perfis</option>
                                <option value="medical_requests">Solicitações Médicas</option>
                                <option value="projects">Projetos</option>
                                <option value="tasks">Tarefas</option>
                                <option value="room_bookings">Reservas de Sala</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Clock size={12} /> Data
                            </label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                                value={logFilters.date}
                                onChange={e => setLogFilters({ ...logFilters, date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Logs Table */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tabela</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Detalhes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logsLoading ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center">
                                                <Activity className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando Auditoria...</p>
                                            </td>
                                        </tr>
                                    ) : logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-bold text-slate-700">{new Date(log.created_at).toLocaleTimeString('pt-BR')}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{new Date(log.created_at).toLocaleDateString('pt-BR')}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                                        {(log.profiles?.full_name || 'Sys').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{log.profiles?.full_name || 'Sistema/Trigger'}</p>
                                                        <p className="text-[10px] text-slate-400">{log.profiles?.email || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border ${log.action === 'INSERT' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                                                    log.action === 'UPDATE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}>
                                                    {log.action === 'INSERT' ? <Plus size={10} className="inline mr-1" /> :
                                                        log.action === 'UPDATE' ? <Edit3 size={10} className="inline mr-1" /> :
                                                            <Trash2 size={10} className="inline mr-1" />}
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-slate-600 font-mono">{log.table_name}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                                                    title="Ver Diferença de Dados"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!logsLoading && logs.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center opacity-40">
                                                <History size={48} className="text-slate-200 mx-auto mb-4" />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum registro de auditoria encontrado</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Existing Modals */}
            {showResetModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in duration-500">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Key size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">Redefinição de Senha</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedUser.full_name}</p>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{selectedUser.setor || 'Sem Setor'}</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowResetModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <XCircle className="text-slate-300" size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {!resetSuccess ? (
                                <>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                        Digite a nova senha para o colaborador abaixo. A alteração será imediata e integrada ao Supabase.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[1.5rem] space-y-4">
                                            <h4 className="font-black text-indigo-800 text-xs uppercase tracking-widest flex items-center gap-2">
                                                <ShieldCheck size={14} /> Redefinição Direta
                                            </h4>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha (Mínimo 6 caracteres)</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                        placeholder="Ex: Klini123@"
                                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                                                    />
                                                    <button
                                                        disabled={!newPassword || newPassword.length < 6 || resetting}
                                                        onClick={async () => {
                                                            setResetting(true);
                                                            try {
                                                                const { error } = await supabase.rpc('admin_reset_user_password', {
                                                                    target_user_id: selectedUser.id,
                                                                    new_password: newPassword
                                                                });
                                                                if (error) throw error;
                                                                setResetSuccess(true);
                                                            } catch (e) {
                                                                alert('Erro ao redefinir: ' + e.message);
                                                            } finally {
                                                                setResetting(false);
                                                            }
                                                        }}
                                                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                                                    >
                                                        {resetting ? (
                                                            <Activity size={14} className="animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 size={14} />
                                                        )}
                                                        {resetting ? 'Alterando...' : 'Confirmar'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem]">
                                            <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Eye size={14} className="text-slate-400" /> Acesso ao Console
                                            </h4>
                                            <p className="text-[11px] text-slate-500 mb-4">Caso prefira gerenciar as configurações avançadas do usuário diretamente no Supabase:</p>
                                            <a
                                                href="https://supabase.com/dashboard/project/vyibcbedcilkxpdrizet/auth/users"
                                                target="_blank"
                                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 hover:shadow-md transition-all font-sans"
                                            >
                                                Abrir Supabase Dashboard
                                            </a>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="py-10 flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center shadow-inner">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800">Sucesso!</h4>
                                        <p className="text-sm text-slate-400 font-medium px-10">
                                            A senha de <strong>{selectedUser.full_name}</strong> foi alterada com sucesso.
                                        </p>
                                    </div>
                                    <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nova Senha Temporária</p>
                                        <p className="text-lg font-mono font-black text-slate-700 tracking-wider">{newPassword}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50/50 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowResetModal(false);
                                    setResetSuccess(false);
                                    setNewPassword('');
                                }}
                                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                            >
                                {resetSuccess ? 'Fechar' : 'Cancelar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
}
