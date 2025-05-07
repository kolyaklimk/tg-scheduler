import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Stack,
    Title,
    TextInput,
    Button,
    Loader,
    Alert,
    Card,
    Group,
    Avatar,
    Text,
    Center,
    useMantineTheme,
    ActionIcon, // For a clear button in search
    UnstyledButton // To make the card clickable
} from '@mantine/core';
import { IconSearch, IconAlertCircle, IconUserSearch, IconChevronLeft, IconX, IconMapPin } from '@tabler/icons-react';

function BookAppointmentPage({ apiUrl, telegramId }) { // Added telegramId for BackButton context
    const [searchText, setSearchText] = useState('');
    const [specialists, setSpecialists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false); // To know if a search has been performed
    const navigate = useNavigate();
    const theme = useMantineTheme();

    // Effect for Telegram Back Button
    useEffect(() => {
        const handleBack = () => navigate(telegramId ? `/client-appointments/${telegramId}` : -1); // Sensible default back
        if (window.Telegram?.WebApp?.BackButton) {
            window.Telegram.WebApp.BackButton.onClick(handleBack);
            window.Telegram.WebApp.BackButton.show();
        }
        return () => {
            if (window.Telegram?.WebApp?.BackButton?.isVisible) {
                window.Telegram.WebApp.BackButton.offClick(handleBack);
                window.Telegram.WebApp.BackButton.hide();
            }
        };
    }, [navigate, telegramId]);


    const handleSearch = async (e) => {
        if (e) e.preventDefault(); // Prevent form submission if it's in a form
        const trimmedSearchText = searchText.trim();

        // Optionally, you might not want to search for very short strings
        // if (trimmedSearchText.length < 2) {
        //     setError("Пожалуйста, введите хотя бы 2 символа для поиска.");
        //     setSpecialists([]);
        //     setHasSearched(true);
        //     return;
        // }

        setIsLoading(true);
        setError(null);
        setSpecialists([]); // Clear previous results
        setHasSearched(true);

        try {
            // Use encodeURIComponent for search query robustness
            const response = await fetch(`${apiUrl}/User/SearchSpecialists?searchText=${encodeURIComponent(trimmedSearchText)}`);
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Ошибка ${response.status}: ${errorData || 'Не удалось получить специалистов'}`);
            }
            const data = await response.json();
            // Ensure data is an array
            if (!Array.isArray(data)) {
                console.error("SearchSpecialists returned non-array data:", data);
                throw new Error("Получены некорректные данные от сервера.");
            }
            setSpecialists(data);
        } catch (err) {
            console.error("Search error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSpecialistClick = (specialistTelegramId) => {
        navigate(`/profile/${specialistTelegramId}`);
    };

    const clearSearch = () => {
        setSearchText('');
        setSpecialists([]);
        setError(null);
        setHasSearched(false);
    };

    return (
        <Container size="md" py="lg">
            <Stack gap="lg">
                {/* Back button handled by Telegram integration */}
                <Title order={2} ta="center">
                    <Group justify="center" gap="xs">
                        <IconUserSearch size={28} />
                        <span>Поиск специалиста</span>
                    </Group>
                </Title>

                <form onSubmit={handleSearch}>
                    <Group align="flex-end" grow>
                        <TextInput
                            placeholder="Имя, специализация или город..."
                            value={searchText}
                            onChange={(event) => setSearchText(event.currentTarget.value)}
                            icon={<IconSearch size={16} />}
                            rightSection={
                                searchText ? (
                                    <ActionIcon onClick={clearSearch} title="Очистить поиск" variant="transparent">
                                        <IconX size={16} style={{ display: 'block', opacity: 0.5 }} />
                                    </ActionIcon>
                                ) : null
                            }
                            flex={1}
                        />
                        <Button type="submit" disabled={isLoading || searchText.trim() === ''}>
                            {isLoading ? <Loader size="xs" color="white" /> : 'Найти'}
                        </Button>
                    </Group>
                </form>

                {isLoading && (
                    <Center mt="xl">
                        <Loader />
                    </Center>
                )}

                {error && (
                    <Alert icon={<IconAlertCircle size="1rem" />} title="Ошибка поиска" color="red" radius="md" mt="md">
                        {error}
                    </Alert>
                )}

                {!isLoading && hasSearched && specialists.length === 0 && !error && (
                    <Center mt="xl">
                        <Text c="dimmed">По вашему запросу специалисты не найдены. Попробуйте изменить критерии поиска.</Text>
                    </Center>
                )}

                {!isLoading && specialists.length > 0 && (
                    <Stack gap="md" mt="lg">
                        <Text size="sm" c="dimmed">Найдено специалистов: {specialists.length}</Text>
                        {specialists.map(specialist => (
                            <UnstyledButton
                                key={specialist.telegramId}
                                onClick={() => handleSpecialistClick(specialist.telegramId)}
                                style={{ width: '100%' }} // Ensure button takes full width for card
                            >
                                <Card shadow="sm" padding="lg" radius="md" withBorder>
                                    <Group wrap="nowrap" align="flex-start">
                                        <Avatar
                                            src={specialist.profileImageUrl || null} // Pass null if no image for default Avatar
                                            alt={specialist.name || 'Specialist'}
                                            size="xl" // lg or xl
                                            radius="xl" // circular
                                            color={theme.colors.blue[6]} // Fallback color for initials
                                        >
                                            {/* Fallback initials if no image */}
                                            {specialist.name ? specialist.name.substring(0, 2).toUpperCase() : 'SP'}
                                        </Avatar>
                                        <Stack gap="xs" style={{ flex: 1 }}>
                                            <Title order={4}>{specialist.name || 'Имя не указано'}</Title>
                                            <Text size="sm" lineClamp={2}>
                                                {specialist.description || 'Описание отсутствует.'}
                                            </Text>
                                            {specialist.location && (
                                                <Group gap={4} mt={4}>
                                                    <IconMapPin size={14} color={theme.colors.gray[6]} />
                                                    <Text size="xs" c="dimmed">
                                                        {specialist.location}
                                                    </Text>
                                                </Group>
                                            )}
                                        </Stack>
                                    </Group>
                                </Card>
                            </UnstyledButton>
                        ))}
                    </Stack>
                )}

                {!isLoading && !hasSearched && !error && (
                    <Center mt="xl" p="md">
                        <Text c="dimmed" ta="center">
                            Введите имя специалиста, его специализацию или город, чтобы найти подходящего мастера и записаться на услугу.
                        </Text>
                    </Center>
                )}
            </Stack>
        </Container>
    );
}

export default BookAppointmentPage;
