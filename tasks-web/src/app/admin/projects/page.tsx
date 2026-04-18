'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Modal } from '@/components/Modal';

type Project = {
  id: number;
  name: string;
  description?: string | null;
  _count?: {
    tasks: number;
  };
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/projects');
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao buscar projetos:', err);
      setError('Não foi possível carregar os projetos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '' });
    setSaveError('');
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      description: project.description || '',
    });
    setSaveError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');

    try {
      if (editingProject) {
        await api.patch(`/projects/${editingProject.id}`, formData);
      } else {
        await api.post('/projects', formData);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      console.error('Erro ao salvar projeto:', err);
      const msg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      setSaveError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const handleDelete = async (project: Project) => {
    const hasTasks = (project._count?.tasks || 0) > 0;
    const message = hasTasks
      ? 'Esse projeto possui tarefas vinculadas e nao pode ser excluido enquanto houver tasks associadas.'
      : 'Excluir este projeto?';

    if (hasTasks) {
      alert(message);
      return;
    }

    if (!confirm(message)) return;

    try {
      await api.delete(`/projects/${project.id}`);
      fetchProjects();
    } catch (err: any) {
      alert('Erro ao excluir: ' + (err?.response?.data?.message || err?.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-blue-500 font-black animate-bounce text-2xl tracking-tighter">
          Carregando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchProjects}
          className="px-4 py-2 bg-blue-600 rounded-xl text-white font-bold"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-blue-500 font-black tracking-widest uppercase text-[10px] mb-1">
            Administração
          </p>
          <h1 className="text-4xl font-black text-white leading-none">Projetos</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all text-sm font-bold border border-blue-500/20"
          style={{ fontWeight: 700, fontSize: 14 }}
        >
          + Novo Projeto
        </button>
      </header>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Projeto
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Descrição
              </th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Tarefas
              </th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {projects.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-500 italic">
                  Nenhum projeto cadastrado.
                </td>
              </tr>
            )}
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-white/5 transition-colors">
                <td className="px-8 py-6">
                  <div className="font-bold text-white">{project.name}</div>
                </td>
                <td className="px-8 py-6 text-sm text-slate-300 font-medium">
                  {project.description || (
                    <span className="text-slate-500 italic">Sem descrição</span>
                  )}
                </td>
                <td className="px-8 py-6">
                  <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider border border-blue-500/20">
                    {project._count?.tasks || 0} tarefa(s)
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(project)}
                      className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all text-sm font-bold border border-blue-500/20"
                      style={{ fontWeight: 700, fontSize: 14 }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all text-sm font-bold border border-red-500/20"
                      style={{ fontWeight: 700, fontSize: 14 }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? `Editando: ${editingProject.name}` : 'Novo Projeto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
              {saveError}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Nome do Projeto
            </label>
            <input
              className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Portal do Cliente"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Descrição
            </label>
            <textarea
              className="w-full min-h-[120px] bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all text-sm"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Resumo do projeto, contexto ou objetivo"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all text-sm font-bold border border-blue-500/20"
              style={{ fontWeight: 700, fontSize: 14 }}
            >
              {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all border border-slate-600"
              style={{ fontWeight: 700, fontSize: 14 }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
