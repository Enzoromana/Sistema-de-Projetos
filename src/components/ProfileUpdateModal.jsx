import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Briefcase, Save, Loader2, Mail } from 'lucide-react';

export default function ProfileUpdateModal({ profile, onUpdate }) {
    const [setor, setSetor] = useState(profile?.setor || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!setor.trim()) {
            alert('Por favor, preencha o seu setor.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ setor: setor.trim() })
                .eq('id', profile.id);

            if (error) throw error;

            // Notify parent to refresh profile
            onUpdate({ ...profile, setor: setor.trim() });
        } catch (e) {
            alert('Erro ao atualizar perfil: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-slate-100 flex flex-col animate-in zoom-in duration-500">
                <div className="p-10 border-b border-slate-50">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
                            <User size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Atualização de Cadastro</h2>
                            <p className="text-sm text-slate-400 font-medium">Precisamos de mais algumas informações para seu perfil.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={profile?.full_name || ''}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-400 outline-none cursor-not-allowed text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                    E-mail
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        disabled
                                        value={profile?.email || ''}
                                        className="w-full pl-6 pr-12 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-400 outline-none cursor-not-allowed text-sm truncate"
                                    />
                                    <Mail size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
                                <Briefcase size={12} /> Setor / Departamento <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                autoFocus
                                value={setor}
                                onChange={e => setSetor(e.target.value)}
                                placeholder="Ex: Financeiro, TI, Marketing..."
                                className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-10 bg-slate-50/50 flex flex-col gap-4">
                    <button
                        onClick={handleSave}
                        disabled={loading || !setor.trim()}
                        className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <Save size={20} className="group-hover:scale-110 transition-transform" />
                                Salvar e Continuar
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest">
                        Seus dados estão seguros e serão usados apenas para identificação interna.
                    </p>
                </div>
            </div>
        </div>
    );
}
