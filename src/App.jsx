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
import {
    LayoutDashboard, Calendar, LayoutGrid,
    Bell, ShieldCheck, LogOut, Loader2,
    ShieldAlert, Activity, Presentation
} from 'lucide-react';

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
            <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => setActiveModule('hub')}
                        >
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">K</div>
                            <span className="font-black text-slate-800 tracking-tighter text-xl">HUB MANAGER</span>
                        </div>

                        <div className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
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
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all relative">
                            <Bell size={20} />
                        </button>
                        <div className="h-10 w-px bg-slate-200 mx-2"></div>
                        <div className="flex items-center gap-3 pl-2 group relative">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800">{profile?.full_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile?.role === 'admin' ? 'Administrador' : 'Colaborador'}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-12 h-12 rounded-2xl bg-slate-100 p-0.5 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center text-slate-400"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
                {activeModule === 'hub' && <HubHome setActiveModule={setActiveModule} userProfile={profile} />}
                {activeModule === 'projects' && <ProjectControl />}
                {activeModule === 'rooms' && <RoomControl setView={setActiveModule} />}
                {activeModule === 'audit' && <UserAudit />}
                {activeModule === 'medical' && <MedicalControl />}
                {activeModule === 'sheet-to-slide' && <SheetToSlideModule />}
            </main>

            {/* Profile Update Mandatory Modal */}
            {profile && (!profile.setor || !profile.cpf) && (
                <ProfileUpdateModal
                    profile={profile}
                    onUpdate={(updatedProfile) => setProfile(updatedProfile)}
                />
            )}

            <footer className="bg-white border-t border-slate-100 py-10 px-6 mt-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
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
