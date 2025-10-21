import axios from 'axios';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  User, 
  Redacao, 
  CreateRedacaoRequest,
  Avaliacao,
  CreateAvaliacaoRequest,
  Turma,
  Matricula
} from '../types';

const API_BASE_URL = 'http://localhost:3000';

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    // Envia o 'role' se ele for 'PROFESSOR'
    const payload: RegisterRequest = { ...data };
    if (data.role !== 'PROFESSOR') {
        delete payload.role; // Não envia 'ALUNO', backend assume como padrão
    }
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  changePassword: async (senhaAtual: string, novaSenha: string): Promise<{ mensagem: string }> => {
    const response = await api.put('/auth/change-password', { senhaAtual, novaSenha });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },

  getUser: (): User | null => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
};

// Redacao services
export const redacaoService = {
  list: async (): Promise<Redacao[]> => {
    const response = await api.get('/redacoes');
    return response.data;
  },

  get: async (id: string): Promise<Redacao> => {
    const response = await api.get(`/redacoes/${id}`);
    return response.data;
  },

  getAnalise: async (id: string): Promise<any> => {
    const response = await api.get(`/redacoes/${id}/analise`);
    return response.data;
  },

  getAnaliseEnem: async (id: string): Promise<any> => {
    const response = await api.get(`/redacoes/${id}/analise-enem`);
    return response.data;
  },

  getTextoRaw: async (id: string): Promise<string> => {
    const response = await api.get(`/redacoes/${id}`);
    return response.data.textoExtraido || '';
  },

  reanalyze: async (texto: string): Promise<any> => {
    const response = await api.post(`/redacoes/reanalisar`, { texto });
    return response.data;
  },

  create: async (data: CreateRedacaoRequest): Promise<Redacao> => {
    const response = await api.post('/redacoes', data);
    return response.data;
  },

  // Envio multipart/form-data com arquivo
  createWithFile: async (formData: FormData): Promise<Redacao> => {
    const response = await api.post('/redacoes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },

  update: async (id: string, data: Partial<CreateRedacaoRequest>): Promise<Redacao> => {
    const response = await api.put(`/redacoes/${id}`, data);
    return response.data;
  },

  updateTexto: async (id: string, textoExtraido: string): Promise<Redacao> => {
    const response = await api.put(`/redacoes/${id}`, { textoExtraido });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/redacoes/${id}`);
  },
};

// Avaliacao services
export const avaliacaoService = {
  listByRedacao: async (redacaoId: string): Promise<Avaliacao[]> => {
    const response = await api.get(`/avaliacoes/redacao/${redacaoId}`);
    return response.data;
  },

  get: async (id: string): Promise<Avaliacao> => {
    const response = await api.get(`/avaliacoes/${id}`);
    return response.data;
  },

  create: async (data: CreateAvaliacaoRequest): Promise<Avaliacao> => {
    const response = await api.post('/avaliacoes', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateAvaliacaoRequest>): Promise<Avaliacao> => {
    const response = await api.put(`/avaliacoes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/avaliacoes/${id}`);
  },
};

// ADICIONADO: Turma services
export const turmaService = {
// Para Professores  
  listarTurmasProfessor: async (): Promise<Turma[]> => {
    const response = await api.get('/turmas/professor');
    return response.data;
  },
  criarTurma: async (nome: string): Promise<Turma> => {
    const response = await api.post('/turmas', { nome });
    return response.data;
  },
  adicionarAluno: async (turmaId: string, emailAluno: string): Promise<Matricula> => {
    const response = await api.post('/turmas/matricular', { turmaId, emailAluno });
    return response.data;
  },
  listarRedacoesDaTurma: async (turmaId: string): Promise<Redacao[]> => {
    const response = await api.get(`/turmas/${turmaId}/redacoes`);
    return response.data;
  },
  listarAlunosDaTurma: async (turmaId: string): Promise<User[]> => {
    const response = await api.get(`/turmas/${turmaId}/alunos`);
    return response.data;
  },

  // Para Alunos
  listarTurmasAluno: async (): Promise<Turma[]> => {
    const response = await api.get('/turmas/aluno');
    return response.data;
  },
};

export default api;