import React, { useState } from 'react';
import { Redacao } from '../types'; // Importando o tipo central

interface VisualizarTextoProps {
    isVisible: boolean;
    onClose: () => void;
    redacao: Redacao | null; // Usando o tipo Redacao completo
    onSave?: (redacaoId: string, novoTexto: string) => Promise<void>;
}

const VisualizarTexto: React.FC<VisualizarTextoProps> = ({ isVisible, onClose, redacao, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isVisible || !redacao) return null;

    const textoLimpo = redacao.textoExtraido || '';
    const textoAtual = isEditing ? editedText : textoLimpo;
    const palavrasDetectadas = textoAtual.split(/\s+/).filter(p => p.trim().length > 0).length;
    const linhasDetectadas = textoAtual.split('\n').filter(l => l.trim().length > 0).length;

    const handleStartEdit = () => {
        setEditedText(textoLimpo);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setEditedText('');
        setIsEditing(false);
    };

    const handleSaveEdit = async () => {
        if (!onSave || !redacao.id) return;
        
        setIsSaving(true);
        try {
            await onSave(redacao.id, editedText);
            setIsEditing(false);
            // Fechar o modal após salvar
            onClose();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar o texto. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col my-4">
                {/* Header */}
                <div className={`text-white p-4 flex justify-between items-center ${isEditing ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    <div>
                        <h2 className="text-xl font-semibold">
                            {isEditing ? '✏️ Editando Texto' : '📄 Texto Extraído pela IA'}
                        </h2>
                        <p className="text-blue-100 text-sm">{redacao.titulo}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl font-bold">×</button>
                </div>

                {/* Stats */}
                <div className="bg-gray-50 p-4 border-b">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{palavrasDetectadas}</div>
                            <div className="text-sm text-gray-600">Palavras</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{linhasDetectadas}</div>
                            <div className="text-sm text-gray-600">Parágrafos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{textoAtual.length}</div>
                            <div className="text-sm text-gray-600">Caracteres</div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {textoAtual ? (
                        <div>
                            {/* Alerta se o texto ainda não foi analisado */}
                            {!redacao.notaFinal && !isEditing && (
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">💡</span>
                                        <div>
                                            <h4 className="font-semibold text-yellow-800 mb-1">
                                                Texto ainda não analisado
                                            </h4>
                                            <p className="text-sm text-yellow-700">
                                                Este é o momento ideal para revisar e editar o texto extraído pelo OCR antes de realizar a análise ENEM. 
                                                Clique em "Editar Texto" abaixo para fazer correções.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                {isEditing ? '✏️ Edite o texto abaixo:' : '🔍 Texto como foi lido e formatado:'}
                            </h3>
                            {isEditing ? (
                                <>
                                    <textarea
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans text-base text-gray-800 leading-relaxed resize-none"
                                        placeholder="Digite ou edite o texto aqui..."
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        💡 Dica: Revise erros de OCR, quebras de linha e formatação antes de salvar.
                                    </p>
                                </>
                            ) : (
                                <div className="bg-gray-50 border rounded-lg p-4">
                                    <pre className="whitespace-pre-wrap font-sans text-base text-gray-800 leading-relaxed">
                                        {textoLimpo}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-6xl mb-4">📄</div>
                            <p>Nenhum texto foi extraído desta imagem.</p>
                            <p className="text-sm mt-2">Verifique se a imagem contém texto legível.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-100 px-6 py-3 flex justify-between items-center border-t gap-2 flex-wrap">
                    <div className="text-sm text-gray-500">
                        Processado em: {new Date(redacao.criadoEm).toLocaleString('pt-BR')}
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button 
                                    onClick={handleCancelEdit} 
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveEdit} 
                                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                                    disabled={isSaving || !editedText.trim()}
                                >
                                    {isSaving ? 'Salvando...' : '💾 Salvar e Reanalisar'}
                                </button>
                            </>
                        ) : (
                            <>
                                {textoLimpo && onSave && (
                                    <button 
                                        onClick={handleStartEdit} 
                                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                                    >
                                        ✏️ Editar Texto
                                    </button>
                                )}
                                <button 
                                    onClick={onClose} 
                                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                                >
                                    Fechar
                                </button>
                            </>
                        )}
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};

export default VisualizarTexto;