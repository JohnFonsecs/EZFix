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
    Matricula,
    EstatisticasTurma
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth services (COM setToken e setUser RESTAURADOS)
export const authService = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', data);
        // A lógica de salvar no localStorage é feita no componente de login
        return response.data;
    },
    register: async (data: RegisterRequest): Promise<User> => {
        const response = await api.post('/auth/register', data);
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
    // FUNÇÃO RESTAURADA
    setToken: (token: string) => {
        localStorage.setItem('token', token);
    },
    getUser: (): User | null => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    },
    // FUNÇÃO RESTAURADA
    setUser: (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
    },
};

// Redacao services (COM updateTexto RESTAURADO)
export const redacaoService = {
    list: async (): Promise<Redacao[]> => {
        const response = await api.get('/redacoes');
        return response.data;
    },
    get: async (id: string): Promise<Redacao> => {
        const response = await api.get(`/redacoes/${id}`);
        return response.data;
    },
    getAnaliseEnem: async (id: string): Promise<any> => {
        try {
            const response = await api.get(`/redacoes/${id}/analise-enem`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 202) {
                return { status: 'running' };
            }
            throw error;
        }
    },
    reanalyze: async (texto: string): Promise<any> => {
        const response = await api.post(`/redacoes/reanalisar`, { texto });
        return response.data;
    },
    create: async (data: CreateRedacaoRequest): Promise<Redacao> => {
        const response = await api.post('/redacoes', data);
        return response.data;
    },
    createWithFile: async (formData: FormData): Promise<Redacao> => {
        const response = await api.post('/redacoes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return response.data;
    },
    createForAluno: async (alunoId: string, formData: FormData): Promise<Redacao> => {
        const response = await api.post(`/alunos/${alunoId}/redacoes`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return response.data;
    },
    update: async (id: string, data: Partial<Redacao>): Promise<Redacao> => {
        const response = await api.put(`/redacoes/${id}`, data);
        return response.data;
    },
    // FUNÇÃO RESTAURADA
    updateTexto: async (id: string, textoExtraido: string): Promise<Redacao> => {
        // A função 'update' é mais genérica, mas 'updateTexto' é o que seu código chama.
        // Vamos fazê-la chamar a 'update'
        return await redacaoService.update(id, { textoExtraido });
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/redacoes/${id}`);
    },
    listByTurma: async (turmaId: string): Promise<Redacao[]> => {
        const response = await api.get(`/turmas/${turmaId}/redacoes`);
        return response.data;
    }
};

// --- SERVIÇO PARA GERENCIAMENTO DE TURMAS ---
export const turmaService = {
    create: async (nome: string): Promise<Turma> => {
        const response = await api.post('/turmas', { nome });
        return response.data;
    },
    list: async (): Promise<Turma[]> => {
        const response = await api.get('/turmas');
        return response.data;
    },
    getDetails: async (id: string): Promise<any> => { // Deixando como 'any' para o componente lidar
        const response = await api.get(`/turmas/${id}`);
        return response.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/turmas/${id}`);
    },
    addAluno: async (turmaId: string, alunoEmail: string): Promise<Matricula> => {
        const response = await api.post(`/turmas/${turmaId}/alunos`, { alunoEmail });
        return response.data;
    },
    removeAluno: async (turmaId: string, alunoId: string): Promise<void> => {
        await api.delete(`/turmas/${turmaId}/alunos/${alunoId}`);
    },
    getEstatisticas: async (turmaId: string): Promise<EstatisticasTurma> => {
        const response = await api.get(`/turmas/${turmaId}/estatisticas`);
        return response.data;
    }
};

// Avaliacao services (sem alterações)
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

export default api;