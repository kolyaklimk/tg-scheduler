import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
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
import { UserProvider } from './context/UserContext';

function App() {
    const [role, setRole] = useState(localStorage.getItem('userRole') || null);
    const [isTelegramReady, setIsTelegramReady] = useState(false);
    const [telegramId, setTelegramId] = useState(null);
    const [specialistId, setSpecialistId] = useState(null);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();
    const location = useLocation();
    const profileLink = `https://t.me/${import.meta.env.TG_BOT_NAME}?startapp=specialist-${telegramId}`;

    useEffect(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.disableVerticalSwipes();
            setIsTelegramReady(true);
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

    useEffect(() => {
        const parsedQuery = qs.parse(location.search);
        const startAppValue = parsedQuery.startapp;

        if (startAppValue && startAppValue.startsWith("specialist-")) {
            const specialistTelegramId = startAppValue.substring("specialist-".length);
            setSpecialistId(specialistTelegramId);

            updateUserAndNavigate(telegramId, specialistTelegramId);
        }
    }, [location, isTelegramReady, telegramId, navigate]);

    const updateUserAndNavigate = async (userTelegramId, specialistTelegramId) => {
        try {
            const response = await fetch(`${apiUrl}/User/UpdateUserAndSetClientRole?telegramId=${userTelegramId}`, {
                method: 'POST',
            });
            const data = await response.json();
            setRole(data.role);
            localStorage.setItem('userRole', data.role);

            navigate(`/profile/${specialistTelegramId}`);

        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

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

    if (!isTelegramReady) {
        return <div>Загрузка...</div>;
    }

    return (
        <Router>
            <UserProvider initialRole={role}>
                <div>
                    {role && <Navbar role={role} />}
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
                                <Route path="/profile-link" element={<ProfileLinkPage profileLink={profileLink} />} />
                            </>
                        )}
                    </Routes>
                </div>
            </UserProvider>
        </Router>
    );
}

export default App;