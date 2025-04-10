import React, { useState, useEffect } from 'react';
import RoleSelectionPage from './pages/RoleSelection'; // Создайте этот компонент
import HomePage from './pages/Home'; // Создайте этот компонент

function App() {
    const [role, setRole] = useState(localStorage.getItem('userRole') || null);
    const [isTelegramReady, setIsTelegramReady] = useState(false);
    const [telegramId, setTelegramId] = useState(null);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        // Проверяем, что Telegram Web App API доступен и вызываем ready()
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            setIsTelegramReady(true);
        }
        else {
            alert("error Telegram.WebApp.ready()")
        }
    }, []);

    useEffect(() => {
        if (isTelegramReady) {
            const id = window.Telegram.WebApp.initDataUnsafe?.user?.id;
            setTelegramId(id);
        }
    }, [isTelegramReady]);


    useEffect(() => {
        if (isTelegramReady && telegramId) {
            fetchUser();
        }
    }, [isTelegramReady, telegramId]);

    const fetchUser = async () => {
        try {
            const response = await fetch(`${apiUrl}/User/GetUser?telegramId=${telegramId}`);
            const data = await response.json();
            setRole(data.role);
            localStorage.setItem('userRole', data.role);
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    const handleRoleChange = async (newRole) => {
        try {
            const response = await fetch(`${apiUrl}/User/ChangeRole?telegramId=${telegramId}&newRole=${newRole}`, {
                method: 'POST',
            });
            const data = await response.json();
            setRole(data.role);
            localStorage.setItem('userRole', data.role);
        } catch (error) {
            console.error("Error changing role:", error);
        }
    };

    const handleLogout = () => {
        setRole(null);
        localStorage.removeItem('userRole');
    };

    if (!isTelegramReady) {
        return <div>Загрузка...</div>; // Или любой другой индикатор загрузки
    }

    if (role === null || role === "") {
        return <RoleSelectionPage onRoleChange={handleRoleChange} />;
    }

    return (
        <HomePage role={role} onLogout={handleLogout} />
    );
}

export default App;