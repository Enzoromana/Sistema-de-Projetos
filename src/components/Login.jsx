import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, ArrowRight, Loader2 } from 'lucide-react';

export default function Login({ onSignupClick }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) setError(error.message);
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-[1100px] h-[700px] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 animate-in fade-in zoom-in duration-700">
                {/* Visual Side */}
                <div className="flex-1 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 p-16 text-white flex flex-col justify-between relative overflow-hidden">
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
                <div className="flex-1 p-16 md:p-24 flex flex-col justify-center bg-white">
                    <div className="mb-12">
                        <h3 className="text-4xl font-black text-slate-800 mb-2">Bem-vindo.</h3>
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
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                            <div className="relative">
                                <input
                                    type="password" required
                                    className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                {error}
                            </div>
                        )}

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
        </div>
    );
}
