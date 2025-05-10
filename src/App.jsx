import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { MantineProvider, AppShell, LoadingOverlay, Box } from '@mantine/core'; // Added AppShell, LoadingOverlay
import Navbar from './Navbar';
// import './Navbar.css'; // Remove this import
import AppRouter from "./AppRouter";
import '@mantine/core/styles.css'; // Ensure Mantine base styles are imported
import '@mantine/dates/styles.css';

function App() {
    const [role, setRole] = useState(localStorage.getItem('userRole') || null);
    const [isTelegramReady, setIsTelegramReady] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(true); // Combined fetch ready state
    const [isFetchReady, setIsFetchReady] = useState(false);
    const [telegramId, setTelegramId] = useState(null);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    // Calculate profileLink only when telegramId is available
    const profileLink = telegramId ? `https://t.me/${import.meta.env.VITE_TG_BOT_NAME}?startapp=specialist-${telegramId}` : '';

    useEffect(() => {
        let isMounted = true; // Prevent state updates on unmounted component
        if (window.Telegram && window.Telegram.WebApp) {
            console.log("Telegram WebApp found, calling ready().");
            window.Telegram.WebApp.ready();
            // Optionally disable vertical swipes if needed, but test usability
            window.Telegram.WebApp.disableVerticalSwipes();

            // Expand the app to full height
            window.Telegram.WebApp.expand();

            // Set theme based on Telegram's scheme
            const colorScheme = window.Telegram.WebApp.colorScheme;
            // You might need to dynamically set the theme in MantineProvider based on this

            setIsTelegramReady(true);

            // Get user ID
            const id = window.Telegram.WebApp.initDataUnsafe?.user?.id;
            console.log("Telegram User ID:", id);
            if (id) {
                setTelegramId(String(id)); // Ensure it's a string if needed by backend
            } else {
                console.error("Could not get Telegram User ID.");
                // Handle error case - maybe show an error message
                setIsLoadingUser(false); // Stop loading if no ID
            }

        } else {
            console.warn("Telegram WebApp not found. Running in browser mode?");
            setIsLoadingUser(false); // Stop loading if not in Telegram env
            // Maybe set a default test ID for browser development
            // setTelegramId("BROWSER_TEST_ID");
        }
        return () => { isMounted = false };
    }, []);

    // Fetch user data once telegramId is set
    useEffect(() => {
        let isMounted = true;
        if (telegramId) {
            console.log(`Fetching user data for ID: ${telegramId}`);
            fetchUser(isMounted);
        } else {
            // If telegramId is null/undefined after initial check, stop loading
            if (isTelegramReady) {
                setIsLoadingUser(false);
            }
        }
        return () => { isMounted = false };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [telegramId, isTelegramReady]); // Rerun when telegramId is set

    const fetchUser = async (isMounted) => {
        setIsLoadingUser(true); // Start loading for fetch
        try {
            const response = await fetch(`${apiUrl}/User/GetUser?telegramId=${telegramId}&createNew=true`);
            if (!isMounted) return; // Check if component is still mounted

            if (response.ok) {
                const data = await response.json();
                console.log("User data received:", data);
                setRole(data.role);
                localStorage.setItem('userRole', data.role);
                setIsFetchReady(true);
            } else {
                console.error("Error fetching user:", response.status, await response.text());
                // Handle fetch error (e.g., show message)
                setRole(null); // Clear role on error
                localStorage.removeItem('userRole');
            }
        } catch (error) {
            if (!isMounted) return;
            console.error("Network error fetching user:", error);
            // Handle network error
            setRole(null);
            localStorage.removeItem('userRole');
        } finally {
            if (isMounted) {
                setIsLoadingUser(false); // Stop loading
            }
        }
    };

    // Determine theme based on Telegram WebApp (optional, but good practice)
    const telegramTheme = window.Telegram?.WebApp?.colorScheme || 'light';

    return (
        // Set theme mode based on Telegram context
        <MantineProvider
            theme={{ colorScheme: telegramTheme }}
            withGlobalStyles
            withNormalizeCSS
        >
            {/* Use LoadingOverlay while checking Telegram readiness and fetching user */}
            <LoadingOverlay
                visible={isLoadingUser}
                zIndex={1000} // Ensure it's above other content
                overlayProps={{ radius: "sm", blur: 2 }}
            />

            {/* Only render Router and content once loading is complete */}
            {!isLoadingUser && (
                <Router>
                    {/* AppShell provides basic layout structure */}
                    <AppShell
                        padding="md" // Padding for the main content area
                        header={{ height: 60 }} // Define header height
                    >
                        <AppShell.Header>
                            {/* Render Navbar only if role is determined */}
                            {role && <Navbar role={role} telegramId={telegramId} />}
                        </AppShell.Header>

                        <AppShell.Main>
                            {/* Pass necessary props down to the router */}
                            <AppRouter
                                telegramId={telegramId}
                                isTelegramReady={isTelegramReady} // Might not be needed by router anymore
                                role={role}
                                profileLink={profileLink}
                                apiUrl={apiUrl}
                                isFetchReady={isFetchReady} // Pass loading state if needed
                                setRole={setRole} // Pass setRole if needed for role change page
                            />
                        </AppShell.Main>

                        {/* You can add Navbar (for sidebar), Footer etc. here if needed */}

                    </AppShell>
                </Router>
            )}
        </MantineProvider>
    );
}

export default App;
