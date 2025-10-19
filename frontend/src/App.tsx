import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RedacoesPage from './pages/RedacoesPage';
import ProfilePage from './pages/ProfilePage';
import GerenciarTurmas from './components/GerenciarTurmas';
import DetalhesTurma from './components/DetalhesTurma';  
import ProtectedRoute from './components/ProtectedRoute'; 
import { authService } from './services/api';
import { UserRole } from './types';
import './index.css';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const token = authService.getToken();
        if (token) {
            setIsAuthenticated(true);
        } else {
            authService.logout();
            setIsAuthenticated(false);
        }
        setLoading(false);
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        authService.logout();
        setIsAuthenticated(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    // Componente wrapper para rotas privadas genéricas
    const PrivateWrapper = () => {
        return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
    };

    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* Rota Pública */}
                    <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

                    {/* Rotas Privadas para TODOS os usuários logados */}
                    <Route element={<PrivateWrapper />}>
                        <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
                        <Route path="/redacoes" element={<RedacoesPage onLogout={handleLogout} />} />
                        <Route path="/perfil" element={<ProfilePage onLogout={handleLogout} />} />

                        {/* Rotas Privadas APENAS para Professores */}
                        <Route element={<ProtectedRoute requiredRole={UserRole.PROFESSOR} />}>
                            <Route path="/turmas" element={<GerenciarTurmas />} />
                            <Route path="/turmas/:id" element={<DetalhesTurma />} />
                        </Route>

                        {/* Rota Raiz: redireciona para o dashboard se logado */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Route>

                    {/* Rota de Fallback: Se não estiver logado e tentar acessar qualquer outra coisa */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;