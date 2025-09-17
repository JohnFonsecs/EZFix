import React, { useState } from 'react';

const RedacaoForm: React.FC = () => {
    const [titulo, setTitulo] = useState('');
    const [conteudo, setConteudo] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Lógica para enviar os dados da redação para o backend
        console.log('Título:', titulo);
        console.log('Conteúdo:', conteudo);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="titulo">Título:</label>
                <input
                    type="text"
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="conteudo">Conteúdo:</label>
                <textarea
                    id="conteudo"
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Salvar Redação</button>
        </form>
    );
};

export default RedacaoForm;