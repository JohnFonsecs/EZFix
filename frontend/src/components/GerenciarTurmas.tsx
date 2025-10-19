import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { turmaService } from '../services/api';
import { Turma as TurmaBase } from '../types';

// CORREÇÃO: Estendemos o tipo Turma para incluir a contagem de matrículas
interface TurmaComContagem extends TurmaBase {
    _count?: {
        matriculas: number;
    };
}

const GerenciarTurmas: React.FC = () => {
    const [turmas, setTurmas] = useState<TurmaComContagem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTurmaName, setNewTurmaName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const loadTurmas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await turmaService.list();
            setTurmas(data);
        } catch (err: any) {
            setError(err.response?.data?.erro || err.message || 'Erro ao carregar turmas.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTurmas();
    }, [loadTurmas]);

    const handleCreateTurma = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTurmaName.trim()) return;
        setIsCreating(true);
        try {
            await turmaService.create(newTurmaName);
            setNewTurmaName('');
            setShowCreateModal(false);
            loadTurmas();
        } catch (err: any) {
            alert(`Erro ao criar turma: ${err.response?.data?.erro || err.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <header className="mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Gerenciar Turmas</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 font-semibold transition-colors shadow-sm"
                    >
                        + Criar Nova Turma
                    </button>
                </div>
            </header>

            {loading && <p className="text-center text-gray-500">Carregando...</p>}
            {error && <p className="text-center text-red-600">{error}</p>}

            {!loading && !error && (
                <main className="space-y-4">
                    {turmas.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-lg shadow">
                            <p className="text-gray-500">Nenhuma turma criada ainda. Clique em "Criar Nova Turma" para começar.</p>
                        </div>
                    ) : (
                        turmas.map((turma) => (
                            <div key={turma.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center transition hover:shadow-lg">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">{turma.nome}</h2>
                                    <p className="text-sm text-gray-500">
                                        {turma._count?.matriculas ?? 0} alunos
                                    </p>
                                </div>
                                <Link to={`/turmas/${turma.id}`} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-purple-100 hover:text-purple-700 text-sm font-medium transition-colors">
                                    Ver Detalhes
                                </Link>
                            </div>
                        ))
                    )}
                </main>
            )}

            {/* Modal de Criação */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Criar Nova Turma</h2>
                        <form onSubmit={handleCreateTurma}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Turma</label>
                            <input
                                type="text"
                                value={newTurmaName}
                                onChange={(e) => setNewTurmaName(e.target.value)}
                                placeholder="Ex: Turma de Redação 2025"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Cancelar</button>
                                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50 hover:bg-purple-700">
                                    {isCreating ? 'Criando...' : 'Criar Turma'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GerenciarTurmas;
