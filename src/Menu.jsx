import React from 'react';
import { Link } from 'react-router-dom';

function Menu({ role }) {
    return (
        <nav>
            <ul>
                <li><Link to="/">Поменять роль</Link></li>
                {role === 'specialist' ? (
                    <>
                        <li><Link to="/profile">Профиль</Link></li>
                        <li><Link to="/schedule">Расписание</Link></li>
                        <li><Link to="/appointments">Записи</Link></li>
                        <li><Link to="/archive">Архив</Link></li>
                        <li><Link to="/subscription">Подписка</Link></li>
                        <li><Link to="/profile-link">Ссылка на профиль</Link></li>
                    </>
                ) : (
                    <>
                        <li><Link to="/book-appointment">Записаться</Link></li>
                        <li><Link to="/archive">Архив</Link></li>
                    </>
                )}
            </ul>
        </nav>
    );
}

export default Menu;