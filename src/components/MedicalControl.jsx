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
    ArrowLeft, ArrowRight, Loader2, Save, Download, Search as SearchIcon
} from 'lucide-react';
import TUSS_DATA from '../data/tuss.json';

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
    { id: 'emailConfirmacaoMedico', label: 'Confirmação Recebimento Médico' },
    { id: 'beneficiarioAberturaFechamento', label: 'Fechamento Beneficiários' },
    { id: 'confirmacaoRecebimento', label: 'Confirmação de Recebimento' }
];

export default function MedicalControl() {
    const [view, setView] = useState('list'); // 'list', 'form', or 'details'
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
    const [uploadingInternal, setUploadingInternal] = useState(null); // id do tipo de doc sendo enviado

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

            let requestId;

            if (selectedRequest && view === 'form') {
                // UPDATE MODE
                const { data: updateData, error: updateError } = await supabase
                    .from('medical_requests')
                    .update(sanitizedData)
                    .eq('id', selectedRequest.id)
                    .select();

                if (updateError) throw updateError;
                requestId = selectedRequest.id;

                // For procedures/materials, simplified strategy: delete all and re-insert 
                // (or smart diff if we had IDs, but re-insert is safer for consistency here)
                await supabase.from('medical_procedures').delete().eq('request_id', requestId);
                await supabase.from('medical_materials').delete().eq('request_id', requestId);
            } else {
                // CREATE MODE
                const { data: requestData, error: requestError } = await supabase
                    .from('medical_requests')
                    .insert([sanitizedData])
                    .select();
                if (requestError) throw requestError;
                requestId = requestData[0].id;
            }

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

            // 4. Attachments (Supabase Storage upload)
            if (attachments.length > 0) {
                const uploadPromises = attachments.map(async (file) => {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                    const filePath = `${requestId}/${fileName}`; // Folder is the requestId

                    const { error: uploadError } = await supabase.storage
                        .from('medical-board')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error('Erro de upload Supabase:', uploadError);
                        throw uploadError;
                    }

                    return {
                        request_id: requestId,
                        file_name: file.name,
                        file_path: filePath
                    };
                });

                const uploadedAttachments = await Promise.all(uploadPromises);

                const { error: attError } = await supabase
                    .from('medical_attachments')
                    .insert(uploadedAttachments);

                if (attError) throw attError;
            }

            setView('list');
            loadRequests();
            resetForm();
            setSelectedRequest(null);
        } catch (e) {
            alert('Erro ao salvar junta médica: ' + e.message);
        }
    };

    const handleEditRequest = (request) => {
        setSelectedRequest(request);
        setFormData({
            requisicao: request.requisicao,
            ben_nome: request.ben_nome, ben_cpf: request.ben_cpf, ben_email: request.ben_email || '', ben_sexo: request.ben_sexo, ben_nascimento: request.ben_nascimento, ben_telefone: request.ben_telefone || '', ben_estado: request.ben_estado || '', ben_cidade: request.ben_cidade || '',
            aud_nome: request.aud_nome, aud_estado: request.aud_estado || '', aud_crm: request.aud_crm, aud_data: request.aud_data,
            ass_nome: request.ass_nome, ass_crm: request.ass_crm, ass_email: request.ass_email || '', ass_telefone: request.ass_telefone || '', ass_endereco: request.ass_endereco || '', ass_especialidade: request.ass_especialidade || '',
            div_especialidade: request.div_especialidade || '', div_motivos: request.div_motivos || [],
            prazo_ans: request.prazo_ans || ''
        });

        // Clean up procedures/materials to match form structure
        setProcedures(request.medical_procedures?.map(p => ({
            codigo: p.codigo || '',
            descricao: p.descricao,
            qtd_solicitada: p.qtd_solicitada,
            qtd_autorizada: p.qtd_autorizada,
            justificativa: p.justificativa || ''
        })) || []);

        setMaterials(request.medical_materials?.map(m => ({
            descricao: m.descricao,
            qtd_solicitada: m.qtd_solicitada,
            qtd_autorizada: m.qtd_autorizada,
            justificativa: m.justificativa || ''
        })) || []);

        setAttachments([]); // Reset new attachments (existing ones remain in DB/Storage)
        setView('form');
        setCurrentStep(0);
    };

    const handleDownloadPDF = () => {
        const content = document.getElementById('printable-report-content');
        if (!content) return;

        // Create a dedicated print container at the body level
        const printContainer = document.createElement('div');
        printContainer.id = 'print-container';

        // Clone the report
        const clonedContent = content.cloneNode(true);
        printContainer.appendChild(clonedContent);
        document.body.appendChild(printContainer);

        // Store original title and set new one for PDF naming
        const originalTitle = document.title;
        document.title = `Relatorio_Klini_${selectedRequest.requisicao}`;

        // Trigger print
        window.print();

        // Cleanup
        const cleanup = () => {
            document.title = originalTitle; // Restore title
            if (document.body.contains(printContainer)) {
                document.body.removeChild(printContainer);
            }
            window.removeEventListener('afterprint', cleanup);
        };

        window.addEventListener('afterprint', cleanup);

        // Fallback cleanup
        setTimeout(cleanup, 2000);
    };

    const getPendingDocsCount = (request) => {
        if (!request) return 0;
        const docs = request.documentos_internos || {};
        let count = 0;
        DOC_TYPES.forEach(type => {
            if (!docs[type.id] || docs[type.id].length === 0) {
                count++;
            }
        });
        return count;
    };

    const handleInternalFileUpload = async (e, typeId) => {
        const file = e.target.files[0];
        if (!file || !selectedRequest) return;

        setUploadingInternal(typeId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `internal/${selectedRequest.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('medical-board')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL or just store path
            const { data: { publicUrl } } = supabase.storage.from('medical-board').getPublicUrl(filePath);

            const newDoc = {
                name: file.name,
                path: filePath,
                url: publicUrl,
                uploaded_at: new Date().toISOString()
            };

            // Update JSONB in database
            const updatedDocs = { ...selectedRequest.documentos_internos };
            if (!updatedDocs[typeId]) updatedDocs[typeId] = [];
            updatedDocs[typeId].push(newDoc);

            const { error: updateError } = await supabase
                .from('medical_requests')
                .update({ documentos_internos: updatedDocs })
                .eq('id', selectedRequest.id);

            if (updateError) throw updateError;

            // Update local state
            setSelectedRequest({ ...selectedRequest, documentos_internos: updatedDocs });
            loadRequests();
        } catch (e) {
            console.error('Detalhes do erro de upload:', e);
            alert(`Erro no upload: ${e.message || e.error_description || 'Erro desconhecido'}. \n\nVerifique se o bucket "medical-board" foi criado no Supabase e se as permissões de RLS permitem upload.`);
        } finally {
            setUploadingInternal(null);
            e.target.value = '';
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
                            Junta Médica
                        </h1>
                        <p className="text-xl text-white/70 font-medium">Gestão técnica de divergências Klini</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {view === 'list' ? (
                            <button
                                onClick={() => {
                                    setView('form');
                                    setSelectedRequest(null);
                                    resetForm();
                                }}
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
                                                        onClick={() => { setSelectedRequest(r); setView('details'); }}
                                                        className="p-3 text-blue-600 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                                        title="Ver Detalhes"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedRequest(r); setShowStatusModal(true); }}
                                                        className="p-3 text-[#1D7874] bg-slate-50 hover:bg-[#1D7874] hover:text-white rounded-xl transition-all relative"
                                                    >
                                                        <Activity size={18} />
                                                        {getPendingDocsCount(r) > 0 && (
                                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                                                {getPendingDocsCount(r)}
                                                            </span>
                                                        )}
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
            ) : view === 'details' ? (
                <RequestDetails
                    request={selectedRequest}
                    onEdit={() => handleEditRequest(selectedRequest)}
                    onBack={() => setView('list')}
                />
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
                                    <Input
                                        label="Especialidade" required
                                        value={formData.ass_especialidade}
                                        onChange={v => setFormData({ ...formData, ass_especialidade: v, div_especialidade: v })}
                                        placeholder="Ex: Cardiologia"
                                    />
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
                                                <div className="md:col-span-3">
                                                    <TussAutocomplete
                                                        value={p}
                                                        onChange={(newValues) => {
                                                            const newP = [...procedures];
                                                            newP[idx] = { ...newP[idx], ...newValues };
                                                            setProcedures(newP);
                                                        }}
                                                    />
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
                    {/* Medical Report Modal */}
                    {
                        showReportModal && selectedRequest && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                                <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-white/20">
                                    {/* Control Header (Hidden on Print) */}
                                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-teal-700 text-white rounded-2xl shadow-lg shadow-teal-200">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Visualização do Relatório</h3>
                                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Protocolo: {selectedRequest.requisicao}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleDownloadPDF}
                                                className="bg-teal-700 hover:bg-teal-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-teal-100 flex items-center gap-2"
                                            >
                                                <Printer size={18} /> Imprimir / Salvar PDF
                                            </button>
                                            <button onClick={() => setShowReportModal(false)} className="p-4 hover:bg-slate-200 rounded-xl transition-all text-slate-400">
                                                <X size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Report Content Wrapper */}
                                    <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex justify-center">
                                        {/* The Actual Document Area - Visual Match for A4 */}
                                        <div
                                            id="printable-report-content"
                                            className="bg-white shadow-2xl border border-slate-200"
                                            style={{
                                                width: '210mm',
                                                minHeight: '297mm',
                                                fontFamily: "'Inter', sans-serif",
                                                padding: '15mm', // Match print padding
                                                margin: '0 auto',
                                                boxSizing: 'border-box',
                                                transform: 'scale(0.85)', // Scale down for better preview visibility
                                                transformOrigin: 'top center'
                                            }}
                                        >
                                            {/* Klini Header */}
                                            <div className="flex justify-between items-start border-b-[6px] border-[#1D7874] pb-8 mb-10 text-left">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3 text-teal-700">
                                                        <Activity size={48} className="stroke-[3]" />
                                                        <div>
                                                            <h1 className="text-4xl font-black tracking-tighter leading-none">KLINI</h1>
                                                            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Saúde & Bem-estar</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade de Regulação Técnica</p>
                                                        <p className="text-[10px] font-bold text-slate-500">Junta Médica e Odontológica Administrativa</p>
                                                    </div>
                                                </div>
                                                <div className="mt-8 md:mt-0 text-right">
                                                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 inline-block">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Protocolo do Processo</p>
                                                        <p className="text-3xl font-black text-teal-800 tracking-tighter">{selectedRequest.requisicao}</p>
                                                        <div className="flex items-center gap-2 justify-center mt-2 text-[10px] font-bold text-slate-500">
                                                            <Calendar size={12} /> Emitido em: {new Date().toLocaleDateString('pt-BR')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-10">
                                                {/* Section 1: Beneficiary */}
                                                <div className="relative text-left break-inside-avoid px-2">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-700 rounded-full"></div>
                                                    <div className="pl-8 space-y-6">
                                                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                                            <User className="text-teal-700" size={20} /> I. Identificação do Beneficiário
                                                        </h2>
                                                        <div className="grid grid-cols-6 gap-y-6 gap-x-8">
                                                            <ReportItem label="Nome do Paciente" value={selectedRequest.ben_nome} className="col-span-4" />
                                                            <ReportItem label="CPF" value={selectedRequest.ben_cpf} className="col-span-2" />
                                                            <ReportItem label="E-mail" value={selectedRequest.ben_email} className="col-span-3" />
                                                            <ReportItem label="Telefone" value={selectedRequest.ben_telefone} className="col-span-3" />
                                                            <ReportItem label="Data de Nascimento" value={selectedRequest.ben_nascimento ? new Date(selectedRequest.ben_nascimento).toLocaleDateString('pt-BR') : '-'} className="col-span-2" />
                                                            <ReportItem label="Sexo" value={selectedRequest.ben_sexo} className="col-span-2" />
                                                            <ReportItem label="Cidade/UF" value={`${selectedRequest.ben_cidade || '-'} / ${selectedRequest.ben_estado || '-'}`} className="col-span-2" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section 2: Professionals */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left break-inside-avoid">
                                                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                            <Activity className="text-teal-700" size={18} /> II. Médico Auditor
                                                        </h2>
                                                        <div className="space-y-4">
                                                            <ReportItem label="Profissional" value={selectedRequest.aud_nome} />
                                                            <div className="flex gap-8">
                                                                <ReportItem label="CRM/CRO" value={selectedRequest.aud_crm} />
                                                                <ReportItem label="Data Análise" value={selectedRequest.aud_data ? new Date(selectedRequest.aud_data).toLocaleDateString('pt-BR') : '-'} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                            <Stethoscope className="text-teal-700" size={18} /> III. Médico Assistente
                                                        </h2>
                                                        <div className="space-y-4">
                                                            <ReportItem label="Profissional" value={selectedRequest.ass_nome} />
                                                            <div className="flex gap-8">
                                                                <ReportItem label="CRM/CRO" value={selectedRequest.ass_crm} />
                                                                <ReportItem label="Especialidade" value={selectedRequest.ass_especialidade} />
                                                            </div>
                                                            <ReportItem label="Endereço Profissional" value={selectedRequest.ass_endereco} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section 3: Divergence */}
                                                <div className="bg-teal-50/50 rounded-[2.5rem] p-10 border border-teal-100 relative overflow-hidden text-left shadow-sm">
                                                    <AlertTriangle className="absolute -right-8 -bottom-8 text-teal-700/5 rotate-12" size={240} />
                                                    <h2 className="text-xl font-black text-teal-900 uppercase tracking-tight mb-8 flex items-center gap-3">
                                                        <AlertTriangle className="text-teal-700" size={20} /> IV. Divergência Técnico-Assistencial
                                                    </h2>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                                        <ReportItem label="Especialidade Afetada" value={selectedRequest.div_especialidade} />
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-black text-teal-700/60 uppercase tracking-widest">Motivações Identificadas</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {selectedRequest.div_motivos?.map((m, i) => (
                                                                    <span key={i} className="px-4 py-2 bg-white border border-teal-100 rounded-full text-xs font-bold text-teal-900 shadow-sm">{m}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section 4: Materials & OPME */}
                                                {selectedRequest.medical_materials?.length > 0 && (
                                                    <div className="space-y-6 text-left">
                                                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                                            <Box className="text-teal-700" size={20} /> V. Materiais & OPME
                                                        </h2>
                                                        <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50/30">
                                                            <table className="w-full text-left">
                                                                <thead className="bg-slate-50">
                                                                    <tr>
                                                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Material</th>
                                                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qtd. Solicitada</th>
                                                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qtd. Autorizada</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {selectedRequest.medical_materials.map((m, i) => (
                                                                        <tr key={i} className="bg-white">
                                                                            <td className="px-8 py-6">
                                                                                <div className="font-bold text-slate-700">{m.descricao}</div>
                                                                                {m.justificativa && <div className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-tighter">Obs: {m.justificativa}</div>}
                                                                            </td>
                                                                            <td className="px-8 py-6 text-sm font-black text-slate-400 text-center">{m.qtd_solicitada || 1}</td>
                                                                            <td className="px-8 py-6 text-sm font-black text-teal-700 text-center">{m.qtd_autorizada || 0}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Section 5: Procedures */}
                                                <div className="space-y-6 text-left">
                                                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                                        <FileText className="text-teal-700" size={20} /> VI. Lista de Procedimentos
                                                    </h2>
                                                    <div className="border border-slate-100 rounded-[2rem] overflow-hidden">
                                                        <table className="w-full text-left">
                                                            <thead className="bg-slate-50">
                                                                <tr>
                                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cód. TUSS</th>
                                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição Técnica</th>
                                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Solicitada</th>
                                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Autorizada</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                {selectedRequest.medical_procedures?.map((p, i) => (
                                                                    <tr key={i}>
                                                                        <td className="px-8 py-6 font-bold text-teal-700">{p.codigo || '-'}</td>
                                                                        <td className="px-8 py-6 text-sm font-medium text-slate-600">
                                                                            <div className="font-bold">{p.descricao}</div>
                                                                            {p.justificativa && <div className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-tighter">Nota: {p.justificativa}</div>}
                                                                        </td>
                                                                        <td className="px-8 py-6 text-sm font-black text-slate-400 text-center">{p.qtd_solicitada}</td>
                                                                        <td className="px-8 py-6 text-sm font-black text-teal-700 text-center">{p.qtd_autorizada}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Footer / Signatures */}
                                                <div className="pt-20 text-center space-y-20">
                                                    <div className="flex justify-center gap-24">
                                                        <div className="w-64 border-t border-slate-300 pt-4">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assinatura Auditor</p>
                                                        </div>
                                                        <div className="w-64 border-t border-slate-300 pt-4">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assinatura Coordenador</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">Este documento é original e confidencial da Klini Saúde - {selectedRequest.requisicao}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer Controls (Hidden on Print) */}
                                    <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 print:hidden">
                                        <button onClick={() => setShowReportModal(false)} className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-200 transition-all">
                                            Fechar Visualização
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Modal Status */}
                    {
                        showStatusModal && selectedRequest && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                                <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-200">
                                                <Activity size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Status do Processo</h3>
                                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{selectedRequest.requisicao}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-10 space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alterar Situação</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {Object.entries(SITUACAO).map(([status, config]) => (
                                                    <button
                                                        key={status}
                                                        onClick={async () => {
                                                            const { error } = await supabase.from('medical_requests').update({ situacao: status }).eq('id', selectedRequest.id);
                                                            if (!error) {
                                                                setSelectedRequest({ ...selectedRequest, situacao: status });
                                                                loadRequests();
                                                            }
                                                        }}
                                                        className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 group relative overflow-hidden ${selectedRequest.situacao === status
                                                            ? `${config.bgLight} border-teal-500 shadow-md`
                                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                                            }`}
                                                    >
                                                        <div className={`w-3 h-3 rounded-full ${config.color} shrink-0`} />
                                                        <span className={`text-sm font-bold ${selectedRequest.situacao === status ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                                            {status}
                                                        </span>
                                                        {selectedRequest.situacao === status && (
                                                            <div className="absolute top-2 right-2">
                                                                <CheckCircle2 size={12} className="text-teal-600" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between ml-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximas Etapas / Documentos</label>
                                                <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                                                    {getPendingDocsCount(selectedRequest)} Pendentes
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                id="internal-file-input"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const typeId = e.target.getAttribute('data-type-id');
                                                    handleInternalFileUpload(e, typeId);
                                                }}
                                            />
                                            <div className="grid grid-cols-1 gap-3">
                                                {DOC_TYPES.map(dt => (
                                                    <div key={dt.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4 group">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                                                                    <FileText size={16} />
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-600">{dt.label}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const input = document.getElementById('internal-file-input');
                                                                    input.setAttribute('data-type-id', dt.id);
                                                                    input.click();
                                                                }}
                                                                disabled={uploadingInternal === dt.id}
                                                                className="text-xs font-black text-teal-600 uppercase tracking-widest hover:text-teal-800 transition-all flex items-center gap-1 disabled:opacity-50"
                                                            >
                                                                {uploadingInternal === dt.id ? (
                                                                    <Loader2 size={12} className="animate-spin" />
                                                                ) : (
                                                                    <Plus size={12} />
                                                                )}
                                                                Anexar
                                                            </button>
                                                        </div>

                                                        {/* List of files for this type */}
                                                        {selectedRequest.documentos_internos?.[dt.id]?.length > 0 && (
                                                            <div className="space-y-2 border-t border-slate-200/50 pt-3">
                                                                {selectedRequest.documentos_internos[dt.id].map((doc, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                                                        <div className="flex items-center gap-2 text-slate-600">
                                                                            <Paperclip size={12} className="text-slate-300" />
                                                                            <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <a
                                                                                href={doc.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-teal-600 font-black hover:underline uppercase tracking-tighter"
                                                                            >
                                                                                Abrir
                                                                            </a>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    if (!confirm('Deseja remover este anexo?')) return;
                                                                                    const updatedDocs = { ...selectedRequest.documentos_internos };
                                                                                    updatedDocs[dt.id] = updatedDocs[dt.id].filter((_, i) => i !== idx);

                                                                                    const { error } = await supabase
                                                                                        .from('medical_requests')
                                                                                        .update({ documentos_internos: updatedDocs })
                                                                                        .eq('id', selectedRequest.id);

                                                                                    if (!error) {
                                                                                        setSelectedRequest({ ...selectedRequest, documentos_internos: updatedDocs });
                                                                                        loadRequests();
                                                                                    }
                                                                                }}
                                                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                                        <button onClick={() => setShowStatusModal(false)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200">
                                            Salvar Alterações
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
            );
}

            // Internal Components
            function StatCard({icon, label, value, color}) {
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

            function FormHeader({icon, title, sub}) {
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

            function Input({label, required, value, onChange, placeholder, type = "text"}) {
    return (
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {label} {required && <span className="text-red-500 font-black">*</span>}
                </label>
                <input
                    type={type}
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 placeholder:text-slate-300 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1D7874]/10 transition-all"
                />
            </div>
            );
}

            function Checkbox({label, checked, onChange}) {
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

            function ReportSection({title, icon, children}) {
    return (
            <div className="space-y-6 break-inside-avoid border-l-2 border-teal-50 pl-6">
                <div className="flex items-center gap-3 border-b-2 border-slate-50 pb-4">
                    <div className="text-teal-600">{icon}</div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{title}</h4>
                </div>
                {children}
            </div>
            );
}

            function ReportItem({label, value, className = ""}) {
    return (
            <div className={`${className} break-inside-avoid`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-700 leading-tight">{value || '-'}</p>
            </div>
            );
}

            function TussAutocomplete({value, onChange}) {
    const [search, setSearch] = useState('');
            const [showOptions, setShowOptions] = useState(false);
            const [results, setResults] = useState([]);

    const handleSearch = (term) => {
                setSearch(term);
            if (term.length < 2) {
                setResults([]);
            return;
        }

            const lowerTerm = term.toLowerCase();
        // Limit to 50 results for performance
        const filtered = TUSS_DATA.filter(item =>
            item.label.toLowerCase().includes(lowerTerm)
            ).slice(0, 50);

            setResults(filtered);
            setShowOptions(true);
    };

            // Derived state determining if a valid procedure is selected
            const isSelected = !!value.codigo;

            return (
            <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Procedimento (Busca TUSS) <span className="text-red-500 font-black">*</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {/* Visual fields for the selected values */}
                    <div className="md:col-span-1">
                        <input
                            readOnly
                            value={value.codigo}
                            placeholder="Código"
                            className="w-full px-6 py-4 rounded-2xl bg-slate-100 border border-slate-100 font-bold text-slate-500 outline-none cursor-not-allowed"
                        />
                    </div>
                    <div className="md:col-span-2 relative">
                        {isSelected ? (
                            <div className="relative">
                                <input
                                    readOnly
                                    value={value.descricao}
                                    className="w-full pl-6 pr-14 py-4 rounded-2xl bg-teal-50 border border-teal-100 font-bold text-teal-800 outline-none"
                                />
                                <button
                                    onClick={() => {
                                        onChange({ codigo: '', descricao: '' });
                                        setSearch('');
                                        setResults([]);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                                    title="Limpar seleção"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onFocus={() => {
                                        if (search.length >= 2) setShowOptions(true);
                                    }}
                                    placeholder="Digite o código ou nome do procedimento..."
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1D7874]/10 transition-all"
                                />

                                {showOptions && results.length > 0 && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto">
                                        {results.map((item) => (
                                            <button
                                                key={item.value}
                                                onClick={() => {
                                                    onChange({ codigo: item.code, descricao: item.description });
                                                    setShowOptions(false);
                                                }}
                                                className="w-full text-left px-6 py-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                                            >
                                                <span className="block text-xs font-black text-[#1D7874]">{item.code}</span>
                                                <span className="block text-sm font-bold text-slate-600">{item.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {showOptions && (
                                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowOptions(false)} />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            function RequestDetails({request, onEdit, onBack}) {
        if (!request) return null;

            return (
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-10 pb-8 border-b border-slate-100">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Detalhes do Processo</h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Protocolo: {request.requisicao}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onEdit}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                        >
                            <Edit3 size={18} /> Editar Dados
                        </button>
                        <button
                            onClick={onBack}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            Voltar
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><User size={20} className="text-teal-600" /> Beneficiário</h3>
                            <div className="space-y-4">
                                <ReportItem label="Nome" value={request.ben_nome} />
                                <ReportItem label="CPF" value={request.ben_cpf} />
                                <ReportItem label="E-mail" value={request.ben_email} />
                                <ReportItem label="Telefone" value={request.ben_telefone} />
                                <ReportItem label="Nascimento" value={request.ben_nascimento ? new Date(request.ben_nascimento).toLocaleDateString('pt-BR') : '-'} />
                            </div>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Activity size={20} className="text-teal-600" /> Auditor</h3>
                            <div className="space-y-4">
                                <ReportItem label="Nome" value={request.aud_nome} />
                                <ReportItem label="CRM" value={request.aud_crm} />
                                <ReportItem label="Data Análise" value={request.aud_data ? new Date(request.aud_data).toLocaleDateString('pt-BR') : '-'} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><FileText size={20} className="text-teal-600" /> Procedimentos</h3>
                            <div className="space-y-3">
                                {request.medical_procedures?.map((p, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <p className="font-bold text-slate-700 text-sm">{p.descricao}</p>
                                        <div className="flex justify-between mt-2">
                                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Cód: {p.codigo || 'N/A'}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd: {p.qtd_solicitada}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {request.medical_materials?.length > 0 && (
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Box size={20} className="text-teal-600" /> Materiais</h3>
                                <div className="space-y-3">
                                    {request.medical_materials?.map((m, i) => (
                                        <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                            <p className="font-bold text-slate-700 text-sm">{m.descricao}</p>
                                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">Qtd: {m.qtd_solicitada}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-10 pt-10 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onBack}
                        className="text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-xs px-6 py-4"
                    >
                        Voltar para lista
                    </button>
                </div>
            </div>
            );
    }


