import { useState } from 'react';
import ProjectControl from './components/ProjectControl';
import RoomControl from './components/RoomControl';
import { LayoutDashboard, Calendar } from 'lucide-react';

function App() {
    const [activeModule, setActiveModule] = useState('projects'); // 'projects' or 'rooms'

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Global Navbar */}
            <nav className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                            <span className="font-bold text-slate-800 tracking-tight">Sistema MVP</span>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveModule('projects')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeModule === 'projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutDashboard size={18} />
                                Projetos
                            </button>
                            <button
                                onClick={() => setActiveModule('rooms')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeModule === 'rooms' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Calendar size={18} />
                                Salas
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    U{i}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
                {activeModule === 'projects' ? <ProjectControl /> : <RoomControl />}
            </div>

            <footer className="bg-white border-t border-slate-100 py-6 px-6 mt-12">
                <div className="max-w-6xl mx-auto flex items-center justify-between text-slate-400 text-sm">
                    <p>© 2026 Sistema de Projetos MVP</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-indigo-600 transition-colors">Suporte</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Docs</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;

