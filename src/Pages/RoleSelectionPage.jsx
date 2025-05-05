import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Stack, Title, Button, Group, Paper, Center, useMantineTheme,Text } from '@mantine/core';
import { IconUser, IconBriefcase } from '@tabler/icons-react'; // Icons for roles

// Assuming onRoleChange is passed down from App.jsx or similar
function RoleSelectionPage({ onRoleChange }) {
    const navigate = useNavigate();
    const theme = useMantineTheme();

    // Ensure Telegram Back Button is hidden on this initial setup page
    useEffect(() => {
        if (window.Telegram?.WebApp?.BackButton?.isVisible) {
            window.Telegram.WebApp.BackButton.hide();
        }
    }, []);


    // Original logic to change role and navigate remains the same
    const handleRoleSelect = async (newRole) => {
        try {
            // We assume onRoleChange might be async (e.g., API call)
            await onRoleChange(newRole);
            // Navigate to the default route (usually HomePage) after role is set
            // The AppRouter should then direct based on the new role
            navigate("/");
        } catch (error) {
            console.error("Error setting role:", error);
            // Optionally show an error message to the user
            window.Telegram?.WebApp?.showPopup?.({ message: "Не удалось сохранить выбранную роль." });
        }
    };

    return (
        // Center the content vertically and horizontally
        <Center style={{ minHeight: '80vh' }}> {/* Adjust height as needed */}
            <Container size="xs" w="100%"> {/* Constrain width */}
                <Paper shadow="md" p="xl" radius="md" withBorder>
                    <Stack align="center" gap="lg">
                        <Title order={2} ta="center">Кто вы?</Title>
                        <Text size="sm" c="dimmed" ta="center" mb="md">
                            Выберите свою роль, чтобы продолжить использование приложения.
                        </Text>

                        {/* Use Group for horizontal button layout on larger screens, Stack on smaller */}
                        {/* Or just Stack for vertical layout always */}
                        <Stack gap="md" w="100%">
                            <Button
                                size="lg" // Make buttons larger
                                fullWidth // Make buttons take full width of container
                                leftSection={<IconUser size={20} />}
                                variant="gradient" // Use gradient for visual appeal
                                gradient={{ from: 'blue', to: 'cyan' }}
                                onClick={() => handleRoleSelect('client')}
                            >
                                Я Клиент
                            </Button>
                            <Button
                                size="lg"
                                fullWidth
                                leftSection={<IconBriefcase size={20} />}
                                variant="gradient"
                                gradient={{ from: 'teal', to: 'lime' }}
                                onClick={() => handleRoleSelect('specialist')}
                            >
                                Я Специалист
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            </Container>
        </Center>
    );
}

export default RoleSelectionPage;