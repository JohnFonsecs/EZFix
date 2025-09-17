import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer>
            <div>
                <p>&copy; {new Date().getFullYear()} EZFix. Todos os direitos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;