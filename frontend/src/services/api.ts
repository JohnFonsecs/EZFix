import axios from 'axios';
import { API_URL } from '../utils/constants';
import { Redacao, Avaliacao, LoginCredentials, RegisterData } from '../types';

const api = axios.create({
    baseURL: API_URL,
});

// Interceptador para adicionar o token em todas as requisições
api.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Interceptador para lidar com erros de autenticação
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Token expirado ou inválido
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
export const login = async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const register = async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};

// Redacao endpoints
export const getRedacoes = async (): Promise<Redacao[]> => {
    const response = await api.get('/redacoes');
    return response.data;
};

export const createRedacao = async (redacao: Omit<Redacao, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post('/redacoes', redacao);
    return response.data;
};

// Avaliacao endpoints
export const fetchAvaliacaoList = async (): Promise<Avaliacao[]> => {
    const response = await api.get('/avaliacoes');
    return response.data;
};

export const createAvaliacao = async (avaliacao: Omit<Avaliacao, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post('/avaliacoes', avaliacao);
    return response.data;
};

export default api;