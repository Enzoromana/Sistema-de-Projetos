import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, ArrowRight, Loader2 } from 'lucide-react';

export default function Login({ onSignupClick }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('Acesso@2026'); // Autopreenchido com a senha provisória
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Force Password Reset Flow
    const [showForceReset, setShowForceReset] = useState(false);
    const [newPasswordForm, setNewPasswordForm] = useState('');
    const [loadingForceReset, setLoadingForceReset] = useState(false);

    // Reset Password States
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: validation, 2: new password
    const [resetData, setResetData] = useState({
        email: '',
        cpf: '',
        birthDate: '',
        newPassword: ''
    });
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                // Traduzindo e detectando erros comuns
                if (authError.message === 'Invalid login credentials') {
                    setError('E-mail ou senha incorretos.');
                } else {
                    setError(authError.message);
                }
                return; // Break execution if error
            }

            // Se a senha for a temporária, interceptamos o login para forçar a troca!
            if (password === 'Acesso@2026') {
                setShowForceReset(true);
                return; // Bloqueamos a entrada no sistema até trocar
            }

        } catch (err) {
            console.error('Erro detalhado no login:', err);
            if (err.message?.includes('fetch') || err.name === 'TypeError') {
                setError('Erro de Conexão: O acesso ao banco de dados foi bloqueado pela sua rede ou firewall. Entre em contato com o suporte de TI local para liberar o domínio do Supabase.');
            } else {
                setError('Ocorreu um erro inesperado. Tente novamente em instantes.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-[1100px] min-h-[500px] md:h-[700px] bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-in fade-in zoom-in duration-700">
                {/* Visual Side */}
                <div className="hidden md:flex flex-1 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-10 lg:p-16 text-white flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full -ml-10 -mb-10 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/20">K</div>
                            <span className="font-black text-2xl tracking-tighter">HUB MANAGER</span>
                        </div>

                        <h2 className="text-5xl font-black leading-tight mb-6">
                            Gestão Centralizada <br />
                            <span className="text-indigo-400">Klini.</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-sm font-medium">
                            Acesse os módulos de projetos, salas e auditoria em uma única plataforma premium.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-6">
                        <div className="flex -space-x-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-indigo-950 bg-slate-800"></div>
                            ))}
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">+200 usuários ativos</p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-white">
                    <div className="mb-12">
                        <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Bem-vindo.</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Acesse sua conta corporativa</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                            <div className="relative">
                                <input
                                    type="email" required
                                    className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                    placeholder="seu@email.com.br"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                                Senha
                                <button type="button" onClick={() => setPassword('Acesso@2026')} className="text-[10px] text-indigo-500 hover:underline">
                                    Usar Senha da Migração
                                </button>
                            </label>
                            <div className="relative">
                                <input
                                    type="password" required
                                    className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold flex flex-col gap-3 animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    {error}
                                </div>
                                {error.includes('Conexão') && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await fetch('https://vyibcbedcilkxpdrizet.supabase.co', { mode: 'no-cors' });
                                                alert('Conexão estabelecida com sucesso! O domínio não está bloqueado.');
                                            } catch (e) {
                                                alert('Falha no teste: O domínio continua inacessível na sua rede atual.');
                                            }
                                        }}
                                        className="text-xs text-indigo-600 hover:underline w-fit ml-4"
                                    >
                                        Verificar conexão agora →
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end pr-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowResetModal(true);
                                    setResetStep(1);
                                    setResetMessage({ type: '', text: '' });
                                    setResetData({ ...resetData, email: email || '' });
                                }}
                                className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors"
                            >
                                Esqueci minha senha
                            </button>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                <>Entrar no Hub <ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-12 text-center text-slate-400 font-medium">
                        Novo por aqui?
                        <button
                            onClick={onSignupClick}
                            className="ml-2 text-indigo-600 font-bold hover:underline"
                        >
                            Solicitar Acesso
                        </button>
                    </p>
                </div>
            </div>

            {/* Modal de Troca de Senha Obrigatória (Acesso@2026) */}
            {showForceReset && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-10 animate-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 text-center mb-2">Atualize sua Senha</h3>
                        <p className="text-sm text-slate-500 text-center mb-8 font-medium">
                            Você está acessando a plataforma após a migração usando uma senha temporária. Para sua segurança e para prosseguir ao painel, crie uma **nova senha forte** agora.
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Nova Senha Escolhida</label>
                                <input
                                    type="password"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 text-sm"
                                    placeholder="No mínimo 6 caracteres"
                                    value={newPasswordForm}
                                    onChange={e => setNewPasswordForm(e.target.value)}
                                />
                            </div>

                            <button
                                disabled={newPasswordForm.length < 6 || loadingForceReset}
                                onClick={async () => {
                                    setLoadingForceReset(true);
                                    try {
                                        const { error: updateError } = await supabase.auth.updateUser({
                                            password: newPasswordForm
                                        });
                                        if (updateError) throw updateError;

                                        // Sucesso!
                                        setShowForceReset(false);
                                        // window.location.reload() ou apenas deixar o AuthStateChange carregar normalmente
                                        window.location.href = '/'; // Forçamos refresh pro app ver o novo state logado
                                    } catch (err) {
                                        alert('Erro ao atualizar senha: ' + err.message);
                                    } finally {
                                        setLoadingForceReset(false);
                                    }
                                }}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50 mt-4"
                            >
                                {loadingForceReset ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Nova Senha e Entrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showResetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in duration-500 scrollbar-hide">
                        <div className="p-10 border-b border-slate-50 relative">
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <Lock size={20} className="text-slate-300" />
                            </button>

                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                <Key size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Recuperar Acesso</h3>
                            <p className="text-sm text-slate-400 font-medium">Valide seus dados para redefinir sua senha.</p>
                        </div>

                        <div className="p-10 space-y-6">
                            {resetMessage.text && (
                                <div className={`p-4 rounded-xl text-xs font-bold ${resetMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
                                    {resetMessage.text}
                                </div>
                            )}

                            {resetStep === 1 ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                        <input
                                            type="email"
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 text-sm"
                                            placeholder="seu@email.com.br"
                                            value={resetData.email}
                                            onChange={e => setResetData({ ...resetData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 text-sm"
                                            placeholder="000.000.000-00"
                                            value={resetData.cpf}
                                            onChange={e => {
                                                let v = e.target.value.replace(/\D/g, '');
                                                if (v.length <= 11) {
                                                    v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                                    v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                                    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                                    setResetData({ ...resetData, cpf: v });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                        <input
                                            type="date"
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 text-sm"
                                            value={resetData.birthDate}
                                            onChange={e => setResetData({ ...resetData, birthDate: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setResetStep(2)}
                                        disabled={!resetData.email || !resetData.cpf || !resetData.birthDate}
                                        className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50"
                                    >
                                        Próximo Passo <ArrowRight size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha (Mínimo 6 caracteres)</label>
                                        <input
                                            type="password"
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 text-sm"
                                            placeholder="••••••••"
                                            value={resetData.newPassword}
                                            onChange={e => setResetData({ ...resetData, newPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setResetStep(1)}
                                            className="flex-1 bg-slate-100 text-slate-600 font-black py-5 rounded-[1.5rem] hover:bg-slate-200 transition-all"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            disabled={resetData.newPassword.length < 6 || resetLoading}
                                            onClick={async () => {
                                                setResetLoading(true);
                                                setResetMessage({ type: '', text: '' });
                                                try {
                                                    const { data, error: rpcError } = await supabase.rpc('admin_reset_password_via_validation', {
                                                        email_input: resetData.email,
                                                        cpf_input: resetData.cpf.replace(/\D/g, ''),
                                                        birth_date_input: resetData.birthDate,
                                                        new_password: resetData.newPassword
                                                    });

                                                    if (rpcError) throw rpcError;

                                                    if (data.success) {
                                                        setResetMessage({ type: 'success', text: 'Senha alterada com sucesso! Você já pode entrar.' });
                                                        setTimeout(() => setShowResetModal(false), 2000);
                                                    } else {
                                                        setResetMessage({ type: 'error', text: data.message });
                                                        setResetStep(1);
                                                    }
                                                } catch (err) {
                                                    setResetMessage({ type: 'error', text: 'Erro ao processar: ' + err.message });
                                                } finally {
                                                    setResetLoading(false);
                                                }
                                            }}
                                            className="flex-[2] bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                        >
                                            {resetLoading ? <Loader2 className="animate-spin" size={20} /> : 'Definir Nova Senha'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Hook locally to use Key icon
import { Key } from 'lucide-react';
