import { useState, useMemo } from 'react';

const GUIA_API_BASE = 'https://guia-medico.klinisaude.com.br';

const COLORS = {
    teal: '#259591',
    darkTeal: '#1a7a77',
    tealLight: '#6AA7AE',
    orange: '#CD7925',
    coral: '#E05759',
    white: '#FFFFFF',
    gray: '#666666',
    lightGray: '#f5f5f5',
    lightTeal: '#e6f7f7'
};

export default function GuiaMedicoGerador({ produtos }) {
    const [selectedProduto, setSelectedProduto] = useState('');
    const [selectedFormato, setSelectedFormato] = useState('municipio');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState('');
    const [generatedFile, setGeneratedFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const filteredProdutos = useMemo(() => {
        if (!searchTerm) return produtos;
        return produtos.filter(p =>
            p.nome.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, produtos]);

    const selectedStats = useMemo(() => {
        if (!selectedProduto) return null;
        return produtos.find(p => p.nome === selectedProduto);
    }, [selectedProduto, produtos]);

    const totalRegistros = useMemo(() => {
        return produtos.reduce((acc, p) => acc + (p.registros || 0), 0);
    }, [produtos]);

    const generateGuia = async () => {
        if (!selectedProduto) return;

        setIsGenerating(true);
        setProgress(0);
        setError('');
        setGeneratedFile(null);

        const endpoint = selectedFormato === 'especialidade'
            ? `${GUIA_API_BASE}/api/generate-especialidade-pdf`
            : `${GUIA_API_BASE}/api/generate-pdf`;
        const formatoLabel = selectedFormato === 'especialidade' ? 'Por Especialidade' : 'Por Município';

        try {
            setProgressMsg(`Gerando Guia Médico (PDF) ${formatoLabel}...`);
            setProgress(10);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ produto: selectedProduto })
            });

            setProgressMsg('Processando dados e criando PDF...');
            setProgress(50);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let msg = errorData.error || 'Erro ao gerar documento';
                if (errorData.debug) {
                    msg += `\nDEBUG INFO: ${JSON.stringify(errorData.debug, null, 2)}`;
                }
                throw new Error(msg);
            }

            setProgressMsg('Baixando PDF...');
            setProgress(90);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const produtoSlug = selectedProduto.replace(/\s+/g, '_');
            const hoje = new Date().toISOString().split('T')[0];
            const prefix = selectedFormato === 'especialidade' ? 'Guia_Por_Especialidade' : 'Guia_Medico';
            const ext = 'pdf';
            const fileName = `${prefix}_${produtoSlug}_${hoje}.${ext}`;

            setGeneratedFile({
                url,
                nome: fileName,
                produto: selectedProduto,
                formato: selectedFormato
            });

            setProgress(100);
            setProgressMsg('PDF gerado com sucesso!');

        } catch (err) {
            setError(err.message);
            setProgressMsg('');
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadFile = () => {
        if (generatedFile) {
            const link = document.createElement('a');
            link.href = generatedFile.url;
            link.download = generatedFile.nome;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{
                background: 'white',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #eee',
                borderRadius: '12px 12px 0 0',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                        <span style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.teal }}>klini</span>
                        <span style={{ fontSize: '14px', color: COLORS.orange, marginLeft: '2px' }}>saúde</span>
                    </div>
                    <div style={{ width: '1px', height: '40px', background: '#ddd' }} />
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.darkTeal }}>Gerador de Guia Médico</div>
                        <div style={{ fontSize: '12px', color: COLORS.gray }}>Sistema automático • {produtos.length} produtos disponíveis</div>
                    </div>
                </div>
                <div style={{ color: COLORS.gray, fontSize: '14px' }}>
                    ANS - Nº 42.202-9
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>

                {/* Coluna 1 - Selecione o Produto */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                            width: '32px', height: '32px', background: COLORS.teal, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '14px'
                        }}>1</div>
                        <div>
                            <div style={{ fontWeight: 'bold', color: COLORS.darkTeal, fontSize: '16px' }}>Selecione o Produto</div>
                            <div style={{ fontSize: '12px', color: COLORS.gray }}>{produtos.length} produtos • {totalRegistros.toLocaleString('pt-BR')} registros</div>
                        </div>
                    </div>

                    {/* Busca */}
                    <div style={{ position: 'relative', marginTop: '16px', marginBottom: '16px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 40px',
                                border: '1px solid #ddd', borderRadius: '8px',
                                fontSize: '14px', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Lista de Produtos */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                        {filteredProdutos.map((p, idx) => (
                            <div
                                key={p.nome}
                                onClick={() => setSelectedProduto(p.nome)}
                                style={{
                                    padding: '14px 16px', cursor: 'pointer',
                                    borderBottom: idx < filteredProdutos.length - 1 ? '1px solid #eee' : 'none',
                                    background: selectedProduto === p.nome ? COLORS.lightTeal : 'white',
                                    borderLeft: selectedProduto === p.nome ? `3px solid ${COLORS.teal}` : '3px solid transparent'
                                }}
                            >
                                <div style={{ fontWeight: '600', color: COLORS.darkTeal, fontSize: '14px' }}>{p.nome}</div>
                                <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '12px', color: COLORS.gray }}>
                                    <span>📊 {(p.registros || 0).toLocaleString('pt-BR')}</span>
                                    <span>📍 {p.municipios}</span>
                                    <span>🗺️ {p.estados || 1} UFs</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coluna 2 - Configurar e Gerar */}
                <div style={{
                    background: 'white', borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    width: '100%', maxWidth: '480px', padding: '30px', position: 'relative'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div style={{
                            width: '32px', height: '32px', background: COLORS.teal, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '14px'
                        }}>2</div>
                        <div>
                            <div style={{ fontWeight: 'bold', color: COLORS.darkTeal, fontSize: '16px' }}>Configurar e Gerar</div>
                            <div style={{ fontSize: '12px', color: COLORS.gray }}>Escolha a versão do PDF</div>
                        </div>
                    </div>

                    {!selectedProduto ? (
                        <div style={{
                            textAlign: 'center', padding: '60px 20px', color: COLORS.gray,
                            background: COLORS.lightGray, borderRadius: '8px'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👈</div>
                            <div>Selecione um produto na lista ao lado</div>
                        </div>
                    ) : (
                        <>
                            {/* Produto Selecionado */}
                            <div style={{
                                background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkTeal})`,
                                borderRadius: '8px', padding: '20px', color: 'white', marginBottom: '20px'
                            }}>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}>Produto selecionado</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedProduto}</div>
                            </div>

                            {/* Stats */}
                            {selectedStats && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ background: COLORS.lightGray, padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', marginBottom: '4px' }}>📊</div>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.teal }}>{(selectedStats.registros || 0).toLocaleString('pt-BR')}</div>
                                        <div style={{ fontSize: '12px', color: COLORS.gray }}>Prestadores</div>
                                    </div>
                                    <div style={{ background: COLORS.lightGray, padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', marginBottom: '4px' }}>📍</div>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.orange }}>{selectedStats.municipios}</div>
                                        <div style={{ fontSize: '12px', color: COLORS.gray }}>Municípios</div>
                                    </div>
                                    <div style={{ background: COLORS.lightGray, padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '14px', marginBottom: '4px' }}>🗺️</div>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.darkTeal }}>{selectedStats.estados || 1}</div>
                                        <div style={{ fontSize: '12px', color: COLORS.gray }}>Estados</div>
                                    </div>
                                </div>
                            )}

                            {/* Seleção de Formato */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: COLORS.gray, marginBottom: '10px' }}>
                                    📑 Escolha o formato do guia:
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div
                                        onClick={() => setSelectedFormato('municipio')}
                                        style={{
                                            padding: '14px',
                                            border: `2px solid ${selectedFormato === 'municipio' ? COLORS.teal : '#ddd'}`,
                                            borderRadius: '8px',
                                            background: selectedFormato === 'municipio' ? COLORS.lightTeal : 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '16px', height: '16px', borderRadius: '50%',
                                                border: `2px solid ${selectedFormato === 'municipio' ? COLORS.teal : '#ccc'}`,
                                                background: selectedFormato === 'municipio' ? COLORS.teal : 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {selectedFormato === 'municipio' && (
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: COLORS.darkTeal, fontSize: '13px' }}>📍 Por Município</div>
                                                <div style={{ fontSize: '10px', color: COLORS.gray }}>Município → Especialidade</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setSelectedFormato('especialidade')}
                                        style={{
                                            padding: '14px',
                                            border: `2px solid ${selectedFormato === 'especialidade' ? COLORS.orange : '#ddd'}`,
                                            borderRadius: '8px',
                                            background: selectedFormato === 'especialidade' ? '#fff8f0' : 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '16px', height: '16px', borderRadius: '50%',
                                                border: `2px solid ${selectedFormato === 'especialidade' ? COLORS.orange : '#ccc'}`,
                                                background: selectedFormato === 'especialidade' ? COLORS.orange : 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {selectedFormato === 'especialidade' && (
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: COLORS.darkTeal, fontSize: '13px' }}>🩺 Por Especialidade</div>
                                                <div style={{ fontSize: '10px', color: COLORS.gray }}>Especialidade → Município</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div style={{
                                background: COLORS.lightGray, borderRadius: '8px',
                                padding: '16px', marginBottom: '20px'
                            }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: COLORS.gray, marginBottom: '10px' }}>
                                    📋 O documento incluirá:
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
                                    <div style={{ color: COLORS.darkTeal }}>✅ Capa com identidade Klini</div>
                                    <div style={{ color: COLORS.darkTeal }}>✅ Índice Interativo</div>
                                    <div style={{ color: COLORS.darkTeal }}>✅ Layout Otimizado</div>
                                    <div style={{ color: COLORS.darkTeal }}>✅ Organização por {selectedFormato === 'especialidade' ? 'especialidade' : 'município'}</div>
                                    <div style={{ color: COLORS.darkTeal }}>✅ Coleta Automática</div>
                                    <div style={{ color: COLORS.darkTeal }}>✅ Formato PDF (Pronto para Uso)</div>
                                </div>
                            </div>

                            {/* Botão Gerar */}
                            <button
                                onClick={generateGuia}
                                disabled={isGenerating}
                                style={{
                                    width: '100%', padding: '16px',
                                    background: isGenerating ? COLORS.gray : `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.darkTeal})`,
                                    color: 'white', border: 'none', borderRadius: '8px',
                                    fontSize: '16px', fontWeight: '600',
                                    cursor: isGenerating ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isGenerating ? '⏳ Gerando...' : `📥 Gerar Guia PDF (${selectedFormato === 'especialidade' ? 'Especialidade' : 'Município'})`}
                            </button>

                            {/* Progress */}
                            {isGenerating && (
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ background: '#eee', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${progress}%`, height: '100%',
                                            background: `linear-gradient(90deg, ${COLORS.teal}, ${COLORS.orange})`,
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                    <p style={{ textAlign: 'center', color: COLORS.teal, fontSize: '13px', marginTop: '8px' }}>
                                        {progressMsg}
                                    </p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div style={{
                                    marginTop: '16px', padding: '12px',
                                    background: '#fff5f5', border: '1px solid #fc8181',
                                    borderRadius: '8px', color: '#c53030', fontSize: '13px'
                                }}>
                                    ❌ {error}
                                </div>
                            )}

                            {/* Download */}
                            {generatedFile && (
                                <div style={{
                                    marginTop: '20px', padding: '20px',
                                    background: COLORS.lightTeal, borderRadius: '8px', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                                    <div style={{ fontWeight: 'bold', color: COLORS.darkTeal, marginBottom: '4px' }}>
                                        {generatedFile.formato === 'especialidade' ? 'Guia por Especialidade' : 'Guia por Município'} Gerado!
                                    </div>
                                    <div style={{ fontSize: '12px', color: COLORS.gray, marginBottom: '12px' }}>
                                        📄 {generatedFile.nome}
                                    </div>
                                    <button
                                        onClick={downloadFile}
                                        style={{
                                            padding: '12px 32px',
                                            background: `linear-gradient(135deg, ${COLORS.orange}, #e6951e)`,
                                            color: 'white', border: 'none', borderRadius: '8px',
                                            fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                                        }}
                                    >
                                        📥 Baixar PDF
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
