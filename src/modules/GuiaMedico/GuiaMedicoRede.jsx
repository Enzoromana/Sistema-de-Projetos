import { useState, useMemo, useEffect } from 'react';

const PRODUCT_MAP = {
    'k200': { name: 'Klini 200', color: '#3B82F6', dark: '#1D4ED8', file: 'K200' },
    'k400': { name: 'Klini 400', color: '#199A8E', dark: '#147A70', file: 'K400' },
    'k600': { name: 'Klini 600', color: '#8B5CF6', dark: '#6D28D9', file: 'K600' }
};

const getField = (item, ...keys) => {
    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null && item[key] !== '') return String(item[key]).trim();
    }
    return '';
};

export default function GuiaMedicoRede() {
    const [activeProduct, setActiveProduct] = useState('k400');
    const [activeTab, setActiveTab] = useState('visao-geral');
    const [filters, setFilters] = useState({ municipio: '', especialidade: '' });
    const [productData, setProductData] = useState({ k200: [], k400: [], k600: [] });
    const [loadingData, setLoadingData] = useState(true);

    // Load data via fetch (instead of getStaticProps)
    useEffect(() => {
        const loadAll = async () => {
            setLoadingData(true);
            const data = {};
            for (const prod of ['K200', 'K400', 'K600']) {
                try {
                    const res = await fetch(`/data/guia-medico/produtos/${prod}.json`);
                    if (res.ok) {
                        const parsed = await res.json();
                        data[prod.toLowerCase()] = Array.isArray(parsed) ? parsed : (parsed.prestadores || []);
                    } else {
                        data[prod.toLowerCase()] = [];
                    }
                } catch {
                    data[prod.toLowerCase()] = [];
                }
            }
            setProductData(data);
            setLoadingData(false);
        };
        loadAll();
    }, []);

    useEffect(() => {
        setFilters({ municipio: '', especialidade: '' });
        setActiveTab('visao-geral');
    }, [activeProduct]);

    const currentProductData = useMemo(() => productData[activeProduct] || [], [productData, activeProduct]);
    const productConfig = PRODUCT_MAP[activeProduct] || PRODUCT_MAP['k400'];

    const municipios = useMemo(() => {
        const m = new Set();
        currentProductData.forEach(item => {
            const mun = getField(item, 'municipio', 'MUNICIPIO', 'cidade', 'CIDADE');
            if (mun) m.add(mun);
        });
        return [...m].sort();
    }, [currentProductData]);

    const especialidades = useMemo(() => {
        const e = new Set();
        currentProductData.forEach(item => {
            const esp = getField(item, 'especialidade', 'ESPECIALIDADE');
            if (esp) e.add(esp);
        });
        return [...e].sort();
    }, [currentProductData]);

    const filteredData = useMemo(() => {
        return currentProductData.filter(item => {
            const mun = getField(item, 'municipio', 'MUNICIPIO', 'cidade', 'CIDADE');
            const esp = getField(item, 'especialidade', 'ESPECIALIDADE');
            const tipo = getField(item, 'tipo_servico', 'TIPO_SERVICO');
            if (filters.municipio && mun !== filters.municipio) return false;
            if (filters.especialidade && !esp.includes(filters.especialidade)) return false;
            if (activeTab === 'visao-geral') return true;
            if (activeTab === 'hospitais' && !tipo.includes('PRONTO ATENDIMENTO') && !tipo.includes('INTERNAÇÃO')) return false;
            if (activeTab === 'consultas' && !tipo.includes('CONSULTA')) return false;
            if (activeTab === 'exames' && !tipo.includes('EXAME')) return false;
            if (activeTab === 'terapias' && !tipo.includes('TERAPIA')) return false;
            return true;
        });
    }, [currentProductData, filters, activeTab]);

    const groupedData = useMemo(() => {
        const grouped = {};
        filteredData.forEach(item => {
            const mun = getField(item, 'municipio', 'MUNICIPIO', 'cidade', 'CIDADE') || 'OUTROS';
            const nome = getField(item, 'nome_fantasia', 'nome', 'prestador');

            // Fix address rendering
            let endereco = '';
            if (item.endereco && typeof item.endereco === 'object') {
                endereco = [
                    item.endereco.logradouro || item.endereco.endereco,
                    item.endereco.numero,
                    item.endereco.bairro
                ].filter(Boolean).join(', ');
            } else {
                endereco = getField(item, 'endereco', 'ENDERECO', 'logradouro');
            }

            const providerKey = `${nome}|${endereco}`;

            if (!grouped[mun]) grouped[mun] = {};

            if (!grouped[mun][providerKey]) {
                grouped[mun][providerKey] = {
                    ...item,
                    fullEndereco: endereco, // Store the fixed address
                    especialidades: new Set(),
                    tipos: new Set()
                };
            }

            const esp = getField(item, 'especialidade', 'ESPECIALIDADE');
            if (esp) esp.split(';').forEach(e => grouped[mun][providerKey].especialidades.add(e.trim()));

            const tipo = getField(item, 'tipo_servico', 'TIPO_SERVICO');
            if (tipo) tipo.split(';').forEach(t => grouped[mun][providerKey].tipos.add(t.trim()));
        });

        // Convert grouped objects back to arrays for rendering
        const finalGrouped = {};
        Object.keys(grouped).forEach(mun => {
            finalGrouped[mun] = Object.values(grouped[mun]);
        });
        return finalGrouped;
    }, [filteredData]);

    const stats = useMemo(() => {
        const s = { hospitais: 0, consultas: 0, exames: 0, terapias: 0 };
        currentProductData.forEach(item => {
            const tipo = getField(item, 'tipo_servico', 'TIPO_SERVICO');
            if (tipo.includes('PRONTO ATENDIMENTO') || tipo.includes('INTERNAÇÃO')) s.hospitais++;
            if (tipo.includes('CONSULTA')) s.consultas++;
            if (tipo.includes('EXAME')) s.exames++;
            if (tipo.includes('TERAPIA')) s.terapias++;
        });
        return s;
    }, [currentProductData]);

    const renderCard = (provider, idx) => {
        const nome = getField(provider, 'nome_fantasia', 'nome', 'prestador');
        const bairro = getField(provider, 'bairro', 'BAIRRO');
        const tipos = Array.from(provider.tipos);
        const endereco = provider.fullEndereco;
        const telefone = getField(provider, 'telefones', 'telefone');
        const especialidades = Array.from(provider.especialidades);

        return (
            <div key={idx} style={{
                border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1rem',
                transition: 'all 0.2s', cursor: 'default',
                display: 'flex', flexDirection: 'column', height: '100%'
            }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = productConfig.color; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{nome}</h4>
                    {bairro && <span style={{ fontSize: '0.75rem', background: '#F3F4F6', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#4B5563' }}>{bairro}</span>}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {tipos.some(t => t.includes('INTERNAÇÃO')) && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold', background: '#FEE2E2', color: '#991B1B' }}>Internação</span>}
                    {tipos.some(t => t.includes('PRONTO ATENDIMENTO')) && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold', background: '#FFEDD5', color: '#9A3412' }}>Pronto Socorro</span>}
                </div>

                <div style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#6B7280', flex: 1 }}>
                    <div>{endereco}</div>
                    {telefone && <div style={{ marginTop: '0.25rem' }}>{telefone}</div>}
                </div>

                {especialidades.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Especialidades</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', fontSize: '0.75rem' }}>
                            {especialidades.slice(0, 5).map((e, i) => (
                                <span key={i} style={{ background: '#F3F4F6', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#374151' }}>{e}</span>
                            ))}
                            {especialidades.length > 5 && (
                                <span style={{ background: '#F3F4F6', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#374151' }}>+{especialidades.length - 5}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loadingData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px', height: '40px', border: '4px solid #E5E7EB', borderTop: `4px solid ${PRODUCT_MAP.k400.color}`,
                        borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem'
                    }} />
                    <p style={{ color: '#6B7280' }}>Carregando dados da rede...</p>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", background: '#F5F7FA', color: '#111827' }}>
            {/* HEADER */}
            <header style={{
                background: `linear-gradient(135deg, ${productConfig.color} 0%, ${productConfig.dark} 100%)`,
                color: 'white', padding: '1rem 2rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderRadius: '12px 12px 0 0'
            }}>
                <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, background: 'white', color: productConfig.color, padding: '0.5rem 1rem', borderRadius: '8px' }}>Klini Saúde</div>
                    <div style={{ fontWeight: '600' }}>Guia Médico Unificado</div>
                </div>
            </header>

            {/* PRODUCT SELECTOR */}
            <div style={{ background: '#0F172A', padding: '0.75rem 2rem' }}>
                <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
                    {Object.keys(PRODUCT_MAP).map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveProduct(key)}
                            style={{
                                background: activeProduct === key ? 'white' : 'rgba(255,255,255,0.1)',
                                border: activeProduct === key ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                color: activeProduct === key ? '#0F172A' : 'white',
                                fontWeight: activeProduct === key ? 'bold' : 'normal',
                                padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {PRODUCT_MAP[key].name}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABS */}
            <nav style={{ background: '#F4793B', padding: '0.5rem 2rem', overflowX: 'auto' }}>
                <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
                    {['Visão Geral', 'Hospitais', 'Consultas', 'Exames', 'Terapias'].map(tab => {
                        const id = tab.toLowerCase().replace(' ', '-').replace('ã', 'a');
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                style={{
                                    background: activeTab === id ? 'white' : 'rgba(255,255,255,0.2)',
                                    color: activeTab === id ? '#F4793B' : 'white',
                                    border: 'none', padding: '0.5rem 1rem',
                                    borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600
                                }}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* FILTERS */}
            <div style={{ background: 'white', padding: '1rem 2rem', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                        style={{ padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '6px', minWidth: '200px' }}
                        value={filters.municipio}
                        onChange={(e) => setFilters(curr => ({ ...curr, municipio: e.target.value }))}
                    >
                        <option value="">Todos Municípios</option>
                        {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <select
                        style={{ padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '6px', minWidth: '200px' }}
                        value={filters.especialidade}
                        onChange={(e) => setFilters(curr => ({ ...curr, especialidade: e.target.value }))}
                    >
                        <option value="">Todas Especialidades</option>
                        {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>

                    <div style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
                        {Object.values(groupedData).reduce((acc, curr) => acc + curr.length, 0)} resultados
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
                {/* DASHBOARD VIEW */}
                {activeTab === 'visao-geral' && !filters.municipio && !filters.especialidade && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: productConfig.color }}>{stats.hospitais}</div>
                            <div style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 600 }}>Hospitais / PS</div>
                        </div>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: productConfig.color }}>{stats.consultas}</div>
                            <div style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 600 }}>Consultórios</div>
                        </div>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: productConfig.color }}>{stats.exames}</div>
                            <div style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 600 }}>Locais de Exame</div>
                        </div>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: productConfig.color }}>{stats.terapias}</div>
                            <div style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 600 }}>Centros de Terapia</div>
                        </div>
                    </div>
                )}

                {/* RESULTS GRID */}
                {Object.keys(groupedData).map(mun => (
                    <div key={mun} style={{ marginBottom: '2rem' }}>
                        <div style={{
                            background: `linear-gradient(135deg, ${productConfig.color} 0%, ${productConfig.dark} 100%)`,
                            color: 'white', padding: '1rem', borderRadius: '8px 8px 0 0', fontWeight: 'bold'
                        }}>
                            {mun} ({groupedData[mun].length})
                        </div>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem',
                            background: 'white', padding: '1rem', border: '1px solid #E5E7EB', borderTop: 'none'
                        }}>
                            {groupedData[mun].map((item, idx) => renderCard(item, idx))}
                        </div>
                    </div>
                ))}

                {filteredData.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
                        <h3>Nenhum prestador encontrado</h3>
                        <p>Tente ajustar os filtros de busca.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
