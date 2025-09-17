import { useState, useEffect } from 'react';
import { login as apiLogin } from '../services/api';
import { User, LoginCredentials } from '../types';
import { AUTH_TOKEN_KEY } from '../utils/constants';

const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem(AUTH_TOKEN_KEY));

    useEffect(() => {
        // Verificar se há um token salvo e buscar informações do usuário
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
            // Você pode implementar uma função para buscar dados do usuário pelo token
            // fetchUserData();
        }
    }, []);

    const login = async (credentials: LoginCredentials) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiLogin(credentials);
            // Salvar o token no localStorage
            localStorage.setItem(AUTH_TOKEN_KEY, response.token);
            setIsAuthenticated(true);
            
            // Se a API retornar dados do usuário junto com o token
            if (response.user) {
                setUser(response.user);
            }
            
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error 
                ? err.message 
                : 'Erro no login';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        setIsAuthenticated(false);
    };

    return { user, loading, error, isAuthenticated, login, logout };
};

export default useAuth;