import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Activity, FileText, CheckCircle2, AlertCircle,
    Gavel, User, Stethoscope, Save, Loader2
} from 'lucide-react';

export default function TiebreakerExternalForm({ token }) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [request, setRequest] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [verifyCrm, setVerifyCrm] = useState('');
    const [verifyCpf, setVerifyCpf] = useState('');
    const [verificationError, setVerificationError] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        desempatador_nome: '',
        desempatador_crm: '',
        desempatador_especialidade: '',
        parecer_conclusao: '',
        referencias_bibliograficas: ''
    });

    const [procedureConclusions, setProcedureConclusions] = useState([]);
    const [materialConclusions, setMaterialConclusions] = useState([]);

    useEffect(() => {
        fetchRequestData();
    }, [token]);

    const fetchRequestData = async () => {
        try {
            // Using RPC function for security
            const { data, error } = await supabase
                .rpc('get_tiebreaker_request_by_token', { token_input: token });

            if (error) throw error;
            if (!data) throw new Error('Solicitação não encontrada ou token inválido.');

            if (data.situacao === 'Finalizado') {
                setSuccess(true); // Already done
                setLoading(false);
                return;
            }

            setRequest(data);

            // Initialize item conclusions
            if (data.medical_procedures) {
                setProcedureConclusions(data.medical_procedures.map(p => ({
                    id: p.id,
                    codigo: p.codigo,
                    descricao: p.descricao,
                    conclusao_desempate: ''
                })));
            }
            if (data.medical_materials) {
                setMaterialConclusions(data.medical_materials.map(m => ({
                    id: m.id,
                    descricao: m.descricao,
                    conclusao_desempate: ''
                })));
            }

        } catch (err) {
            console.error('Erro ao buscar dados:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validate required fields
            if (!formData.desempatador_nome || !formData.desempatador_crm || !formData.parecer_conclusao) {
                throw new Error('Preencha os campos obrigatórios (Nome, CRM e Parecer Final).');
            }

            const payload_desempatador = {
                desempatador_nome: formData.desempatador_nome,
                desempatador_crm: formData.desempatador_crm,
                describe_especialidade: formData.desempatador_especialidade,
                parecer_conclusao: formData.parecer_conclusao,
                referencias_bibliograficas: formData.referencias_bibliograficas
            };

            const { data, error } = await supabase
                .rpc('submit_tiebreaker_opinion', {
                    token_input: token,
                    desempatador_data: payload_desempatador,
                    procedure_conclusions: procedureConclusions,
                    material_conclusions: materialConclusions
                });

            if (error) throw error;

            setSuccess(true);
        } catch (err) {
            console.error('Erro ao enviar:', err);
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerify = (e) => {
        e.preventDefault();
        setVerificationError(null);

        const cleanVerifyCpf = verifyCpf.replace(/\D/g, '');
        const targetCrm = request.tiebreaker_verify_crm;
        const targetCpf = request.tiebreaker_verify_cpf?.replace(/\D/g, '');

        if (verifyCrm === targetCrm && cleanVerifyCpf === targetCpf) {
            setIsVerified(true);
        } else {
            setVerificationError('Dados de verificação incorretos. Por favor, confira seu CRM e CPF.');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="text-[#259591] animate-spin" size={48} />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-red-100">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Acesso Negado</h2>
                <p className="text-slate-500">{error}</p>
            </div>
        </div>
    );

    if (success) return (
        <div className="min-h-screen bg-[#259591] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center relative z-10 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-teal-50 text-[#259591] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-100">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Parecer Enviado!</h2>
                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                    Seu parecer de desempate foi registrado com sucesso no sistema da Klini. O processo foi finalizado automaticamente.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Pode fechar esta janela com segurança
                </div>
            </div>
        </div>
    );

    if (!isVerified && request && (request.tiebreaker_verify_crm || request.tiebreaker_verify_cpf)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Activity size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Verificação de Segurança</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Valide seus dados para acessar o formulário</p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">CRM de Verificação</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Digite seu CRM"
                                    value={verifyCrm}
                                    onChange={e => setVerifyCrm(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">CPF de Verificação</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="000.000.000-00"
                                    value={verifyCpf}
                                    onChange={e => setVerifyCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                    maxLength={11}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {verificationError && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} />
                                <p className="text-xs font-bold leading-tight">{verificationError}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                        >
                            Acessar Formulário
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#259591] rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-teal-200">K</div>
                        <div>
                            <h1 className="font-black text-slate-800 text-lg tracking-tight">Junta Médica</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parecer de Desempate</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                        Protocolo: {request.requisicao}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
                {/* Case Summary */}
                <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Resumo do Caso</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Beneficiário</p>
                            <p className="font-bold text-slate-700">{request.ben_nome}</p>
                            <p className="text-xs text-slate-500">{request.ben_sexo} • {new Date(request.ben_nascimento).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Médico Assistente</p>
                            <p className="font-bold text-slate-700">{request.ass_nome}</p>
                            <p className="text-xs text-slate-500">CRM: {request.ass_crm} • {request.ass_especialidade}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2">Itens em Divergência</h3>
                        {request.medical_procedures?.map((proc, idx) => (
                            <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl">
                                <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 mb-2 block w-fit">Procedimento</span>
                                <p className="font-bold text-slate-700">{proc.codigo} - {proc.descricao}</p>
                            </div>
                        ))}
                        {request.medical_materials?.map((mat, idx) => (
                            <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl">
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded mb-2 block w-fit">Material</span>
                                <p className="font-bold text-slate-700">{mat.descricao}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Physician Info */}
                    <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#1d78741a] text-[#259591] rounded-lg">
                                <User size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Seus Dados (Desempatador)</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome Completo *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-4 bg-slate-50 rounded-xl border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-[#259591]"
                                    value={formData.desempatador_nome}
                                    onChange={e => setFormData({ ...formData, desempatador_nome: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CRM/UF *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-4 bg-slate-50 rounded-xl border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-[#259591]"
                                        value={formData.desempatador_crm}
                                        onChange={e => setFormData({ ...formData, desempatador_crm: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Especialidade</label>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-slate-50 rounded-xl border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-[#259591]"
                                        value={formData.desempatador_especialidade}
                                        onChange={e => setFormData({ ...formData, desempatador_especialidade: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Item Conclusions */}
                    <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Activity size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Parecer Técnico por Item</h2>
                        </div>

                        <div className="space-y-6">
                            {procedureConclusions.map((proc, idx) => (
                                <div key={proc.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                    <h4 className="font-bold text-slate-800 mb-2">{proc.descricao}</h4>
                                    <p className="text-xs text-slate-500 mb-4 font-mono">{proc.codigo}</p>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Conclusão para este item</label>
                                    <textarea
                                        rows={3}
                                        className="w-full p-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#259591]"
                                        placeholder="Digite o parecer técnico para este item..."
                                        value={proc.conclusao_desempate}
                                        onChange={(e) => {
                                            const newconclusions = [...procedureConclusions];
                                            newconclusions[idx].conclusao_desempate = e.target.value;
                                            setProcedureConclusions(newconclusions);
                                        }}
                                    />
                                </div>
                            ))}

                            {materialConclusions.map((mat, idx) => (
                                <div key={mat.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                    <h4 className="font-bold text-slate-800 mb-2">{mat.descricao}</h4>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Conclusão para este item</label>
                                    <textarea
                                        rows={3}
                                        className="w-full p-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#259591]"
                                        placeholder="Digite o parecer técnico para este item..."
                                        value={mat.conclusao_desempate}
                                        onChange={(e) => {
                                            const newM = [...materialConclusions];
                                            newM[idx].conclusao_desempate = e.target.value;
                                            setMaterialConclusions(newM);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Final Conclusion */}
                    <section className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#1d78741a] text-[#259591] rounded-lg">
                                <Gavel size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Conclusão Final</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Parecer Descritivo Completo *</label>
                                <textarea
                                    required
                                    rows={8}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-slate-200 font-medium text-slate-700 focus:ring-2 focus:ring-[#259591] focus:bg-white transition-all"
                                    placeholder="Descreva detalhadamente a análise técnica e a conclusão final..."
                                    value={formData.parecer_conclusao}
                                    onChange={e => setFormData({ ...formData, parecer_conclusao: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Referências Bibliográficas</label>
                                <textarea
                                    rows={4}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-slate-200 font-medium text-slate-700 focus:ring-2 focus:ring-[#259591] focus:bg-white transition-all"
                                    placeholder="Cite as referências utilizadas (opcional)..."
                                    value={formData.referencias_bibliograficas}
                                    onChange={e => setFormData({ ...formData, referencias_bibliograficas: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-6 bg-[#259591] hover:bg-[#155a57] text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-teal-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : <Save />}
                        {submitting ? 'Enviando...' : 'Assinar e Finalizar Parecer'}
                    </button>
                    <p className="text-center text-xs text-slate-400 font-medium pb-8">Ao clicar em finalizar, o parecer será registrado e não poderá ser alterado.</p>
                </form>
            </main>
        </div>
    );
}
