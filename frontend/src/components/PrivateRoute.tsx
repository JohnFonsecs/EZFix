import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const PrivateRoute: React.FC = () => {
    const { isAuthenticated, loading } = useAuthContext();

    if (loading) {
        return <div>Carregando...</div>;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;