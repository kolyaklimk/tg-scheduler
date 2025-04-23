import React, { useContext, useEffect } from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import RoleSelectionPage from "./Pages/RoleSelectionPage";
import HomePage from "./Pages/HomePage";
import BookAppointmentPage from "./Pages/Client/BookAppointmentPage";
import ProfilePage from "./Pages/Specialist/ProfilePage";
import SchedulePage from "./Pages/Specialist/SchedulePage";
import AppointmentsPage from "./Pages/Specialist/AppointmentsPage";
import SubscriptionPage from "./Pages/Specialist/SubscriptionPage";
import ProfileLinkPage from "./Pages/Specialist/ProfileLinkPage";
import ArchivePage from "./Pages/ArchivePage";
import qs from 'query-string';


function AppRouter({ telegramId, role, profileLink, apiUrl, isFetchReady, setRole }) {
    const navigate = useNavigate();
    const location = useLocation();
    let specialistTelegramId = null;

    useEffect(() => {
        if (isFetchReady) {
            console.log("3");
            console.log(telegramId);
            console.log("3");
            const parsedQuery = qs.parse(location.search);
            const startAppValue = parsedQuery.tgWebAppStartParam;

            if (startAppValue && startAppValue.startsWith("specialist-")) {
                specialistTelegramId = startAppValue.substring("specialist-".length);
                updateUserAndNavigate(telegramId, specialistTelegramId);
            }
        }
    }, [isFetchReady]);

    const updateUserAndNavigate = async (userTelegramId, specialistTelegramId) => {
        try {
            const response = await fetch(`${apiUrl}/User/CheckSpecialist?telegramId=${specialistTelegramId}`);
            const data = await response.json();

            if (data) {
                const response = await fetch(`${apiUrl}/User/UpdateUserAndSetClientRole?telegramId=${userTelegramId}`, {
                    method: 'POST',
                });
                console.log("4");
                console.log(telegramId);
                console.log("4");
                const data = await response.json();
                setRole(data.role);
                console.log(data.role);
                localStorage.setItem('userRole', data.role);
                navigate(`/profile/${specialistTelegramId}`);
            }
            else {
                Telegram.WebApp.showPopup({ message: "Специалист не найден!" });
            }
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

    return (
        <Routes>
            {role === null || role === "" ? (
                <Route path="/" element={<RoleSelectionPage onRoleChange={handleRoleChange} />} />
            ) : (
                <Route path="/" element={<HomePage role={role} />} />
            )}

            <Route path="/change-role" element={<RoleSelectionPage onRoleChange={handleRoleChange} />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/book-appointment" element={<BookAppointmentPage />} />
            <Route path="/profile/:telegramId" element={<ProfilePage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/profile-link" element={<ProfileLinkPage profileLink={profileLink} />} />
        </Routes>
    );
}

export default AppRouter;