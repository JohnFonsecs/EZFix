export interface User {
    id: string;
    email: string;
    nome: string;
}

export interface Redacao {
    id: string;
    titulo: string;
    conteudo: string;
    tema: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Avaliacao {
    id: string;
    redacaoId: string;
    nota: number;
    comentarios: string;
    criterios: {
        competencia1: number;
        competencia2: number;
        competencia3: number;
        competencia4: number;
        competencia5: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface LoginCredentials {
    email: string;
    senha: string;
}

export interface RegisterData {
    nome: string;
    email: string;
    senha: string;
}