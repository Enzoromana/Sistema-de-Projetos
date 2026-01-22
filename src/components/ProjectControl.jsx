import { useState, useEffect } from 'react';
import {
    Plus, Folder, CheckCircle2, Clock,
    AlertCircle, Trash2, Edit3, X,
    ChevronDown, ChevronRight, ChevronUp,
    BarChart3, Target, Calendar, Users,
    Columns, LayoutList, MoreHorizontal
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const STATUS = {
    pending: { label: 'Pendente', color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
    progress: { label: 'Em Andamento', color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    done: { label: 'Concluído', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
    blocked: { label: 'Bloqueado', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50' }
};

const PRIORITY = {
    low: { label: 'Baixa', color: 'bg-slate-400' },
    medium: { label: 'Média', color: 'bg-amber-400' },
    high: { label: 'Alta', color: 'bg-red-500' }
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

export default function ProjectControl() {
    const [projects, setProjects] = useState([]);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
    const [expandedProject, setExpandedProject] = useState(null);
    const [expandedTask, setExpandedTask] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    const [showSubtaskModal, setShowSubtaskModal] = useState(false);
    const [editingSubtask, setEditingSubtask] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '', description: '', status: 'pending', priority: 'medium', deadline: ''
    });

    const [taskForm, setTaskForm] = useState({
        title: '', status: 'pending', start_date: '', deadline: '', completed_at: ''
    });

    const [subtaskForm, setSubtaskForm] = useState({ title: '', status: 'pending', assignee: '', completed_at: '' });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*, tasks(*, subtasks(*))')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formattedProjects = data.map(p => ({
                    ...p,
                    tasks: (p.tasks || []).sort((a, b) => (a.position || a.id) - (b.position || b.id)).map(t => ({
                        ...t,
                        subtasks: (t.subtasks || []).sort((a, b) => (a.position || a.id) - (b.position || b.id))
                    }))
                }));
                setProjects(formattedProjects);
            }
        } catch (e) {
            console.error('Erro ao carregar projetos:', e);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: projects.length,
        done: projects.filter(p => p.status === 'done').length,
        progress: projects.filter(p => p.status === 'progress').length,
        pending: projects.filter(p => p.status === 'pending').length,
        tasksTotal: projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0),
        tasksDone: projects.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === 'done').length || 0), 0)
    };

    const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

    // PROJECT CRUD
    const handleSubmit = async () => {
        if (!formData.name.trim()) return;
        try {
            if (editingProject) {
                const { data, error } = await supabase
                    .from('projects')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        status: formData.status,
                        priority: formData.priority,
                        deadline: formData.deadline || null
                    })
                    .eq('id', editingProject.id)
                    .select();
                if (error) throw error;
                if (data) setProjects(projects.map(p => p.id === editingProject.id ? { ...p, ...data[0] } : p));
            } else {
                const { data, error } = await supabase
                    .from('projects')
                    .insert([{
                        name: formData.name,
                        description: formData.description,
                        status: formData.status,
                        priority: formData.priority,
                        deadline: formData.deadline || null
                    }])
                    .select();
                if (error) throw error;
                if (data) setProjects([{ ...data[0], tasks: [] }, ...projects]);
            }
            resetForm();
        } catch (e) {
            alert('Erro ao salvar projeto: ' + (e.message || 'Verifique o console'));
        }
    };

    const resetForm = () => {
        setShowModal(false);
        setEditingProject(null);
        setFormData({ name: '', description: '', status: 'pending', priority: 'medium', deadline: '' });
    };

    const deleteProject = async (id) => {
        if (!confirm('Excluir projeto e todas as tarefas?')) return;
        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
            setProjects(projects.filter(p => p.id !== id));
        } catch (e) { alert('Erro ao excluir projeto'); }
    };

    // TASK CRUD
    const handleTaskSubmit = async () => {
        if (!taskForm.title.trim()) return;
        try {
            if (editingTask) {
                const { data, error } = await supabase
                    .from('tasks')
                    .update({
                        title: taskForm.title,
                        status: taskForm.status,
                        start_date: taskForm.start_date || null,
                        deadline: taskForm.deadline || null,
                        completed_at: taskForm.completed_at || null
                    })
                    .eq('id', editingTask.id)
                    .select();
                if (error) throw error;
                if (data) {
                    setProjects(projects.map(p => ({
                        ...p,
                        tasks: p.tasks.map(t => t.id === editingTask.id ? { ...t, ...data[0] } : t)
                    })));
                }
            } else {
                const maxPos = projects.find(p => p.id === selectedProjectId)?.tasks
                    .reduce((max, t) => Math.max(max, t.position || 0), 0) || 0;

                const { data, error } = await supabase
                    .from('tasks')
                    .insert([{
                        project_id: selectedProjectId,
                        title: taskForm.title,
                        status: taskForm.status,
                        start_date: taskForm.start_date || null,
                        deadline: taskForm.deadline || null,
                        completed_at: taskForm.completed_at || null,
                        position: maxPos + 1
                    }])
                    .select();
                if (error) throw error;
                if (data) {
                    setProjects(projects.map(p => p.id === selectedProjectId ? { ...p, tasks: [...(p.tasks || []), { ...data[0], subtasks: [] }] } : p));
                }
            }
            setShowTaskModal(false);
            setEditingTask(null);
            setTaskForm({ title: '', status: 'pending', start_date: '', deadline: '', completed_at: '' });
        } catch (e) { alert('Erro na tarefa: ' + e.message); }
    };

    const toggleTaskStatus = async (projectId, taskId, currentStatus) => {
        const newStatus = currentStatus === 'done' ? 'pending' : 'done';
        const completedAt = newStatus === 'done' ? new Date().toISOString().split('T')[0] : null;
        try {
            await supabase.from('tasks').update({
                status: newStatus,
                completed_at: completedAt
            }).eq('id', taskId);
            setProjects(projects.map(p => p.id === projectId ? {
                ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus, completed_at: completedAt } : t)
            } : p));
        } catch (e) { console.error(e); }
    };

    const deleteTask = async (projectId, taskId) => {
        if (!confirm('Excluir tarefa?')) return;
        try {
            await supabase.from('tasks').delete().eq('id', taskId);
            setProjects(projects.map(p => p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p));
        } catch (e) { console.error(e); }
    };

    // SUBTASK CRUD
    const handleSubtaskSubmit = async () => {
        if (!subtaskForm.title.trim()) return;
        try {
            if (editingSubtask) {
                const { data, error } = await supabase
                    .from('subtasks')
                    .update({
                        title: subtaskForm.title,
                        status: subtaskForm.status,
                        assignee: subtaskForm.assignee || null,
                        completed_at: subtaskForm.completed_at || null
                    })
                    .eq('id', editingSubtask.id)
                    .select();
                if (error) throw error;
                if (data) {
                    setProjects(projects.map(p => ({
                        ...p,
                        tasks: p.tasks.map(t => ({
                            ...t,
                            subtasks: t.subtasks.map(s => s.id === editingSubtask.id ? { ...s, ...data[0] } : s)
                        }))
                    })));
                }
            } else {
                const maxPos = projects.find(p => p.tasks.some(t => t.id === selectedTaskId))
                    ?.tasks.find(t => t.id === selectedTaskId)
                    ?.subtasks.reduce((max, s) => Math.max(max, s.position || 0), 0) || 0;

                const { data, error } = await supabase
                    .from('subtasks')
                    .insert([{
                        task_id: selectedTaskId,
                        title: subtaskForm.title,
                        status: subtaskForm.status,
                        assignee: subtaskForm.assignee || null,
                        completed_at: subtaskForm.completed_at || null,
                        position: maxPos + 1
                    }])
                    .select();
                if (error) throw error;
                if (data) {
                    setProjects(projects.map(p => ({
                        ...p,
                        tasks: p.tasks.map(t => t.id === selectedTaskId ? { ...t, subtasks: [...(t.subtasks || []), data[0]] } : t)
                    })));
                }
            }
            setShowSubtaskModal(false);
            setEditingSubtask(null);
            setSubtaskForm({ title: '', status: 'pending', assignee: '', completed_at: '' });
        } catch (e) { alert('Erro na subtarefa: ' + e.message); }
    };

    const toggleSubtaskStatus = async (taskId, subtaskId, currentStatus) => {
        const newStatus = currentStatus === 'done' ? 'pending' : 'done';
        const completedAt = newStatus === 'done' ? new Date().toISOString().split('T')[0] : null;
        try {
            await supabase.from('subtasks').update({
                status: newStatus,
                completed_at: completedAt
            }).eq('id', subtaskId);
            setProjects(projects.map(p => ({
                ...p,
                tasks: p.tasks.map(t => t.id === taskId ? {
                    ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, status: newStatus, completed_at: completedAt } : s)
                } : t)
            })));
        } catch (e) { console.error(e); }
    };

    const deleteSubtask = async (taskId, subtaskId) => {
        if (!confirm('Excluir subtarefa?')) return;
        try {
            await supabase.from('subtasks').delete().eq('id', subtaskId);
            setProjects(projects.map(p => ({
                ...p,
                tasks: p.tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) } : t)
            })));
        } catch (e) { console.error(e); }
    };

    const handleSubtaskDrop = async (taskId, draggedId, targetId) => {
        if (draggedId === targetId) return;

        const projectIndex = projects.findIndex(p => p.tasks.some(t => t.id === taskId));
        const project = projects[projectIndex];
        const taskIndex = project.tasks.findIndex(t => t.id === taskId);
        const task = project.tasks[taskIndex];

        const subtasks = [...task.subtasks];
        const draggedIndex = subtasks.findIndex(s => s.id === draggedId);
        const targetIndex = subtasks.findIndex(s => s.id === targetId);

        const [draggedItem] = subtasks.splice(draggedIndex, 1);
        subtasks.splice(targetIndex, 0, draggedItem);

        // Update locally for immediate feedback
        setProjects(projects.map((p, pIdx) =>
            pIdx === projectIndex
                ? {
                    ...p,
                    tasks: p.tasks.map((t, tIdx) =>
                        tIdx === taskIndex ? { ...t, subtasks: subtasks } : t
                    )
                }
                : p
        ));

        // Update positions in DB
        try {
            const updates = subtasks.map((s, idx) => ({
                id: s.id,
                position: idx + 1
            }));

            for (const update of updates) {
                await supabase.from('subtasks').update({ position: update.position }).eq('id', update.id);
            }
        } catch (e) {
            console.error('Erro ao salvar nova ordem de subtarefas:', e);
        }
    };

    const handleTaskDrop = async (projectId, draggedId, targetId) => {
        if (draggedId === targetId) return;

        const projectIndex = projects.findIndex(p => p.id === projectId);
        const project = projects[projectIndex];

        const tasks = [...project.tasks];
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);

        const [draggedItem] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, draggedItem);

        // Update locally for immediate feedback
        setProjects(projects.map((p, pIdx) =>
            pIdx === projectIndex ? { ...p, tasks: tasks } : p
        ));

        // Update positions in DB
        try {
            const updates = tasks.map((t, idx) => ({
                id: t.id,
                position: idx + 1
            }));

            for (const update of updates) {
                await supabase.from('tasks').update({ position: update.position }).eq('id', update.id);
            }
        } catch (e) {
            console.error('Erro ao salvar nova ordem de tarefas:', e);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-lg sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Folder size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Gestão de Projetos</h1>
                                <p className="text-teal-100 text-sm">Hub Manager Klini</p>

                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-white/10 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-teal-700 shadow-sm' : 'text-white hover:bg-white/10'}`}
                                >
                                    <LayoutList size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white text-teal-700 shadow-sm' : 'text-white hover:bg-white/10'}`}
                                >
                                    <Columns size={18} />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 bg-white text-teal-700 px-4 py-2 rounded-lg font-medium hover:bg-teal-50 transition-all shadow-md"
                            >
                                <Plus size={18} /> Novo Projeto
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard icon={<BarChart3 />} label="Total" value={stats.total} color="slate" />
                    <StatCard icon={<CheckCircle2 />} label="Concluídos" value={stats.done} color="emerald" />
                    <StatCard icon={<Clock />} label="Em Andamento" value={stats.progress} color="blue" />
                    <StatCard icon={<Target />} label="Tarefas" value={`${stats.tasksDone}/${stats.tasksTotal}`} color="teal" />
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {['all', 'pending', 'progress', 'done', 'blocked'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            {f === 'all' ? 'Todos' : STATUS[f]?.label}
                        </button>
                    ))}
                </div>

                {viewMode === 'list' ? (
                    <div className="space-y-3">
                        {filtered.length === 0 ? <EmptyState /> : filtered.map(project => (
                            <ProjectListCard
                                key={project.id}
                                project={project}
                                isExpanded={expandedProject === project.id}
                                setExpandedProject={setExpandedProject}
                                openEdit={setEditingProject}
                                setShowModal={setShowModal}
                                setFormData={setFormData}
                                deleteProject={deleteProject}
                                setSelectedProjectId={setSelectedProjectId}
                                setShowTaskModal={setShowTaskModal}
                                expandedTask={expandedTask}
                                setExpandedTask={setExpandedTask}
                                toggleTaskStatus={toggleTaskStatus}
                                deleteTask={deleteTask}
                                setEditingTask={setEditingTask}
                                setTaskForm={setTaskForm}
                                setSelectedTaskId={setSelectedTaskId}
                                setShowSubtaskModal={setShowSubtaskModal}
                                toggleSubtaskStatus={toggleSubtaskStatus}
                                deleteSubtask={deleteSubtask}
                                setEditingSubtask={setEditingSubtask}
                                setSubtaskForm={setSubtaskForm}
                                handleSubtaskDrop={handleSubtaskDrop}
                                handleTaskDrop={handleTaskDrop}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 items-start h-[calc(100vh-280px)]">
                        {['pending', 'progress', 'blocked', 'done'].map(status => (
                            <KanbanColumn
                                key={status}
                                status={status}
                                projects={filtered.filter(p => p.status === status)}
                                openEdit={(p) => {
                                    setEditingProject(p);
                                    setFormData({ name: p.name, description: p.description || '', status: p.status, priority: p.priority, deadline: p.deadline || '' });
                                    setShowModal(true);
                                }}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* MODALS */}
            {showModal && (
                <ProjectModal
                    formData={formData}
                    setFormData={setFormData}
                    handleSubmit={handleSubmit}
                    resetForm={resetForm}
                    editingProject={editingProject}
                />
            )}

            {showTaskModal && (
                <TaskModal
                    taskForm={taskForm}
                    setTaskForm={setTaskForm}
                    handleSubmit={handleTaskSubmit}
                    setShow={setShowTaskModal}
                    editingTask={editingTask}
                    setEditingTask={setEditingTask}
                />
            )}

            {showSubtaskModal && (
                <SubtaskModal
                    subtaskForm={subtaskForm}
                    setSubtaskForm={setSubtaskForm}
                    handleSubmit={handleSubtaskSubmit}
                    setShow={setShowSubtaskModal}
                    editingSubtask={editingSubtask}
                    setEditingSubtask={setEditingSubtask}
                />
            )}
        </div>
    );
}

// COMPONENTS
function StatCard({ icon, label, value, color }) {
    const colors = {
        slate: 'bg-slate-100 text-slate-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        blue: 'bg-blue-100 text-blue-600',
        teal: 'bg-teal-100 text-teal-600'
    };
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
                <div>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
            <Folder size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Nenhum projeto encontrado</p>
        </div>
    );
}

function ProjectListCard({
    project, isExpanded, setExpandedProject, openEdit, setShowModal, setFormData, deleteProject,
    setSelectedProjectId, setShowTaskModal, expandedTask, setExpandedTask,
    toggleTaskStatus, deleteTask, setEditingTask, setTaskForm,
    setSelectedTaskId, setShowSubtaskModal, toggleSubtaskStatus, deleteSubtask,
    setEditingSubtask, setSubtaskForm, handleSubtaskDrop, handleTaskDrop
}) {
    const tasksDone = project.tasks?.filter(t => t.status === 'done').length || 0;
    const progress = (project.tasks?.length || 0) > 0 ? (tasksDone / project.tasks.length) * 100 : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedProject(isExpanded ? null : project.id)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                            {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-800">{project.name}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${STATUS[project.status]?.color}`}>
                                    {STATUS[project.status]?.label}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${PRIORITY[project.priority]?.color}`} title={PRIORITY[project.priority]?.label}></span>
                            </div>
                            <p className="text-sm text-slate-500 mb-2">{project.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                {project.deadline && (
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} /> {formatDate(project.deadline)}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 size={12} /> {tasksDone}/{project.tasks?.length || 0} tarefas
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => {
                            setFormData({ name: project.name, description: project.description || '', status: project.status, priority: project.priority, deadline: project.deadline || '' });
                            openEdit(project);
                            setShowModal(true);
                        }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <Edit3 size={16} className="text-slate-400" />
                        </button>
                        <button onClick={() => deleteProject(project.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} className="text-red-400" />
                        </button>
                    </div>
                </div>
                {project.tasks?.length > 0 && (
                    <div className="mt-3 ml-7">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-700">Tarefas</h4>
                        <button
                            onClick={() => { setSelectedProjectId(project.id); setShowTaskModal(true); }}
                            className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                        >
                            <Plus size={14} /> Adicionar Tarefa
                        </button>
                    </div>
                    <div className="space-y-3">
                        {project.tasks?.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Nenhuma tarefa</p> :
                            project.tasks.map(task => (
                                <div
                                    key={task.id}
                                    draggable="true"
                                    onDragStart={(e) => {
                                        const isSubtask = e.target.closest('.subtask-item');
                                        if (isSubtask) return;

                                        e.dataTransfer.setData('taskId', task.id);
                                        e.dataTransfer.setData('projectId', project.id);
                                        e.dataTransfer.setData('type', 'task');
                                        e.currentTarget.classList.add('opacity-50', 'border-teal-500');
                                    }}
                                    onDragEnd={(e) => {
                                        e.currentTarget.classList.remove('opacity-50', 'border-teal-500');
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        // Visual feedback for drop target
                                        e.currentTarget.classList.add('border-t-2', 'border-teal-500');
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.classList.remove('border-t-2', 'border-teal-500');
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-t-2', 'border-teal-500');

                                        const type = e.dataTransfer.getData('type');
                                        if (type !== 'task') return;

                                        const draggedTaskId = parseInt(e.dataTransfer.getData('taskId'));
                                        const sourceProjectId = parseInt(e.dataTransfer.getData('projectId'));

                                        if (!isNaN(draggedTaskId) && sourceProjectId === project.id) {
                                            handleTaskDrop(project.id, draggedTaskId, task.id);
                                        }
                                    }}
                                >
                                    <TaskItem
                                        task={task}
                                        projectId={project.id}
                                        isExpanded={expandedTask === task.id}
                                        setExpandedTask={setExpandedTask}
                                        toggleTaskStatus={toggleTaskStatus}
                                        deleteTask={deleteTask}
                                        setEditingTask={setEditingTask}
                                        setTaskForm={setTaskForm}
                                        setShowTaskModal={setShowTaskModal}
                                        setSelectedTaskId={setSelectedTaskId}
                                        setShowSubtaskModal={setShowSubtaskModal}
                                        toggleSubtaskStatus={toggleSubtaskStatus}
                                        deleteSubtask={deleteSubtask}
                                        setEditingSubtask={setEditingSubtask}
                                        setSubtaskForm={setSubtaskForm}
                                        handleSubtaskDrop={handleSubtaskDrop}
                                    />
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

function TaskItem({
    task, projectId, isExpanded, setExpandedTask, toggleTaskStatus, deleteTask,
    setEditingTask, setTaskForm, setShowTaskModal,
    setSelectedTaskId, setShowSubtaskModal, toggleSubtaskStatus, deleteSubtask,
    setEditingSubtask, setSubtaskForm, handleSubtaskDrop
}) {
    const subtasksDone = task.subtasks?.filter(s => s.status === 'done').length || 0;

    return (
        <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
            <div className="p-3 flex items-center justify-between group cursor-move">
                <div className="flex items-center gap-3 flex-1 relative">
                    <div className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity absolute -left-6 p-1">
                        <MoreHorizontal size={14} className="rotate-90" />
                    </div>
                    <button
                        onClick={() => toggleTaskStatus(projectId, task.id, task.status)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-teal-500'
                            }`}
                    >
                        {task.status === 'done' && <CheckCircle2 size={12} className="text-white" />}
                    </button>
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {task.title}
                            </span>
                            {task.subtasks?.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500">
                                    {subtasksDone}/{task.subtasks.length}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            {task.start_date && <span className="text-[10px] text-slate-400">Início: {formatDate(task.start_date)}</span>}
                            {task.deadline && <span className="text-[10px] text-red-400">Prazo: {formatDate(task.deadline)}</span>}
                            {task.completed_at && <span className="text-[10px] text-emerald-500 font-medium">Realizado: {formatDate(task.completed_at)}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setExpandedTask(isExpanded ? null : task.id)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button onClick={() => {
                        setEditingTask(task);
                        setTaskForm({
                            title: task.title,
                            status: task.status,
                            start_date: task.start_date || '',
                            deadline: task.deadline || '',
                            completed_at: task.completed_at || ''
                        });
                        setShowTaskModal(true);
                    }} className="p-1 hover:bg-slate-100 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteTask(projectId, task.id)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-3 bg-slate-50/50 border-t border-slate-100 ml-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Subtarefas</span>
                        <button
                            onClick={() => { setSelectedTaskId(task.id); setShowSubtaskModal(true); }}
                            className="text-[11px] text-teal-600 font-bold hover:underline"
                        >
                            + Adicionar
                        </button>
                    </div>
                    <div className="space-y-1.5">
                        {task.subtasks?.length === 0 ? <p className="text-[11px] text-slate-400 italic">Nenhuma subtarefa</p> :
                            task.subtasks.map((sub, index) => (
                                <div
                                    key={sub.id}
                                    className="flex items-center justify-between group/sub cursor-move subtask-item"
                                    draggable="true"
                                    onDragStart={(e) => {
                                        // Prevents task drag from being triggered when starting a subtask drag
                                        e.stopPropagation();
                                        e.dataTransfer.setData('subtaskId', sub.id);
                                        e.dataTransfer.setData('taskId', task.id);
                                        e.dataTransfer.setData('type', 'subtask');
                                        e.target.classList.add('opacity-50');
                                    }}
                                    onDragEnd={(e) => {
                                        e.stopPropagation();
                                        e.target.classList.remove('opacity-50');
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const type = e.dataTransfer.getData('type');
                                        if (type !== 'subtask') return;

                                        const draggedSubId = parseInt(e.dataTransfer.getData('subtaskId'));
                                        const sourceTaskId = parseInt(e.dataTransfer.getData('taskId'));
                                        if (sourceTaskId === task.id) {
                                            handleSubtaskDrop(task.id, draggedSubId, sub.id);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="text-slate-300 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                            <MoreHorizontal size={12} className="rotate-90" />
                                        </div>
                                        <button
                                            onClick={() => toggleSubtaskStatus(task.id, sub.id, sub.status)}
                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${sub.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                                                }`}
                                        >
                                            {sub.status === 'done' && <CheckCircle2 size={10} className="text-white" />}
                                        </button>
                                        <div className="flex flex-col">
                                            <span className={`text-[12px] ${sub.status === 'done' ? 'line-through text-slate-400' : 'text-slate-600'}`}>{sub.title}</span>
                                            {sub.assignee && (
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                    <Users size={8} /> {sub.assignee}
                                                    {sub.completed_at && <span className="text-emerald-500 ml-1">• Realizado: {formatDate(sub.completed_at)}</span>}
                                                </div>
                                            )}
                                            {!sub.assignee && sub.completed_at && (
                                                <div className="text-[10px] text-emerald-500 font-medium leading-none mt-0.5">
                                                    Realizado: {formatDate(sub.completed_at)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100">
                                        <button onClick={() => {
                                            setEditingSubtask(sub);
                                            setSubtaskForm({
                                                title: sub.title,
                                                status: sub.status,
                                                assignee: sub.assignee || '',
                                                completed_at: sub.completed_at || ''
                                            });
                                            setSelectedTaskId(task.id);
                                            setShowSubtaskModal(true);
                                        }} className="p-1 hover:bg-white rounded text-slate-400">
                                            <Edit3 size={12} />
                                        </button>
                                        <button onClick={() => deleteSubtask(task.id, sub.id)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

function KanbanColumn({ status, projects, openEdit }) {
    return (
        <div className="bg-slate-100/50 rounded-xl min-w-[280px] flex-shrink-0 flex flex-col max-h-full">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${STATUS[status].color}`}></div>
                    <h3 className="font-bold text-slate-700">{STATUS[status].label}</h3>
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{projects.length}</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
                {projects.map(p => (
                    <div
                        key={p.id}
                        onClick={() => openEdit(p)}
                        className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-teal-500 transition-all group"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${PRIORITY[p.priority]?.color}`}></span>
                            <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{p.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{p.description}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Calendar size={10} /> {p.deadline ? formatDate(p.deadline) : 'Sem prazo'}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Target size={10} /> {p.tasks?.length || 0}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// MODAL COMPONENTS
function ProjectModal({ formData, setFormData, handleSubmit, resetForm, editingProject }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h2>
                    <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-400" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nome do projeto" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 resize-none" rows={2} placeholder="Descrição" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none">
                                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
                            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none">
                                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Prazo</label>
                        <input type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none" />
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 flex gap-3">
                    <button onClick={resetForm} className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
                    <button onClick={handleSubmit} disabled={!formData.name.trim()} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">{editingProject ? 'Salvar' : 'Criar'}</button>
                </div>
            </div>
        </div>
    );
}

function TaskModal({ taskForm, setTaskForm, handleSubmit, setShow, editingTask, setEditingTask }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                    <button onClick={() => { setShow(false); setEditingTask(null); }} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-400" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                        <input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500" placeholder="Título" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                            <input type="date" value={taskForm.start_date} onChange={e => setTaskForm({ ...taskForm, start_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Prazo</label>
                            <input type="date" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none" />
                        </div>
                    </div>
                    {taskForm.status === 'done' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Realização</label>
                            <input type="date" value={taskForm.completed_at} onChange={e => setTaskForm({ ...taskForm, completed_at: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    )}
                </div>
                <div className="p-5 border-t border-slate-100 flex gap-3">
                    <button onClick={() => { setShow(false); setEditingTask(null); }} className="flex-1 px-4 py-2 border rounded-lg text-slate-600">Cancelar</button>
                    <button onClick={handleSubmit} disabled={!taskForm.title.trim()} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">{editingTask ? 'Salvar' : 'Adicionar'}</button>
                </div>
            </div>
        </div>
    );
}

function SubtaskModal({ subtaskForm, setSubtaskForm, handleSubmit, setShow, editingSubtask, setEditingSubtask }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">{editingSubtask ? 'Editar Subtarefa' : 'Nova Subtarefa'}</h2>
                    <button onClick={() => { setShow(false); setEditingSubtask(null); }} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-400" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                        <input type="text" value={subtaskForm.title} onChange={e => setSubtaskForm({ ...subtaskForm, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500" placeholder="Título da subtarefa" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Users size={14} />
                            </span>
                            <input
                                type="text"
                                value={subtaskForm.assignee}
                                onChange={e => setSubtaskForm({ ...subtaskForm, assignee: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="Nome do responsável"
                            />
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 flex gap-3">
                    <button onClick={() => { setShow(false); setEditingSubtask(null); }} className="flex-1 px-4 py-2 border rounded-lg text-slate-600">Cancelar</button>
                    <button onClick={handleSubmit} disabled={!subtaskForm.title.trim()} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">{editingSubtask ? 'Salvar' : 'Adicionar'}</button>
                </div>
            </div>
        </div>
    );
}
