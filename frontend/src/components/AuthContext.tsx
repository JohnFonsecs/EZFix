import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { authService } from '../services/api';
import { User } from '../types'; // Importa seu tipo User

interface AuthContextType {
    usuarioAtual: User | null;
    autenticado: boolean;
    carregando: boolean;
    login: (usuario: User) => void; // Função para atualizar usuário após login
    logout: () => void;
}

// Cria o contexto com valores padrão
const AuthContext = createContext<AuthContextType>({
    usuarioAtual: null,
    autenticado: false,
    carregando: true,
    login: () => { },
    logout: () => { },
});

// Cria o componente provedor
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [usuarioAtual, setUsuarioAtual] = useState<User | null>(null);
    const [carregando, setCarregando] = useState<boolean>(true);

    // Verifica o status de autenticação na carga inicial
    useEffect(() => {
        const verificarAuth = () => {
            const usuario = authService.getUser(); // Obtém usuário com role do localStorage
            const token = authService.getToken();

            if (usuario && token) {
                setUsuarioAtual(usuario);
            } else {
                authService.logout(); // Garante estado limpo se algo estiver faltando
                setUsuarioAtual(null);
            }
            setCarregando(false);
        };
        verificarAuth();
    }, []);

    const login = useCallback((usuario: User) => {
        setUsuarioAtual(usuario); // Atualiza o estado quando o login ocorre
        // Nota: Token e Usuário já devem estar definidos no localStorage pela LoginPage
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setUsuarioAtual(null);
    }, []);

    const autenticado = !!usuarioAtual; // Determina status de autenticação baseado no usuarioAtual

    return (
        <AuthContext.Provider value={{ usuarioAtual, autenticado, carregando, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook customizado para usar o contexto de autenticação facilmente
export const useAuth = () => useContext(AuthContext); // Mantive 'useAuth' por convenção comum