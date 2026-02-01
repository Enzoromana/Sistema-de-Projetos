import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users, ShieldCheck, ShieldAlert, CheckCircle2,
    XCircle, Lock, Unlock, Eye, Trash2,
    LayoutDashboard, Calendar, Search, Filter, User, Activity, Key
} from 'lucide-react';

export default function UserAudit() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        loadProfiles();
    }, []);

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

    const togglePermission = async (profileId, field, currentValue) => {
        let newValue;
        if (field === 'role') {
            newValue = currentValue === 'admin' ? 'user' : 'admin';
        } else {
            newValue = !currentValue;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ [field]: newValue })
            .eq('id', profileId);

        if (error) alert(error.message);
        else {
            setProfiles(profiles.map(p =>
                p.id === profileId ? { ...p, [field]: newValue } : p
            ));
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
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in slide-in-from-right duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Users className="text-indigo-600" size={32} />
                        Auditoria de Usuários
                    </h2>
                    <p className="text-slate-400 font-medium">Gestão de permissões e controle de acessos da Klini.</p>
                </div>

                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-600"
                        placeholder="Buscar por nome ou e-mail..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Permissões de Módulo</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredProfiles.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 text-lg">
                                                {p.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{p.full_name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{p.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {p.is_approved ? (
                                            <span className="flex items-center gap-2 text-teal-600 bg-teal-50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                                                <CheckCircle2 size={14} /> Ativo
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                                                <ShieldAlert size={14} /> Pendente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => togglePermission(p.id, 'role', p.role)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${p.role === 'admin' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                <User size={14} /> {p.role === 'admin' ? 'Admin' : 'Mudar para Admin'}
                                            </button>
                                            <div className="w-px h-6 bg-slate-200 mx-2"></div>
                                            <button
                                                onClick={() => togglePermission(p.id, 'access_projects', p.access_projects)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${p.access_projects ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                <LayoutDashboard size={14} /> Projetos
                                            </button>
                                            <button
                                                onClick={() => togglePermission(p.id, 'access_rooms', p.access_rooms)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${p.access_rooms ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                <Calendar size={14} /> Salas
                                            </button>
                                            <button
                                                onClick={() => togglePermission(p.id, 'access_audit', p.access_audit)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${p.access_audit ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                <ShieldCheck size={14} /> Auditoria
                                            </button>
                                            <button
                                                onClick={() => togglePermission(p.id, 'access_medical', p.access_medical)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${p.access_medical ? 'bg-teal-700 text-white shadow-lg shadow-teal-100' : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                <Activity size={14} /> Médico
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {!p.is_approved ? (
                                            <button
                                                onClick={() => approveUser(p.id)}
                                                className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black hover:bg-black transition-all"
                                            >
                                                Aprovar Acesso
                                            </button>
                                        ) : (
                                            <button
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                onClick={() => togglePermission(p.id, 'is_approved', true)}
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
                                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                            title="Redefinir Senha"
                                        >
                                            <Key size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Reset Password Options Modal */}
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
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedUser.full_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowResetModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                    <XCircle className="text-slate-300" size={24} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                    Como o sistema está configurado para não utilizar e-mails externos, utilize uma das opções abaixo para redefinir a senha do colaborador:
                                </p>

                                <div className="space-y-4">
                                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-indigo-600" /> Opção 1: Dashboard Supabase (Recomendado)
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mb-4">Acesse o painel administrativo da Klini e altere manualmente a senha na aba Authentication.</p>
                                        <a
                                            href="https://supabase.com/dashboard/project/vyibcbedcilkxpdrizet/auth/users"
                                            target="_blank"
                                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white px-4 py-2 rounded-lg border border-slate-200 hover:shadow-md transition-all"
                                        >
                                            Abrir Painel Supabase <Eye size={12} />
                                        </a>
                                    </div>

                                    <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl">
                                        <h4 className="font-black text-orange-800 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Unlock size={14} className="text-orange-600" /> Opção 2: Chave de Recuperação
                                        </h4>
                                        <p className="text-[11px] text-orange-700/70">Em breve: Sistema de chaves estáticas que o usuário armazena offline para auto-redefinição.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50/50 flex justify-end">
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {filteredProfiles.length === 0 && (
                    <div className="p-20 flex flex-col items-center justify-center opacity-40">
                        <Users size={64} className="text-slate-200 mb-6" />
                        <p className="font-black text-slate-400 uppercase tracking-widest">Nenhum usuário encontrado</p>
                    </div>
                )}
            </div>
        </div>
    );
}
