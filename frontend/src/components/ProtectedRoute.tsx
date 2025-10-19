import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/api';
import { UserRole } from '../types';

interface ProtectedRouteProps {
    requiredRole: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getUser();

    if (!isAuthenticated) {
        // Se não estiver logado, redireciona para a página de login
        return <Navigate to="/login" replace />;
    }

    if (user && user.role !== requiredRole) {
        // Se estiver logado, mas não tiver o papel correto, redireciona para o dashboard
        return <Navigate to="/dashboard" replace />;
    }

    // Se estiver logado e tiver o papel correto, renderiza o conteúdo da rota
    return <Outlet />;
};

export default ProtectedRoute;