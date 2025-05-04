import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Button, ActionIcon, Group, Box, useMantineTheme } from '@mantine/core';
import {
    IconMenu2, // Hamburger menu icon
    IconUserCircle, // Profile
    IconCalendarEvent, // Schedule
    IconArchive, // Archive
    IconCreditCard, // Subscription
    IconLink, // Profile Link
    IconLogin, // Book Appointment (could use something else too)
    IconSwitchHorizontal, // Change Role
    IconListCheck, // Client Appointments (alternative for Archive)
} from '@tabler/icons-react';

function Navbar({ role, telegramId }) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useMantineTheme(); // Access theme for colors etc.

    const handleNavigate = (path) => {
        navigate(path);
    };

    // Define menu items based on role
    const specialistMenuItems = [
        { path: `/profile/${telegramId}`, label: 'Профиль', icon: <IconUserCircle size={14} /> },
        { path: `/schedule/${telegramId}`, label: 'Расписание', icon: <IconCalendarEvent size={14} /> },
        { path: `/specialist-appointments/${telegramId}`, label: 'Записи клиентов', icon: <IconListCheck size={14} /> }, // Changed from Archive
        // { path: '/archive', label: 'Архив', icon: <IconArchive size={14} /> }, // If needed
        { path: '/subscription', label: 'Подписка', icon: <IconCreditCard size={14} /> },
        { path: '/profile-link', label: 'Ссылка на профиль', icon: <IconLink size={14} /> },
        { path: '/change-role', label: 'Сменить роль', icon: <IconSwitchHorizontal size={14} />, isCommon: true },
    ];

    const clientMenuItems = [
        { path: '/book-appointment', label: 'Найти специалиста', icon: <IconLogin size={14} /> }, // Changed label
        { path: `/client-appointments/${telegramId}`, label: 'Мои записи', icon: <IconListCheck size={14} /> }, // Changed from Archive
        // { path: '/archive', label: 'Архив', icon: <IconArchive size={14} /> }, // If needed
        { path: '/change-role', label: 'Сменить роль', icon: <IconSwitchHorizontal size={14} />, isCommon: true },
    ];

    const menuItems = role === 'specialist' ? specialistMenuItems : clientMenuItems;

    return (
        // Using Box for basic layout, position sticky could be applied here or in App.jsx via AppShell
        <Box
            p="xs" // Add some padding
            style={{
                // position: 'sticky', // Make it sticky
                // top: 0,
                // zIndex: 100,
                // backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
                // borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
                // Ensure it's above content, adjust based on your layout needs
                // These styles might be better handled by an AppShell in App.jsx
            }}
        >
            <Group justify="flex-end"> {/* Align menu button to the right */}
                <Menu shadow="md" width={200}>
                    <Menu.Target>
                        {/* Using ActionIcon for a compact icon button */}
                        <ActionIcon variant="outline" size="lg" aria-label="Меню">
                            <IconMenu2 size={20} stroke={1.5} />
                        </ActionIcon>
                        {/* Alternatively, use a Button:
                        <Button leftSection={<IconMenu2 size={14} />} variant="outline">
                            Меню
                        </Button>
                        */}
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Label>{role === 'specialist' ? 'Меню специалиста' : 'Меню клиента'}</Menu.Label>
                        {menuItems.map((item) => (
                            item.isDivider ? <Menu.Divider key={item.key} /> :
                                <Menu.Item
                                    key={item.path}
                                    leftSection={item.icon}
                                    onClick={() => handleNavigate(item.path)}
                                    // Highlight active item (optional)
                                    bg={location.pathname === item.path ? theme.colors.blue[0] : undefined}
                                >
                                    {item.label}
                                </Menu.Item>
                        ))}
                        {/* Example of adding a divider */}
                        {/* <Menu.Divider />
                         <Menu.Item color="red" leftSection={<IconLogout size={14} />}>
                             Выход (Example)
                         </Menu.Item> */}
                    </Menu.Dropdown>
                </Menu>
            </Group>
        </Box>
    );
}

export default Navbar;
