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
import { UserContext } from "./Context/UserContext";
import qs from 'query-string';


function AppRouter({ telegramId, isTelegramReady, handleRoleChange, role, profileLink }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { setRole } = useContext(UserContext);
    let specialistTelegramId = null;

    useEffect(() => {
        const parsedQuery = qs.parse(location.search);
        const startAppValue = parsedQuery.startapp;

        if (startAppValue && startAppValue.startsWith("specialist-")) {
            specialistTelegramId = startAppValue.substring("specialist-".length);
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
            <Route path="/profile" element={<ProfilePage specialistTelegramId={specialistTelegramId} telegramId={telegramId} />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/profile-link" element={<ProfileLinkPage profileLink={profileLink} />} />
        </Routes>
    );
}

export default AppRouter;