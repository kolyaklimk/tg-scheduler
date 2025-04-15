import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar({ role }) {
    const navigate = useNavigate();

    const handleChange = (event) => {
        const value = event.target.value;       
        navigate(value);
    };

    return (
        <nav className="navbar">
            <select className="menu-select" onChange={handleChange}>     
                <option value="">МЕНЮ</option>
                <option value="/change-role">Сменить роль</option>
                {role === 'specialist' ? (
                    <>
                        <option value="/profile">Профиль</option>
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