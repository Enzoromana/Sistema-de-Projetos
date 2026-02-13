import React, { useState, useEffect, cloneElement } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus, Activity, CheckCircle2, Clock,
    AlertCircle, Trash2, Edit3, X,
    BarChart3, Calendar,
    FileText, Search,
    User, Stethoscope,
    Box, Paperclip, AlertTriangle, Printer,
    ArrowLeft, Loader2, Gavel, Download, Link, ShieldCheck
} from 'lucide-react';
import TUSS_DATA from '../data/tuss.json';
import SPECIALTIES from '../data/specialties.json';

const SITUACAO = {
    'Aguardando Análise': { color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
    'Aguardando Desempatador': { color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    'Aguardando Visualização de Abertura': { color: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-50' },
    'Finalizado': { color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' }
};

const DOC_TYPES = [
    { id: 'aberturaBeneficiario', label: 'Confirmação abertura beneficiário' },
    { id: 'aberturaMedico', label: 'Confirmação abertura Médico' },
    { id: 'desempatadorEscolha', label: 'Desempatador Escolha' },
    { id: 'parecerFinal', label: 'Parecer final' },
    { id: 'fechamentoBeneficiario', label: 'Confirmação fechamento beneficiário' },
    { id: 'fechamentoMedico', label: 'Confirmação fechamento médico' },
];

const addBusinessDays = (date, days) => {
    if (!date) return '';
    let result = new Date(date);
    if (isNaN(result.getTime())) return '';

    // Adjust for timezone offset
    result.setHours(12, 0, 0, 0);

    let count = 0;
    let iterations = 0;
    while (count < days && iterations < 100) { // Safety limit of 100 iterations
        result.setDate(result.getDate() + 1);
        const day = result.getDay();
        if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
            count++;
        }
        iterations++;
    }
    return result.toISOString().split('T')[0];
};

export default function MedicalControl() {
    const [view, setView] = useState('list'); // 'list', 'form', or 'details'
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');
    const [crmSearch, setCrmSearch] = useState('');
    const [monthFilter, setMonthFilter] = useState(''); // YYYY-MM

    // Form State
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        requisicao: '',
        ben_nome: '', ben_cpf: '', ben_email: '', ben_sexo: '', ben_nascimento: '', ben_telefone: '', ben_estado: '', ben_cidade: '',
        aud_nome: '', aud_estado: '', aud_crm: '', aud_data: '', guia: '',
        ass_nome: '', ass_crm: '', ass_email: '', ass_telefone: '', ass_endereco: '', ass_especialidade: '',
        div_especialidade: '', div_motivos: [],
        prazo_ans: ''
    });
    const [procedures, setProcedures] = useState([{ codigo: '', descricao: '', qtd_solicitada: 1, qtd_autorizada: 0, justificativa: '' }]);
    const [materials, setMaterials] = useState([{ descricao: '', qtd_solicitada: 1, qtd_autorizada: 0, justificativa: '' }]);
    const [attachments, setAttachments] = useState([]);
    const [categorizedAttachments, setCategorizedAttachments] = useState({}); // { typeId: [File, File] }

    // Detail/Status Modal
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [uploadingInternal, setUploadingInternal] = useState(null); // id do tipo de doc sendo enviado
    const [dragOverId, setDragOverId] = useState(null); // 'general' or doc type id

    // Third Opinion (Tiebreaker) Modal State
    const [showTiebreakerModal, setShowTiebreakerModal] = useState(false);
    const [tiebreakerData, setTiebreakerData] = useState({
        desempatador_nome: '',
        desempatador_crm: '',
        desempatador_especialidade: '',
        desempate_ass_nome: '',
        desempate_ass_crm: '',
        desempate_ass_especialidade: '',
        parecer_conclusao: '',
        referencias_bibliograficas: '',
        tiebreaker_verify_crm: '',
        tiebreaker_verify_cpf: ''
    });
    const [procedureConclusions, setProcedureConclusions] = useState([]); // [{id, conclusao_desempate}]
    const [materialConclusions, setMaterialConclusions] = useState([]); // [{id, conclusao_desempate}]
    const [showTiebreakerReportModal, setShowTiebreakerReportModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showVerifyConfigModal, setShowVerifyConfigModal] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');

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

    useEffect(() => {
        loadRequests();
    }, []);

    // Calculate ANS deadline (21 business days) whenever 'aud_data' changes
    useEffect(() => {
        if (view === 'form' && formData.aud_data) {
            const calculatedDate = addBusinessDays(formData.aud_data, 21);
            setFormData(prev => ({ ...prev, prazo_ans: calculatedDate }));
        }
    }, [formData.aud_data, view]);


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
            let docInternos = {};

            // Upload categorized attachments
            const catEntries = Object.entries(categorizedAttachments);
            if (catEntries.length > 0) {
                for (const [typeId, files] of catEntries) {
                    docInternos[typeId] = [];
                    for (const file of files) {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                        const filePath = `internal/${requestId}/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('medical-board')
                            .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage.from('medical-board').getPublicUrl(filePath);

                        docInternos[typeId].push({
                            name: file.name,
                            path: filePath,
                            url: publicUrl,
                            uploaded_at: new Date().toISOString()
                        });
                    }
                }
            }

            // Update request with categorized docs mapping
            if (Object.keys(docInternos).length > 0) {
                const { error: updateDocsError } = await supabase
                    .from('medical_requests')
                    .update({ documentos_internos: docInternos })
                    .eq('id', requestId);
                if (updateDocsError) throw updateDocsError;
            }

            // Upload general attachments
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
        // Fix: Remove specific preview styles so it fills the print page
        clonedContent.style.width = '100%';
        clonedContent.style.maxWidth = 'none';
        clonedContent.style.minHeight = 'auto';
        clonedContent.style.padding = '0';
        clonedContent.style.margin = '0';
        clonedContent.style.border = 'none';
        clonedContent.style.boxShadow = 'none';
        clonedContent.style.transform = 'none';

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


    const getTiebreakerMissingCount = (request) => {
        if (!request) return 0;
        let count = 0;

        // 1. Mandatory Fields
        if (!request.desempatador_nome) count++;
        if (!request.desempatador_crm) count++;
        if (!request.desempatador_especialidade) count++;

        // Assistant (check saved values or fallbacks)
        if (!request.desempate_ass_nome && !request.ass_nome) count++;
        if (!request.desempate_ass_crm && !request.ass_crm) count++;
        if (!request.desempate_ass_especialidade && !request.ass_especialidade) count++;

        // 2. Conclusion
        if (!request.parecer_conclusao) count++;

        // 3. Procedures & Materials
        if (request.medical_procedures) {
            request.medical_procedures.forEach(p => {
                if (!p.conclusao_desempate) count++;
            });
        }

        if (request.medical_materials) {
            request.medical_materials.forEach(m => {
                if (!m.conclusao_desempate) count++;
            });
        }

        return count;
    };


    const handleSaveTiebreaker = async () => {
        try {
            // 1. Update main request with tiebreaker data
            const { error } = await supabase
                .from('medical_requests')
                .update({
                    ...tiebreakerData,
                    situacao: 'Finalizado'
                })
                .eq('id', selectedRequest.id);

            if (error) throw error;

            // 2. Update procedure conclusions
            for (const proc of procedureConclusions) {
                if (proc.id && proc.conclusao_desempate !== undefined) {
                    await supabase
                        .from('medical_procedures')
                        .update({ conclusao_desempate: proc.conclusao_desempate })
                        .eq('id', proc.id);
                }
            }

            // 3. Update material conclusions
            for (const mat of materialConclusions) {
                if (mat.id && mat.conclusao_desempate !== undefined) {
                    await supabase
                        .from('medical_materials')
                        .update({ conclusao_desempate: mat.conclusao_desempate })
                        .eq('id', mat.id);
                }
            }

            // Update local state
            setSelectedRequest(prev => ({ ...prev, ...tiebreakerData, situacao: 'Finalizado' }));
            setShowTiebreakerModal(false);
            loadRequests();
        } catch (error) {
            console.error('Erro ao salvar desempate:', error);
            alert('Erro ao salvar o parecer de desempate.');
        }
    };

    const handleInternalFileUpload = async (e, typeId) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0 || !selectedRequest) return;

        setUploadingInternal(typeId);
        try {
            const updatedDocs = { ...selectedRequest.documentos_internos };
            if (!updatedDocs[typeId]) updatedDocs[typeId] = [];

            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                const filePath = `internal/${selectedRequest.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('medical-board')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('medical-board').getPublicUrl(filePath);

                const newDoc = {
                    name: file.name,
                    path: filePath,
                    url: publicUrl,
                    uploaded_at: new Date().toISOString()
                };

                updatedDocs[typeId].push(newDoc);
            }

            // Update JSONB in database once after all uploads
            const { error: updateError } = await supabase
                .from('medical_requests')
                .update({ documentos_internos: updatedDocs })
                .eq('id', selectedRequest.id);

            if (updateError) throw updateError;

            // Update local state
            setSelectedRequest({ ...selectedRequest, documentos_internos: updatedDocs });
            loadRequests();
        } catch (error) {
            console.error('Detalhes do erro de upload:', error);
            alert(`Erro no upload: ${error.message || error.error_description || 'Erro desconhecido'}. \n\nVerifique se o bucket "medical-board" foi criado no Supabase e se as permissões de RLS permitem upload.`);
        } finally {
            setUploadingInternal(null);
            if (e.target) e.target.value = '';
        }
    };

    const handleDrop = (e, typeId) => {
        e.preventDefault();
        setDragOverId(null);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        if (typeId === 'general') {
            setAttachments([...attachments, ...files]);
        } else {
            if (!selectedRequest) {
                // Durante criação, guardar no estado categorizado
                setCategorizedAttachments(prev => ({
                    ...prev,
                    [typeId]: [...(prev[typeId] || []), ...files]
                }));
            } else {
                const mockE = { target: { files: files, value: '' } };
                handleInternalFileUpload(mockE, typeId);
            }
        }
    };

    const exportToExcel = () => {
        // Prepare CSV headers and data
        const headers = ['Protocolo', 'Beneficiário', 'Situação', 'Especialidade', 'Data Criação'];
        const rows = filteredRequests.map(r => [
            r.requisicao,
            r.ben_nome,
            r.situacao,
            r.div_especialidade || '-',
            r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(';')).join('\n');

        // Proper Brazilian encoding (UTF-8 with BOM)
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        // Dynamic filename with period if filter is active
        const periodSuffix = monthFilter ? `_${monthFilter}` : '';
        const filename = `resumo_juntas_medicas${periodSuffix}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        setCategorizedAttachments({});
        setCurrentStep(0);
    };

    const filteredRequests = requests.filter(r => {
        const matchSearch = r.ben_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.requisicao.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === '' || r.situacao === statusFilter;
        const matchSpecialty = specialtyFilter === '' || r.div_especialidade === specialtyFilter;

        const matchDoctor = doctorSearch === '' || [r.aud_nome, r.ass_nome, r.desempatador_nome, r.desempate_ass_nome]
            .some(name => name?.toLowerCase().includes(doctorSearch.toLowerCase()));

        const matchCRM = crmSearch === '' || [r.aud_crm, r.ass_crm, r.desempatador_crm, r.desempate_ass_crm]
            .some(crm => crm?.toLowerCase().includes(crmSearch.toLowerCase()));

        const matchMonth = monthFilter === '' || (r.created_at && r.created_at.startsWith(monthFilter));

        return matchSearch && matchStatus && matchSpecialty && matchDoctor && matchCRM && matchMonth;
    });

    const specialties = [...new Set(requests.map(r => r.div_especialidade).filter(Boolean))].sort();

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
            <div className="bg-gradient-to-br from-[#074F4B] to-[#259591] rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl">
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
                        <button
                            onClick={() => setShowHelpModal(true)}
                            className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-[1.5rem] transition-all backdrop-blur-md flex items-center gap-2 border border-white/10 shadow-xl"
                            title="Ajuda e Notas de Atualização"
                        >
                            <AlertCircle size={20} />
                        </button>
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
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-2 w-full md:w-2/5">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                <input
                                    type="text"
                                    placeholder="Beneficiário ou requisição..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-[#259591]/10 outline-none font-bold text-slate-600"
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <div className="relative">
                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="month"
                                        value={monthFilter}
                                        onChange={e => setMonthFilter(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-[#259591]/10"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-[#259591]/10"
                                >
                                    <option value="">Todos os status</option>
                                    {Object.keys(SITUACAO).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 w-full">
                                <select
                                    value={specialtyFilter}
                                    onChange={e => setSpecialtyFilter(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-[#259591]/10"
                                >
                                    <option value="">Todas as especialidades</option>
                                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome do médico..."
                                    value={doctorSearch}
                                    onChange={e => setDoctorSearch(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-[#259591]/10 outline-none font-bold text-slate-600"
                                />
                            </div>
                            <div className="relative flex-1 w-full">
                                <Stethoscope className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar por CRM..."
                                    value={crmSearch}
                                    onChange={e => setCrmSearch(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-[#259591]/10 outline-none font-bold text-slate-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Requests Table */}
                    <div className="bg-white rounded-[3rem] border border-slate-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)]">
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
                                                <span className="font-black text-[#259591]">{r.requisicao}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="font-bold text-slate-800">{r.ben_nome}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{r.ben_cpf}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit mx-auto shadow-sm border ${SITUACAO[r.situacao]?.textColor} ${SITUACAO[r.situacao]?.bgLight} border-current/10`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${SITUACAO[r.situacao]?.color}`} />
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
                                                        className="p-3 text-[#259591] bg-slate-50 hover:bg-[#259591] hover:text-white rounded-xl transition-all relative"
                                                        title="Status / Etapas"
                                                    >
                                                        <Activity size={18} />
                                                        {getPendingDocsCount(r) > 0 && (
                                                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                                                {getPendingDocsCount(r)}
                                                            </span>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedRequest(r); setShowReportModal(true); }}
                                                        className="p-3 text-indigo-600 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                                        title="Visualizar Relatório"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(r);
                                                            setTiebreakerData({
                                                                desempatador_nome: r.desempatador_nome || '',
                                                                desempatador_crm: r.desempatador_crm || '',
                                                                desempatador_especialidade: r.desempatador_especialidade || '',
                                                                desempate_ass_nome: r.desempate_ass_nome || r.ass_nome || '',
                                                                desempate_ass_crm: r.desempate_ass_crm || r.ass_crm || '',
                                                                desempate_ass_especialidade: r.desempate_ass_especialidade || r.ass_especialidade || '',
                                                                parecer_conclusao: r.parecer_conclusao || '',
                                                                referencias_bibliograficas: r.referencias_bibliograficas || '',
                                                                tiebreaker_verify_crm: r.tiebreaker_verify_crm || '',
                                                                tiebreaker_verify_cpf: r.tiebreaker_verify_cpf || ''
                                                            });
                                                            // Initialize item-level conclusions
                                                            setProcedureConclusions(
                                                                (r.medical_procedures || []).map(p => ({
                                                                    id: p.id,
                                                                    codigo: p.codigo,
                                                                    descricao: p.descricao,
                                                                    justificativa: p.justificativa,
                                                                    qtd_solicitada: p.qtd_solicitada,
                                                                    qtd_autorizada: p.qtd_autorizada,
                                                                    conclusao_desempate: p.conclusao_desempate || ''
                                                                }))
                                                            );
                                                            setMaterialConclusions(
                                                                (r.medical_materials || []).map(m => ({
                                                                    id: m.id,
                                                                    descricao: m.descricao,
                                                                    justificativa: m.justificativa,
                                                                    qtd_solicitada: m.qtd_solicitada,
                                                                    qtd_autorizada: m.qtd_autorizada,
                                                                    conclusao_desempate: m.conclusao_desempate || ''
                                                                }))
                                                            );
                                                            setShowVerifyConfigModal(true);
                                                        }}
                                                        className="p-3 text-indigo-600 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all border border-indigo-100 relative"
                                                        title="Conclusão Junta"
                                                    >
                                                        <Gavel size={18} />
                                                        {getTiebreakerMissingCount(r) > 0 && r.situacao !== 'Finalizado' && (
                                                            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm ring-1 ring-rose-300">
                                                                {getTiebreakerMissingCount(r)}
                                                            </span>
                                                        )}
                                                    </button>
                                                    {r.parecer_conclusao && (
                                                        <button
                                                            onClick={() => { setSelectedRequest(r); setShowTiebreakerReportModal(true); }}
                                                            className="p-3 text-emerald-600 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100"
                                                            title="Imprimir Parecer de Junta"
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                    )}

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
                    <div className="w-full lg:w-72 space-y-1.5 pt-4">
                        {[
                            { title: 'Beneficiário', icon: <User size={18} /> },
                            { title: 'Médico Auditor', icon: <Activity size={18} /> },
                            { title: 'Médico Assistente', icon: <Stethoscope size={18} /> },
                            { title: 'Procedimentos', icon: <FileText size={18} /> },
                            { title: 'Materiais', icon: <Box size={18} /> },
                            { title: 'Anexos', icon: <Paperclip size={18} /> },
                            { title: 'Divergência', icon: <AlertTriangle size={18} /> }
                        ].map((s, idx) => (
                            <div
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${currentStep === idx ? 'bg-[#259591] text-white shadow-lg border-[#259591]' : 'bg-white text-slate-400 border-slate-100 hover:border-[#259591]/30 hover:text-slate-600'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentStep === idx ? 'bg-white/20' : 'bg-slate-50 text-slate-300'}`}>
                                    {s.icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">{s.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Step Form Content */}
                    <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
                        {/* Step 0: Beneficiário */}
                        {currentStep === 0 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <FormHeader icon={<User />} title="Dados do Beneficiário" sub="Informações pessoais do paciente para abertura da junta." />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="CPF" required
                                        value={formData.ben_cpf}
                                        onChange={v => setFormData({ ...formData, ben_cpf: v.replace(/\D/g, '').slice(0, 11) })}
                                        placeholder="00000000000 (Somente números)"
                                        maxLength={11}
                                    />
                                    <Input label="Nome Completo" required value={formData.ben_nome} onChange={v => setFormData({ ...formData, ben_nome: v })} placeholder="Nome do paciente" />
                                    <Input label="E-mail" required value={formData.ben_email} onChange={v => setFormData({ ...formData, ben_email: v })} placeholder="email@exemplo.com" />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo</label>
                                        <select
                                            value={formData.ben_sexo}
                                            onChange={e => setFormData({ ...formData, ben_sexo: e.target.value })}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#259591]/10 transition-all"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Feminino">Feminino</option>
                                        </select>
                                    </div>
                                    <Input label="Data de Nascimento" type="date" value={formData.ben_nascimento} onChange={v => setFormData({ ...formData, ben_nascimento: v })} />
                                    <Input
                                        label="Telefone" required
                                        value={formData.ben_telefone}
                                        onChange={v => setFormData({ ...formData, ben_telefone: v.replace(/\D/g, '') })}
                                        placeholder="21999999999 (Somente números)"
                                    />
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
                                    <Input label="Número da Guia" value={formData.guia} onChange={v => setFormData({ ...formData, guia: v })} placeholder="EX: 123456789" />
                                    <Input label="Nome do Médico" required value={formData.aud_nome} onChange={v => setFormData({ ...formData, aud_nome: v })} placeholder="Dr. Nome Completo" />
                                    <Input
                                        label="CRM/CRO" required
                                        value={formData.aud_crm}
                                        onChange={v => setFormData({ ...formData, aud_crm: v.replace(/\D/g, '') })}
                                        placeholder="00000 (Somente números)"
                                    />
                                    <Input label="Estado (CRM)" value={formData.aud_estado} onChange={v => setFormData({ ...formData, aud_estado: v })} placeholder="UF" />
                                    <Input label="Data do Atendimento" type="date" value={formData.aud_data} onChange={v => setFormData({ ...formData, aud_data: v })} />
                                    <div className="relative">
                                        <Input
                                            label="Prazo Limite (ANS)"
                                            value={formData.prazo_ans}
                                            onChange={() => { }} // Read-only
                                            type="date"
                                            placeholder="Calculado automaticamente após 21 dias úteis"
                                        />
                                        <div className="absolute inset-0 bg-transparent cursor-not-allowed z-10" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Médico Assistente */}
                        {currentStep === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <FormHeader icon={<Stethoscope />} title="Dados do Médico Assistente" sub="Informações do médico que solicitou o procedimento." />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Nome" required value={formData.ass_nome} onChange={v => setFormData({ ...formData, ass_nome: v })} placeholder="Dr. Nome Completo" />
                                    <Input
                                        label="CRM/CRO" required
                                        value={formData.ass_crm}
                                        onChange={v => setFormData({ ...formData, ass_crm: v.replace(/\D/g, '') })}
                                        placeholder="00000 (Somente números)"
                                    />
                                    <Input label="E-mail" required value={formData.ass_email} onChange={v => setFormData({ ...formData, ass_email: v })} placeholder="email@exemplo.com" />
                                    <Input
                                        label="Telefone" required
                                        value={formData.ass_telefone}
                                        onChange={v => setFormData({ ...formData, ass_telefone: v.replace(/\D/g, '') })}
                                        placeholder="21999999999 (Somente números)"
                                    />
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
                                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group" style={{ zIndex: procedures.length - idx }}>
                                            <div className="flex justify-end mb-4">
                                                <button
                                                    onClick={() => setProcedures(procedures.filter((_, i) => i !== idx))}
                                                    className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} /> Remover Item
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                                                    <div className="lg:col-span-3">
                                                        <TussAutocomplete
                                                            value={p}
                                                            onChange={(newValues) => {
                                                                const newP = [...procedures];
                                                                newP[idx] = { ...newP[idx], ...newValues };
                                                                setProcedures(newP);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Input label="Solicitada" type="number" value={p.qtd_solicitada} onChange={v => {
                                                            const newP = [...procedures];
                                                            newP[idx].qtd_solicitada = v;
                                                            setProcedures(newP);
                                                        }} />
                                                        <Input label="Autorizada" type="number" value={p.qtd_autorizada} onChange={v => {
                                                            const newP = [...procedures];
                                                            newP[idx].qtd_autorizada = v;
                                                            setProcedures(newP);
                                                        }} />
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <Input label="Justificativa Técnica" required={Number(p.qtd_solicitada) !== Number(p.qtd_autorizada)} value={p.justificativa} onChange={v => {
                                                        const newP = [...procedures];
                                                        newP[idx].justificativa = v;
                                                        setProcedures(newP);
                                                    }} placeholder={Number(p.qtd_solicitada) !== Number(p.qtd_autorizada) ? "Obrigatório: Quantidades divergem" : "Descreva brevemente a necessidade clínica"} />
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
                                            <div className="flex justify-end mb-4">
                                                <button
                                                    onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}
                                                    className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} /> Remover Item
                                                </button>
                                            </div>
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
                                                    <Input label="Justificativa" required={Number(m.qtd_solicitada) !== Number(m.qtd_autorizada)} value={m.justificativa} onChange={v => {
                                                        const newM = [...materials];
                                                        newM[idx].justificativa = v;
                                                        setMaterials(newM);
                                                    }} placeholder={Number(m.qtd_solicitada) !== Number(m.qtd_autorizada) ? "Obrigatório: Quantidades divergem" : "Justificativa técnica (opcional)"} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 5: Anexos / Documentação */}
                        {currentStep === 5 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <div className="flex items-center justify-between">
                                    <FormHeader icon={<Paperclip />} title="Anexos & Documentação" sub="Anexe os arquivos obrigatórios e complementares da junta." />
                                    <span className="px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                                        Organizado por Categoria
                                    </span>
                                </div>

                                <input
                                    type="file"
                                    id="form-internal-file-input"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const typeId = e.target.getAttribute('data-type-id');
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        if (selectedRequest) {
                                            // Se estivermos editando, salvamos direto
                                            handleInternalFileUpload(e, typeId);
                                        } else {
                                            // Durante criação, guardar no estado categorizado
                                            setCategorizedAttachments(prev => ({
                                                ...prev,
                                                [typeId]: [...(prev[typeId] || []), file]
                                            }));
                                        }
                                        e.target.value = '';
                                    }}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {DOC_TYPES.map(dt => (
                                        <div
                                            key={dt.id}
                                            onDragOver={(e) => { e.preventDefault(); setDragOverId(dt.id); }}
                                            onDragLeave={() => setDragOverId(null)}
                                            onDrop={(e) => handleDrop(e, dt.id)}
                                            className={`p-6 rounded-3xl border transition-all ${dragOverId === dt.id ? 'bg-teal-50 border-teal-500 scale-[1.02] shadow-2xl' : 'bg-slate-50 border-slate-100 hover:border-teal-200 hover:bg-white hover:shadow-xl hover:shadow-teal-900/5'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <FileText size={20} />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{dt.label}</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const input = document.getElementById('form-internal-file-input');
                                                        input.setAttribute('data-type-id', dt.id);
                                                        input.click();
                                                    }}
                                                    className="text-[10px] font-black text-teal-600 uppercase tracking-widest px-4 py-2 bg-white rounded-xl border border-teal-100 hover:bg-teal-600 hover:text-white transition-all flex items-center gap-1 shadow-sm"
                                                >
                                                    <Plus size={12} /> ANEXAR
                                                </button>
                                            </div>

                                            {/* List of files for this type */}
                                            {selectedRequest?.documentos_internos?.[dt.id]?.length > 0 || (!selectedRequest && categorizedAttachments[dt.id]?.length > 0) ? (
                                                <div className="space-y-2 border-t border-slate-200/50 pt-4">
                                                    {/* Files already in the database */}
                                                    {selectedRequest?.documentos_internos?.[dt.id]?.map((doc, idx) => (
                                                        <div key={`db-${idx}`} className="flex items-center justify-between text-[11px] bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <Paperclip size={12} className="text-slate-300" />
                                                                <span className="font-bold truncate max-w-[150px]">{doc.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <a
                                                                    href={doc.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-teal-600 font-black hover:underline uppercase tracking-tighter pt-0.5"
                                                                >
                                                                    Ver
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
                                                                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Files being added during creation */}
                                                    {!selectedRequest && categorizedAttachments[dt.id]?.map((file, idx) => (
                                                        <div key={`temp-${idx}`} className="flex items-center justify-between text-[11px] bg-teal-50 p-3 rounded-xl border border-teal-100 shadow-sm">
                                                            <div className="flex items-center gap-2 text-teal-700">
                                                                <Paperclip size={12} className="text-teal-400" />
                                                                <span className="font-bold truncate max-w-[150px]">{file.name}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setCategorizedAttachments(prev => ({
                                                                        ...prev,
                                                                        [dt.id]: prev[dt.id].filter((_, i) => i !== idx)
                                                                    }));
                                                                }}
                                                                className="text-teal-400 hover:text-red-500 transition-colors p-1"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-center py-4 border-2 border-dashed border-slate-100 rounded-2xl">
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum arquivo enviado</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-amber-900 uppercase tracking-tight mb-1">Observação sobre Anexos Gerais</p>
                                        <p className="text-xs text-amber-700 leading-relaxed font-medium">Os anexos acima são documentos específicos das etapas da junta. Caso deseje anexar documentos gerais (exame, laudo externo), utilize a seção de "Anexos Gerais" abaixo.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anexos Gerais (Laudos, Exames, etc)</label>
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragOverId('general'); }}
                                        onDragLeave={() => setDragOverId(null)}
                                        onDrop={(e) => handleDrop(e, 'general')}
                                        className={`border-4 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center group transition-all cursor-pointer ${dragOverId === 'general' ? 'border-[#259591] bg-[#259591]/5 scale-[1.01]' : 'border-slate-100 hover:border-[#259591]/30 hover:bg-slate-50/50'}`}
                                        onClick={() => document.getElementById('medical-file-input').click()}
                                    >
                                        <input
                                            type="file" id="medical-file-input" multiple className="hidden"
                                            onChange={e => setAttachments([...attachments, ...Array.from(e.target.files)])}
                                        />
                                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Plus size={32} />
                                        </div>
                                        <p className="text-lg font-black text-slate-800 mb-1">Arraste ou Selecione</p>
                                        <p className="text-slate-400 text-xs font-medium">Formatos suportados: PDF, Imagens, Docx</p>
                                    </div>
                                    {attachments.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {attachments.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="text-teal-600" size={18} />
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
                            </div>
                        )}

                        {/* Step 6: Divergência */}
                        {currentStep === 6 && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <FormHeader icon={<AlertTriangle />} title="Divergência Técnica" sub="Motivação técnica para a instauração da junta." />
                                <div className="space-y-6">
                                    <SpecialtyAutocomplete
                                        required
                                        value={formData.div_especialidade}
                                        onChange={v => setFormData({ ...formData, div_especialidade: v })}
                                        placeholder="Ex: Ortopedia / Oncologia"
                                    />
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
                                    className="bg-[#259591] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-teal-200"
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
                                    {/* Klini Header - Executive (Brand Colors) */}
                                    <div className="flex justify-between items-end border-b-[4px] border-[#259591] pb-4 mb-6">
                                        <div className="flex items-center gap-4 text-[#259591]">
                                            <Activity size={48} className="stroke-[2.5]" />
                                            <div>
                                                <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">Klini</h1>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.3em] opacity-80 text-slate-600">Saúde & Bem-estar</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-2xl font-black uppercase tracking-tight text-[#259591]">Parecer de 2° opinião</h2>
                                            <div className="mt-2 space-y-0.5">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    Protocolo: <span className="text-slate-900 text-sm font-black">{selectedRequest.requisicao}</span>
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    Emissão: <span className="text-slate-900 font-bold">{new Date().toLocaleDateString('pt-BR')}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 text-slate-900 font-sans">
                                        {/* Block 1: Beneficiary & Request Data */}
                                        <div className="border border-[#259591] flex rounded-none relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#259591]"></div>
                                            {/* Beneficiary Col */}
                                            <div className="flex-[2] p-5 border-r border-[#259591] pl-8">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#259591] mb-3 border-b border-slate-100 pb-1">I. Beneficiário</h3>
                                                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                                    <div>
                                                        <p className="text-[9px] uppercase font-bold text-[#259591]/70">Nome Completo</p>
                                                        <p className="text-base font-bold truncate">{selectedRequest.ben_nome}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] uppercase font-bold text-[#259591]/70">CPF</p>
                                                        <p className="text-base font-bold">{selectedRequest.ben_cpf}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] uppercase font-bold text-[#259591]/70">Data de Nasc.</p>
                                                        <p className="text-sm font-medium">{selectedRequest.ben_nascimento ? new Date(selectedRequest.ben_nascimento).toLocaleDateString('pt-BR') : '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] uppercase font-bold text-[#259591]/70">Telefone</p>
                                                        <p className="text-sm font-medium">{selectedRequest.ben_telefone}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Request Details Col */}
                                            <div className="flex-1 p-5 bg-teal-50/30 break-inside-avoid">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#259591] mb-3 border-b border-slate-200 pb-1">Status Interno</h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-[9px] uppercase font-bold text-[#259591]/70">Situação Atual</p>
                                                        <p className="text-xs font-black uppercase text-slate-800">{selectedRequest.situacao}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] uppercase font-bold text-[#259591]/70">Prazo ANS</p>
                                                        <p className="text-xs font-bold text-slate-800">{selectedRequest.prazo_ans ? new Date(selectedRequest.prazo_ans).toLocaleDateString('pt-BR') : 'A calcular'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reporting Note */}
                                        <p className="text-xs leading-relaxed font-bold italic text-slate-700 pt-4 pb-4">
                                            Prezado(a) Senhor(a) {selectedRequest.ben_nome}, CPF nº {selectedRequest.ben_cpf}, a Klini vem apresentar o Parecer de Junta Médica referente à Requisição: {selectedRequest.requisicao}, cujo atendimento foi em {selectedRequest.aud_data ? new Date(selectedRequest.aud_data).toLocaleDateString('pt-BR') : '-'}.
                                        </p>

                                        {/* Block 2: Professionals */}
                                        <div className="border border-[#259591] flex break-inside-avoid shadow-[4px_4px_0px_0px_rgba(29,120,116,0.1)]">
                                            <div className="flex-1 p-4 border-r border-[#259591]">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#259591] mb-2">II. Médico Auditor</h3>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold">{selectedRequest.aud_nome}</p>
                                                    <p className="text-xs font-medium text-slate-600">CRM: {selectedRequest.aud_crm} / {selectedRequest.aud_estado}</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 p-4 bg-teal-50/10">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#259591] mb-2">III. Médico Assistente</h3>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold">{selectedRequest.ass_nome}</p>
                                                    <p className="text-xs font-medium text-slate-600">CRM: {selectedRequest.ass_crm} • {selectedRequest.ass_especialidade}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table: Procedures */}
                                        <div className="mt-8 break-inside-avoid">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-[#259591] mb-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#259591]"></div> IV. Procedimentos Solicitados
                                            </h3>
                                            <table className="w-full text-left border border-[#259591] text-xs">
                                                <thead className="bg-teal-50 border-b border-[#259591]">
                                                    <tr>
                                                        <th className="p-3 border-r border-[#259591]/20 font-black uppercase w-24 text-[#259591]">TUSS</th>
                                                        <th className="p-3 border-r border-[#259591]/20 font-black uppercase text-[#259591]">Descrição Técnica</th>
                                                        <th className="p-3 border-r border-[#259591]/20 font-black uppercase text-center w-16 text-[#259591]">Sol.</th>
                                                        <th className="p-3 font-black uppercase text-center w-16 text-[#259591]">Aut.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#259591]/20">
                                                    {selectedRequest.medical_procedures?.map((p, i) => (
                                                        <tr key={i} className="even:bg-slate-50 hover:bg-teal-50/10">
                                                            <td className="p-3 border-r border-[#259591]/20 font-bold font-mono text-slate-700">{p.codigo || '-'}</td>
                                                            <td className="p-3 border-r border-[#259591]/20">
                                                                <div className="font-bold text-slate-900">{p.descricao}</div>
                                                                {p.justificativa && <div className="text-[10px] mt-1 font-bold text-red-600">NOTA: {p.justificativa}</div>}
                                                            </td>
                                                            <td className="p-3 border-r border-[#259591]/20 text-center font-bold text-slate-600">{p.qtd_solicitada}</td>
                                                            <td className="p-3 text-center font-bold text-[#259591]">{p.qtd_autorizada}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {(!selectedRequest.medical_procedures || selectedRequest.medical_procedures.length === 0) && (
                                                <div className="text-center p-4 border border-t-0 border-[#259591] text-xs italic text-slate-500">Nenhum procedimento listado.</div>
                                            )}
                                        </div>

                                        {/* Table: Materials */}
                                        {selectedRequest.medical_materials?.length > 0 && (
                                            <div className="mt-6 break-inside-avoid">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-[#259591] mb-2 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#259591]"></div> V. Materiais & OPME
                                                </h3>
                                                <table className="w-full text-left border border-[#259591] text-xs">
                                                    <thead className="bg-teal-50 border-b border-[#259591]">
                                                        <tr>
                                                            <th className="p-3 border-r border-[#259591]/20 font-black uppercase text-[#259591]">Descrição do Material</th>
                                                            <th className="p-3 border-r border-[#259591]/20 font-black uppercase text-center w-24 text-[#259591]">Sol.</th>
                                                            <th className="p-3 font-black uppercase text-center w-24 text-[#259591]">Aut.</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#259591]/20">
                                                        {selectedRequest.medical_materials.map((m, i) => (
                                                            <tr key={i} className="even:bg-slate-50">
                                                                <td className="p-3 border-r border-[#259591]/20">
                                                                    <div className="font-bold text-slate-900">{m.descricao}</div>
                                                                    {m.justificativa && <div className="text-[10px] mt-1 font-bold text-red-600">NOTA: {m.justificativa}</div>}
                                                                </td>
                                                                <td className="p-3 border-r border-[#259591]/20 text-center font-bold text-slate-600">{m.qtd_solicitada}</td>
                                                                <td className="p-3 text-center font-bold text-[#259591]">{m.qtd_autorizada}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Block 6: Documents */}
                                        <div className="mt-8 break-inside-avoid">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-[#259591] mb-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#259591]"></div> VI. Documentos & Anexos
                                            </h3>
                                            <div className="border border-[#259591] bg-white text-xs">
                                                {DOC_TYPES.map(type => {
                                                    const docs = selectedRequest.documentos_internos?.[type.id];
                                                    if (!docs || docs.length === 0) return null;
                                                    return (
                                                        <div key={type.id} className="p-3 border-b border-[#259591]/20 last:border-b-0">
                                                            <p className="font-black text-[#259591] uppercase text-[10px] mb-1">{type.label}</p>
                                                            <div className="space-y-1 pl-2">
                                                                {docs.map((doc, i) => (
                                                                    <div key={i} className="flex items-center gap-2">
                                                                        <FileText size={10} className="text-slate-400" />
                                                                        <span className="font-bold text-slate-700">{doc.name}</span>
                                                                        <span className="text-[9px] text-slate-400">({new Date(doc.uploaded_at).toLocaleDateString('pt-BR')})</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* General Attachments */}
                                                {selectedRequest.medical_attachments && selectedRequest.medical_attachments.length > 0 && (
                                                    <div className="p-3 border-b border-[#259591]/20 last:border-b-0">
                                                        <p className="font-black text-[#259591] uppercase text-[10px] mb-1">Outros Anexos</p>
                                                        <div className="space-y-1 pl-2">
                                                            {selectedRequest.medical_attachments.map((att, i) => (
                                                                <div key={i} className="flex items-center gap-2">
                                                                    <Paperclip size={10} className="text-slate-400" />
                                                                    <span className="font-bold text-slate-700">{att.file_name}</span>
                                                                    <span className="text-[9px] text-slate-400">({new Date(att.created_at).toLocaleDateString('pt-BR')})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Empty State */}
                                                {(!selectedRequest.medical_attachments?.length && (!selectedRequest.documentos_internos || Object.keys(selectedRequest.documentos_internos).length === 0)) && (
                                                    <div className="p-4 text-center italic text-slate-500">Nenhum documento anexado.</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Block 7: Divergence (Renumbered) */}
                                        <div className="mt-8 border border-[#259591] bg-teal-50/30 p-5 break-inside-avoid relative overflow-hidden">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#259591] mb-3 border-b border-[#259591]/20 pb-1">VII. Parecer de Divergência</h3>
                                            <div className="grid grid-cols-1 gap-y-1 relative z-10">
                                                <div>
                                                    <p className="text-[9px] uppercase font-bold text-[#259591]/70">Especialidade Analisada</p>
                                                    <p className="text-sm font-bold text-slate-900">{selectedRequest.div_especialidade}</p>
                                                </div>
                                                <div className="mt-2">
                                                    <p className="text-[9px] uppercase font-bold text-[#259591]/70">Considerações Técnicas</p>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {selectedRequest.div_motivos?.map((m, i) => (
                                                            <span key={i} className="px-3 py-1 bg-white border border-[#259591]/30 rounded text-[10px] font-bold text-[#259591]">{m}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>


                                        <div className="mt-12 text-center">
                                            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#259591]/50">
                                                Documento gerado eletronicamente em {new Date().toLocaleString('pt-BR')} • ID: {selectedRequest.id}
                                            </p>
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
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            const typeId = e.target.getAttribute('data-type-id');
                                            handleInternalFileUpload(e, typeId);
                                        }}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {DOC_TYPES.map(dt => (
                                            <div
                                                key={dt.id}
                                                onDragOver={(e) => { e.preventDefault(); setDragOverId(dt.id); }}
                                                onDragLeave={() => setDragOverId(null)}
                                                onDrop={(e) => handleDrop(e, dt.id)}
                                                className={`p-5 rounded-2xl border transition-all ${dragOverId === dt.id ? 'bg-teal-50 border-teal-500 scale-[1.02] shadow-xl' : 'bg-slate-50 border-slate-100 hover:border-teal-200 hover:bg-white hover:shadow-lg'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                                                            <FileText size={16} />
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight leading-none">{dt.label}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const input = document.getElementById('internal-file-input');
                                                            input.setAttribute('data-type-id', dt.id);
                                                            input.click();
                                                        }}
                                                        disabled={uploadingInternal === dt.id}
                                                        className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:text-teal-800 transition-all flex items-center gap-1 disabled:opacity-50 px-3 py-1.5 bg-white rounded-lg border border-teal-50 shadow-sm"
                                                    >
                                                        {uploadingInternal === dt.id ? (
                                                            <Loader2 size={10} className="animate-spin" />
                                                        ) : (
                                                            <Plus size={10} />
                                                        )}
                                                        Anexar
                                                    </button>
                                                </div>

                                                {/* List of files for this type */}
                                                {selectedRequest.documentos_internos?.[dt.id]?.length > 0 ? (
                                                    <div className="space-y-2 border-t border-slate-200/50 pt-3">
                                                        {selectedRequest.documentos_internos[dt.id].map((doc, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                                                <div className="flex items-center gap-2 text-slate-600">
                                                                    <Paperclip size={12} className="text-slate-300" />
                                                                    <span className="font-bold truncate max-w-[120px]">{doc.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <a
                                                                        href={doc.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-teal-600 font-black hover:underline uppercase tracking-tighter"
                                                                    >
                                                                        Ver
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
                                                ) : (
                                                    <div className="text-center py-2">
                                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Pendente</span>
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

            {/* Modal de Ajuda */}
            {
                showHelpModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-[#259591] text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight">Portal de Ajuda & Notas</h3>
                                        <p className="text-sm font-black text-white/60 uppercase tracking-widest leading-none mt-1">Junta Médica Administrativa</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowHelpModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                                {/* Guia de Utilização */}
                                <section className="space-y-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="w-8 h-1 bg-[#259591] rounded-full" /> Guia de Utilização
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                                            <p className="font-black text-[#259591] text-sm uppercase">1. Cadastro de Junta</p>
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed">Preencha os dados do beneficiário e médicos. Os campos de CPF, CRM e Telefone agora aceitam apenas números.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                                            <p className="font-black text-[#259591] text-sm uppercase">2. Documentação</p>
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed">Na penúltima etapa, anexe os documentos específicos em suas respectivas categorias para melhor organização.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                                            <p className="font-black text-[#259591] text-sm uppercase">3. Acompanhamento</p>
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed">Utilize o botão de "Status" na lista principal para gerenciar as etapas e anexos após a criação.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                                            <p className="font-black text-[#259591] text-sm uppercase">4. Emissão de PDF</p>
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed">Gere o documento inicial clicando no ícone de impressora na visualização de detalhes.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                                            <p className="font-black text-[#259591] text-sm uppercase">5. Fase de Desempate</p>
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed">Para solicitações divergentes, use o ícone de Martelo para inserir o parecer do desempatador e itens específicos.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                                            <p className="font-black text-[#259591] text-sm uppercase">6. Parecer Final</p>
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed">Após finalizar o desempate, imprima o Parecer de Junta Médica (ícone de Check verde) para o fechamento oficial.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                                            <p className="font-black text-[#259591] text-sm uppercase">7. Filtros Avançados</p>
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed">Filtre a lista por Especialidade, CRM ou Nome de qualquer médico na barra superior.</p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                                            <p className="font-black text-[#259591] text-sm uppercase">8. Download em Lote</p>
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed">Baixe todos os anexos de uma só vez com o botão "Baixar Todos os Arquivos" em detalhes.</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Notas de Atualização */}
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                            <div className="w-8 h-1 bg-amber-400 rounded-full" /> Notas de Atualização
                                        </h4>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Versão 2.3.1</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative pl-8 pb-8 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                            <div className="absolute top-0 -left-[9px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight mb-2">Novo! - Relatórios & Identidade Visual</p>
                                                <ul className="space-y-2">
                                                    {[
                                                        "Novo Título de Parecer: Atualização da nomenclatura oficial para 'Parecer de 2° opinião' no relatório inicial.",
                                                        "Referências Bibliográficas: Inclusão de seção dedicada para citações bibliográficas no rodapé dos relatórios.",
                                                        "Ajuste de Nomenclatura: Padronização do termo 'Médico Assistente' em todos os modais e impressões.",
                                                        "Correção de UI: Restauração da badge (indicador vermelho) de contagem de documentos pendentes no ícone de Status."
                                                    ].map((note, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-xs font-black text-emerald-600 leading-relaxed">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" /> {note}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="relative pl-8 pb-8 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                            <div className="absolute top-0 -left-[9px] w-4 h-4 rounded-full bg-teal-600 border-4 border-white shadow-sm" />
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight mb-2">1ª Nota - Segurança & Gestão de Dados</p>
                                                <ul className="space-y-2">
                                                    {[
                                                        "Filtros Avançados: Implementação de busca multi-critério por Especialidade, CRM e Nome do Médico (Auditor/Assistente/Desempatador).",
                                                        "Download em Lote: Novo botão 'Baixar Todos os Arquivos' para coleta automática e sequencial de toda a documentação do processo.",
                                                        "Hardening de Segurança (RLS): Fechamento de APIs de Procedimentos, Materiais e Anexos, exigindo agora obrigatoriamente autenticação médica/admin.",
                                                        "Infraestrutura de Backups: Novo sistema de repositório local e script de sincronização periódica de anexos físicos.",
                                                        "Tooltips de UX: Adição de nomenclatura descritiva ao passar o mouse em ícones de Status e Ações na tabela principal.",
                                                        "Proteção de Credenciais: Migração de chaves Supabase para variáveis de ambiente (.env) seguindo normas de segurança OWASP."
                                                    ].map((note, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-xs font-black text-[#259591] leading-relaxed">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#259591] mt-1.5" /> {note}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="relative pl-8 pb-8 border-l-2 border-slate-100 last:border-0 last:pb-0 opacity-60">
                                            <div className="absolute top-0 -left-[9px] w-4 h-4 rounded-full bg-slate-400 border-4 border-white shadow-sm" />
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight mb-2">2ª Nota - Fase de Desempate (Terceira Opinião)</p>
                                                <ul className="space-y-2">
                                                    {[
                                                        "Lançamento do Módulo de Terceira Opinião (Desempatador): Fluxo completo para resolução de divergências médicas entre auditoria e assistente.",
                                                        "Conclusões Item-a-Item: Possibilidade de registrar o veredito do desempatador individualmente para cada Procedimento e Material, com justificativas específicas.",
                                                        "Relatório Executivo de Parecer: Novo layout 'Parecer de Junta Médica' em alta densidade, formatado para impressão oficial com CSS inline para fidelidade visual.",
                                                        "Inteligência na Busca TUSS: Motor de busca otimizado com priorização por prefixo (início do código) e limite expandido para 100 resultados simultâneos.",
                                                        "Sincronização de Status: Transição automática da solicitação para o estado 'Finalizado' imediatamente após o registro do parecer de desempate.",
                                                        "Ajuste de Conformidade ANS: Atualização do registro ANS da Klini para o código correto (42.202-9) em todos os documentos gerados.",
                                                        "Status Dinâmico de Anexos: Remoção de bloqueios impeditivos na fase de auditoria, permitindo maior fluidez no processo sem travas de 'Pendência' obrigatória.",
                                                        "Destaque em Auditoria: Observações e justificativas de itens agora são destacadas em Vermelho no PDF para facilitar a leitura rápida do médico."
                                                    ].map((note, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-500 leading-relaxed">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" /> {note}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="relative pl-8 pb-8 border-l-2 border-slate-100 last:border-0 last:pb-0">
                                            <div className="absolute top-0 -left-[9px] w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
                                            <div>
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-tight mb-2">3ª Nota - Janelas & Fluxo</p>
                                                <ul className="space-y-2">
                                                    {[
                                                        "Suporte a Drag & Drop (Arraste e Solte) para anexos direto nas pastas",
                                                        "Nova estrutura de documentação categorizada por tipo de anexo",
                                                        "Validação numérica restritiva para CPF, CRM e Telefone (apenas números)",
                                                        "Melhoria visual premium nos menus de seleção e dropdowns de especialidade",
                                                        "Sidebar de fases mais compacta e limpa para navegação ágil",
                                                        "Correção de campos e labels que eram cortados em telas menores",
                                                        "Lançamento do Portal de Ajuda Integrado e Central de Notas"
                                                    ].map((note, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-400 leading-relaxed">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" /> {note}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="p-8 border-t border-slate-100 flex justify-end bg-slate-50/50">
                                <button onClick={() => setShowHelpModal(false)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-100 hover:scale-105 active:scale-95">
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                showTiebreakerModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-[#259591] text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl">
                                        <Gavel size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight">Conclusão de Desempate</h3>
                                        <p className="text-sm font-black text-white/60 uppercase tracking-widest leading-none mt-1">Junta Médica</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowTiebreakerModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-8">
                                {/* Section 1: Desempatador */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-1 bg-[#259591] rounded-full"></div>
                                        <h4 className="text-xs font-black text-[#259591] uppercase tracking-widest">1. Dados do Desempatador</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Nome Completo"
                                            value={tiebreakerData.desempatador_nome}
                                            onChange={v => setTiebreakerData({ ...tiebreakerData, desempatador_nome: v })}
                                            labelClass="text-[#259591]"
                                        />
                                        <Input
                                            label="Especialidade"
                                            value={tiebreakerData.desempatador_especialidade}
                                            onChange={v => setTiebreakerData({ ...tiebreakerData, desempatador_especialidade: v })}
                                            labelClass="text-[#259591]"
                                        />
                                        <Input
                                            label="CRM"
                                            value={tiebreakerData.desempatador_crm}
                                            onChange={v => setTiebreakerData({ ...tiebreakerData, desempatador_crm: v.replace(/\D/g, '') })}
                                            labelClass="text-[#259591]"
                                        />
                                    </div>
                                    {/* 2FA Read-only visibility for admin context */}
                                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-teal-100 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-teal-600">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Dados de Verificação (2FA)</p>
                                                <p className="text-xs font-bold text-slate-600">
                                                    CRM: <span className="text-teal-600">{tiebreakerData.tiebreaker_verify_crm || '-'}</span> •
                                                    CPF: <span className="text-teal-600">{tiebreakerData.tiebreaker_verify_cpf || '-'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowVerifyConfigModal(true)}
                                            className="text-[9px] font-black text-teal-600 hover:text-teal-700 uppercase tracking-widest bg-white px-3 py-2 rounded-lg border border-teal-50 shadow-sm hover:shadow-md transition-all"
                                        >
                                            Alterar
                                        </button>
                                    </div>
                                </div>


                                {/* Section 2: Assistant Physician (Tiebreaker Phase) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-1 bg-[#259591] rounded-full"></div>
                                        <h4 className="text-xs font-black text-[#259591] uppercase tracking-widest">2. Médico Assistente</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Nome Completo"
                                            value={tiebreakerData.desempate_ass_nome}
                                            onChange={v => setTiebreakerData({ ...tiebreakerData, desempate_ass_nome: v })}
                                            labelClass="text-[#259591]"
                                        />
                                        <Input
                                            label="Especialidade"
                                            value={tiebreakerData.desempate_ass_especialidade}
                                            onChange={v => setTiebreakerData({ ...tiebreakerData, desempate_ass_especialidade: v })}
                                            labelClass="text-[#259591]"
                                        />
                                        <Input
                                            label="CRM"
                                            value={tiebreakerData.desempate_ass_crm}
                                            onChange={v => setTiebreakerData({ ...tiebreakerData, desempate_ass_crm: v.replace(/\D/g, '') })}
                                            labelClass="text-[#259591]"
                                        />
                                    </div>
                                </div>

                                {/* Section 3: Procedure Conclusions */}
                                {procedureConclusions.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-1 bg-[#259591] rounded-full"></div>
                                            <h4 className="text-xs font-black text-[#259591] uppercase tracking-widest">3. Conclusões dos Procedimentos</h4>
                                        </div>
                                        <div className="space-y-4">
                                            {procedureConclusions.map((proc, idx) => (
                                                <div key={proc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                                                        <span className="px-2 py-1 bg-[#259591]/10 text-[#259591] rounded font-bold">{proc.codigo || 'S/C'}</span>
                                                        <span className="font-bold text-slate-700">{proc.descricao}</span>
                                                        <span className="text-slate-400">Sol: {proc.qtd_solicitada} | Aut: {proc.qtd_autorizada}</span>
                                                    </div>
                                                    {proc.justificativa && (
                                                        <p className="text-xs text-amber-600 font-medium mb-2">
                                                            <strong>Justificativa:</strong> {proc.justificativa}
                                                        </p>
                                                    )}
                                                    <Input
                                                        label="Conclusão Desempatador"
                                                        value={proc.conclusao_desempate}
                                                        onChange={v => {
                                                            const updated = [...procedureConclusions];
                                                            updated[idx].conclusao_desempate = v;
                                                            setProcedureConclusions(updated);
                                                        }}
                                                        placeholder="Parecer sobre este procedimento..."
                                                        labelClass="text-[#259591]"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Section 4: Material Conclusions */}
                                {materialConclusions.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-1 bg-[#259591] rounded-full"></div>
                                            <h4 className="text-xs font-black text-[#259591] uppercase tracking-widest">4. Conclusões dos Materiais</h4>
                                        </div>
                                        <div className="space-y-4">
                                            {materialConclusions.map((mat, idx) => (
                                                <div key={mat.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                                                        <span className="font-bold text-slate-700">{mat.descricao}</span>
                                                        <span className="text-slate-400">Sol: {mat.qtd_solicitada} | Aut: {mat.qtd_autorizada}</span>
                                                    </div>
                                                    {mat.justificativa && (
                                                        <p className="text-xs text-amber-600 font-medium mb-2">
                                                            <strong>Justificativa:</strong> {mat.justificativa}
                                                        </p>
                                                    )}
                                                    <Input
                                                        label="Conclusão Desempatador"
                                                        value={mat.conclusao_desempate}
                                                        onChange={v => {
                                                            const updated = [...materialConclusions];
                                                            updated[idx].conclusao_desempate = v;
                                                            setMaterialConclusions(updated);
                                                        }}
                                                        placeholder="Parecer sobre este material..."
                                                        labelClass="text-[#259591]"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Section 5: Final Conclusion */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-1 bg-[#259591] rounded-full"></div>
                                        <h4 className="text-xs font-black text-[#259591] uppercase tracking-widest">5. Conclusão Final do Parecer</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#259591] uppercase tracking-widest ml-1">Parecer Final</label>
                                        <textarea
                                            value={tiebreakerData.parecer_conclusao}
                                            onChange={e => setTiebreakerData({ ...tiebreakerData, parecer_conclusao: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#259591]/20 transition-all min-h-[150px]"
                                            placeholder="Descreva a conclusão final da junta médica..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#259591] uppercase tracking-widest ml-1">Referências Bibliográficas</label>
                                        <textarea
                                            value={tiebreakerData.referencias_bibliograficas}
                                            onChange={e => setTiebreakerData({ ...tiebreakerData, referencias_bibliograficas: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#259591]/20 transition-all min-h-[100px]"
                                            placeholder="Cite as referências bibliográficas utilizadas..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                                <button
                                    onClick={async () => {
                                        if (!selectedRequest) return;
                                        try {
                                            let token = selectedRequest.tiebreaker_token;
                                            if (!token) {
                                                token = crypto.randomUUID();
                                                const { error } = await supabase
                                                    .from('medical_requests')
                                                    .update({ tiebreaker_token: token })
                                                    .eq('id', selectedRequest.id);
                                                if (error) throw error;

                                                setSelectedRequest(prev => ({ ...prev, tiebreaker_token: token }));
                                                setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, tiebreaker_token: token } : r));
                                            }

                                            const link = `${window.location.origin}/parecer/${token}`;
                                            setGeneratedLink(link);
                                            setShowLinkModal(true);
                                            await navigator.clipboard.writeText(link);
                                        } catch (e) {
                                            console.error('Erro ao gerar link:', e);
                                            alert('Erro ao gerar link.');
                                        }
                                    }}
                                    className="px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all flex items-center gap-2 mr-auto"
                                    title="Copiar link para preenchimento externo"
                                >
                                    <Link size={18} /> Copiar Link Externo
                                </button>
                                <button onClick={() => setShowTiebreakerModal(false)} className="px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-200 transition-all">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveTiebreaker}
                                    className="bg-[#259591] hover:bg-[#155a57] text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-teal-900/20 flex items-center gap-2"
                                >
                                    Finalizar <CheckCircle2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                showVerifyConfigModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-white/20">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-amber-500 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl shadow-lg">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight">Segurança: 2FA</h3>
                                        <p className="text-sm font-black text-white/60 uppercase tracking-widest leading-none mt-1">Configuração de Link</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowVerifyConfigModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center px-4">
                                        Defina os dados que o médico externo deve validar para acessar o formulário.
                                    </p>
                                    <div className="space-y-4 pt-4">
                                        <Input
                                            label="CRM de Verificação"
                                            value={tiebreakerData.tiebreaker_verify_crm}
                                            onChange={v => setTiebreakerData({ ...tiebreakerData, tiebreaker_verify_crm: v.replace(/\D/g, '') })}
                                            placeholder="Ex: 123456"
                                            labelClass="text-amber-600"
                                        />
                                        <Input
                                            label="CPF de Verificação"
                                            value={tiebreakerData.tiebreaker_verify_cpf}
                                            onChange={v => setTiebreakerData({ ...tiebreakerData, tiebreaker_verify_cpf: v.replace(/\D/g, '') })}
                                            placeholder="Apenas números"
                                            maxLength={11}
                                            labelClass="text-amber-600"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-4">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const { error } = await supabase
                                                    .from('medical_requests')
                                                    .update({
                                                        tiebreaker_verify_crm: tiebreakerData.tiebreaker_verify_crm,
                                                        tiebreaker_verify_cpf: tiebreakerData.tiebreaker_verify_cpf
                                                    })
                                                    .eq('id', selectedRequest.id);
                                                if (error) throw error;
                                                setShowVerifyConfigModal(false);
                                                setShowTiebreakerModal(true);
                                            } catch (e) {
                                                alert('Erro ao salvar configuração.');
                                            }
                                        }}
                                        className="w-full bg-[#259591] hover:bg-[#1a6e6a] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-2"
                                    >
                                        Continuar para Conclusão <CheckCircle2 size={16} />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const { error } = await supabase
                                                    .from('medical_requests')
                                                    .update({
                                                        tiebreaker_verify_crm: tiebreakerData.tiebreaker_verify_crm,
                                                        tiebreaker_verify_cpf: tiebreakerData.tiebreaker_verify_cpf
                                                    })
                                                    .eq('id', selectedRequest.id);
                                                if (error) throw error;
                                                setShowVerifyConfigModal(false);
                                                loadRequests();
                                            } catch (e) {
                                                alert('Erro ao salvar configuração.');
                                            }
                                        }}
                                        className="w-full py-5 text-amber-600 font-black text-xs uppercase tracking-widest hover:text-amber-700 transition-all border-2 border-amber-50 rounded-[1.5rem] hover:bg-amber-50"
                                    >
                                        Apenas Salvar Dados
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                showLinkModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-white/20 animate-in zoom-in-95 duration-300">
                            <div className="p-10 text-center">
                                <div className="w-24 h-24 bg-teal-50 rounded-[2rem] flex items-center justify-center text-teal-600 mx-auto mb-8 shadow-inner">
                                    <Link size={40} className="stroke-[2.5]" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Link Gerado com Sucesso!</h3>
                                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-8 px-4">
                                    O link para preenchimento externo foi copiado para sua área de transferência.
                                </p>

                                <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 mb-8 flex items-center gap-3 group">
                                    <div className="flex-1 truncate text-xs font-mono font-black text-slate-400 text-left">
                                        {generatedLink}
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedLink);
                                            alert('Link copiado!');
                                        }}
                                        className="p-3 bg-white text-teal-600 rounded-xl border border-teal-50 shadow-sm hover:scale-105 transition-all"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <a
                                        href={generatedLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#259591] hover:bg-[#1a6e6a] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-2"
                                    >
                                        Abrir para Teste <Activity size={16} />
                                    </a>
                                    <button
                                        onClick={() => setShowLinkModal(false)}
                                        className="w-full py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
                                    >
                                        Fechar Janela
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Tiebreaker Conclusion Report Modal */}
            {
                showTiebreakerReportModal && selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-white/20">
                            {/* Control Header (Hidden on Print) */}
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white print:hidden">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl shadow-lg">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight">Parecer de Junta Médica</h3>
                                        <p className="text-sm text-white/70 font-bold uppercase tracking-widest">Protocolo: {selectedRequest.requisicao}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            const r = selectedRequest;
                                            const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Parecer de Junta Médica - ${r.requisicao}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; padding: 15mm; color: #1e293b; font-size: 12px; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 4px solid #259591; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { display: flex; align-items: center; gap: 12px; color: #259591; }
        .logo-icon { width: 48px; height: 48px; }
        .logo h1 { font-size: 36px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; margin: 0; line-height: 1; }
        .logo p { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #64748b; margin: 0; }
        .header-right { text-align: right; }
        .header-right h2 { font-size: 18px; font-weight: 900; text-transform: uppercase; color: #259591; margin-bottom: 8px; }
        .header-right p { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .header-right span { color: #1e293b; font-weight: 900; }
        .section { border: 1px solid #259591; padding: 12px 16px; margin-bottom: 12px; }
        .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #259591; margin-bottom: 8px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: rgba(29, 120, 116, 0.7); }
        .field-value { font-weight: 700; font-size: 13px; }
        .professionals { display: flex; border: 1px solid #259591; margin-bottom: 12px; }
        .professionals > div { flex: 1; padding: 12px 16px; }
        .professionals > div:not(:last-child) { border-right: 1px solid #259591; }
        .professionals .last { background: rgba(240, 253, 250, 0.3); }
        table { width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #259591; }
        th { background: #f0fdfa; border: 1px solid rgba(29, 120, 116, 0.2); padding: 8px; text-align: left; font-weight: 700; font-size: 10px; text-transform: uppercase; }
        td { border: 1px solid rgba(29, 120, 116, 0.2); padding: 8px; }
        .code { font-family: monospace; }
        .center { text-align: center; }
        .bold { font-weight: 700; }
        .teal { color: #259591; }
        .conclusion-box { border: 1px solid #259591; background: rgba(240, 253, 250, 0.3); padding: 16px; margin-top: 24px; }
        .signature { margin-top: 48px; display: flex; justify-content: center; }
        .sig-line { width: 200px; border-top: 1px solid #64748b; padding-top: 8px; text-align: center; }
        .sig-line p { font-size: 11px; font-weight: 700; margin: 0; }
        .sig-line span { font-size: 10px; color: #64748b; }
        .footer { margin-top: 48px; text-align: center; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: rgba(29, 120, 116, 0.5); }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="#259591" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <div>
                <h1>Klini</h1>
                <p>Saúde & Bem-estar</p>
            </div>
        </div>
        <div class="header-right">
            <h2>Parecer de Junta Médica</h2>
            <p>Protocolo: <span style="font-size: 14px;">${r.requisicao}</span></p>
            <p>Emissão: <span>${new Date().toLocaleDateString('pt-BR')}</span></p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">I. Beneficiário</div>
        <div class="grid-2">
            <div><span class="field-label">Nome:</span> <span class="field-value">${r.ben_nome}</span></div>
            <div><span class="field-label">CPF:</span> <span class="field-value">${r.ben_cpf}</span></div>
        </div>
    </div>

    <div class="professionals">
        <div>
            <div class="section-title">II. Desempatador</div>
            <p class="field-value">${r.desempatador_nome || '-'}</p>
            <p style="font-size: 11px; color: #64748b;">CRM: ${r.desempatador_crm || '-'} • ${r.desempatador_especialidade || '-'}</p>
        </div>
        <div>
            <div class="section-title">III. Médico Assistente</div>
            <p class="field-value">${r.desempate_ass_nome || '-'}</p>
            <p style="font-size: 11px; color: #64748b;">CRM: ${r.desempate_ass_crm || '-'} • ${r.desempate_ass_especialidade || '-'}</p>
        </div>
        <div class="last">
            <div class="section-title">IV. Operadora</div>
            <p class="field-value">Klini Planos de Saúde</p>
            <p style="font-size: 11px; color: #64748b;">ANS: 42.202-9</p>
        </div>
    </div>

    <div style="margin-bottom: 24px; line-height: 1.6; text-align: justify; color: #334155;">
        <p>Em continuidade ao processo de <b>junta médica</b>, encaminhado em <b>${r.aud_data ? new Date(r.aud_data).toLocaleDateString('pt-BR') : '-'}</b> sob o número de guia nº <b>${r.guia || '-'}</b>, protocolo nº <b>${r.requisicao}</b>, informamos que foi realizada a seguinte deliberação:</p>
    </div>

    ${(r.medical_procedures?.length > 0) ? `
    <div style="margin-bottom: 12px;">
        <div class="section-title" style="margin-bottom: 8px;">V. Procedimentos</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 80px;">TUSS</th>
                    <th>Descrição</th>
                    <th style="width: 50px;" class="center">Sol.</th>
                    <th style="width: 50px;" class="center">Aut.</th>
                    <th>Conclusão Desempatador</th>
                </tr>
            </thead>
            <tbody>
                ${r.medical_procedures.map(p => `
                    <tr>
                        <td class="code">${p.codigo || '-'}</td>
                        <td class="bold">${p.descricao}</td>
                        <td class="center">${p.qtd_solicitada}</td>
                        <td class="center bold teal">${p.qtd_autorizada}</td>
                        <td>${p.conclusao_desempate || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${(r.medical_materials?.length > 0) ? `
    <div style="margin-bottom: 12px;">
        <div class="section-title" style="margin-bottom: 8px;">VI. Materiais & OPME</div>
        <table>
            <thead>
                <tr>
                    <th>Descrição</th>
                    <th style="width: 50px;" class="center">Sol.</th>
                    <th style="width: 50px;" class="center">Aut.</th>
                    <th>Conclusão Desempatador</th>
                </tr>
            </thead>
            <tbody>
                ${r.medical_materials.map(m => `
                    <tr>
                        <td class="bold">${m.descricao}</td>
                        <td class="center">${m.qtd_solicitada}</td>
                        <td class="center bold teal">${m.qtd_autorizada}</td>
                        <td>${m.conclusao_desempate || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="conclusion-box">
        <div class="section-title">VII. Conclusão Final do Parecer</div>
        <p style="font-size: 12px; white-space: pre-wrap; margin-bottom: 12px;">${r.parecer_conclusao || 'Sem conclusão registrada.'}</p>
        
        ${r.referencias_bibliograficas ? `
            <div style="border-top: 1px solid rgba(29, 120, 116, 0.2); padding-top: 8px; margin-top: 8px;">
                <div class="section-title" style="font-size: 8px;">VIII. Referências Bibliográficas</div>
                <p style="font-size: 11px; white-space: pre-wrap; font-style: italic; color: #475569;">${r.referencias_bibliograficas}</p>
            </div>
        ` : ''}
    </div>

    <div class="signature">
        <div class="sig-line">
            <p>${r.desempatador_nome || 'Desempatador'}</p>
            <span>CRM: ${r.desempatador_crm || '-'}</span>
        </div>
    </div>

    <div class="footer">
        Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} • ID: ${r.id}
    </div>
</body>
</html>`;
                                            const winPrint = window.open('', '', 'width=900,height=650');
                                            winPrint.document.write(printHTML);
                                            winPrint.document.close();
                                            winPrint.focus();
                                            setTimeout(() => { winPrint.print(); winPrint.close(); }, 250);
                                        }}
                                        className="bg-white text-emerald-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 hover:bg-emerald-50"
                                    >
                                        <Printer size={18} /> Imprimir / Salvar PDF
                                    </button>
                                    <button onClick={() => setShowTiebreakerReportModal(false)} className="p-4 hover:bg-white/20 rounded-xl transition-all text-white/60 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Report Content Wrapper */}
                            <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex justify-center">
                                <div
                                    id="tiebreaker-report-content"
                                    className="bg-white shadow-2xl border border-slate-200"
                                    style={{
                                        width: '210mm',
                                        minHeight: '297mm',
                                        fontFamily: "'Inter', sans-serif",
                                        padding: '15mm',
                                        margin: '0 auto',
                                        boxSizing: 'border-box',
                                        transform: 'scale(0.85)',
                                        transformOrigin: 'top center'
                                    }}
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-end border-b-[4px] border-[#259591] pb-4 mb-6">
                                        <div className="flex items-center gap-4 text-[#259591]">
                                            <Activity size={48} className="stroke-[2.5]" />
                                            <div>
                                                <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">Klini</h1>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.3em] opacity-80 text-slate-600">Saúde & Bem-estar</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-2xl font-black uppercase tracking-tight text-[#259591]">Parecer de Junta Médica</h2>
                                            <div className="mt-2 space-y-0.5">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    Protocolo: <span className="text-slate-900 text-sm font-black">{selectedRequest.requisicao}</span>
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    Emissão: <span className="text-slate-900 font-bold">{new Date().toLocaleDateString('pt-BR')}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Beneficiary */}
                                    <div className="border border-[#259591] p-4 mb-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#259591] mb-2">I. Beneficiário</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-[9px] uppercase font-bold text-[#259591]/70">Nome:</span> <span className="font-bold">{selectedRequest.ben_nome}</span></div>
                                            <div><span className="text-[9px] uppercase font-bold text-[#259591]/70">CPF:</span> <span className="font-bold">{selectedRequest.ben_cpf}</span></div>
                                        </div>
                                    </div>

                                    {/* Professionals */}
                                    <div className="border border-[#259591] flex mb-4">
                                        <div className="flex-1 p-4 border-r border-[#259591]">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#259591] mb-2">II. Desempatador</h3>
                                            <p className="text-sm font-bold">{selectedRequest.desempatador_nome || '-'}</p>
                                            <p className="text-xs text-slate-600">CRM: {selectedRequest.desempatador_crm || '-'} • {selectedRequest.desempatador_especialidade || '-'}</p>
                                        </div>
                                        <div className="flex-1 p-4 border-r border-[#259591]">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#259591] mb-2">III. Médico Assistente</h3>
                                            <p className="text-sm font-bold">{selectedRequest.desempate_ass_nome || '-'}</p>
                                            <p className="text-xs text-slate-600">CRM: {selectedRequest.desempate_ass_crm || '-'} • {selectedRequest.desempate_ass_especialidade || '-'}</p>
                                        </div>
                                        <div className="flex-1 p-4 bg-teal-50/30">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#259591] mb-2">IV. Operadora</h3>
                                            <p className="text-sm font-bold">Klini Planos de Saúde</p>
                                            <p className="text-xs text-slate-600">ANS: 42.202-9</p>
                                        </div>
                                    </div>

                                    {/* Introductory Note */}
                                    <div className="mb-8 text-sm leading-relaxed text-slate-600 text-justify bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <p>
                                            Em continuidade ao processo de <span className="font-bold text-slate-900">junta médica</span>, encaminhado em <span className="font-bold text-slate-900">{selectedRequest.aud_data ? new Date(selectedRequest.aud_data).toLocaleDateString('pt-BR') : '-'}</span> sob o número de guia nº <span className="font-bold text-slate-900">{selectedRequest.guia || '-'}</span>, protocolo nº <span className="font-bold text-slate-900">{selectedRequest.requisicao}</span>, informamos que foi realizada a seguinte deliberação:
                                        </p>
                                    </div>

                                    {/* Procedures Table */}
                                    {selectedRequest.medical_procedures?.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-[#259591] mb-2">V. Procedimentos</h3>
                                            <table className="w-full text-left border border-[#259591] text-xs">
                                                <thead className="bg-teal-50 border-b border-[#259591]">
                                                    <tr>
                                                        <th className="p-2 border-r border-[#259591]/20 w-20">TUSS</th>
                                                        <th className="p-2 border-r border-[#259591]/20">Descrição</th>
                                                        <th className="p-2 border-r border-[#259591]/20 w-12 text-center">Sol.</th>
                                                        <th className="p-2 border-r border-[#259591]/20 w-12 text-center">Aut.</th>
                                                        <th className="p-2">Conclusão Desempatador</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedRequest.medical_procedures.map((p, i) => (
                                                        <tr key={i} className="border-b border-[#259591]/20">
                                                            <td className="p-2 border-r border-[#259591]/20 font-mono">{p.codigo || '-'}</td>
                                                            <td className="p-2 border-r border-[#259591]/20 font-bold">{p.descricao}</td>
                                                            <td className="p-2 border-r border-[#259591]/20 text-center">{p.qtd_solicitada}</td>
                                                            <td className="p-2 border-r border-[#259591]/20 text-center font-bold text-[#259591]">{p.qtd_autorizada}</td>
                                                            <td className="p-2">{p.conclusao_desempate || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Materials Table */}
                                    {selectedRequest.medical_materials?.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-[#259591] mb-2">VI. Materiais & OPME</h3>
                                            <table className="w-full text-left border border-[#259591] text-xs">
                                                <thead className="bg-teal-50 border-b border-[#259591]">
                                                    <tr>
                                                        <th className="p-2 border-r border-[#259591]/20">Descrição</th>
                                                        <th className="p-2 border-r border-[#259591]/20 w-12 text-center">Sol.</th>
                                                        <th className="p-2 border-r border-[#259591]/20 w-12 text-center">Aut.</th>
                                                        <th className="p-2">Conclusão Desempatador</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedRequest.medical_materials.map((m, i) => (
                                                        <tr key={i} className="border-b border-[#259591]/20">
                                                            <td className="p-2 border-r border-[#259591]/20 font-bold">{m.descricao}</td>
                                                            <td className="p-2 border-r border-[#259591]/20 text-center">{m.qtd_solicitada}</td>
                                                            <td className="p-2 border-r border-[#259591]/20 text-center font-bold text-[#259591]">{m.qtd_autorizada}</td>
                                                            <td className="p-2">{m.conclusao_desempate || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Final Conclusion */}
                                    <div className="border border-[#259591] bg-teal-50/30 p-4 mt-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#259591] mb-2">VII. Conclusão Final do Parecer</h3>
                                        <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap mb-4">{selectedRequest.parecer_conclusao || 'Sem conclusão registrada.'}</p>

                                        {selectedRequest.referencias_bibliograficas && (
                                            <div className="border-t border-[#259591]/20 pt-3">
                                                <h3 className="text-[9px] font-black uppercase tracking-widest text-[#259591] mb-1 opacity-70">VIII. Referências Bibliográficas</h3>
                                                <p className="text-xs font-medium text-slate-500 italic whitespace-pre-wrap">{selectedRequest.referencias_bibliograficas}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Signature Block */}
                                    <div className="mt-12 flex justify-around">
                                        <div className="text-center">
                                            <div className="w-48 border-t border-slate-400 pt-2">
                                                <p className="text-xs font-bold">{selectedRequest.desempatador_nome || 'Desempatador'}</p>
                                                <p className="text-[10px] text-slate-500">CRM: {selectedRequest.desempatador_crm || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-12 text-center">
                                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#259591]/50">
                                            Documento gerado eletronicamente em {new Date().toLocaleString('pt-BR')} • ID: {selectedRequest.id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

function SpecialtyAutocomplete({ value, onChange, placeholder, required }) {
    const [search, setSearch] = useState(value || '');
    const [showOptions, setShowOptions] = useState(false);
    const [results, setResults] = useState([]);

    useEffect(() => {
        setSearch(value || '');
    }, [value]);

    const handleSearch = (term) => {
        setSearch(term);
        onChange(term); // Allow manual typing

        if (term.length < 1) {
            setResults([]);
            return;
        }

        const lowerTerm = term.toLowerCase().trim();
        const filtered = SPECIALTIES.filter(s =>
            s.toLowerCase().includes(lowerTerm)
        ).slice(0, 10);

        setResults(filtered);
        setShowOptions(true);
    };

    return (
        <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Especialidade da Divergência {required && <span className="text-red-500 font-black">*</span>}
            </label>
            <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => {
                        if (search.length >= 1) setShowOptions(true);
                        else {
                            setResults(SPECIALTIES.slice(0, 10));
                            setShowOptions(true);
                        }
                    }}
                    placeholder={placeholder}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 placeholder:text-slate-300 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#259591]/10 transition-all"
                />

                {showOptions && results.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2">
                            {results.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => {
                                        onChange(item);
                                        setSearch(item);
                                        setShowOptions(false);
                                    }}
                                    className="w-full text-left px-6 py-4 hover:bg-[#259591] hover:text-white rounded-[1.5rem] transition-all group/item mb-1 last:mb-0"
                                >
                                    <span className="block text-sm font-bold text-slate-600 group-hover/item:text-white truncate">{item}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {showOptions && (
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowOptions(false)} />
                )}
            </div>
        </div>
    );
}

// Internal Components
function StatCard({ icon, label, value, color }) {
    const colors = {
        primary: 'bg-teal-50 text-teal-600 border-teal-100 shadow-[0_8px_16px_rgba(37,149,145,0.1)]',
        warning: 'bg-amber-50 text-amber-600 border-amber-100 shadow-[0_8px_16px_rgba(217,119,6,0.1)]',
        info: 'bg-blue-50 text-blue-600 border-blue-100 shadow-[0_8px_16px_rgba(37,99,235,0.1)]',
        success: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_8px_16px_rgba(5,150,105,0.1)]'
    };
    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 transition-all hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-1 group">
            <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[1.2rem] ${colors[color]} border flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3`}>
                    {icon && cloneElement(icon, { size: 28, className: "stroke-[2.5]" })}
                </div>
                <div>
                    <p className="text-4xl font-black text-slate-800 tracking-tighter mb-0.5">{value}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                </div>
            </div>
        </div>
    );
}

function FormHeader({ icon, title, sub }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-[#259591] flex items-center justify-center border border-[#259591]/10 shadow-sm">
                {icon}
            </div>
            <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
                <p className="text-slate-400 text-sm font-medium">{sub}</p>
            </div>
        </div>
    );
}

function Input({ label, required, value, onChange, placeholder, type = "text", maxLength, labelClass = "text-slate-400" }) {
    return (
        <div className="space-y-2">
            <label className={`text-[10px] font-black ${labelClass} uppercase tracking-widest ml-1`}>
                {label} {required && <span className="text-red-500 font-black">*</span>}
            </label>
            <input
                type={type}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 placeholder:text-slate-300 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#259591]/10 transition-all"
            />
        </div>
    );
}

function Checkbox({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer group transition-all hover:bg-slate-100">
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? 'bg-[#259591] border-[#259591]' : 'border-slate-300 bg-white group-hover:border-[#259591]'}`}>
                {checked && <X size={14} className="text-white" />}
            </div>
            <span className="text-sm font-bold text-slate-600 transition-colors group-hover:text-slate-900">{label}</span>
            <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
        </label>
    );
}

function ReportSection({ title, icon, children }) {
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

function ReportItem({ label, value, className = "" }) {
    return (
        <div className={`${className} break-inside-avoid`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-700 leading-tight">{value || '-'}</p>
        </div>
    );
}

function TussAutocomplete({ value, onChange }) {
    const [search, setSearch] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [results, setResults] = useState([]);

    const handleSearch = (term) => {
        setSearch(term);
        if (term.length < 2) {
            setResults([]);
            return;
        }

        const lowerTerm = term.toLowerCase().trim();
        const cleanTerm = lowerTerm.replace(/[^a-z0-9]/g, ''); // Strip dots, dashes, spaces for code matching

        // Filter and sort: prioritize exact matches and prefix matches
        const filtered = TUSS_DATA.filter(item => {
            if (item.code === 'Código') return false;

            const itemCode = (item.code || '').toLowerCase();
            const cleanItemCode = itemCode.replace(/[^a-z0-9]/g, '');
            const itemLabel = item.label.toLowerCase();

            // Match against original label OR cleaned code (supports "10.10.10.12" input matching "10101012")
            return itemLabel.includes(lowerTerm) || cleanItemCode.includes(cleanTerm);
        }).sort((a, b) => {
            const aCode = (a.code || '').toLowerCase();
            const bCode = (b.code || '').toLowerCase();
            const cleanACode = aCode.replace(/[^a-z0-9]/g, '');
            const cleanBCode = bCode.replace(/[^a-z0-9]/g, '');

            // 1. Exact code match (Cleaned)
            if (cleanACode === cleanTerm && cleanBCode !== cleanTerm) return -1;
            if (cleanACode !== cleanTerm && cleanBCode === cleanTerm) return 1;

            // 2. Code starts with term (prefix match) - HIGHEST PRIORITY after exact match
            const aCodeStarts = cleanACode.startsWith(cleanTerm);
            const bCodeStarts = cleanBCode.startsWith(cleanTerm);
            if (aCodeStarts && !bCodeStarts) return -1;
            if (!aCodeStarts && bCodeStarts) return 1;

            // 3. String length difference
            if (aCodeStarts && bCodeStarts) {
                return aCode.length - bCode.length;
            }

            // 4. Alphabetical order
            return aCode.localeCompare(bCode);
        });

        // Deduplication (keep first occurrence of each code)
        const uniqueResults = [];
        const seenCodes = new Set();
        for (const item of filtered) {
            if (!seenCodes.has(item.code)) {
                seenCodes.add(item.code);
                uniqueResults.push(item);
                if (uniqueResults.length >= 100) break;
            }
        }

        setResults(uniqueResults);
        setShowOptions(true);
    };

    // Derived state determining if a valid procedure is selected
    const isSelected = !!value.codigo;

    return (
        <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Busca de Procedimentos (TUSS) <span className="text-red-500 font-black">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* Code Field (Search Input) - Now the interactive one */}
                <div className="md:col-span-1 relative">
                    {isSelected ? (
                        <div className="relative">
                            <input
                                readOnly
                                value={value.codigo}
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
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => {
                                    if (search.length >= 2) setShowOptions(true);
                                }}
                                placeholder="Cód..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#259591]/10 transition-all"
                            />

                            {showOptions && results.length > 0 && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 max-h-80 overflow-y-auto w-[300%] animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-2">
                                        {results.map((item) => (
                                            <button
                                                key={item.value}
                                                onClick={() => {
                                                    onChange({ codigo: item.code, descricao: item.description });
                                                    setShowOptions(false);
                                                }}
                                                className="w-full text-left px-6 py-4 hover:bg-[#259591] hover:text-white rounded-[1.5rem] transition-all group/item mb-1 last:mb-0"
                                            >
                                                <span className="block text-[10px] font-black text-[#259591] group-hover/item:text-teal-200 uppercase tracking-widest mb-1">{item.code}</span>
                                                <span className="block text-sm font-bold text-slate-600 group-hover/item:text-white truncate">{item.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {showOptions && (
                                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowOptions(false)} />
                            )}
                        </div>
                    )}
                </div>

                {/* Description Field (Read Only) */}
                <div className="md:col-span-2">
                    <input
                        readOnly
                        value={value.descricao || ''}
                        placeholder="Nome do procedimento (Selecione pelo código)"
                        className="w-full px-6 py-4 rounded-2xl bg-slate-100 border border-slate-100 font-bold text-slate-500 outline-none cursor-not-allowed"
                    />
                </div>
            </div>
        </div>
    );
}

function RequestDetails({ request, onEdit, onBack }) {
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
                            <div className="flex gap-4">
                                <ReportItem label="CPF" value={request.ben_cpf} className="flex-1" />
                                <ReportItem label="Sexo" value={request.ben_sexo} className="flex-1" />
                            </div>
                            <ReportItem label="E-mail" value={request.ben_email} />
                            <ReportItem label="Telefone" value={request.ben_telefone} />
                            <ReportItem label="Nascimento" value={request.ben_nascimento ? new Date(request.ben_nascimento).toLocaleDateString('pt-BR') : '-'} />
                            <div className="flex gap-4">
                                <ReportItem label="Cidade" value={request.ben_cidade} className="flex-1" />
                                <ReportItem label="Estado" value={request.ben_estado} className="flex-1" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Activity size={20} className="text-teal-600" /> Auditor</h3>
                        <div className="space-y-4">
                            <ReportItem label="Nome" value={request.aud_nome} />
                            <div className="flex gap-4">
                                <ReportItem label="CRM" value={request.aud_crm} className="flex-1" />
                                <ReportItem label="Estado (CRM)" value={request.aud_estado} className="flex-1" />
                            </div>
                            <ReportItem label="Guia" value={request.guia} />
                            <ReportItem label="Data Análise" value={request.aud_data ? new Date(request.aud_data).toLocaleDateString('pt-BR') : '-'} />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Stethoscope size={20} className="text-teal-600" /> Médico Assistente</h3>
                        <div className="space-y-4">
                            <ReportItem label="Nome" value={request.ass_nome} />
                            <div className="flex gap-4">
                                <ReportItem label="CRM" value={request.ass_crm} className="flex-1" />
                                <ReportItem label="Especialidade" value={request.ass_especialidade} className="flex-1" />
                            </div>
                            <ReportItem label="Email" value={request.ass_email} />
                            <ReportItem label="Telefone" value={request.ass_telefone} />
                            <ReportItem label="Endereço" value={request.ass_endereco} />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><AlertTriangle size={20} className="text-teal-600" /> Divergência</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <ReportItem label="Especialidade Afetada" value={request.div_especialidade} className="flex-1" />
                                <ReportItem label="Prazo ANS" value={request.prazo_ans ? new Date(request.prazo_ans).toLocaleDateString('pt-BR') : '-'} className="flex-1" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivos</p>
                                <div className="flex flex-wrap gap-2">
                                    {request.div_motivos?.map((m, i) => (
                                        <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">{m}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

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

                    {request.parecer_conclusao && (
                        <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100">
                            <h3 className="text-lg font-black text-emerald-900 mb-6 flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-emerald-600" /> Conclusão Desempatador</h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 border-b border-emerald-200/50 pb-4">
                                    <div>
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Desempatador</p>
                                        <p className="text-xs font-bold text-emerald-900">{request.desempatador_nome}</p>
                                        <p className="text-[10px] text-emerald-600/70">CRM: {request.desempatador_crm}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Médico Assistente</p>
                                        <p className="text-xs font-bold text-emerald-900">{request.ass_nome}</p>
                                        <p className="text-[10px] text-emerald-600/70">CRM: {request.ass_crm}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Conclusão</p>
                                    <p className="text-xs text-emerald-800 leading-relaxed font-medium whitespace-pre-wrap italic bg-white/50 p-4 rounded-xl border border-emerald-100">
                                        {request.parecer_conclusao}
                                    </p>
                                </div>
                                {request.referencias_bibliograficas && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Referências Bibliográficas</p>
                                        <p className="text-[11px] text-emerald-700/70 leading-relaxed font-medium whitespace-pre-wrap italic">
                                            {request.referencias_bibliograficas}
                                        </p>
                                    </div>
                                )}
                                {request.situacao === 'Finalizado' && (
                                    <div className="mt-4 pt-4 border-t border-emerald-200/50">
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Deseja liberar este parecer para reedição pelo médico desempatador?')) return;
                                                const { error } = await supabase
                                                    .from('medical_requests')
                                                    .update({ tiebreaker_allow_edit: true, situacao: 'Aguardando Desempatador' })
                                                    .eq('id', request.id);

                                                if (error) alert('Erro ao liberar: ' + error.message);
                                                else {
                                                    alert('Reedição liberada com sucesso!');
                                                    onBack(); // Return to list to refresh data
                                                }
                                            }}
                                            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                                        >
                                            Liberar Reedição do Desempatador
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Paperclip size={20} className="text-teal-600" /> Documentos e Anexos
                            </h3>
                            <button
                                onClick={() => {
                                    const allDocs = [
                                        ...Object.values(request.documentos_internos || {}).flat(),
                                        ...(request.medical_attachments || []).map(a => ({ url: a.file_path, name: a.file_name }))
                                    ].filter(d => d.url || d.file_path);

                                    if (allDocs.length === 0) {
                                        alert('Nenhum documento para baixar.');
                                        return;
                                    }

                                    allDocs.forEach((doc, index) => {
                                        setTimeout(() => {
                                            const link = document.createElement('a');
                                            link.href = doc.url || doc.file_path;
                                            link.target = '_blank';
                                            link.download = doc.name || 'documento';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }, index * 400); // 400ms delay to prevent browser block
                                    });
                                }}
                                className="bg-[#259591] hover:bg-[#155a57] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Download size={14} /> Baixar Todos os Arquivos
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Documentos Internos */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">Documentos Internos</h4>
                                {DOC_TYPES.map(dt => {
                                    const docs = request.documentos_internos?.[dt.id] || [];
                                    if (docs.length === 0) return null;
                                    return (
                                        <div key={dt.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{dt.label}</p>
                                            <div className="space-y-2">
                                                {docs.map((doc, idx) => (
                                                    <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors group">
                                                        <FileText size={14} />
                                                        <span className="text-xs font-bold group-hover:underline">{doc.name}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {!Object.values(request.documentos_internos || {}).some(arr => arr?.length > 0) && (
                                    <p className="text-xs text-slate-400 italic">Nenhum documento interno anexado.</p>
                                )}
                            </div>

                            {/* Anexos Gerais */}
                            {request.medical_attachments?.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-700 pb-2">Anexos Gerais</h4>
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                                        {request.medical_attachments.map((att, idx) => (
                                            <a key={idx} href={att.file_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors group">
                                                <Paperclip size={14} />
                                                <span className="text-xs font-bold group-hover:underline">{att.file_name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
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
        </div >
    );
}


