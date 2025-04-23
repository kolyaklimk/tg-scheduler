import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import Navbar from './Navbar';
import './Navbar.css';
import AppRouter from "./AppRouter";

function App() {
    const [role, setRole] = useState(localStorage.getItem('userRole') || null);
    const [isTelegramReady, setIsTelegramReady] = useState(false);
    const [isFetchReady, setIsFetchReady] = useState(false);
    const [telegramId, setTelegramId] = useState(null);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const profileLink = `https://t.me/${import.meta.env.VITE_TG_BOT_NAME}?startapp=specialist-${telegramId}`;

    useEffect(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.disableVerticalSwipes();
            setIsTelegramReady(true);
            console.log("0");
        }
    }, []);

    useEffect(() => {
        if (isTelegramReady) {
            const id = window.Telegram.WebApp.initDataUnsafe?.user?.id;
            setTelegramId(id);
            console.log("1");
        }
    }, [isTelegramReady]);


    useEffect(() => {
        if (isTelegramReady && telegramId) {
            fetchUser();
            console.log("2");
        }
    }, [isTelegramReady, telegramId]);

    const fetchUser = async () => {
        try {
            const response = await fetch(`${apiUrl}/User/GetUser?telegramId=${telegramId}&createNew=true`);
            const data = await response.json();
            setRole(data.role);
            localStorage.setItem('userRole', data.role);
            setIsFetchReady(true);
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    return (
        <MantineProvider withGlobalStyles withNormalizeCSS>
            <Router>
                <div>
                    {role && <Navbar role={role} telegramId={telegramId} />}
                    <AppRouter telegramId={telegramId}
                        isTelegramReady={isTelegramReady}
                        role={role}
                        profileLink={profileLink}
                        apiUrl={apiUrl}
                        isFetchReady={isFetchReady}
                        setRole={setRole} />
                </div>
            </Router>
        </MantineProvider>
    );
}

export default App;