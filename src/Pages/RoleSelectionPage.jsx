import React from 'react';
import { useNavigate } from 'react-router-dom';

function RoleSelectionPage({ onRoleChange }) {
    const navigate = useNavigate();

    const handleRoleChangeAndRedirect = async (newRole) => {
        await onRoleChange(newRole);
        navigate("/");
    };

    return (
        <div>
            <h2>Кто вы?</h2>
            <button onClick={() => handleRoleChangeAndRedirect('client')}>Клиент</button>
            <button onClick={() => handleRoleChangeAndRedirect('specialist')}>Специалист</button>
        </div>
    );
}

export default RoleSelectionPage;