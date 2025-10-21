export interface User {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
  role?: 'ALUNO' | 'PROFESSOR';
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
  aluno?: { nome: string; email: string };
  avaliacoes: Avaliacao[];
}

export interface Avaliacao {
  id: string;
  competencia: number;
  notaComp: number;
  comentario?: string;
  redacaoId: string;
}

export interface Turma {
  id: string;
  nome: string;
  professorId: string;
  criadoEm: string;
  atualizadoEm: string;
  _count?: { // Opcional, se o backend incluir contagem
    matriculas: number;
  };
}

export interface Matricula {
  id: string;
  alunoId: string;
  turmaId: string;
  criadoEm: string;
  aluno?: User; // Opcional, para joins
  turma?: Turma; // Opcional, para joins
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  role?: 'ALUNO' | 'PROFESSOR';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateRedacaoRequest {
    titulo: string;
    imagemUrl?: string;
    file?: File;
    turmaId?: string;
}

export interface CreateAvaliacaoRequest {
  competencia: number;
  notaComp: number;
  comentario?: string;
  redacaoId: string;
}