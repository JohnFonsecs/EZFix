import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { turmaService, redacaoService } from '../services/api';
import { Turma, Redacao, EstatisticasTurma } from '../types';

// CORREÇÃO: Definindo tipos locais que correspondem à resposta da API
interface AlunoResumo {
    id: string;
    nome: string;
    email: string;
}

interface MatriculaDetalhada {
    id: string; // O tipo Matricula real deve ter 'id'
    alunoId: string;
    turmaId: string;
    aluno: AlunoResumo; // A API retorna apenas um resumo do aluno
}

interface TurmaDetalhada extends Turma {
    matriculas: MatriculaDetalhada[];
}

const DetalhesTurma: React.FC = () => {
    const { id: turmaId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    // Usando o novo tipo TurmaDetalhada para o estado
    const [turma, setTurma] = useState<TurmaDetalhada | null>(null);
    const [redacoes, setRedacoes] = useState<Redacao[]>([]);
    const [stats, setStats] = useState<EstatisticasTurma | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newAlunoEmail, setNewAlunoEmail] = useState('');
    const [isAddingAluno, setIsAddingAluno] = useState(false);

    const loadData = useCallback(async () => {
        if (!turmaId) return;
        setLoading(true);
        setError(null);
        try {
            const [turmaData, redacoesData, statsData] = await Promise.all([
                turmaService.getDetails(turmaId),
                redacaoService.listByTurma(turmaId),
                turmaService.getEstatisticas(turmaId)
            ]);
            // CORREÇÃO: Fazendo um cast para o tipo local que definimos
            setTurma(turmaData as TurmaDetalhada);
            setRedacoes(redacoesData);
            setStats(statsData);
        } catch (err: any) {
            console.error("Erro ao carregar dados da turma:", err);
            setError(err.response?.data?.erro || err.message || 'Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    }, [turmaId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAddAluno = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAlunoEmail.trim() || !turmaId) return;
        setIsAddingAluno(true);
        try {
            await turmaService.addAluno(turmaId, newAlunoEmail);
            setNewAlunoEmail('');
            loadData();
        } catch (err: any) {
            alert(`Erro ao adicionar aluno: ${err.response?.data?.erro || err.message}`);
        } finally {
            setIsAddingAluno(false);
        }
    };

    const handleRemoveAluno = async (alunoId: string) => {
        if (!turmaId || !window.confirm("Tem certeza que deseja remover este aluno da turma?")) return;
        try {
            await turmaService.removeAluno(turmaId, alunoId);
            loadData();
        } catch (err: any) {
            alert(`Erro ao remover aluno: ${err.response?.data?.erro || err.message}`);
        }
    };

    const handleDeleteTurma = async () => {
        if (!turmaId || !window.confirm("Tem certeza que deseja EXCLUIR esta turma?")) return;
        try {
            await turmaService.delete(turmaId);
            navigate('/turmas');
        } catch (err: any) {
            alert(`Erro ao excluir turma: ${err.response?.data?.erro || err.message}`);
        }
    };

    if (loading) return <div className="p-6 text-center">Carregando detalhes da turma...</div>;
    if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
    if (!turma) return <div className="p-6 text-center">Turma não encontrada.</div>;

    const mediaGeralFormatada = stats?.mediaGeral ? (stats.mediaGeral / 100).toFixed(1) : 'N/A';

    return (
        <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            <button onClick={() => navigate('/turmas')} className="text-purple-600 hover:underline mb-4 text-sm">&larr; Voltar para Todas as Turmas</button>
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl font-bold text-gray-800">{turma.nome}</h1>
                <button onClick={handleDeleteTurma} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 shadow-sm transition-colors">Excluir Turma</button>
            </div>

            {/* Seção de Estatísticas */}
            <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Visão Geral da Turma</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-4xl font-bold text-blue-600">{turma.matriculas.length}</p>
                        <p className="text-sm text-gray-500">Alunos</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-4xl font-bold text-green-600">{stats?.totalRedacoesComNota ?? 0}</p>
                        <p className="text-sm text-gray-500">Redações Corrigidas</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-4xl font-bold text-purple-600">{mediaGeralFormatada}</p>
                        <p className="text-sm text-gray-500">Média Geral (0-10)</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-4xl font-bold text-orange-600">{redacoes.length}</p>
                        <p className="text-sm text-gray-500">Total de Envios</p>
                    </div>
                </div>
            </div>

            {/* Seção de Alunos */}
            <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Alunos Matriculados ({turma.matriculas.length})</h2>
                <form onSubmit={handleAddAluno} className="flex gap-2 mb-6">
                    <input
                        type="email"
                        value={newAlunoEmail}
                        onChange={(e) => setNewAlunoEmail(e.target.value)}
                        placeholder="Email do aluno para adicionar"
                        required
                        className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    />
                    <button type="submit" disabled={isAddingAluno} className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors">
                        {isAddingAluno ? 'Adicionando...' : 'Adicionar'}
                    </button>
                </form>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {turma.matriculas.length > 0 ? turma.matriculas.map(({ aluno }) => (
                        <div key={aluno.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                            <div>
                                <p className="font-medium text-gray-800">{aluno.nome}</p>
                                <p className="text-xs text-gray-500">{aluno.email}</p>
                            </div>
                            <button onClick={() => handleRemoveAluno(aluno.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remover</button>
                        </div>
                    )) : <p className="text-gray-500 text-sm text-center py-4">Nenhum aluno matriculado nesta turma.</p>}
                </div>
            </div>

            {/* Seção de Redações da Turma */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Redações da Turma ({redacoes.length})</h2>
                <div className="space-y-4">
                    {redacoes.length > 0 ? redacoes.map(redacao => (
                        <div key={redacao.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{redacao.titulo}</h3>
                                    <p className="text-sm text-gray-500">Aluno: {redacao.aluno?.nome || 'Não identificado'}</p>
                                    <p className="text-xs text-gray-400 mt-1">Enviada em: {new Date(redacao.criadoEm).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${redacao.notaFinal ? 'text-green-800 bg-green-100' : 'text-yellow-800 bg-yellow-100'}`}>
                                        Nota: {redacao.notaFinal ? `${redacao.notaFinal}/1000` : 'Pendente'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-gray-500 text-sm text-center py-4">Nenhuma redação enviada para esta turma ainda.</p>}
                </div>
            </div>
        </div>
    );
};

export default DetalhesTurma;