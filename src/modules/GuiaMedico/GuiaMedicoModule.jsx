import { useState, useEffect } from 'react';
import { BookOpen, Network, BarChart3, ArrowLeft } from 'lucide-react';
import GuiaMedicoGerador from './GuiaMedicoGerador';
import GuiaMedicoAnalise from './GuiaMedicoAnalise';
import GuiaMedicoRede from './GuiaMedicoRede';

export default function GuiaMedicoModule({ onBack, userProfile }) {
    const [produtos, setProdutos] = useState([]);
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
                    // produtos.json may be an array or { produtos: [] }
                    setProdutos(Array.isArray(data) ? data : (data.produtos || []));
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

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-0">
                {availableViews.map(v => {
                    const Icon = v.icon;
                    const isActive = activeView === v.id;
                    return (
                        <button
                            key={v.id}
                            onClick={() => setActiveView(v.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all
                                ${isActive
                                    ? 'border-[#199A8E] text-[#199A8E]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {v.label}
                        </button>
                    );
                })}
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
                <div>
                    {activeView === 'gerador' && <GuiaMedicoGerador produtos={produtos} />}
                    {activeView === 'analise' && <GuiaMedicoAnalise produtos={produtos} />}
                    {activeView === 'rede' && <GuiaMedicoRede />}
                </div>
            )}
        </div>
    );
}
