import { useState, useEffect } from 'react';
import { BookOpen, Network, BarChart3, ArrowLeft } from 'lucide-react';
import GuiaMedicoGerador from './GuiaMedicoGerador';
import GuiaMedicoAnalise from './GuiaMedicoAnalise';
import GuiaMedicoRede from './GuiaMedicoRede';

export default function GuiaMedicoModule({ onBack, userProfile }) {
    const [produtos, setProdutos] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [loadingProdutos, setLoadingProdutos] = useState(true);

    const isAdmin = userProfile?.role === 'admin';
    const availableViews = [
        { id: 'gerador', label: 'Gerador de Guia', icon: BookOpen, description: 'Gerar PDF do Guia Médico', allowed: isAdmin || userProfile?.access_guia_gerador },
        { id: 'analise', label: 'Análise de Rede', icon: BarChart3, description: 'Comparativo de rede credenciada', allowed: isAdmin || userProfile?.access_guia_analise },
        { id: 'rede', label: 'Rede Completa', icon: Network, description: 'Navegar prestadores da rede', allowed: isAdmin || userProfile?.access_guia_rede },
    ].filter(v => v.allowed !== false); // Default to true if not explicitly false, but here we check for explicit true/admin

    const [activeView, setActiveView] = useState(availableViews[0]?.id || 'gerador');

    // Load product list from static JSON
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/data/guia-medico/produtos.json');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setProdutos(data);
                    } else {
                        setProdutos(data.produtos || []);
                        setLastUpdate(data.data_atualizacao);
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar produtos:', err);
            } finally {
                setLoadingProdutos(false);
            }
        };
        load();
    }, []);

    return (
        <div className="space-y-6">
            {/* Back + Title */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Guia Médico</h1>
                        <p className="text-sm text-gray-500">Sistema de geração e consulta de guia médico Klini</p>
                    </div>
                </div>

                {lastUpdate && (
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Última atualização</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-gray-600">
                                {new Date(lastUpdate).toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Tabs - Modern Segmented Control Style */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md py-4 -mx-4 px-4 mb-2 border-b border-gray-100 flex justify-center">
                <div className="flex p-1 bg-gray-100/80 rounded-2xl w-fit border border-gray-200/50 relative">
                    {availableViews.map((v, idx) => {
                        const Icon = v.icon;
                        const isActive = activeView === v.id;
                        return (
                            <button
                                key={v.id}
                                onClick={() => setActiveView(v.id)}
                                className={`flex items-center gap-2.5 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 relative z-10
                                    ${isActive
                                        ? 'text-[#199A8E]'
                                        : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                                {v.label}

                                {isActive && (
                                    <div className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5 -z-10" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            {loadingProdutos ? (
                <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#199A8E] mx-auto mb-4"></div>
                        <p className="text-gray-500">Carregando dados...</p>
                    </div>
                </div>
            ) : (
                <div className="min-h-[500px]">
                    <div style={{ display: activeView === 'gerador' ? 'block' : 'none' }}>
                        <GuiaMedicoGerador produtos={produtos} />
                    </div>
                    <div style={{ display: activeView === 'analise' ? 'block' : 'none' }}>
                        <GuiaMedicoAnalise produtos={produtos} />
                    </div>
                    <div style={{ display: activeView === 'rede' ? 'block' : 'none' }}>
                        <GuiaMedicoRede />
                    </div>
                </div>
            )}
        </div>
    );
}
