import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import RoleSelectionPage from './Pages/RoleSelectionPage'; 
import HomePage from './Pages/HomePage';
import Navbar from './Navbar';
import BookAppointmentPage from './Pages/Client/BookAppointmentPage';
import ProfilePage from './Pages/Specialist/ProfilePage';
import SchedulePage from './Pages/Specialist/SchedulePage';
import AppointmentsPage from './Pages/Specialist/AppointmentsPage';
import SubscriptionPage from './Pages/Specialist/SubscriptionPage';
import ProfileLinkPage from './Pages/Specialist/ProfileLinkPage';
import ArchivePage from './Pages/ArchivePage';
import './Navbar.css';

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
        return <div>Загрузка...</div>;
    }

    return (
        <Router>
            <div>
                <Navbar role={role} onLogout={handleLogout} /> 
                <Routes>
                    {role === null || role === "" ? (
                        <Route path="/" element={<RoleSelectionPage onRoleChange={handleRoleChange} />} />
                    ) : (
                        <Route path="/" element={<HomePage role={role} />} />
                    )}

                    <Route path="/change-role" element={<RoleSelectionPage onRoleChange={handleRoleChange} />} />
                    <Route path="/archive" element={<ArchivePage />} />

                    {role === 'client' && (
                        <Route path="/book-appointment" element={<BookAppointmentPage />} />
                    )}

                    {role === 'specialist' && (
                        <>
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/schedule" element={<SchedulePage />} />
                            <Route path="/appointments" element={<AppointmentsPage />} />
                            <Route path="/subscription" element={<SubscriptionPage />} />
                            <Route path="/profile-link" element={<ProfileLinkPage />} />
                        </>
                    )}
                </Routes>
            </div>
        </Router>
    );
}

export default App;