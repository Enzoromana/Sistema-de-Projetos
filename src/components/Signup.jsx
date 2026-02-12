import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, ArrowLeft, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Signup({ onLoginClick }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [cpf, setCpf] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    cpf: cpf.replace(/\D/g, '')
                }
            }
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-[600px] bg-white rounded-[3rem] p-16 shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-teal-100">
                        <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-4">Solicitação Enviada.</h3>
                    <p className="text-slate-500 font-medium leading-relaxed mb-10">
                        Sua conta foi criada com sucesso. Para segurança da Klini, seu acesso foi enviado para o módulo de <span className="text-indigo-600 font-bold">Auditoria de Usuários</span> e será liberado por um administrador.
                    </p>
                    <button
                        onClick={onLoginClick}
                        className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-black transition-all"
                    >
                        <ArrowLeft size={20} /> Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-[1100px] h-[700px] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-in fade-in zoom-in duration-700">
                {/* Visual Side */}
                <div className="flex-1 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-16 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>

                    <div className="relative z-10">
                        <button
                            onClick={onLoginClick}
                            className="flex items-center gap-2 text-indigo-300 font-bold hover:text-white transition-colors mb-12"
                        >
                            <ArrowLeft size={20} /> Voltar
                        </button>

                        <div className="w-14 h-14 bg-indigo-600/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-indigo-300 mb-8 border border-indigo-400/20">
                            <ShieldCheck size={32} />
                        </div>

                        <h2 className="text-5xl font-black leading-tight mb-6">
                            Segurança & <br />
                            <span className="text-indigo-400">Proteção.</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-sm font-medium">
                            Cada nova solicitação de acesso passa pela Auditoria para garantir o controle total de permissões.
                        </p>
                    </div>

                    <div className="relative z-10 p-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10">
                        <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-4">A Auditoria validará:</p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Seus dados corporativos
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Nível de acesso (Usuário/Admin)
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Módulos liberados
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-16 md:p-24 flex flex-col justify-center bg-white">
                    <div className="mb-12">
                        <h3 className="text-4xl font-black text-slate-800 mb-2">Novo Acesso.</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Crie sua conta para solicitar entrada no Hub</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                            <div className="relative">
                                <input
                                    type="text" required
                                    className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                    placeholder="Ex: Enzo Romana"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                />
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                            <div className="relative">
                                <input
                                    type="text" required
                                    className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                    placeholder="000.000.000-00"
                                    value={cpf}
                                    onChange={e => {
                                        let v = e.target.value.replace(/\D/g, '');
                                        if (v.length <= 11) {
                                            v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                            v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                            setCpf(v);
                                        }
                                    }}
                                />
                                <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                            <div className="relative">
                                <input
                                    type="email" required
                                    className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                    placeholder="seu@email.com.br"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                            <div className="relative">
                                <input
                                    type="password" required
                                    className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.2rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50 mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                <>Criar Conta & Solicitar <ShieldCheck size={20} /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
