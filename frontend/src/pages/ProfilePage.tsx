import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { User } from '../types';
import { useAuth } from '../components/AuthContext';

interface ProfilePageProps {
    onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const { usuarioAtual } = useAuth();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        const user = authService.getUser();
        if (user) {
            setCurrentUser(user);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validações
        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            setMessage({ type: 'error', text: 'Todos os campos são obrigatórios' });
            return;
        }

        if (novaSenha.length < 6) {
            setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres' });
            return;
        }

        if (novaSenha !== confirmarSenha) {
            setMessage({ type: 'error', text: 'As senhas não coincidem' });
            return;
        }

        setLoading(true);

        try {
            await authService.changePassword(senhaAtual, novaSenha);
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            
            // Limpar campos
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarSenha('');
            setShowPasswordForm(false);

            // Auto-hide mensagem após 5 segundos
            setTimeout(() => setMessage(null), 5000);
        } catch (error: any) {
            console.error('Erro ao alterar senha:', error);
            const errorMessage = error.response?.data?.erro || 'Erro ao alterar senha. Tente novamente.';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
                    <p className="mt-4 text-white">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
            {/* Header */}
            <header className="bg-white shadow-lg p-3 sm:p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl sm:text-2xl">📝</span>
                        <h1 className="text-base sm:text-xl font-bold text-gray-800">EZ Sentence Fix</h1>
                    </div>

                    <nav className="hidden md:flex space-x-4 lg:space-x-8">
                        <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-800 bg-transparent text-sm lg:text-base">Dashboard</button>
                        <button onClick={() => navigate('/redacoes')} className="text-gray-600 hover:text-gray-800 bg-transparent text-sm lg:text-base">Redações</button>
                        {usuarioAtual?.role === 'PROFESSOR' && (
                            <button onClick={() => navigate('/turmas')} className="text-gray-600 hover:text-gray-800 bg-transparent text-sm lg:text-base">Turmas</button>
                        )}
                        <button onClick={() => navigate('/perfil')} className="text-purple-600 font-semibold bg-transparent text-sm lg:text-base">Perfil</button>
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button 
                            onClick={() => navigate('/perfil')}
                            className="bg-purple-600 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm hover:bg-purple-700 transition-colors"
                        >
                            {currentUser.nome.charAt(0).toUpperCase()}
                        </button>
                        <span className="text-gray-700 text-sm sm:text-base hidden sm:inline">
                            {currentUser.nome}
                        </span>
                        <button
                            onClick={() => {
                                authService.logout();
                                onLogout();
                            }}
                            className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium px-2 py-1"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
                    {/* Cabeçalho do Perfil */}
                    <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-gray-200">
                        <div className="bg-purple-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold">
                            {currentUser.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{currentUser.nome}</h2>
                            <p className="text-gray-600">{currentUser.email}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Membro desde {formatDate(currentUser.criadoEm)}
                            </p>
                        </div>
                    </div>

                    {/* Mensagem de feedback */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${
                            message.type === 'success' 
                                ? 'bg-green-50 border border-green-200 text-green-800' 
                                : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                            <div className="flex justify-between items-center">
                                <p className="text-sm">{message.text}</p>
                                <button
                                    onClick={() => setMessage(null)}
                                    className={`${
                                        message.type === 'success' 
                                            ? 'text-green-600 hover:text-green-800' 
                                            : 'text-red-600 hover:text-red-800'
                                    } text-lg font-bold`}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Informações do Perfil */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Informações da Conta</h3>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <p className="text-gray-900">{currentUser.nome}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <p className="text-gray-900">{currentUser.email}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
                                <p className="text-gray-900 flex items-center gap-2">
                                    {currentUser.role === 'PROFESSOR' ? (
                                        <>
                                            <span className="text-2xl">👨‍🏫</span>
                                            <span>Professor</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-2xl">🎓</span>
                                            <span>Aluno</span>
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID do Usuário</label>
                                <p className="text-gray-600 text-sm font-mono">{currentUser.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Seção de Alteração de Senha */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Segurança</h3>
                            {!showPasswordForm && (
                                <button
                                    onClick={() => setShowPasswordForm(true)}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                >
                                    Alterar Senha
                                </button>
                            )}
                        </div>

                        {showPasswordForm ? (
                            <form onSubmit={handleChangePassword} className="space-y-4 bg-gray-50 p-6 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Senha Atual
                                    </label>
                                    <input
                                        type="password"
                                        value={senhaAtual}
                                        onChange={(e) => setSenhaAtual(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Digite sua senha atual"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nova Senha
                                    </label>
                                    <input
                                        type="password"
                                        value={novaSenha}
                                        onChange={(e) => setNovaSenha(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Digite sua nova senha (mín. 6 caracteres)"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirmar Nova Senha
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmarSenha}
                                        onChange={(e) => setConfirmarSenha(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Digite novamente a nova senha"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        {loading ? 'Alterando...' : 'Confirmar Alteração'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordForm(false);
                                            setSenhaAtual('');
                                            setNovaSenha('');
                                            setConfirmarSenha('');
                                            setMessage(null);
                                        }}
                                        className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <p className="text-gray-600 text-sm">
                                    🔒 Mantenha sua conta segura alterando sua senha regularmente.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
