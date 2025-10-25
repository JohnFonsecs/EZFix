import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { turmaService, authService } from '../services/api';
import { Turma, User, Redacao } from '../types';
import { useAuth } from '../components/AuthContext';

interface TurmasPageProps {
    onLogout: () => void;
}

const TurmasPage: React.FC<TurmasPageProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const { usuarioAtual } = useAuth();
    const isProfessor = usuarioAtual?.role === 'PROFESSOR';
    
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddAlunoModal, setShowAddAlunoModal] = useState(false);
    const [showTurmaDetailsModal, setShowTurmaDetailsModal] = useState(false);
    const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
    const [turmaAlunos, setTurmaAlunos] = useState<User[]>([]);
    const [turmaRedacoes, setTurmaRedacoes] = useState<Redacao[]>([]);
    const [nomeTurma, setNomeTurma] = useState('');
    const [emailAluno, setEmailAluno] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [addAlunoLoading, setAddAlunoLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadTurmas();
    }, [isProfessor]);

    const loadTurmas = async () => {
        try {
            setLoading(true);
            if (isProfessor) {
                const data = await turmaService.listarTurmasProfessor();
                setTurmas(data);
            } else {
                const data = await turmaService.listarTurmasAluno();
                setTurmas(data);
            }
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            setError('Erro ao carregar turmas');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTurma = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        setError('');

        try {
            await turmaService.criarTurma(nomeTurma);
            setNomeTurma('');
            setShowCreateModal(false);
            loadTurmas();
        } catch (err: any) {
            setError(err.response?.data?.erro || 'Erro ao criar turma');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleAddAluno = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTurma) return;

        setAddAlunoLoading(true);
        setError('');

        try {
            await turmaService.adicionarAluno(selectedTurma.id, emailAluno);
            setEmailAluno('');
            setShowAddAlunoModal(false);
            alert('Aluno adicionado com sucesso!');
            // Recarregar detalhes da turma se estiver visualizando
            if (showTurmaDetailsModal) {
                loadTurmaDetails(selectedTurma.id);
            }
        } catch (err: any) {
            setError(err.response?.data?.erro || 'Erro ao adicionar aluno');
        } finally {
            setAddAlunoLoading(false);
        }
    };

    const loadTurmaDetails = async (turmaId: string) => {
        try {
            const [alunos, redacoes] = await Promise.all([
                turmaService.listarAlunosDaTurma(turmaId),
                turmaService.listarRedacoesDaTurma(turmaId),
            ]);
            setTurmaAlunos(alunos);
            setTurmaRedacoes(redacoes);
        } catch (error) {
            console.error('Erro ao carregar detalhes da turma:', error);
        }
    };

    const openTurmaDetails = async (turma: Turma) => {
        setSelectedTurma(turma);
        setShowTurmaDetailsModal(true);
        await loadTurmaDetails(turma.id);
    };

    const closeTurmaDetails = () => {
        setShowTurmaDetailsModal(false);
        setSelectedTurma(null);
        setTurmaAlunos([]);
        setTurmaRedacoes([]);
    };

    const openAddAlunoModal = (turma: Turma) => {
        setSelectedTurma(turma);
        setShowAddAlunoModal(true);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
            {/* Header */}
            <header className="bg-white shadow-lg p-3 sm:p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl sm:text-2xl">📝</span>
                        <h1 className="text-base sm:text-xl font-bold text-gray-800">EZ Sentence Fix</h1>
                    </div>

                    <nav className="hidden md:flex space-x-4 lg:space-x-8">
                        <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-800 bg-transparent text-sm lg:text-base">Dashboard</button>
                        <button onClick={() => navigate('/redacoes')} className="text-gray-600 hover:text-gray-800 bg-transparent text-sm lg:text-base">Redações</button>
                        {isProfessor && (
                            <button onClick={() => navigate('/turmas')} className="text-purple-600 font-semibold bg-transparent text-sm lg:text-base">Turmas</button>
                        )}
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button 
                            onClick={() => navigate('/perfil')}
                            className="bg-purple-600 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm hover:bg-purple-700 transition-colors cursor-pointer"
                            title="Ver perfil"
                        >
                            {usuarioAtual?.nome ? usuarioAtual.nome.charAt(0).toUpperCase() : 'U'}
                        </button>
                        <span className="text-gray-700 text-sm sm:text-base hidden sm:inline">
                            {usuarioAtual?.nome || 'Usuário'}
                        </span>
                        <button
                            onClick={() => {
                                authService.logout();
                                onLogout();
                            }}
                            className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium px-2 py-1"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-3 sm:p-6">
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                {isProfessor ? 'Minhas Turmas' : 'Turmas que Participo'}
                            </h2>
                            {isProfessor && (
                                <p className="text-gray-600 text-sm mt-1">Gerencie suas turmas e alunos</p>
                            )}
                        </div>
                        {isProfessor && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                                ➕ Nova Turma
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando turmas...</p>
                        </div>
                    ) : turmas.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="text-6xl mb-4 block">📚</span>
                            <p className="text-gray-600 text-lg">
                                {isProfessor ? 'Você ainda não criou nenhuma turma' : 'Você não está matriculado em nenhuma turma'}
                            </p>
                            {isProfessor && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Criar primeira turma
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {turmas.map((turma) => (
                                <div key={turma.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg text-gray-800 mb-1">{turma.nome}</h3>
                                            <p className="text-sm text-gray-500">
                                                {turma._count ? `${turma._count.matriculas} alunos` : 'Carregando...'}
                                            </p>
                                        </div>
                                        <span className="text-2xl">🎓</span>
                                    </div>
                                    
                                    <div className="text-xs text-gray-500 mb-3">
                                        Criada em {new Date(turma.criadoEm).toLocaleDateString('pt-BR')}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openTurmaDetails(turma)}
                                            className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                                        >
                                            👁️ Ver detalhes
                                        </button>
                                        {isProfessor && (
                                            <button
                                                onClick={() => openAddAlunoModal(turma)}
                                                className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-md hover:bg-green-100 transition-colors text-sm font-medium"
                                            >
                                                ➕ Adicionar aluno
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Criar Turma */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Criar Nova Turma</h3>

                        <form onSubmit={handleCreateTurma} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome da Turma
                                </label>
                                <input
                                    type="text"
                                    value={nomeTurma}
                                    onChange={(e) => setNomeTurma(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: Turma A - 2024"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                >
                                    {createLoading ? 'Criando...' : 'Criar Turma'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNomeTurma('');
                                        setError('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Adicionar Aluno */}
            {showAddAlunoModal && selectedTurma && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Adicionar Aluno</h3>
                        <p className="text-gray-600 text-sm mb-4">Turma: {selectedTurma.nome}</p>

                        <form onSubmit={handleAddAluno} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email do Aluno
                                </label>
                                <input
                                    type="email"
                                    value={emailAluno}
                                    onChange={(e) => setEmailAluno(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="aluno@email.com"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    O aluno deve estar cadastrado no sistema
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={addAlunoLoading}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {addAlunoLoading ? 'Adicionando...' : 'Adicionar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddAlunoModal(false);
                                        setEmailAluno('');
                                        setError('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detalhes da Turma */}
            {showTurmaDetailsModal && selectedTurma && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl my-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{selectedTurma.nome}</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    {turmaAlunos.length} alunos • {turmaRedacoes.length} redações
                                </p>
                            </div>
                            <button
                                onClick={closeTurmaDetails}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Lista de Alunos */}
                            <div>
                                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                    👥 Alunos ({turmaAlunos.length})
                                </h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {turmaAlunos.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-8">
                                            Nenhum aluno matriculado
                                        </p>
                                    ) : (
                                        turmaAlunos.map((aluno) => (
                                            <div key={aluno.id} className="border border-gray-200 rounded-lg p-3">
                                                <p className="font-medium text-gray-800">{aluno.nome}</p>
                                                <p className="text-sm text-gray-600">{aluno.email}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Lista de Redações */}
                            <div>
                                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                    📝 Redações ({turmaRedacoes.length})
                                </h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {turmaRedacoes.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-8">
                                            Nenhuma redação enviada
                                        </p>
                                    ) : (
                                        turmaRedacoes.map((redacao) => (
                                            <div key={redacao.id} className="border border-gray-200 rounded-lg p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-medium text-gray-800 text-sm flex-1">{redacao.titulo}</p>
                                                    {redacao.notaFinal && (
                                                        <span className="text-green-600 text-xs font-semibold ml-2">
                                                            ✅ {redacao.notaFinal}
                                                        </span>
                                                    )}
                                                </div>
                                                {redacao.aluno && (
                                                    <p className="text-xs text-gray-600">
                                                        Por: {redacao.aluno.nome}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(redacao.criadoEm).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeTurmaDetails}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TurmasPage;
