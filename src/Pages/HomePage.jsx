import React from 'react';

function HomePage({ role }) {
    return (
        <div>
            <h1>Главная страница</h1>
            <p>Ваша роль: {role}</p>
        </div>
    );
}

export default HomePage;