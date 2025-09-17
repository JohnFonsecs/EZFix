import React, { useEffect, useState } from 'react';
import { fetchAvaliacaoList } from '../../services/api';
import { Avaliacao } from '../../types';

const AvaliacaoList: React.FC = () => {
    const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAvaliacoes = async () => {
            try {
                const data = await fetchAvaliacaoList();
                setAvaliacoes(data);
            } catch (err) {
                const errorMessage = err instanceof Error 
                    ? err.message 
                    : 'Erro ao carregar avaliações';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        loadAvaliacoes();
    }, []);

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div>
            <h2>Lista de Avaliações</h2>
            <ul>
                {avaliacoes.map(avaliacao => (
                    <li key={avaliacao.id}>
                        Nota: {avaliacao.nota} - {avaliacao.comentarios}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AvaliacaoList;