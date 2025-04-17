import React, { useContext } from 'react';

function HomePage({ role }) {
    const { role } = useContext(UserContext);

    return (
        <div>
            <h1>Главная страница</h1>
            <p>Ваша роль: {role}</p>
        </div>
    );
}

export default HomePage;