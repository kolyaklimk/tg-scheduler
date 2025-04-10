import React from 'react';

function HomePage({ role, onLogout }) {
    return (
        <div>
            <h1>Главная страница</h1>
            <p>Ваша роль: {role}</p>
            <button onClick={onLogout}>Сменить роль</button>
        </div>
    );
}

export default HomePage;