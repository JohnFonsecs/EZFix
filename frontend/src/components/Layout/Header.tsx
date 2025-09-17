import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header-content">
                <div className="logo">
                    <div className="logo-icon">🔧</div>
                    <span>EZ Sentence Fix</span>
                </div>
                
                <nav>
                    <ul className="nav-menu">
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li><Link to="/redacoes">Redações</Link></li>
                        <li><Link to="/turmas">Turmas</Link></li>
                        <li><Link to="/relatorios">Relatórios</Link></li>
                    </ul>
                </nav>

                <div className="user-profile">
                    <div className="user-avatar">PF</div>
                    <span>Prof. Fernando</span>
                </div>
            </div>
        </header>
    );
};

export default Header;