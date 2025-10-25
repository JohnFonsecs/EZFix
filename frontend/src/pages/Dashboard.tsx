import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { redacaoService, authService, turmaService } from '../services/api';
import { Redacao, Turma, User } from '../types';
import AnaliseRedacao from '../components/AnaliseRedacao';
import VisualizarTexto from '../components/VisualizarTexto';
import ProcessingModal from '../components/ProcessingModal';
import GraficoEvolucao from '../components/GraficoEvolucao';
import { useAuth } from '../components/AuthContext';

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const { usuarioAtual } = useAuth();
    const [redacoes, setRedacoes] = useState<Redacao[]>([]);
    const [enemScores, setEnemScores] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [newRedacao, setNewRedacao] = useState({
        titulo: '',
        imagemUrl: '',
        turmaId: '',
        alunoId: '',
    });
    const [turmasDisponiveis, setTurmasDisponiveis] = useState<Turma[]>([]);
    const [alunosDisponiveis, setAlunosDisponiveis] = useState<User[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [processingOpen, setProcessingOpen] = useState(false);
    const [processingStep, setProcessingStep] = useState<string | undefined>(undefined);
    const [processingDetails, setProcessingDetails] = useState<string | undefined>(undefined);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const imgPreviewRef = useRef<HTMLImageElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [analiseModalOpen, setAnaliseModalOpen] = useState(false);
    const [redacaoAnaliseId, setRedacaoAnaliseId] = useState<string | null>(null);
    const [textoModalOpen, setTextoModalOpen] = useState(false);
    const [redacaoTextoSelecionada, setRedacaoTextoSelecionada] = useState<Redacao | null>(null);
    const isOcrProcessing = (r: Redacao) =>
        (r.textoExtraido === undefined || r.textoExtraido === null) && !r.notaFinal;
    const isOcrNoText = (r: Redacao) =>
        r.textoExtraido === '' && !r.notaFinal;
    const isOcrDone = (r: Redacao) =>
        typeof r.textoExtraido === 'string' && r.textoExtraido.trim() !== '';

    const loadRedacoes = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const data = await redacaoService.list();
            setRedacoes(data);
            setLastUpdate(new Date());
            try {
                const recent = data.slice(0, 3);
                const scores: Record<string, number> = {};
                await Promise.all(recent.map(async (r: Redacao) => {
                    try {
                        const resp = await redacaoService.getAnaliseEnem(r.id.toString());
                        const nota = resp?.analise?.notaFinal1000 ?? null;
                        if (nota !== null && nota !== undefined) scores[r.id] = Number(nota);
                    } catch (e) {
                        // ignore per-item errors
                    }
                }));
                setEnemScores(scores);
            } catch (e) {
                // ignore
            }
        } catch (error) {
            console.error('Erro ao carregar redações:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Carregar dados do usuário do localStorage
        const user = authService.getUser();
        setCurrentUser(user);

        // Primeira chamada mostra loading
        loadRedacoes(true);
        
        // Carregar turmas se for aluno
        if (usuarioAtual?.role === 'ALUNO' || usuarioAtual?.role === 'PROFESSOR') {
            loadTurmas();
        }
    }, [loadRedacoes, usuarioAtual]);

    const loadTurmas = async () => {
        try {
            if (usuarioAtual?.role === 'ALUNO') {
                const turmas = await turmaService.listarTurmasAluno();
                setTurmasDisponiveis(turmas);
            } else if (usuarioAtual?.role === 'PROFESSOR') {
                const turmas = await turmaService.listarTurmasProfessor();
                setTurmasDisponiveis(turmas);
            }
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
        }
    };

    const loadAlunosDaTurma = async (turmaId: string) => {
        if (!turmaId || usuarioAtual?.role !== 'PROFESSOR') {
            setAlunosDisponiveis([]);
            return;
        }
        
        try {
            const alunos = await turmaService.listarAlunosDaTurma(turmaId);
            setAlunosDisponiveis(alunos);
        } catch (error) {
            console.error('Erro ao carregar alunos da turma:', error);
            setAlunosDisponiveis([]);
        }
    };

    // Auto-refresh das estatísticas a cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            loadRedacoes(false); // Atualiza sem mostrar loading
        }, 5000);

        return () => clearInterval(interval);
    }, [loadRedacoes]);

    const abrirAnalise = (id: string) => {
        setRedacaoAnaliseId(id);
        setAnaliseModalOpen(true);
    };

    const fecharAnalise = () => {
        setAnaliseModalOpen(false);
        setRedacaoAnaliseId(null);
        setProcessingOpen(false);
    };

    const abrirTexto = (redacao: Redacao) => {
        setRedacaoTextoSelecionada(redacao);
        setTextoModalOpen(true);
    };

    const fecharTexto = () => {
        setTextoModalOpen(false);
        setRedacaoTextoSelecionada(null);
    };

    const handleCreateRedacao = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadLoading(true);

        try {
            // Abrir modal de processamento com etapa inicial
            setProcessingOpen(true);
            setProcessingStep('Preparando processamento');
            setProcessingDetails('Iniciando análise da redação...');
            
            // Passo 1: Upload e OCR
            let created: Redacao;
            if (selectedFile) {
                const fd = new FormData();
                fd.append('titulo', newRedacao.titulo);
                if (newRedacao.turmaId) {
                    fd.append('turmaId', newRedacao.turmaId);
                }
                if (newRedacao.alunoId && usuarioAtual?.role === 'PROFESSOR') {
                    fd.append('alunoId', newRedacao.alunoId);
                }
                fd.append('file', selectedFile);
                setProcessingStep('Extraindo texto da imagem');
                setProcessingDetails('🔍 Aplicando OCR com Google Vision...');
                created = await redacaoService.createWithFile(fd);
            } else {
                let imagemUrl = newRedacao.imagemUrl;
                setProcessingStep('Extraindo texto da imagem');
                setProcessingDetails('🔍 Aplicando OCR com Google Vision...');
                created = await redacaoService.create({ 
                    titulo: newRedacao.titulo, 
                    imagemUrl: imagemUrl,
                    turmaId: newRedacao.turmaId || undefined,
                    alunoId: (newRedacao.alunoId && usuarioAtual?.role === 'PROFESSOR') ? newRedacao.alunoId : undefined
                });
            }

            // Passo 2: Mostrar que a correção foi aplicada
            setProcessingStep('Texto extraído com sucesso!');
            setProcessingDetails('🤖 Texto corrigido automaticamente com GPT e análise ENEM iniciada...');
            
            // Limpar formulário
            setNewRedacao({ titulo: '', imagemUrl: '', turmaId: '', alunoId: '' });
            setSelectedFile(null);
            setShowUploadModal(false);
            loadRedacoes();

            // Passo 3: Abrir modal de análise automaticamente
            setTimeout(() => {
                setProcessingStep('Abrindo resultados');
                setProcessingDetails('✅ Processamento completo! Visualizando análise...');
                
                setTimeout(() => {
                    setProcessingOpen(false);
                    setRedacaoAnaliseId(created.id);
                    setAnaliseModalOpen(true);
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                }, 1000);
            }, 1500);

        } catch (error: any) {
            console.error('Erro ao enviar redação:', error);
            setProcessingOpen(false);
            if (error.response?.status === 413) {
                alert('Imagem muito grande! Tente com uma imagem menor (máx 10MB).');
            } else if (error.response?.status === 400) {
                alert(error.response?.data?.erro || 'Imagem inválida ou corrompida. Verifique o arquivo e tente novamente.');
            } else {
                alert(error.response?.data?.erro || 'Erro ao enviar redação. Tente novamente.');
            }
        } finally {
            setUploadLoading(false);
        }
    };

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)');
            return;
        }

        // ✨ OTIMIZAÇÃO: Limite de upload aumentado para 10MB
        const maxSize = 10 * 1024 * 1024; // 10MB em bytes
        if (file.size > maxSize) {
            alert('Arquivo muito grande! Por favor, use uma imagem menor que 10MB.');
            return;
        }

        setSelectedFile(file);
        setNewRedacao({ ...newRedacao, imagemUrl: '', turmaId: '', alunoId: '' });
        setShowUploadModal(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDeleteRedacao = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta redação?')) {
            try {
                await redacaoService.delete(id);
                loadRedacoes();
            } catch (error) {
                alert('Erro ao excluir redação');
            }
        }
    };

    const getStatusColor = (r: Redacao) => {
        if (r.notaFinal) return 'text-green-600';
        if (isOcrProcessing(r)) return 'text-yellow-600';
        if (isOcrNoText(r)) return 'text-orange-600';
        if (isOcrDone(r)) return 'text-blue-600';
        return 'text-yellow-600';
    };

    const getStatusText = (r: Redacao) => {
        if (r.notaFinal) return 'CORRIGIDA';
        if (isOcrProcessing(r)) return 'PROCESSANDO';
        if (isOcrNoText(r)) return 'SEM TEXTO';
        if (isOcrDone(r)) return 'PROCESSADA';
        return 'PROCESSANDO';
    };

    const getStatusIcon = (r: Redacao) => {
        if (r.notaFinal) return '✅';
        if (isOcrProcessing(r)) return '⏳';
        if (isOcrNoText(r)) return '⚠️';
        if (isOcrDone(r)) return '🔍';
        return '⏳';
    };

    const redacoesHoje = redacoes.filter(r =>
        new Date(r.criadoEm).toDateString() === new Date().toDateString()
    ).length;

    const pendentes = redacoes.filter(r =>
        r.textoExtraido && r.textoExtraido.trim() !== '' && !r.notaFinal
    ).length;

    const corrigidas = redacoes.filter(r => r.notaFinal).length;

    const processando = redacoes.filter(r =>
        !r.textoExtraido || r.textoExtraido.trim() === ''
    ).length;

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
                        <button onClick={() => navigate('/dashboard')} className="text-purple-600 font-semibold bg-transparent text-sm lg:text-base">Dashboard</button>
                        <button onClick={() => navigate('/redacoes')} className="text-gray-600 hover:text-gray-800 bg-transparent text-sm lg:text-base">Redações</button>
                        {usuarioAtual?.role === 'PROFESSOR' && (
                            <button onClick={() => navigate('/turmas')} className="text-gray-600 hover:text-gray-800 bg-transparent text-sm lg:text-base">Turmas</button>
                        )}
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button 
                            onClick={() => navigate('/perfil')}
                            className="bg-purple-600 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm hover:bg-purple-700 transition-colors cursor-pointer"
                            title="Ver perfil"
                        >
                            {currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'U'}
                        </button>
                        <span className="text-gray-700 text-sm sm:text-base hidden sm:inline">
                            {currentUser?.nome || 'Usuário'}
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

            <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Layout em grid 2x2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 min-h-[calc(100vh-160px)]">
                    
                    {/* Anexar imagem - Área grande superior esquerda */}
                    <div className="lg:col-span-2 lg:row-span-1">
                        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 overflow-y-auto flex flex-col h-full">
                            {showSuccessMessage && (
                                <div className="bg-green-50 border border-green-200 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">
                                    <div className="flex justify-between items-center gap-2">
                                        <p className="text-green-800 text-xs sm:text-sm">
                                            ✨ Texto analisado com sucesso!!
                                        </p>
                                        <button
                                            onClick={() => setShowSuccessMessage(false)}
                                            className="text-green-600 hover:text-green-800 text-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="text-center flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-center space-x-2 mb-4 sm:mb-6">
                                    <span className="text-xl sm:text-2xl">📝</span>
                                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Anexar Imagem</h2>
                                </div>

                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 sm:p-12 mb-4 sm:mb-6 transition-colors cursor-pointer ${isDragging
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-300 hover:border-purple-400'
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('file-input')?.click()}
                                >
                                    <input
                                        id="file-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileInputChange}
                                        className="hidden"
                                    />
                                    <div className="text-center">
                                        <div className="bg-purple-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                            <span className="text-2xl sm:text-3xl">📄</span>
                                        </div>
                                        {selectedFile ? (
                                            <div>
                                                <p className="text-green-600 font-medium mb-2 sm:mb-3 text-sm sm:text-lg">✅ Arquivo selecionado:</p>
                                                <p className="text-gray-700 text-sm sm:text-base font-medium break-all px-2">{selectedFile.name}</p>
                                                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFile(null);
                                                    }}
                                                    className="mt-2 sm:mt-3 text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium"
                                                >
                                                    Remover arquivo
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-gray-600 mb-2 sm:mb-3 text-base sm:text-lg">Arraste a redação aqui</p>
                                                <p className="text-gray-500 text-sm sm:text-base">ou clique para selecionar</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="w-full bg-purple-600 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-lg hover:bg-purple-700 mb-6 sm:mb-8 text-base sm:text-lg font-semibold transition-colors"
                                >
                                    🤖 Processar com IA
                                </button>

                                <div className="bg-purple-600 text-white p-6 rounded-lg">
                                    <h3 className="font-bold mb-4 text-lg">🚀 Análise IA</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-center space-x-2">
                                            <span className="text-green-300">✅</span>
                                            <span>OCR Engine: Ativo</span>
                                        </div>
                                        <div className="flex items-center justify-center space-x-2">
                                            <span className="text-green-300">✅</span>
                                            <span>Corretor IA: Standby</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Redações recentes - Superior direita */}
                    <div className="lg:col-span-1 lg:row-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-4 overflow-y-auto flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xl">📄</span>
                                    <h2 className="text-lg font-bold text-gray-800">Redações Recentes</h2>
                                </div>
                                <button
                                    onClick={() => loadRedacoes()}
                                    className="text-purple-600 hover:text-purple-700 text-xs flex items-center gap-1"
                                >
                                    🔄
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col justify-start">
                                {loading ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 text-sm">Carregando...</p>
                                    </div>
                                ) : redacoes.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 text-sm">Nenhuma redação encontrada</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {redacoes.slice(0, 5).map((redacao) => (
                                            <div key={redacao.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-800 text-sm">{redacao.titulo}</h3>
                                                        {/* Mostrar nota ENEM se disponível */}
                                                        {enemScores[redacao.id] && (
                                                            <div className="mt-1">
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    🏆 Nota ENEM: {enemScores[redacao.id]}/1000
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-medium flex items-center gap-1 ${getStatusColor(redacao)}`}>
                                                        {getStatusIcon(redacao)} {getStatusText(redacao)}
                                                    </span>
                                                </div>

                                                {isOcrProcessing(redacao) && (
                                                    <div className="mb-3">
                                                        <div className="flex items-center gap-2 text-yellow-600">
                                                            <div className="animate-spin w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                                                            <span className="text-xs">Processando...</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {isOcrNoText(redacao) && (
                                                    <div className="mb-3 text-orange-600 text-xs">
                                                        ⚠️ Nenhum texto detectado
                                                    </div>
                                                )}

                                                {/* Preview do texto extraído */}
                                                {redacao.textoExtraido && redacao.textoExtraido.trim() !== '' && (
                                                    <div className="mb-3 p-3 bg-gray-50 rounded text-xs">
                                                        <p className="text-gray-700 line-clamp-2">
                                                            {redacao.textoExtraido}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(redacao.criadoEm).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {redacao.textoExtraido && redacao.textoExtraido.trim() !== '' && (
                                                            <>
                                                                <button
                                                                    onClick={() => abrirAnalise(redacao.id.toString())}
                                                                    className="text-purple-600 hover:text-purple-800 text-xs font-medium bg-purple-50 px-2 py-1 rounded"
                                                                >
                                                                    📊
                                                                </button>
                                                                <button
                                                                    onClick={() => abrirTexto(redacao)}
                                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-50 px-2 py-1 rounded"
                                                                >
                                                                    📄
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteRedacao(redacao.id)}
                                                            className="text-red-600 hover:text-red-800 text-xs"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                                <h3 className="font-bold text-purple-800 mb-3 text-sm text-center">📋 Critérios ENEM</h3>
                                <div className="space-y-2 text-xs text-purple-700 text-center">
                                    <div>C1: Escrita formal</div>
                                    <div>C2: Compreensão</div>
                                    <div>C3: Argumentação</div>
                                    <div>C4: Mecanismos</div>
                                    <div>C5: Proposta</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estatísticas - Inferior esquerda */}
                    <div className="lg:col-span-1 lg:row-span-1">
                        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 flex flex-col justify-center h-full min-h-[250px]">
                            <div className="flex items-center justify-center space-x-2 mb-4 sm:mb-6">
                                <span className="text-lg sm:text-xl">📊</span>
                                <h2 className="text-base sm:text-lg font-bold text-gray-800">Estatísticas</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 flex-1 items-center">
                                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1 sm:mb-2">Hoje</p>
                                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{redacoesHoje}</p>
                                </div>

                                <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1 sm:mb-2">Processando</p>
                                    <p className="text-xl sm:text-2xl font-bold text-orange-600">{processando}</p>
                                </div>

                                <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1 sm:mb-2">Pendentes</p>
                                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">{pendentes}</p>
                                </div>

                                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1 sm:mb-2">Corrigidas</p>
                                    <p className="text-xl sm:text-2xl font-bold text-green-600">{corrigidas}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráficos de melhora - Inferior direita */}
                    <div className="lg:col-span-1 lg:row-span-1">
                        <GraficoEvolucao redacoes={redacoes} />
                    </div>
                </div>
            </div>

            {/* Modal de Upload */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
                        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md md:max-w-lg my-4 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Enviar Nova Redação</h3>

                            <form onSubmit={handleCreateRedacao} className="space-y-3 sm:space-y-4">
                            {selectedFile && (
                                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Preview da Imagem</h4>
                                    <p className="text-xs text-gray-500 mb-2">A imagem será enviada inteira para o OCR.</p>
                                    <div className="relative bg-white border rounded-md overflow-hidden w-full">
                                        <img
                                            ref={el => { if (el) imgPreviewRef.current = el; }}
                                            src={URL.createObjectURL(selectedFile)}
                                            alt="Preview"
                                            className="w-full h-auto max-h-[250px] sm:max-h-[360px] object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Título da Redação
                                </label>
                                <input
                                    type="text"
                                    value={newRedacao.titulo}
                                    onChange={(e) => setNewRedacao({ ...newRedacao, titulo: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: Redação sobre sustentabilidade"
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    URL da Imagem (opcional)
                                </label>
                                <input
                                    type="url"
                                    value={newRedacao.imagemUrl}
                                    onChange={(e) => setNewRedacao({ ...newRedacao, imagemUrl: e.target.value })}
                                    disabled={!!selectedFile}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="https://exemplo.com/imagem.jpg (ou use upload acima)"
                                />
                                {selectedFile && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        URL desabilitada - usando arquivo selecionado
                                    </p>
                                )}
                            </div>

                            {/* Seletor de Turma - Apenas para Alunos */}
                            {usuarioAtual?.role === 'ALUNO' && turmasDisponiveis.length > 0 && (
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                        Turma (opcional)
                                    </label>
                                    <select
                                        value={newRedacao.turmaId}
                                        onChange={(e) => setNewRedacao({ ...newRedacao, turmaId: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Sem turma</option>
                                        {turmasDisponiveis.map((turma) => (
                                            <option key={turma.id} value={turma.id}>
                                                {turma.nome}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Selecione uma turma para vincular esta redação
                                    </p>
                                </div>
                            )}

                            {/* Seletor de Turma e Aluno - Apenas para Professores */}
                            {usuarioAtual?.role === 'PROFESSOR' && turmasDisponiveis.length > 0 && (
                                <>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                            Turma (opcional)
                                        </label>
                                        <select
                                            value={newRedacao.turmaId}
                                            onChange={(e) => {
                                                const turmaId = e.target.value;
                                                setNewRedacao({ ...newRedacao, turmaId, alunoId: '' });
                                                loadAlunosDaTurma(turmaId);
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">Sem turma</option>
                                            {turmasDisponiveis.map((turma) => (
                                                <option key={turma.id} value={turma.id}>
                                                    {turma.nome}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Selecione uma turma para associar a redação
                                        </p>
                                    </div>

                                    {/* Seletor de Aluno - Aparece apenas quando uma turma é selecionada */}
                                    {newRedacao.turmaId && alunosDisponiveis.length > 0 && (
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                                Aluno <span className="text-red-600">*</span>
                                            </label>
                                            <select
                                                value={newRedacao.alunoId}
                                                onChange={(e) => setNewRedacao({ ...newRedacao, alunoId: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                required
                                            >
                                                <option value="">Selecione um aluno</option>
                                                {alunosDisponiveis.map((aluno) => (
                                                    <option key={aluno.id} value={aluno.id}>
                                                        {aluno.nome} ({aluno.email})
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-red-600 mt-1">
                                                * Obrigatório ao selecionar uma turma
                                            </p>
                                        </div>
                                    )}
                                    
                                    {/* Mensagem quando turma selecionada mas sem alunos */}
                                    {newRedacao.turmaId && alunosDisponiveis.length === 0 && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                            <p className="text-yellow-800 text-xs">
                                                ⚠️ Esta turma não possui alunos matriculados. Adicione alunos na página de Turmas primeiro.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={
                                        uploadLoading || 
                                        (!selectedFile && !newRedacao.imagemUrl) ||
                                        (usuarioAtual?.role === 'PROFESSOR' && !!newRedacao.turmaId && !newRedacao.alunoId)
                                    }
                                    className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {uploadLoading ? 'Processando...' : 'Confirmar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setNewRedacao({ titulo: '', imagemUrl: '', turmaId: '', alunoId: '' });
                                        setSelectedFile(null);
                                    }}
                                    className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Processamento */}
            <ProcessingModal isOpen={processingOpen} step={processingStep} details={processingDetails} />

            {/* Modal de Análise */}
            {redacaoAnaliseId && (
                <AnaliseRedacao
                    redacaoId={redacaoAnaliseId}
                    isVisible={analiseModalOpen}
                    onClose={fecharAnalise}
                    onProgress={(step, details) => {
                        setProcessingOpen(true);
                        setProcessingStep(step);
                        setProcessingDetails(details);
                        try {
                            const s = (step || '').toString().toLowerCase();
                            if (s.includes('conclu') || s.includes('concluído') || s.includes('concluida')) {
                                // quando análise concluída, fechar modal de processamento e mostrar sucesso
                                setProcessingOpen(false);
                                setShowSuccessMessage(true);
                                // Auto-hide depois de 5 segundos
                                setTimeout(() => setShowSuccessMessage(false), 5000);
                            }
                        } catch (e) {
                            // ignore
                        }
                    }}
                />
            )}

            {/* Modal de Visualização de Texto */}
            <VisualizarTexto
                isVisible={textoModalOpen}
                onClose={fecharTexto}
                redacao={redacaoTextoSelecionada}
                onSave={async (redacaoId: string, novoTexto: string) => {
                    try {
                        // Atualizar o texto no backend
                        await redacaoService.updateTexto(redacaoId, novoTexto);
                        
                        // Recarregar a lista de redações para refletir a mudança
                        await loadRedacoes();
                        
                        // Mostrar mensagem de sucesso
                        setShowSuccessMessage(true);
                        setTimeout(() => setShowSuccessMessage(false), 3000);
                    } catch (error) {
                        console.error('Erro ao atualizar texto:', error);
                        throw error;
                    }
                }}
            />

        </div>
    );
};

export default Dashboard;