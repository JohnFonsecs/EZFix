import React, { useEffect, useState } from 'react';
import { getRedacoes } from '../../services/api';
import { Redacao } from '../../types';

const RedacaoList: React.FC = () => {
    const [redacoes, setRedacoes] = useState<Redacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRedacoes = async () => {
            try {
                const data = await getRedacoes();
                setRedacoes(data);
            } catch (err) {
                const errorMessage = err instanceof Error 
                    ? err.message 
                    : 'Erro ao carregar redações';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        loadRedacoes();
    }, []);

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div>
            <h2>Lista de Redações</h2>
            <ul>
                {redacoes.map((redacao) => (
                    <li key={redacao.id}>{redacao.titulo}</li>
                ))}
            </ul>
        </div>
    );
};

export default RedacaoList;