import React from 'react';

function RoleSelectionPage({ onRoleChange }) {
    return (
        <div>
            <h2>Кто вы?</h2>
            <button onClick={() => onRoleChange('client')}>Клиент</button>
            <button onClick={() => onRoleChange('specialist')}>Специалист</button>
        </div>
    );
}

export default RoleSelectionPage;