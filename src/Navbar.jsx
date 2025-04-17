import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar({ role, telegramId }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (event) => {
        const value = event.target.value;
        navigate(value);
    };

    return (
        <nav className="navbar">
            <select
                className="menu-select"
                onChange={handleChange}
                value={location.pathname}
            >
                <option value="">МЕНЮ</option>
                <option value="/change-role">Сменить роль</option>
                {role === 'specialist' ? (
                    <>
                        <option value={`/profile/${telegramId}`}>Профиль</option>
                        <option value="/schedule">Расписание</option>
                        <option value="/appointments">Записи</option>
                        <option value="/archive">Архив</option>
                        <option value="/subscription">Подписка</option>
                        <option value="/profile-link">Ссылка на профиль</option>
                    </>
                ) : (
                    <>
                        <option value="/book-appointment">Записаться</option>
                        <option value="/archive">Архив</option>
                    </>
                )}
            </select>
        </nav>
    );
}

export default Navbar;