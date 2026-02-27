import { useState, useEffect } from 'react';
import { X, Smartphone, Sparkles, ArrowRight, Rocket, CheckCircle2, Menu, LayoutGrid } from 'lucide-react';

const CURRENT_VERSION = '2.1.0';
const STORAGE_KEY = 'hub_last_seen_update';

export default function UpdateAnnouncementPopup({ onViewAll, onClose }) {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        const lastSeen = localStorage.getItem(STORAGE_KEY);
        if (lastSeen !== CURRENT_VERSION) {
            setVisible(true);
        }
    }, []);

    const dismiss = () => {
        setClosing(true);
        setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
            setVisible(false);
            onClose?.();
        }, 300);
    };

    const viewAll = () => {
        localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
        setVisible(false);
        onViewAll?.();
    };

    if (!visible) return null;

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md transition-opacity duration-300 ${closing ? 'opacity-0' : 'animate-in fade-in duration-500'}`}>
            <div className={`bg-white rounded-[1.5rem] md:rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border border-slate-100 transition-all duration-300 ${closing ? 'scale-95 opacity-0' : 'animate-in zoom-in duration-500'}`}>
                {/* Hero section */}
                <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 p-8 md:p-12 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>

                    <button onClick={dismiss} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white/80 hover:text-white">
                        <X size={18} />
                    </button>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/10">
                                <Rocket size={24} />
                            </div>
                            <div className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                                v{CURRENT_VERSION} • Fev 2026
                            </div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3 italic">
                            Novidade no Hub! ✨
                        </h2>
                        <p className="text-emerald-50 text-sm md:text-base font-medium leading-relaxed">
                            O Hub Manager agora funciona perfeitamente no seu celular. Acesse todos os módulos de qualquer lugar com fluidez total.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-10 space-y-5">
                    <div className="space-y-3">
                        {[
                            { icon: <Smartphone size={18} />, text: 'Interface 100% adaptada para mobile', color: 'bg-emerald-50 text-emerald-600' },
                            { icon: <Menu size={18} />, text: 'Menu hamburger com acesso rápido', color: 'bg-teal-50 text-teal-600' },
                            { icon: <LayoutGrid size={18} />, text: 'Todos os módulos acessíveis no celular', color: 'bg-emerald-50 text-emerald-600' },
                            { icon: <CheckCircle2 size={18} />, text: 'Login, Projetos, Salas, Auditoria otimizados', color: 'bg-teal-50 text-teal-600' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 md:p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-all">
                                <div className={`p-2.5 rounded-xl ${item.color} shrink-0`}>
                                    {item.icon}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={viewAll}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 text-sm"
                        >
                            <Sparkles size={18} /> Ver Todas as Novidades
                        </button>
                        <button
                            onClick={dismiss}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
                        >
                            Entendi <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
