import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import ProjectControl from './components/ProjectControl';
import RoomControl from './components/RoomControl';
import UserAudit from './components/UserAudit';
import HubHome from './components/HubHome';
import MedicalControl from './components/MedicalControl';
import ProfileUpdateModal from './components/ProfileUpdateModal';
import Login from './components/Login';
import Signup from './components/Signup';
import TiebreakerExternalForm from './components/TiebreakerExternalForm';
import SheetToSlideModule from './modules/SheetToSlide/SheetToSlideModule';
import GuiaMedicoModule from './modules/GuiaMedico/GuiaMedicoModule';
import DevCockpit from './modules/DevCockpit/DevCockpit';
import {
    LayoutDashboard, Calendar, LayoutGrid,
    Bell, ShieldCheck, LogOut, Loader2,
    ShieldAlert, Activity, Presentation, BookOpen,
    ChevronLeft, ChevronRight, X, Code2, Menu
} from 'lucide-react';
import { useRef } from 'react';

function App() {
    // Manual Routing for External Forms
    const path = window.location.pathname;
    const isTiebreakerRoute = path.startsWith('/parecer/');
    const tiebreakerToken = isTiebreakerRoute ? path.split('/parecer/')[1] : null;

    if (tiebreakerToken) {
        return <TiebreakerExternalForm token={tiebreakerToken} />;
    }

    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState('hub');
    const [view, setView] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('mode') === 'signup' ? 'signup' : 'login';
    }); // 'login' or 'signup'
    const [showProfileView, setShowProfileView] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 200; // Adjust as needed
            if (direction === 'left') {
                scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Timeout Logic (4 hours)
    useEffect(() => {
        if (!session) return;

        let timeoutId;
        const TIMEOUT_DURATION = 4 * 60 * 60 * 1000; // 4 hours

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.log('Session timeout reached. Logging out...');
                handleLogout();
            }, TIMEOUT_DURATION);
        };

        // Events to track activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        resetTimer(); // Initialize timer

        return () => {
            events.forEach(event => document.removeEventListener(event, resetTimer));
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [session]);

    const fetchProfile = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) console.error('Error fetching profile:', error);
        else setProfile(data);
        setLoading(false);
    };

    const handleLogout = () => supabase.auth.signOut();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="text-indigo-600 animate-spin" size={48} />
                    <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-sm">Carregando Hub...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return view === 'login'
            ? <Login onSignupClick={() => setView('signup')} />
            : <Signup onLoginClick={() => setView('login')} />;
    }

    if (profile && !profile.is_approved) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-[500px] w-full bg-white rounded-[3rem] p-16 shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-orange-100">
                        <ShieldAlert size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-4">Acesso em Auditoria.</h3>
                    <p className="text-slate-500 font-medium leading-relaxed mb-10">
                        Sua solicitação está sendo revisada. Contate o administrador da Klini para liberação dos módulos.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-slate-900 text-white font-black py-5 rounded-xl flex items-center justify-center gap-3 hover:bg-black transition-all"
                    >
                        <LogOut size={20} /> Sair do Sistema
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Global Navbar */}
            <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-50">
                <div className="max-w-[95vw] md:max-w-[75vw] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-12">
                        <div
                            className="flex items-center gap-2 md:gap-3 cursor-pointer group"
                            onClick={() => { setActiveModule('hub'); setMobileMenuOpen(false); }}
                        >
                            <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform text-sm md:text-base">K</div>
                            <span className="font-black text-slate-800 tracking-tighter text-base md:text-xl">HUB MANAGER</span>
                        </div>

                        <div className="relative flex items-center group/nav">
                            <button
                                onClick={() => scroll('left')}
                                className="absolute -left-4 z-10 p-1.5 bg-white border border-slate-200 rounded-full shadow-md text-slate-400 hover:text-indigo-600 opacity-0 group-hover/nav:opacity-100 transition-opacity hidden md:flex"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div
                                ref={scrollRef}
                                className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto flex-nowrap max-w-[45vw] scrollbar-hide scroll-smooth"
                            >
                                <button
                                    onClick={() => setActiveModule('hub')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeModule === 'hub' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                                >
                                    <LayoutGrid size={16} />
                                    Início
                                </button>
                                {profile?.access_projects && (
                                    <button
                                        onClick={() => setActiveModule('projects')}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeModule === 'projects' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                                    >
                                        <LayoutDashboard size={16} />
                                        Projetos
                                    </button>
                                )}
                                {profile?.access_rooms && (
                                    <button
                                        onClick={() => setActiveModule('rooms')}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeModule === 'rooms' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                                    >
                                        <Calendar size={16} />
                                        Sala Reunião
                                    </button>
                                )}
                                {(profile?.access_audit || profile?.role === 'admin') && (
                                    <button
                                        onClick={() => setActiveModule('audit')}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeModule === 'audit' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                                    >
                                        <ShieldCheck size={16} />
                                        Auditoria
                                    </button>
                                )}
                                {(profile?.access_medical || profile?.role === 'admin') && (
                                    <button
                                        onClick={() => setActiveModule('medical')}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeModule === 'medical' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                                    >
                                        <Activity size={16} />
                                        Junta Médica
                                    </button>
                                )}
                                {(profile?.role === 'admin' || profile?.access_sheet_to_slide) && (
                                    <button
                                        onClick={() => setActiveModule('sheet-to-slide')}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeModule === 'sheet-to-slide' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                                    >
                                        <Presentation size={16} />
                                        Conversor Comercial
                                    </button>
                                )}
                                {(profile?.role === 'admin' || profile?.access_guia_medico) && (
                                    <button
                                        onClick={() => setActiveModule('guia-medico')}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeModule === 'guia-medico' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                                    >
                                        <BookOpen size={16} />
                                        Guia Médico
                                    </button>
                                )}
                                {(profile?.role === 'admin') && (
                                    <button
                                        onClick={() => setActiveModule('dev-cockpit')}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeModule === 'dev-cockpit' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                                    >
                                        <Code2 size={16} />
                                        Arquitetura
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => scroll('right')}
                                className="absolute -right-4 z-10 p-1.5 bg-white border border-slate-200 rounded-full shadow-md text-slate-400 hover:text-indigo-600 opacity-0 group-hover/nav:opacity-100 transition-opacity hidden md:flex"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Mobile hamburger button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all"
                        >
                            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                        <button className="hidden md:flex p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all relative">
                            <Bell size={20} />
                        </button>
                        <div className="hidden md:block h-10 w-px bg-slate-200 mx-2"></div>
                        <div className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2 group relative">
                            <button
                                onClick={() => setShowProfileView(true)}
                                className="text-right hidden lg:block hover:opacity-70 transition-opacity"
                            >
                                <p className="text-sm font-bold text-slate-800">{profile?.full_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile?.role === 'admin' ? 'Administrador' : 'Colaborador'}</p>
                            </button>
                            <button
                                onClick={() => setShowProfileView(true)}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-100 p-0.5 hover:bg-slate-200 transition-all flex items-center justify-center text-indigo-600 font-black text-base md:text-lg shadow-sm"
                            >
                                {profile?.full_name?.charAt(0) || 'U'}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="hidden md:flex w-10 h-10 rounded-xl bg-slate-50 p-0.5 hover:bg-red-50 hover:text-red-500 transition-all items-center justify-center text-slate-300"
                                title="Sair"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
                    <div className="absolute top-[60px] left-0 right-0 bg-white border-b border-slate-200 shadow-2xl animate-in slide-in-from-top duration-300 max-h-[80vh] overflow-y-auto">
                        <div className="p-4 space-y-1">
                            {[
                                { id: 'hub', icon: <LayoutGrid size={20} />, label: 'Início', show: true },
                                { id: 'projects', icon: <LayoutDashboard size={20} />, label: 'Projetos', show: profile?.access_projects },
                                { id: 'rooms', icon: <Calendar size={20} />, label: 'Sala de Reunião', show: profile?.access_rooms },
                                { id: 'audit', icon: <ShieldCheck size={20} />, label: 'Auditoria', show: profile?.access_audit || profile?.role === 'admin' },
                                { id: 'medical', icon: <Activity size={20} />, label: 'Junta Médica', show: profile?.access_medical || profile?.role === 'admin' },
                                { id: 'sheet-to-slide', icon: <Presentation size={20} />, label: 'Conversor Comercial', show: profile?.role === 'admin' || profile?.access_sheet_to_slide },
                                { id: 'guia-medico', icon: <BookOpen size={20} />, label: 'Guia Médico', show: profile?.role === 'admin' || profile?.access_guia_medico },
                                { id: 'dev-cockpit', icon: <Code2 size={20} />, label: 'Arquitetura', show: profile?.role === 'admin' },
                            ].filter(m => m.show).map(mod => (
                                <button
                                    key={mod.id}
                                    onClick={() => { setActiveModule(mod.id); setMobileMenuOpen(false); }}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${activeModule === mod.id
                                            ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {mod.icon}
                                    {mod.label}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 font-black">
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{profile?.full_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile?.role === 'admin' ? 'Admin' : 'Colaborador'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 max-w-[95vw] md:max-w-[75vw] w-full mx-auto px-4 md:px-6 py-6 md:py-10">
                {activeModule === 'hub' && <HubHome setActiveModule={setActiveModule} userProfile={profile} />}
                {activeModule === 'projects' && <ProjectControl />}
                {activeModule === 'rooms' && <RoomControl setView={setActiveModule} />}
                {activeModule === 'audit' && <UserAudit />}
                {activeModule === 'medical' && <MedicalControl />}
                {activeModule === 'sheet-to-slide' && <SheetToSlideModule />}
                {activeModule === 'guia-medico' && <GuiaMedicoModule userProfile={profile} onBack={() => setActiveModule('hub')} />}
                {activeModule === 'dev-cockpit' && <DevCockpit />}
            </main>

            {/* Profile Update Mandatory Modal */}
            {profile && (!profile.setor || !profile.cpf || !profile.birth_date) && (
                <ProfileUpdateModal
                    profile={profile}
                    onUpdate={(updatedProfile) => setProfile(updatedProfile)}
                />
            )}

            {/* Profile View Modal */}
            {showProfileView && profile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in duration-500">
                        <div className="p-10 border-b border-slate-50 bg-slate-900 text-white relative">
                            <button
                                onClick={() => setShowProfileView(false)}
                                className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-xl transition-all"
                            >
                                <X size={24} />
                            </button>
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-xl">
                                    {profile.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">{profile.full_name}</h3>
                                    <p className="text-xs text-indigo-400 font-black uppercase tracking-widest">{profile.role === 'admin' ? 'Acesso Administrativo' : 'Colaborador Klini'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</p>
                                    <p className="font-bold text-slate-700 truncate">{profile.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor</p>
                                    <p className="font-bold text-slate-700">{profile.setor || 'Não informado'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF</p>
                                    <p className="font-bold text-slate-700">
                                        {profile.cpf ? `***.${profile.cpf.substring(3, 6)}.-**` : 'Não informado'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nascimento</p>
                                    <p className="font-bold text-slate-700">{profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-teal-500" /> Permissões Ativas
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {profile.access_projects && <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">Projetos</span>}
                                    {profile.access_rooms && <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">Salas</span>}
                                    {(profile.access_audit || profile.role === 'admin') && <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">Auditoria</span>}
                                    {profile.access_medical && <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">Junta Médica</span>}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 flex justify-end">
                            <button
                                onClick={() => setShowProfileView(false)}
                                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="bg-white border-t border-slate-100 py-6 md:py-10 px-4 md:px-6 mt-10 md:mt-20">
                <div className="max-w-[95vw] md:max-w-[75vw] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                    <div className="flex items-center gap-3 opacity-50">
                        <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-white font-black text-xs">K</div>
                        <span className="font-black text-slate-800 tracking-tighter">HUB MANAGER KLINI</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">© 2026 Klini Planos de Saúde. Todos os direitos reservados.</p>
                    <div className="flex gap-8">
                        <a href="#" className="text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors">Privacidade</a>
                        <a href="#" className="text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors">Termos</a>
                        <a href="#" className="text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors">Ajuda</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
