import React, { useState } from 'react';
import './Dashboard.css';

interface Redacao {
    id: number;
    aluno: string;
    tema: string;
    status: 'corrigida' | 'pendente' | 'revisao';
    pontuacao?: number;
}

const Dashboard: React.FC = () => {
    const [dragOver, setDragOver] = useState(false);
    const [selectedAluno, setSelectedAluno] = useState('');
    const [selectedPadrao, setSelectedPadrao] = useState('ENEM');

    const redacoesRecentes: Redacao[] = [
        {
            id: 1,
            aluno: 'Ana Silva',
            tema: 'Desafios da mobilidade urbana',
            status: 'corrigida',
            pontuacao: 940
        },
        {
            id: 2,
            aluno: 'Carlos Santos',
            tema: 'Tecnologia e educação',
            status: 'pendente'
        },
        {
            id: 3,
            aluno: 'Maria Oliveira',
            tema: 'Sustentabilidade ambiental',
            status: 'revisao'
        }
    ];

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        // Aqui seria implementada a lógica de upload
        console.log('Arquivo solto:', e.dataTransfer.files);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'corrigida': return 'CORRIGIDA';
            case 'pendente': return 'PENDENTE';
            case 'revisao': return 'EM REVISÃO';
            default: return status;
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-grid">
                {/* Estatísticas */}
                <div className="stats-section">
                    <div className="card card-small stats-card">
                        <div className="stats-icon">📊</div>
                        <div className="stats-content">
                            <h3>Estatísticas</h3>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="card card-small stat-item">
                            <div className="stat-label">Redações Hoje</div>
                            <div className="stat-value">23</div>
                            <div className="stat-progress">
                                <div className="progress-bar" style={{width: '70%'}}></div>
                            </div>
                        </div>

                        <div className="card card-small stat-item">
                            <div className="stat-label">Pendentes</div>
                            <div className="stat-value stat-warning">8</div>
                        </div>

                        <div className="card card-small stat-item">
                            <div className="stat-label">Corrigidas</div>
                            <div className="stat-value stat-success">15</div>
                        </div>
                    </div>

                    <div className="card card-small tools-card">
                        <div className="tools-icon">🛠️</div>
                        <div className="tools-content">
                            <h3>Ferramentas</h3>
                            <button className="button tool-button">
                                📷 OCR Scanner
                            </button>
                            <button className="button-secondary tool-button">
                                📊 Relatórios IA
                            </button>
                            <button className="button-secondary tool-button">
                                👥 Gerenciar Turmas
                            </button>
                        </div>
                    </div>
                </div>

                {/* Seção Principal - Upload */}
                <div className="main-section">
                    <div className="success-alert">
                        🎉 Nova funcionalidade: Reconhecimento manuscrito melhorado com 98% de precisão!
                    </div>

                    <div className="card upload-section">
                        <div className="upload-header">
                            <div className="upload-icon">📝</div>
                            <h2>Enviar Nova Redação</h2>
                        </div>

                        <div 
                            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="upload-icon-large">📄</div>
                            <p>Arraste a redação escaneada aqui</p>
                            <span>ou clique para selecionar arquivo</span>
                            <div className="supported-formats">
                                Suporta JPG, PNG, PDF | Máx: 10MB
                            </div>
                        </div>

                        <div className="upload-options">
                            <div className="option-group">
                                <label>Aluno:</label>
                                <select 
                                    value={selectedAluno} 
                                    onChange={(e) => setSelectedAluno(e.target.value)}
                                    className="select-input"
                                >
                                    <option value="">Selecionar aluno...</option>
                                    <option value="ana">Ana Silva</option>
                                    <option value="carlos">Carlos Santos</option>
                                    <option value="maria">Maria Oliveira</option>
                                </select>
                            </div>

                            <div className="option-group">
                                <label>Padrão de Correção:</label>
                                <select 
                                    value={selectedPadrao} 
                                    onChange={(e) => setSelectedPadrao(e.target.value)}
                                    className="select-input"
                                >
                                    <option value="ENEM">ENEM</option>
                                    <option value="FUVEST">FUVEST</option>
                                    <option value="UNICAMP">UNICAMP</option>
                                </select>
                            </div>
                        </div>

                        <button className="button upload-button">
                            🚀 Processar com IA
                        </button>

                        <div className="ai-status">
                            <div className="status-item">
                                <span className="status-indicator active"></span>
                                <span>Análise IA em Tempo Real</span>
                            </div>
                            <div className="ai-details">
                                <div>Sistema pronto para processar redação manuscrita</div>
                                <div className="ai-engines">
                                    <span className="engine-status">🟢 OCR Engine: Ativo</span>
                                    <span className="engine-status">🟢 Corretor IA: Standby</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Redações Recentes */}
                <div className="recent-section">
                    <div className="card">
                        <div className="section-header">
                            <div className="section-icon">📄</div>
                            <h3>Redações Recentes</h3>
                        </div>

                        <div className="recent-list">
                            {redacoesRecentes.map((redacao) => (
                                <div key={redacao.id} className="recent-item">
                                    <div className="recent-info">
                                        <div className="student-name">{redacao.aluno}</div>
                                        <div className={`status-badge status-${redacao.status}`}>
                                            {getStatusLabel(redacao.status)}
                                        </div>
                                    </div>
                                    <div className="theme">Tema: {redacao.tema}</div>
                                    {redacao.pontuacao ? (
                                        <div className="score">{redacao.pontuacao}</div>
                                    ) : redacao.status === 'pendente' ? (
                                        <div className="processing">Processando OCR...</div>
                                    ) : (
                                        <div className="analyzing">Em análise</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button className="button-secondary view-all-button">
                            Ver Todas
                        </button>
                    </div>
                </div>

                {/* Critérios ENEM */}
                <div className="criteria-section">
                    <div className="card">
                        <div className="section-header">
                            <div className="section-icon">🎯</div>
                            <h3>Critérios ENEM</h3>
                        </div>

                        <div className="criteria-list">
                            <div className="criteria-item">
                                <strong>C1:</strong> Domínio da escrita formal
                            </div>
                            <div className="criteria-item">
                                <strong>C2:</strong> Compreensão do tema
                            </div>
                            <div className="criteria-item">
                                <strong>C3:</strong> Argumentação consistente
                            </div>
                            <div className="criteria-item">
                                <strong>C4:</strong> Mecanismos linguísticos
                            </div>
                            <div className="criteria-item">
                                <strong>C5:</strong> Proposta de intervenção
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;