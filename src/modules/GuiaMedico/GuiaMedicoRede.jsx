import { useState, useMemo, useEffect } from 'react';
import SearchableSelect from './components/SearchableSelect';

const PRODUCT_MAP = {
    'k200': { name: 'Klini 200', color: '#3B82F6', dark: '#1D4ED8', file: 'K200' },
    'k400': { name: 'Klini 400', color: '#199A8E', dark: '#147A70', file: 'K400' },
    'k600': { name: 'Klini 600', color: '#8B5CF6', dark: '#6D28D9', file: 'K600' }
};

const getField = (item, ...keys) => {
    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null && item[key] !== '') return String(item[key]).trim();
    }
    // Check inside endereco object if available
    if (item.endereco && typeof item.endereco === 'object') {
        for (const key of keys) {
            if (item.endereco[key] !== undefined && item.endereco[key] !== null && item.endereco[key] !== '') {
                return String(item.endereco[key]).trim();
            }
        }
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
            <header className="relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, #199A8E 0%, #148578 100%)',
                color: 'white', padding: '1.75rem 2rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '24px 24px 0 0'
            }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div className="flex items-center gap-5">
                        <div style={{ fontSize: '1.75rem', fontWeight: 900, background: 'white', color: '#199A8E', padding: '0.5rem 1.25rem', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>Klini</div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Guia Médico Unificado</div>
                            <div className="text-teal-50 text-[10px] font-black uppercase tracking-[0.25em] mt-0.5 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Rede Credenciada • Base Atualizada
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* PRODUCT SELECTOR */}
            <div style={{ background: '#F8FAFC', padding: '1rem 2rem', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Selecione o Plano:</span>
                    {Object.keys(PRODUCT_MAP).map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveProduct(key)}
                            style={{
                                background: activeProduct === key ? 'white' : 'transparent',
                                border: activeProduct === key ? `2px solid ${PRODUCT_MAP[key].color}` : '2px solid transparent',
                                color: activeProduct === key ? (activeProduct === key ? PRODUCT_MAP[key].color : '#64748B') : '#64748B',
                                fontWeight: '800',
                                padding: '0.6rem 1.5rem', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.3s',
                                fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}
                            className={activeProduct === key ? 'shadow-md scale-105' : 'hover:bg-slate-200/50 hover:text-slate-800'}
                        >
                            {PRODUCT_MAP[key].name}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABS */}
            <nav style={{ background: '#F4793B', padding: '0.5rem 2rem', overflowX: 'auto', boxShadow: 'inset 0 -2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
                    {['Visão Geral', 'Hospitais', 'Consultas', 'Exames', 'Terapias'].map(tab => {
                        const id = tab.toLowerCase().replace(' ', '-').replace('ã', 'a');
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                style={{
                                    background: isActive ? 'white' : 'transparent',
                                    color: isActive ? '#F4793B' : 'white',
                                    border: 'none', padding: '0.6rem 1.5rem',
                                    borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap',
                                    fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase',
                                    transition: 'all 0.3s', letterSpacing: '0.05em'
                                }}
                                className={isActive ? 'shadow-lg ring-2 ring-orange-600/10' : 'hover:bg-white/10 opacity-80 hover:opacity-100'}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* FILTERS */}
            <div style={{ background: 'white', padding: '1.5rem 2rem', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>

                    <div style={{ minWidth: '240px' }}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Município</label>
                        <SearchableSelect
                            options={municipios}
                            value={filters.municipio}
                            onChange={(val) => setFilters(curr => ({ ...curr, municipio: val }))}
                            placeholder="Todos Municípios"
                            searchPlaceholder="Filtrar cidade..."
                        />
                    </div>

                    <div style={{ minWidth: '320px' }}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Especialidade / Serviço</label>
                        <SearchableSelect
                            options={especialidades}
                            value={filters.especialidade}
                            onChange={(val) => setFilters(curr => ({ ...curr, especialidade: val }))}
                            placeholder="Todas Especialidades"
                            searchPlaceholder="Buscar especialidade..."
                        />
                    </div>

                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: productConfig.color }}>
                            {Object.values(groupedData).reduce((acc, curr) => acc + curr.length, 0)}
                        </div>
                        <div style={{ fontSize: '10px', fontBlack: 'bold', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em' }}>
                            RESULTADOS ENCONTRADOS
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
                {/* DASHBOARD VIEW */}
                {activeTab === 'visao-geral' && !filters.municipio && !filters.especialidade && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#14B8A6', lineHeight: 1 }}>{stats.hospitais}</div>
                                <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hospitais / PS</div>
                        </div>
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#F4793B', lineHeight: 1 }}>{stats.consultas}</div>
                                <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Consultórios</div>
                        </div>
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#199A8E', lineHeight: 1 }}>{stats.exames}</div>
                                <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Locais de Exame</div>
                        </div>
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3B82F6', lineHeight: 1 }}>{stats.terapias}</div>
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Centros de Terapia</div>
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
