import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, Activity, CheckCircle2, Clock,
    AlertCircle, Trash2, Edit3, X,
    ChevronDown, ChevronRight, ChevronUp,
    BarChart3, Target, Calendar, Users,
    LayoutGrid, FileText, Search, Filter,
    User, Mail, Phone, MapPin, Stethoscope,
    Box, Paperclip, AlertTriangle, Printer,
    ArrowLeft, ArrowRight, Loader2, Save
} from 'lucide-react';

const SITUACAO = {
    'Aguardando Análise': { color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
    'Aguardando Desempatador': { color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    'Aguardando Visualização de Abertura': { color: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-50' },
    'Finalizado': { color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' }
};

const DOC_TYPES = [
    { id: 'aberturaBeneficiario', label: 'Abertura Beneficiários' },
    { id: 'aberturaFechamentoMedica', label: 'Abertura/Fechamento Médica' },
    { id: 'desempatador', label: 'Desempatador: Escolha' },
    { id: 'parecerFinal', label: 'Parecer Final' },
    { id: 'emailConfirmacaoMedico', label: 'Email Confirmação Recebimento Médico' },
    { id: 'beneficiarioAberturaFechamento', label: 'Beneficiário - Abertura/Fechamento' },
    { id: 'confirmacaoRecebimento', label: 'Confirmação de Recebimento' }
];

export default function MedicalControl() {
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Form State
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        requisicao: '',
        ben_nome: '', ben_cpf: '', ben_email: '', ben_sexo: '', ben_nascimento: '', ben_telefone: '', ben_estado: '', ben_cidade: '',
        aud_nome: '', aud_estado: '', aud_crm: '', aud_data: '',
        ass_nome: '', ass_crm: '', ass_email: '', ass_telefone: '', ass_endereco: '', ass_especialidade: '',
        div_especialidade: '', div_motivos: [],
        prazo_ans: ''
    });
    const [procedures, setProcedures] = useState([{ codigo: '', descricao: '', qtd_solicitada: 1, qtd_autorizada: 0, justificativa: '' }]);
    const [materials, setMaterials] = useState([{ descricao: '', qtd_solicitada: 1, qtd_autorizada: 0, justificativa: '' }]);
    const [attachments, setAttachments] = useState([]);

    // Detail/Status Modal
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('medical_requests')
                .select('*, medical_procedures(*), medical_materials(*), medical_attachments(*)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setRequests(data || []);
        } catch (e) {
            console.error('Erro ao carregar juntas:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        try {
            // Sanitization: convert empty strings to null (especially for dates)
            const sanitizedData = { ...formData };
            ['ben_nascimento', 'aud_data', 'prazo_ans'].forEach(field => {
                if (sanitizedData[field] === '') sanitizedData[field] = null;
            });

            // 1. Insert Main Request
            const { data: requestData, error: requestError } = await supabase
                .from('medical_requests')
                .insert([sanitizedData])
                .select();
            if (requestError) throw requestError;

            const requestId = requestData[0].id;

            // 2. Insert Procedures
            if (procedures.length > 0) {
                const { error: procError } = await supabase
                    .from('medical_procedures')
                    .insert(procedures.map(p => ({ ...p, request_id: requestId })));
                if (procError) throw procError;
            }

            // 3. Insert Materials
            if (materials.length > 0) {
                const { error: matError } = await supabase
                    .from('medical_materials')
                    .insert(materials.map(m => ({ ...m, request_id: requestId })));
                if (matError) throw matError;
            }

            // 4. Attachments (Real file upload logic would go here, using metadata for now)
            if (attachments.length > 0) {
                const { error: attError } = await supabase
                    .from('medical_attachments')
                    .insert(attachments.map(a => ({
                        request_id: requestId,
                        file_name: a.name,
                        file_path: 'uploads/' + a.name
                    })));
                if (attError) throw attError;
            }

            setView('list');
            loadRequests();
            resetForm();
        } catch (e) {
            alert('Erro ao salvar junta médica: ' + e.message);
        }
    };

    const resetForm = () => {
        setFormData({
            requisicao: '',
            ben_nome: '', ben_cpf: '', ben_email: '', ben_sexo: '', ben_nascimento: '', ben_telefone: '', ben_estado: '', ben_cidade: '',
            aud_nome: '', aud_estado: '', aud_crm: '', aud_data: '',
            ass_nome: '', ass_crm: '', ass_email: '', ass_telefone: '', ass_endereco: '', ass_especialidade: '',
            div_especialidade: '', div_motivos: [],
            prazo_ans: ''
        });
        setProcedures([{ codigo: '', descricao: '', qtd_solicitada: 1, qtd_autorizada: 0, justificativa: '' }]);
        setMaterials([{ descricao: '', qtd_solicitada: 1, qtd_autorizada: 0, justificativa: '' }]);
        setAttachments([]);
        setCurrentStep(0);
    };

    const filteredRequests = requests.filter(r => {
        const matchSearch = r.ben_nome.toLowerCase().includes(searchTerm.toLowerCase()) || r.requisicao.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === '' || r.situacao === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: requests.length,
        abertos: requests.filter(r => r.situacao !== 'Finalizado').length,
        aguardando: requests.filter(r => r.situacao === 'Aguardando Análise').length,
        finalizados: requests.filter(r => r.situacao === 'Finalizado').length
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="text-indigo-600 animate-spin" size={48} />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#074F4B] to-[#1D7874] rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[#3BB3AD] w-fit mb-6">
                            Módulo de Regulação
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
                            Junta Médica & Odontológica
                        </h1>
                        <p className="text-xl text-white/70 font-medium">Gestão técnica de divergências Klini</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {view === 'list' ? (
                            <button
                                onClick={() => setView('form')}
                                className="bg-[#3BB3AD] hover:bg-[#2a9d97] text-white px-8 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-950/20 flex items-center gap-2"
                            >
                                <Plus size={20} /> Nova Junta
                            </button>
                        ) : (
                            <button
                                onClick={() => setView('list')}
                                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all backdrop-blur-md flex items-center gap-2 border border-white/10"
                            >
                                <ArrowLeft size={20} /> Voltar à Listagem
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {view === 'list' ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCard icon={<BarChart3 />} label="Total de Registros" value={stats.total} color="primary" />
                        <StatCard icon={<Activity />} label="Cadastros Abertos" value={stats.abertos} color="warning" />
                        <StatCard icon={<Clock />} label="Aguardando Análise" value={stats.aguardando} color="info" />
                        <StatCard icon={<CheckCircle2 />} label="Finalizados" value={stats.finalizados} color="success" />
                    </div>

                    {/* Table Filters */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por beneficiário ou requisição..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-[#1D7874]/10 outline-none font-bold text-slate-600"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-[#1D7874]/10 min-w-[240px]"
                        >
                            <option value="">Todos os status</option>
                            {Object.keys(SITUACAO).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Requests Table */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requisição</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficiário</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Situação</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredRequests.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <span className="font-black text-[#1D7874]">{r.requisicao}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="font-bold text-slate-800">{r.ben_nome}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{r.ben_cpf}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${SITUACAO[r.situacao]?.textColor} ${SITUACAO[r.situacao]?.bgLight}`}>
                                                    {r.situacao}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedRequest(r); setShowStatusModal(true); }}
                                                        className="p-3 text-[#1D7874] bg-slate-50 hover:bg-[#1D7874] hover:text-white rounded-xl transition-all"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedRequest(r); setShowReportModal(true); }}
                                                        className="p-3 text-indigo-600 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Stepper Sidebar */}
                    <div className="w-full lg:w-80 space-y-2">
                        {[
                            { title: 'Beneficiário', sub: 'Dados pessoais', icon: <User /> },
                            { title: 'Médico Auditor', sub: 'Dados do auditor', icon: <Activity /> },
                            { title: 'Médico Assistente', sub: 'Dados do assistente', icon: <Stethoscope /> },
                            { title: 'Procedimentos', sub: 'Lista técnica', icon: <FileText /> },
                            { title: 'Materiais', sub: 'Lista de OPME', icon: <Box /> },
                            { title: 'Anexos', sub: 'Documentação', icon: <Paperclip /> },
                            { title: 'Divergência', sub: 'Motivação técnica', icon: <AlertTriangle /> }
                        ].map((s, idx) => (
                            <div
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${currentStep === idx ? 'bg-[#1D7874] text-white shadow-lg border-[#1D7874]' : 'bg-white text-slate-400 border-slate-100 hover:border-[#1D7874]/30 hover:text-slate-600'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentStep === idx ? 'bg-white/20' : 'bg-slate-50 text-slate-300'}`}>
                                    {s.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">{s.title}</p>
                                    <p className={`text-[10px] ${currentStep === idx ? 'text-white/60' : 'text-slate-400'}`}>{s.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Step Form Content */}
                    <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
                        {/* Step 0: Beneficiário */}
                        {currentStep === 0 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <FormHeader icon={<User />} title="Dados do Beneficiário" sub="Informações pessoais do paciente para abertura da junta." />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="CPF" required value={formData.ben_cpf} onChange={v => setFormData({ ...formData, ben_cpf: v })} placeholder="000.000.000-00" />
                                    <Input label="Nome Completo" required value={formData.ben_nome} onChange={v => setFormData({ ...formData, ben_nome: v })} placeholder="Nome do paciente" />
                                    <Input label="E-mail" value={formData.ben_email} onChange={v => setFormData({ ...formData, ben_email: v })} placeholder="email@exemplo.com" />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
                                        <select
                                            value={formData.ben_sexo}
                                            onChange={e => setFormData({ ...formData, ben_sexo: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1D7874]/10 transition-all"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Feminino">Feminino</option>
                                        </select>
                                    </div>
                                    <Input label="Data de Nascimento" type="date" value={formData.ben_nascimento} onChange={v => setFormData({ ...formData, ben_nascimento: v })} />
                                    <Input label="Telefone" value={formData.ben_telefone} onChange={v => setFormData({ ...formData, ben_telefone: v })} placeholder="(00) 00000-0000" />
                                    <Input label="Estado" value={formData.ben_estado} onChange={v => setFormData({ ...formData, ben_estado: v })} placeholder="UF" />
                                    <Input label="Cidade" value={formData.ben_cidade} onChange={v => setFormData({ ...formData, ben_cidade: v })} placeholder="Nome da cidade" />
                                </div>
                            </div>
                        )}

                        {/* Step 1: Médico Auditor */}
                        {currentStep === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <FormHeader icon={<Activity />} title="Dados do Médico Auditor" sub="Informações do profissional responsável pela análise técnica." />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Número da Requisição" required value={formData.requisicao} onChange={v => setFormData({ ...formData, requisicao: v })} placeholder="EX: REQ-2025-0001" />
                                    <Input label="Nome do Médico" required value={formData.aud_nome} onChange={v => setFormData({ ...formData, aud_nome: v })} placeholder="Dr. Nome Completo" />
                                    <Input label="CRM/CRO" required value={formData.aud_crm} onChange={v => setFormData({ ...formData, aud_crm: v })} placeholder="00000" />
                                    <Input label="Estado (CRM)" value={formData.aud_estado} onChange={v => setFormData({ ...formData, aud_estado: v })} placeholder="UF" />
                                    <Input label="Data do Atendimento" type="date" value={formData.aud_data} onChange={v => setFormData({ ...formData, aud_data: v })} />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Médico Assistente */}
                        {currentStep === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <FormHeader icon={<Stethoscope />} title="Dados do Médico Assistente" sub="Informações do médico que solicitou o procedimento." />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Nome" required value={formData.ass_nome} onChange={v => setFormData({ ...formData, ass_nome: v })} placeholder="Dr. Nome Completo" />
                                    <Input label="CRM/CRO" required value={formData.ass_crm} onChange={v => setFormData({ ...formData, ass_crm: v })} placeholder="00000" />
                                    <Input label="E-mail" value={formData.ass_email} onChange={v => setFormData({ ...formData, ass_email: v })} placeholder="email@exemplo.com" />
                                    <Input label="Telefone" value={formData.ass_telefone} onChange={v => setFormData({ ...formData, ass_telefone: v })} placeholder="(00) 00000-0000" />
                                    <Input label="Especialidade" required value={formData.ass_especialidade} onChange={v => setFormData({ ...formData, ass_especialidade: v })} placeholder="Ex: Cardiologia" />
                                    <div className="md:col-span-2">
                                        <Input label="Endereço" value={formData.ass_endereco} onChange={v => setFormData({ ...formData, ass_endereco: v })} placeholder="Endereço completo da clínica/hospital" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Procedimentos */}
                        {currentStep === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <div className="flex items-center justify-between">
                                    <FormHeader icon={<FileText />} title="Procedimentos" sub="Lista de procedimentos técnicos solicitados." />
                                    <button
                                        onClick={() => setProcedures([...procedures, { codigo: '', descricao: '', qtd_solicitada: 1, qtd_autorizada: 0, justificativa: '' }])}
                                        className="p-3 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {procedures.map((p, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                            <button
                                                onClick={() => setProcedures(procedures.filter((_, i) => i !== idx))}
                                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <Input label="Código" value={p.codigo} onChange={v => {
                                                    const newP = [...procedures];
                                                    newP[idx].codigo = v;
                                                    setProcedures(newP);
                                                }} placeholder="00.00.00.00-0" />
                                                <div className="md:col-span-2">
                                                    <Input label="Descrição" required value={p.descricao} onChange={v => {
                                                        const newP = [...procedures];
                                                        newP[idx].descricao = v;
                                                        setProcedures(newP);
                                                    }} placeholder="Nome do procedimento" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input label="Qtd. Sol." type="number" value={p.qtd_solicitada} onChange={v => {
                                                        const newP = [...procedures];
                                                        newP[idx].qtd_solicitada = v;
                                                        setProcedures(newP);
                                                    }} />
                                                    <Input label="Qtd. Aut." type="number" value={p.qtd_autorizada} onChange={v => {
                                                        const newP = [...procedures];
                                                        newP[idx].qtd_autorizada = v;
                                                        setProcedures(newP);
                                                    }} />
                                                </div>
                                                <div className="md:col-span-4 mt-2">
                                                    <Input label="Justificativa" value={p.justificativa} onChange={v => {
                                                        const newP = [...procedures];
                                                        newP[idx].justificativa = v;
                                                        setProcedures(newP);
                                                    }} placeholder="Justificativa técnica (opcional)" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Materiais */}
                        {currentStep === 4 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <div className="flex items-center justify-between">
                                    <FormHeader icon={<Box />} title="Materiais & OPME" sub="Lista de materiais técnicos e próteses." />
                                    <button
                                        onClick={() => setMaterials([...materials, { descricao: '', qtd_solicitada: 1, qtd_autorizada: 0, justificativa: '' }])}
                                        className="p-3 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {materials.map((m, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                            <button
                                                onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}
                                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="md:col-span-2">
                                                    <Input label="Descrição" required value={m.descricao} onChange={v => {
                                                        const newM = [...materials];
                                                        newM[idx].descricao = v;
                                                        setMaterials(newM);
                                                    }} placeholder="Nome do material" />
                                                </div>
                                                <Input label="Qtd. Solicitada" type="number" value={m.qtd_solicitada} onChange={v => {
                                                    const newM = [...materials];
                                                    newM[idx].qtd_solicitada = v;
                                                    setMaterials(newM);
                                                }} />
                                                <Input label="Qtd. Autorizada" type="number" value={m.qtd_autorizada} onChange={v => {
                                                    const newM = [...materials];
                                                    newM[idx].qtd_autorizada = v;
                                                    setMaterials(newM);
                                                }} />
                                                <div className="md:col-span-4 mt-2">
                                                    <Input label="Justificativa" value={m.justificativa} onChange={v => {
                                                        const newM = [...materials];
                                                        newM[idx].justificativa = v;
                                                        setMaterials(newM);
                                                    }} placeholder="Justificativa técnica (opcional)" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 5: Anexos */}
                        {currentStep === 5 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <FormHeader icon={<Paperclip />} title="Anexos & Documentação" sub="Faça o upload de documentos de apoio." />
                                <div
                                    className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center group hover:border-[#1D7874]/30 hover:bg-slate-50/50 transition-all cursor-pointer"
                                    onClick={() => document.getElementById('medical-file-input').click()}
                                >
                                    <input
                                        type="file" id="medical-file-input" multiple className="hidden"
                                        onChange={e => setAttachments([...attachments, ...Array.from(e.target.files)])}
                                    />
                                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <Plus size={40} />
                                    </div>
                                    <p className="text-xl font-black text-slate-800 mb-2">Selecione os arquivos</p>
                                    <p className="text-slate-400 font-medium max-w-xs mx-auto">Formatos: PDF, PNG, JPG, DOCX, MP3 ou WAV</p>
                                </div>
                                {attachments.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                        {attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-teal-50 border border-teal-100 rounded-2xl group">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="text-teal-600" size={20} />
                                                    <span className="text-xs font-bold text-teal-900 truncate max-w-[200px]">{file.name}</span>
                                                </div>
                                                <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="p-2 text-teal-400 hover:text-red-500 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 6: Divergência */}
                        {currentStep === 6 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <FormHeader icon={<AlertTriangle />} title="Divergência Técnica" sub="Motivação técnica para a instauração da junta." />
                                <div className="space-y-6">
                                    <Input label="Especialidade da Divergência" required value={formData.div_especialidade} onChange={v => setFormData({ ...formData, div_especialidade: v })} placeholder="Ex: Ortopedia / Oncologia" />
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo da Divergência Técnico-Assistencial</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                "Indicação clínica do procedimento",
                                                "Medicamento",
                                                "Órtese, prótese e OPME",
                                                "Outros"
                                            ].map(m => (
                                                <Checkbox
                                                    key={m} label={m}
                                                    checked={formData.div_motivos.includes(m)}
                                                    onChange={checked => {
                                                        const newMotivos = checked
                                                            ? [...formData.div_motivos, m]
                                                            : formData.div_motivos.filter(item => item !== m);
                                                        setFormData({ ...formData, div_motivos: newMotivos });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step Navigation */}
                        <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-50">
                            <button
                                disabled={currentStep === 0}
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                            >
                                Voltar
                            </button>
                            {currentStep < 6 ? (
                                <button
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    className="bg-[#1D7874] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-teal-200"
                                >
                                    Próximo Passo
                                </button>
                            ) : (
                                <button
                                    onClick={handleCreateRequest}
                                    className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-200 flex items-center gap-2"
                                >
                                    Finalizar Cadastro <CheckCircle2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Internal Components
function StatCard({ icon, label, value, color }) {
    const colors = {
        primary: 'bg-[#1D7874]/10 text-[#1D7874] border-[#1D7874]/20',
        warning: 'bg-amber-100 text-amber-600 border-amber-200',
        info: 'bg-blue-100 text-blue-600 border-blue-200',
        success: 'bg-emerald-100 text-emerald-600 border-emerald-200'
    };
    return (
        <div className="bg-white rounded-[1.5rem] p-6 shadow-xl border border-slate-100">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${colors[color]} border`}>{icon}</div>
                <div>
                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest line-clamp-1">{label}</p>
                </div>
            </div>
        </div>
    );
}

function FormHeader({ icon, title, sub }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-[#1D7874] flex items-center justify-center border border-[#1D7874]/10 shadow-sm">
                {icon}
            </div>
            <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
                <p className="text-slate-400 text-sm font-medium">{sub}</p>
            </div>
        </div>
    );
}

function Input({ label, required, value, onChange, placeholder, type = "text" }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {label} {required && <span className="text-red-500 font-black">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 placeholder:text-slate-300 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1D7874]/10 transition-all"
            />
        </div>
    );
}

function Checkbox({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer group transition-all hover:bg-slate-100">
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? 'bg-[#1D7874] border-[#1D7874]' : 'border-slate-300 bg-white group-hover:border-[#1D7874]'}`}>
                {checked && <X size={14} className="text-white" />}
            </div>
            <span className="text-sm font-bold text-slate-600 transition-colors group-hover:text-slate-900">{label}</span>
            <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
        </label>
    );
}
