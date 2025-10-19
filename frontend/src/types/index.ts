export enum UserRole {
    ALUNO = 'ALUNO',
    PROFESSOR = 'PROFESSOR',
}

export interface User {
    id: string;
    nome: string;
    email: string;
    criadoEm: string;
    role: UserRole; // Adicionado o papel do usuário
}

export interface Redacao {
    id: string;
    titulo: string;
    imagemUrl: string;
    tema?: string;
    textoExtraido?: string;
    notaGerada?: number;
    notaFinal?: number;
    feedback?: string;
    sugestoes?: string;
    criadoEm: string;
    usuarioId: string;
    alunoId?: string;
    turmaId?: string;
    avaliacoes: Avaliacao[];
    aluno?: {
        id: string;
        nome: string;
    };
}

export interface Turma {
    id: string;
    nome: string;
    professorId: string;
    criadoEm: string;
    _count?: {
        matriculas: number;
    };
}
export interface Matricula {
    id: string;
    alunoId: string;
    turmaId: string;
    aluno: {
        id: string;
        nome: string;
        email: string;
    };
}
export interface EstatisticasTurma {
    mediaGeral: number | null;
    totalRedacoesComNota: number;
    mediaUltimas10: number | null;
}

export interface Avaliacao {
    id: string;
    competencia: number;
    notaComp: number;
    comentario?: string;
    redacaoId: string;
}

export interface LoginRequest {
    email: string;
    senha: string;
}

export interface RegisterRequest {
    nome: string;
    email: string;
    senha: string;
    role: UserRole;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface CreateRedacaoRequest {
    titulo: string;
    imagemUrl: string;
}

export interface CreateAvaliacaoRequest {
    competencia: number;
    notaComp: number;
    comentario?: string;
    redacaoId: string;
}