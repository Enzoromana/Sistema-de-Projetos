import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import SearchableSelect from './components/SearchableSelect';

const GUIA_API_BASE = 'https://guia-medico.klinisaude.com.br';

export default function GuiaMedicoAnalise({ produtos }) {
    // Estados principais
    const [produtoSelecionado, setProdutoSelecionado] = useState('');
    const [dadosKlini, setDadosKlini] = useState([]);
    const [dadosConcorrente, setDadosConcorrente] = useState([]);
    const [nomeConcorrente, setNomeConcorrente] = useState('');
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [mostrarResultados, setMostrarResultados] = useState(false);

    // Estados para mapeamento de colunas
    const [colunasDisponiveis, setColunasDisponiveis] = useState([]);
    const [mapeamento, setMapeamento] = useState({
        nome: '', especialidade: '', uf: '', municipio: '', categoria: ''
    });
    const [mostrarMapeamento, setMostrarMapeamento] = useState(false);
    const [dadosBrutos, setDadosBrutos] = useState([]);
    const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // Estados para detalhamento
    const [mostrarDetalheOutros, setMostrarDetalheOutros] = useState(false);
    const [municipioSelecionado, setMunicipioSelecionado] = useState('');

    // Carregar dados do produto Klini
    const carregarDadosKlini = async (nomeProduto) => {
        if (!nomeProduto) { setDadosKlini([]); return; }
        setLoading(true);
        setErro('');
        try {
            const response = await fetch(`${GUIA_API_BASE}/api/produto?nome=${encodeURIComponent(nomeProduto)}`);
            if (!response.ok) throw new Error(`Erro ao carregar produto: ${response.status}`);
            const data = await response.json();
            if (data.dados && Array.isArray(data.dados)) {
                const dadosProcessados = data.dados.map(item => {
                    const mun = item.municipio || (item.endereco && typeof item.endereco === 'object' ? item.endereco.municipio : '');
                    const esp = item.especialidade || (item.endereco && typeof item.endereco === 'object' ? item.endereco.especialidade : '');
                    return {
                        ...item,
                        municipio: mun,
                        especialidade: esp,
                        categoria: item.categoria || item.tipo_servico || classificarTipo(esp),
                        nome: item.nome || item.nome_fantasia || ''
                    };
                });
                setDadosKlini(dadosProcessados);
            } else {
                setDadosKlini([]);
                setErro('Dados do produto não encontrados');
            }
        } catch (error) {
            console.error('Erro ao carregar dados Klini:', error);
            setErro(`Erro ao carregar dados: ${error.message}`);
            setDadosKlini([]);
        } finally {
            setLoading(false);
        }
    };

    const classificarTipo = (especialidade) => {
        if (!especialidade) return 'OUTROS';
        const esp = especialidade.toUpperCase();
        if (esp.includes('HOSPITAL') || esp.includes('PRONTO') || esp.includes('UPA')) return 'HOSPITAL';
        if (esp.includes('LABORATÓRIO') || esp.includes('LABORATORIO') || esp.includes('ANÁLISES')) return 'LABORATÓRIO';
        if (esp.includes('FISIOTERAPIA') || esp.includes('FONO') || esp.includes('TERAPIA')) return 'TERAPIA';
        if (esp.includes('IMAGEM') || esp.includes('RAIO') || esp.includes('TOMOGRAFIA') || esp.includes('RESSONÂNCIA')) return 'EXAME';
        return 'CONSULTA';
    };

    // Drag and drop handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) processarArquivo(e.dataTransfer.files[0]);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) processarArquivo(e.target.files[0]);
    };

    const processarArquivo = (file) => {
        setArquivoSelecionado(file);
        setLoading(true);
        setErro('');
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                if (jsonData.length === 0) throw new Error('Planilha vazia');
                const colunas = Object.keys(jsonData[0]);
                setColunasDisponiveis(colunas);
                setDadosBrutos(jsonData);
                const novoMapeamento = autoDetectarColunas(colunas);
                setMapeamento(novoMapeamento);
                setMostrarMapeamento(true);
            } catch (error) {
                console.error('Erro ao processar arquivo:', error);
                setErro(`Erro ao processar arquivo: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const autoDetectarColunas = (colunas) => {
        const mapeamento = { nome: '', especialidade: '', uf: '', municipio: '', categoria: '' };
        const padroes = {
            nome: ['nome', 'prestador', 'fantasia', 'razao', 'estabelecimento', 'clinica', 'hospital'],
            especialidade: ['especialidade', 'servico', 'tipo', 'procedimento', 'atividade'],
            uf: ['uf', 'estado', 'sigla'],
            municipio: ['municipio', 'cidade', 'localidade', 'município'],
            categoria: ['categoria', 'tipo_servico', 'classificacao', 'grupo', 'segmento']
        };
        for (const [campo, keywords] of Object.entries(padroes)) {
            for (const coluna of colunas) {
                const colunaLower = coluna.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                for (const keyword of keywords) {
                    if (colunaLower.includes(keyword)) { mapeamento[campo] = coluna; break; }
                }
                if (mapeamento[campo]) break;
            }
        }
        return mapeamento;
    };

    const aplicarMapeamento = () => {
        if (!mapeamento.nome) { setErro('Selecione pelo menos a coluna de Nome'); return; }
        const dadosProcessados = dadosBrutos.map(row => ({
            nome: row[mapeamento.nome] || '',
            especialidade: row[mapeamento.especialidade] || '',
            uf: row[mapeamento.uf] || '',
            municipio: row[mapeamento.municipio] || '',
            categoria: row[mapeamento.categoria] || classificarTipo(row[mapeamento.especialidade])
        }));
        setDadosConcorrente(dadosProcessados);
        setMostrarMapeamento(false);
    };

    const gerarAnalise = async () => {
        if (!produtoSelecionado) { setErro('Selecione um produto Klini'); return; }
        if (!arquivoSelecionado && dadosConcorrente.length === 0) { setErro('Anexe a planilha do concorrente'); return; }
        setLoading(true);
        await carregarDadosKlini(produtoSelecionado);
        setMostrarResultados(true);
        setLoading(false);
    };

    // Funções de cálculo
    const normalizarTipo = (tipo) => {
        if (!tipo) return 'OUTROS';
        const t = tipo.toUpperCase().trim();
        if (t.includes('HOSPITAL') || t.includes('INTERN')) return 'HOSPITAL';
        if (t.includes('LABOR') || t.includes('ANÁLISE')) return 'LABORATÓRIO';
        if (t.includes('CONSULT')) return 'CONSULTÓRIO';
        if (t.includes('CLÍNICA') || t.includes('CLINICA')) return 'CLÍNICA';
        if (t.includes('PRONTO') || t.includes('URGÊNCIA') || t.includes('EMERGÊNCIA')) return 'PRONTO SOCORRO';
        return 'OUTROS';
    };

    const calcularEstatisticasPorTipo = (dados) => {
        const tipos = {};
        dados.forEach(item => {
            const tipo = normalizarTipo(item.categoria || item.tipo_servico);
            tipos[tipo] = (tipos[tipo] || 0) + 1;
        });
        return tipos;
    };

    const calcularEstatisticasPorUF = (dados) => {
        const ufs = {};
        dados.forEach(item => {
            const uf = (item.uf || 'N/D').toUpperCase();
            ufs[uf] = (ufs[uf] || 0) + 1;
        });
        return ufs;
    };

    const calcularEstatisticasPorEspecialidade = (dados) => {
        const especialidades = {};
        dados.forEach(item => {
            const esp = item.especialidade || 'Não informado';
            especialidades[esp] = (especialidades[esp] || 0) + 1;
        });
        return Object.entries(especialidades)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
    };

    const detalharOutros = (dados) => {
        const outros = dados.filter(item => normalizarTipo(item.categoria || item.tipo_servico) === 'OUTROS');
        const detalhes = {};
        outros.forEach(item => {
            const cat = item.categoria || item.tipo_servico || 'Não informado';
            detalhes[cat] = (detalhes[cat] || 0) + 1;
        });
        return Object.entries(detalhes).sort((a, b) => b[1] - a[1]);
    };

    const getMunicipios = () => {
        const municipiosKlini = new Set(dadosKlini.map(d => d.municipio).filter(m => m));
        const municipiosConcorrente = new Set(dadosConcorrente.map(d => d.municipio).filter(m => m));
        return [...new Set([...municipiosKlini, ...municipiosConcorrente])].sort();
    };

    const calcularEstatisticasPorMunicipio = () => {
        const municipios = getMunicipios();
        return municipios.map(mun => {
            const kliniMun = dadosKlini.filter(d => d.municipio === mun);
            const concMun = dadosConcorrente.filter(d => d.municipio === mun);
            return {
                municipio: mun,
                kliniTotal: kliniMun.length,
                concTotal: concMun.length,
                diferenca: kliniMun.length - concMun.length,
                kliniTipos: calcularEstatisticasPorTipo(kliniMun),
                concTipos: calcularEstatisticasPorTipo(concMun),
                kliniEsp: calcularEstatisticasPorEspecialidade(kliniMun),
                concEsp: calcularEstatisticasPorEspecialidade(concMun)
            };
        }).sort((a, b) => b.kliniTotal - a.kliniTotal);
    };

    const getNomeConcorrenteDisplay = () => nomeConcorrente || 'Concorrente';
    const getStatus = (kliniVal, concorrenteVal) => {
        const diff = kliniVal - concorrenteVal;
        if (diff > 0) return { text: `+${diff}`, color: 'text-green-600 bg-green-50' };
        if (diff < 0) return { text: `${diff}`, color: 'text-red-600 bg-red-50' };
        return { text: '0', color: 'text-gray-600 bg-gray-50' };
    };

    // Dados calculados
    const totalKlini = dadosKlini.length;
    const totalConcorrente = dadosConcorrente.length;
    const diferenca = totalKlini - totalConcorrente;
    const variacao = totalConcorrente > 0 ? ((totalKlini / totalConcorrente - 1) * 100).toFixed(1) : (totalKlini > 0 ? 100 : 0);
    const tiposKlini = calcularEstatisticasPorTipo(dadosKlini);
    const tiposConcorrente = calcularEstatisticasPorTipo(dadosConcorrente);
    const todosOsTipos = [...new Set([...Object.keys(tiposKlini), ...Object.keys(tiposConcorrente)])];
    const ufsKlini = calcularEstatisticasPorUF(dadosKlini);
    const ufsConcorrente = calcularEstatisticasPorUF(dadosConcorrente);
    const todasAsUFs = [...new Set([...Object.keys(ufsKlini), ...Object.keys(ufsConcorrente)])].sort();
    const espKlini = calcularEstatisticasPorEspecialidade(dadosKlini);
    const espConcorrente = calcularEstatisticasPorEspecialidade(dadosConcorrente);
    const todasAsEsp = [...new Set([...Object.keys(espKlini), ...Object.keys(espConcorrente)])];
    const outrosDetalheKlini = detalharOutros(dadosKlini);
    const outrosDetalheConcorrente = detalharOutros(dadosConcorrente);
    const estatisticasMunicipio = calcularEstatisticasPorMunicipio();
    const municipioInfo = municipioSelecionado ? estatisticasMunicipio.find(m => m.municipio === municipioSelecionado) : null;

    return (
        <div className="bg-gray-50">
            <main className="max-w-6xl mx-auto py-8 px-4">
                {!mostrarResultados ? (
                    <>
                        {/* Título */}
                        <div className="mb-10 p-8 bg-white rounded-[32px] shadow-sm border border-slate-100 border-b-4 border-b-purple-600 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                                        <span className="text-white text-xl">📊</span>
                                    </div>
                                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Análise Comparativa de Rede</h1>
                                </div>
                                <p className="text-slate-500 max-w-2xl font-medium leading-relaxed">
                                    Compare a cobertura da Klini Saúde com o mercado. Identifique gaps, diferenciais competitivos e otimize sua estratégia comercial.
                                </p>
                            </div>
                        </div>

                        {/* Formulário */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Selecione o Produto Klini</label>
                                    <SearchableSelect
                                        options={produtos.map(p => p.nome)}
                                        value={produtoSelecionado}
                                        onChange={setProdutoSelecionado}
                                        placeholder="Selecione um produto..."
                                        searchPlaceholder="Ex: Klini 200..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Nome do Concorrente (opcional)</label>
                                    <input
                                        type="text"
                                        value={nomeConcorrente}
                                        onChange={(e) => setNomeConcorrente(e.target.value)}
                                        placeholder="Ex: Amil, Bradesco, Unimed..."
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">3. Anexe a Planilha de Rede do Concorrente</label>
                                <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                    ${dragActive ? 'border-[#199A8E] bg-[#199A8E]/5' : 'border-gray-300 hover:border-gray-400'}
                    ${arquivoSelecionado ? 'bg-green-50 border-green-300' : ''}`}
                                    onClick={() => document.getElementById('guia-analise-file-input').click()}>
                                    <input id="guia-analise-file-input" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                                    {arquivoSelecionado ? (
                                        <div className="text-green-600">
                                            <span className="text-3xl mb-2 block">✓</span>
                                            <p className="font-medium">{arquivoSelecionado.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">Clique para trocar o arquivo</p>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-4xl mb-3 block">📎</span>
                                            <p className="font-medium text-gray-700">Clique aqui ou arraste o arquivo</p>
                                            <p className="text-sm text-gray-500 mt-1">Formatos aceitos: .xlsx, .xls, .csv</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-6">
                                <div className="flex items-start gap-2">
                                    <span className="text-amber-500">💡</span>
                                    <div>
                                        <p className="font-medium text-amber-800">Dica</p>
                                        <p className="text-sm text-amber-700">A planilha deve conter colunas como: Nome/Razão Social, Especialidade, UF, Município.</p>
                                    </div>
                                </div>
                            </div>

                            {erro && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{erro}</div>}

                            <button onClick={gerarAnalise} disabled={loading || !produtoSelecionado || dadosConcorrente.length === 0}
                                className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition flex items-center justify-center gap-2
                  ${loading || !produtoSelecionado || dadosConcorrente.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#199A8E] hover:bg-[#148578]'}`}>
                                {loading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Processando...</>) : (<>● Gerar Análise Comparativa</>)}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <button onClick={() => setMostrarResultados(false)} className="mb-6 text-[#199A8E] hover:underline flex items-center gap-2">← Voltar para seleção</button>

                        {/* Resumo da Análise */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-green-500">📈</span>
                                <h2 className="text-xl font-bold text-[#199A8E]">Resumo da Análise</h2>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-xl border-l-4 border-[#199A8E]">
                                    <p className="text-3xl font-bold text-[#199A8E]">{totalKlini.toLocaleString()}</p>
                                    <p className="text-sm text-gray-600">Prestadores Klini</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-xl border-l-4 border-orange-400">
                                    <p className="text-3xl font-bold text-orange-500">{totalConcorrente.toLocaleString()}</p>
                                    <p className="text-sm text-gray-600">Prestadores {getNomeConcorrenteDisplay()}</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-xl border-l-4 border-red-400">
                                    <p className={`text-3xl font-bold ${diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>{diferenca >= 0 ? '+' : ''}{diferenca.toLocaleString()}</p>
                                    <p className="text-sm text-gray-600">Diferença</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-xl border-l-4 border-red-400">
                                    <p className={`text-3xl font-bold ${variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>{variacao >= 0 ? '+' : ''}{variacao}%</p>
                                    <p className="text-sm text-gray-600">Variação</p>
                                </div>
                            </div>
                        </div>

                        {/* Comparativo por Tipo */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-purple-500">🏥</span>
                                    <h2 className="text-xl font-bold text-[#199A8E]">Comparativo por Tipo de Prestador</h2>
                                </div>
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="text-left py-3 px-4 rounded-l-lg">Tipo</th>
                                        <th className="text-center py-3 px-4">Klini</th>
                                        <th className="text-center py-3 px-4">{getNomeConcorrenteDisplay()}</th>
                                        <th className="text-center py-3 px-4">Comparativo</th>
                                        <th className="text-center py-3 px-4 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todosOsTipos.map(tipo => {
                                        const kliniVal = tiposKlini[tipo] || 0;
                                        const concVal = tiposConcorrente[tipo] || 0;
                                        const maxVal = Math.max(kliniVal, concVal, 1);
                                        const status = getStatus(kliniVal, concVal);
                                        const isOutros = tipo === 'OUTROS';
                                        return (
                                            <tr key={tipo} className="border-b">
                                                <td className="py-3 px-4 font-medium">
                                                    {tipo}
                                                    {isOutros && kliniVal > 0 && (
                                                        <button onClick={() => setMostrarDetalheOutros(!mostrarDetalheOutros)}
                                                            className="ml-2 text-xs text-[#199A8E] hover:underline">
                                                            {mostrarDetalheOutros ? '▲ Ocultar' : '▼ Detalhar'}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="text-center py-3 px-4">{kliniVal}</td>
                                                <td className="text-center py-3 px-4">{concVal}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <div className="flex-1 flex items-center">
                                                            <div className="h-4 bg-[#199A8E] rounded-l" style={{ width: `${(kliniVal / maxVal) * 100}%` }}></div>
                                                            <span className="text-xs text-[#199A8E] ml-1">{kliniVal}</span>
                                                        </div>
                                                        <div className="flex-1 flex items-center">
                                                            <div className="h-4 bg-orange-400 rounded-r" style={{ width: `${(concVal / maxVal) * 100}%` }}></div>
                                                            <span className="text-xs text-orange-500 ml-1">{concVal}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>{status.text}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Detalhe OUTROS */}
                            {mostrarDetalheOutros && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold text-gray-700 mb-3">📋 Detalhamento da categoria "OUTROS"</h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-[#199A8E] mb-2">Klini ({tiposKlini['OUTROS'] || 0})</h4>
                                            <div className="max-h-48 overflow-y-auto">
                                                {outrosDetalheKlini.length > 0 ? outrosDetalheKlini.map(([cat, count]) => (
                                                    <div key={cat} className="flex justify-between py-1 text-sm border-b border-gray-200">
                                                        <span className="text-gray-700">{cat}</span>
                                                        <span className="font-medium text-[#199A8E]">{count}</span>
                                                    </div>
                                                )) : <p className="text-gray-500 text-sm">Nenhum item</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-orange-500 mb-2">{getNomeConcorrenteDisplay()} ({tiposConcorrente['OUTROS'] || 0})</h4>
                                            <div className="max-h-48 overflow-y-auto">
                                                {outrosDetalheConcorrente.length > 0 ? outrosDetalheConcorrente.map(([cat, count]) => (
                                                    <div key={cat} className="flex justify-between py-1 text-sm border-b border-gray-200">
                                                        <span className="text-gray-700">{cat}</span>
                                                        <span className="font-medium text-orange-500">{count}</span>
                                                    </div>
                                                )) : <p className="text-gray-500 text-sm">Nenhum item</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Comparativo por Município */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-indigo-500">🏘️</span>
                                <h2 className="text-xl font-bold text-[#199A8E]">Comparativo por Município</h2>
                            </div>

                            <div className="mb-6 max-w-md">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Detalhar Município Específico</label>
                                <SearchableSelect
                                    options={estatisticasMunicipio.map(m => m.municipio)}
                                    value={municipioSelecionado}
                                    onChange={setMunicipioSelecionado}
                                    placeholder="Todos os municípios..."
                                    searchPlaceholder="Buscar cidade..."
                                />
                            </div>

                            {!municipioSelecionado ? (
                                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="sticky top-0 bg-white">
                                            <tr className="bg-gray-100">
                                                <th className="text-left py-3 px-4 rounded-l-lg">Município</th>
                                                <th className="text-center py-3 px-4">Klini</th>
                                                <th className="text-center py-3 px-4">{getNomeConcorrenteDisplay()}</th>
                                                <th className="text-center py-3 px-4">Diferença</th>
                                                <th className="text-center py-3 px-4 rounded-r-lg">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {estatisticasMunicipio.slice(0, 20).map((m, idx) => {
                                                const status = getStatus(m.kliniTotal, m.concTotal);
                                                return (
                                                    <tr key={idx} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setMunicipioSelecionado(m.municipio)}>
                                                        <td className="py-3 px-4 font-medium text-[#199A8E]">{m.municipio}</td>
                                                        <td className="text-center py-3 px-4">{m.kliniTotal}</td>
                                                        <td className="text-center py-3 px-4">{m.concTotal}</td>
                                                        <td className="text-center py-3 px-4">{m.diferenca >= 0 ? '+' : ''}{m.diferenca}</td>
                                                        <td className="text-center py-3 px-4">
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>{status.text}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : municipioInfo && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-800">📍 {municipioSelecionado}</h3>
                                        <button onClick={() => setMunicipioSelecionado('')} className="text-sm text-[#199A8E] hover:underline">Ver todos</button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-[#199A8E]/10 rounded-lg">
                                            <p className="text-2xl font-bold text-[#199A8E]">{municipioInfo.kliniTotal}</p>
                                            <p className="text-sm text-gray-600">Klini</p>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                                            <p className="text-2xl font-bold text-orange-500">{municipioInfo.concTotal}</p>
                                            <p className="text-sm text-gray-600">{getNomeConcorrenteDisplay()}</p>
                                        </div>
                                        <div className="text-center p-4 bg-gray-100 rounded-lg">
                                            <p className={`text-2xl font-bold ${municipioInfo.diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {municipioInfo.diferenca >= 0 ? '+' : ''}{municipioInfo.diferenca}
                                            </p>
                                            <p className="text-sm text-gray-600">Diferença</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-700 mb-3">🏥 Por Tipo de Prestador</h4>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2">Tipo</th>
                                                    <th className="text-center py-2">Klini</th>
                                                    <th className="text-center py-2">{getNomeConcorrenteDisplay()}</th>
                                                    <th className="text-center py-2">Dif</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...new Set([...Object.keys(municipioInfo.kliniTipos), ...Object.keys(municipioInfo.concTipos)])].map(tipo => {
                                                    const k = municipioInfo.kliniTipos[tipo] || 0;
                                                    const c = municipioInfo.concTipos[tipo] || 0;
                                                    const s = getStatus(k, c);
                                                    return (
                                                        <tr key={tipo} className="border-b">
                                                            <td className="py-2">{tipo}</td>
                                                            <td className="text-center py-2">{k}</td>
                                                            <td className="text-center py-2">{c}</td>
                                                            <td className="text-center py-2"><span className={`px-2 py-0.5 rounded text-xs ${s.color}`}>{s.text}</span></td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-700 mb-3">🩺 Por Especialidade (Top 10)</h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-medium text-[#199A8E] mb-2">Klini</p>
                                                {Object.entries(municipioInfo.kliniEsp).slice(0, 10).map(([esp, count]) => (
                                                    <div key={esp} className="flex justify-between py-1 text-sm border-b border-gray-200">
                                                        <span className="truncate mr-2">{esp}</span>
                                                        <span className="font-medium text-[#199A8E]">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-orange-500 mb-2">{getNomeConcorrenteDisplay()}</p>
                                                {Object.entries(municipioInfo.concEsp).slice(0, 10).map(([esp, count]) => (
                                                    <div key={esp} className="flex justify-between py-1 text-sm border-b border-gray-200">
                                                        <span className="truncate mr-2">{esp}</span>
                                                        <span className="font-medium text-orange-500">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Comparativo por Estado */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-blue-500">🗺️</span>
                                <h2 className="text-xl font-bold text-[#199A8E]">Comparativo por Estado (UF)</h2>
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="text-left py-3 px-4 rounded-l-lg">UF</th>
                                        <th className="text-center py-3 px-4">Klini</th>
                                        <th className="text-center py-3 px-4">{getNomeConcorrenteDisplay()}</th>
                                        <th className="text-center py-3 px-4">Comparativo</th>
                                        <th className="text-center py-3 px-4 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todasAsUFs.map(uf => {
                                        const kliniVal = ufsKlini[uf] || 0;
                                        const concVal = ufsConcorrente[uf] || 0;
                                        const maxVal = Math.max(kliniVal, concVal, 1);
                                        const status = getStatus(kliniVal, concVal);
                                        return (
                                            <tr key={uf} className="border-b">
                                                <td className="py-3 px-4 font-medium">{uf}</td>
                                                <td className="text-center py-3 px-4">{kliniVal}</td>
                                                <td className="text-center py-3 px-4">{concVal}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <div className="flex-1 flex items-center">
                                                            <div className="h-4 bg-[#199A8E] rounded-l" style={{ width: `${(kliniVal / maxVal) * 100}%` }}></div>
                                                            <span className="text-xs text-[#199A8E] ml-1">{kliniVal}</span>
                                                        </div>
                                                        <div className="flex-1 flex items-center">
                                                            <div className="h-4 bg-orange-400 rounded-r" style={{ width: `${(concVal / maxVal) * 100}%` }}></div>
                                                            <span className="text-xs text-orange-500 ml-1">{concVal}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>{status.text}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Comparativo por Especialidade */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-teal-500">🩺</span>
                                <h2 className="text-xl font-bold text-[#199A8E]">Comparativo por Especialidade (Top 15)</h2>
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="text-left py-3 px-4 rounded-l-lg">Especialidade</th>
                                        <th className="text-center py-3 px-4">Klini</th>
                                        <th className="text-center py-3 px-4">{getNomeConcorrenteDisplay()}</th>
                                        <th className="text-center py-3 px-4">Comparativo</th>
                                        <th className="text-center py-3 px-4 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todasAsEsp.slice(0, 15).map(esp => {
                                        const kliniVal = espKlini[esp] || 0;
                                        const concVal = espConcorrente[esp] || 0;
                                        const maxVal = Math.max(kliniVal, concVal, 1);
                                        const status = getStatus(kliniVal, concVal);
                                        return (
                                            <tr key={esp} className="border-b">
                                                <td className="py-3 px-4 font-medium">{esp}</td>
                                                <td className="text-center py-3 px-4">{kliniVal}</td>
                                                <td className="text-center py-3 px-4">{concVal}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <div className="flex-1 flex items-center">
                                                            <div className="h-4 bg-[#199A8E] rounded-l" style={{ width: `${(kliniVal / maxVal) * 100}%` }}></div>
                                                            <span className="text-xs text-[#199A8E] ml-1">{kliniVal}</span>
                                                        </div>
                                                        <div className="flex-1 flex items-center">
                                                            <div className="h-4 bg-orange-400 rounded-r" style={{ width: `${(concVal / maxVal) * 100}%` }}></div>
                                                            <span className="text-xs text-orange-500 ml-1">{concVal}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>{status.text}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Modal de Mapeamento */}
                {mostrarMapeamento && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-semibold mb-4">Mapear Colunas da Planilha</h3>
                            <p className="text-sm text-gray-600 mb-4">Selecione quais colunas correspondem a cada campo:</p>
                            {['nome', 'especialidade', 'uf', 'municipio', 'categoria'].map(campo => (
                                <div key={campo} className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                        {campo === 'uf' ? 'UF' : campo}{campo === 'nome' && <span className="text-red-500">*</span>}
                                    </label>
                                    <select value={mapeamento[campo]} onChange={(e) => setMapeamento({ ...mapeamento, [campo]: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg">
                                        <option value="">Não mapear</option>
                                        {colunasDisponiveis.map((col, idx) => (<option key={idx} value={col}>{col}</option>))}
                                    </select>
                                </div>
                            ))}
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setMostrarMapeamento(false)} className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                                <button onClick={aplicarMapeamento} className="flex-1 py-2 px-4 bg-[#199A8E] text-white rounded-lg hover:bg-[#148578]">Aplicar</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
