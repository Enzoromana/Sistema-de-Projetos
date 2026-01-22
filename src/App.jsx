import { useState } from 'react';
import ProjectControl from './components/ProjectControl';
import RoomControl from './components/RoomControl';
import HubHome from './components/HubHome';
import { LayoutDashboard, Calendar, LayoutGrid, Bell, User } from 'lucide-react';

function App() {
    const [activeModule, setActiveModule] = useState('hub'); // 'hub', 'projects', or 'rooms'

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
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeModule === 'hub' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutGrid size={18} />
                                Início
                            </button>
                            <button
                                onClick={() => setActiveModule('projects')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeModule === 'projects' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutDashboard size={18} />
                                Projetos
                            </button>
                            <button
                                onClick={() => setActiveModule('rooms')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeModule === 'rooms' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Calendar size={18} />
                                Salas
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-10 w-px bg-slate-200 mx-2"></div>
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800">Enzo Romana</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrador</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-100">
                                <div className="w-full h-full rounded-[0.9rem] bg-white flex items-center justify-center text-indigo-600">
                                    <User size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
                {activeModule === 'hub' && <HubHome setActiveModule={setActiveModule} />}
                {activeModule === 'projects' && <ProjectControl />}
                {activeModule === 'rooms' && <RoomControl setView={setActiveModule} />}
            </main>

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
