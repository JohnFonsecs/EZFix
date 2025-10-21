import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RedacoesPage from './pages/RedacoesPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './components/AuthContext'; // Importa o contexto
import { authService } from './services/api'; // Importa authService
import './index.css';

// ADICIONADO: Placeholders para páginas de Professor (criar depois)
// import TurmasPage from './pages/professor/TurmasPage';
// import TurmaDetailPage from './pages/professor/TurmaDetailPage';

// Componente para rotas protegidas
const RotaProtegida: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const { autenticado, carregando } = useAuth();

    if (carregando) {
        // Mostra um indicador de carregamento enquanto verifica o status de auth
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    return autenticado ? children : <Navigate to="/login" replace />;
};

// Componente para rotas específicas de Professor
const RotaProfessor: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const { usuarioAtual } = useAuth();
    // Assumindo que RotaProtegida já cuidou da autenticação e do carregamento
    if (usuarioAtual?.role === 'PROFESSOR') {
        return children;
    } else {
        // Redireciona não-professores (ou mostra uma página de acesso negado)
        return <Navigate to="/dashboard" replace />;
    }
}


// Componente principal que define as rotas
const AppRoutes: React.FC = () => {
    const { login, logout } = useAuth(); // Obtém login/logout do contexto

    // Callback passado para LoginPage para atualizar o contexto após login bem-sucedido
    const handleLoginSucesso = () => {
        const usuario = authService.getUser(); // Re-busca dados do usuário após login defini-los
        if (usuario) {
            login(usuario); // Atualiza o estado do AuthContext
        }
    };


    return (
        <Routes>
            <Route
                path="/login"
                element={<LoginPage onLogin={handleLoginSucesso} />} // Usa o callback
            />

            {/* Rotas Protegidas */}
            <Route
                path="/dashboard"
                element={
                    <RotaProtegida>
                        <Dashboard onLogout={logout} />
                    </RotaProtegida>
                }
            />
            <Route
                path="/redacoes"
                element={
                    <RotaProtegida>
                        <RedacoesPage onLogout={logout} />
                    </RotaProtegida>
                }
            />
            <Route
                path="/perfil"
                element={
                    <RotaProtegida>
                        <ProfilePage onLogout={logout} />
                    </RotaProtegida>
                }
            />

            {/* ADICIONADO: Rotas Específicas do Professor */}
            {/* Exemplo:
            <Route
                path="/turmas" // Rota para listar turmas do professor
                element={
                    <RotaProtegida>
                        <RotaProfessor>
                            <TurmasPage onLogout={logout} />
                        </RotaProfessor>
                    </RotaProtegida>
                }
            />
            <Route
                path="/turmas/:id" // Rota para detalhes de uma turma específica
                element={
                    <RotaProtegida>
                        <RotaProfessor>
                             <TurmaDetailPage onLogout={logout} />
                        </RotaProfessor>
                    </RotaProtegida>
                }
            />
            */}


            {/* Rota Raiz - Redireciona com base na autenticação */}
            <Route
                path="/"
                element={
                    <Navigate to="/dashboard" replace /> // Tenta sempre o dashboard primeiro, RotaProtegida cuida do redirecionamento se necessário
                }
            />

            {/* Rota Catch-all (opcional) */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

// Componente App que envolve tudo com o Provider
const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider> {/* Envolve as rotas com o AuthProvider */}
                <div className="App">
                    <AppRoutes /> {/* Renderiza as rotas */}
                </div>
            </AuthProvider>
        </Router>
    );
};

export default App;