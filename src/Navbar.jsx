import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar({ role, onLogout }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="navbar">
            <button className="menu-button" onClick={toggleMenu}>
                МЕНЮ
            </button>
            {isOpen && (
                <div className="menu-dropdown">
                    <ul>
                        <li><Link to="/change-role" onClick={toggleMenu}>Сменить роль</Link></li>
                        {role === 'specialist' ? (
                            <>
                                <li><Link to="/profile" onClick={toggleMenu}>Профиль</Link></li>
                                <li><Link to="/schedule" onClick={toggleMenu}>Расписание</Link></li>
                                <li><Link to="/appointments" onClick={toggleMenu}>Записи</Link></li>
                                <li><Link to="/archive" onClick={toggleMenu}>Архив</Link></li>
                                <li><Link to="/subscription" onClick={toggleMenu}>Подписка</Link></li>
                                <li><Link to="/profile-link" onClick={toggleMenu}>Ссылка на профиль</Link></li>
                            </>
                        ) : (
                            <>
                                <li><Link to="/book-appointment" onClick={toggleMenu}>Записаться</Link></li>
                                <li><Link to="/archive" onClick={toggleMenu}>Архив</Link></li>
                            </>
                        )}
                        <li>
                            <button onClick={() => {
                                onLogout();
                                toggleMenu(); // Закрываем меню после выхода
                            }}>
                                Выйти
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </nav>
    );
}

export default Navbar;