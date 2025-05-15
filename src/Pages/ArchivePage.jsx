import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Stack,
    Title,
    Text,
    Card,
    Button,
    Badge,
    Loader,
    Center,
    Group,
    Divider, // Optional visual separator
    useMantineTheme, // For colors etc.
    Alert, // For displaying errors
    Box
} from '@mantine/core';
import { IconInfoCircle, IconUser, IconUserCircle, IconCalendar, IconClock, IconMessageCircle, IconReceipt, IconHourglass, IconExternalLink, IconChevronLeft, IconDownload } from '@tabler/icons-react';
import { useWindowScroll } from '@mantine/hooks'; // Can be used for scroll detection
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru'); // Ensure locale is set

function ArchivePage({ telegramId, role, apiUrl }) {
    const [archive, setArchive] = useState([]);
    const [lastDocId, setLastDocId] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // Renamed for clarity
    const [hasMore, setHasMore] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [error, setError] = useState(null); // State for errors
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const loadingRef = useRef(false); // Ref to prevent multiple fetches

    // Memoize fetch function to prevent recreation on every render
    const fetchArchive = useCallback(async (isInitial = false) => {
        // Prevent fetching if already loading, no more items, or no telegramId
        if (loadingRef.current || !hasMore || !telegramId) {
            console.log("Fetch skipped:", { loading: loadingRef.current, hasMore, telegramId });
            return;
        }

        loadingRef.current = true;
        setIsLoading(true);
        setError(null); // Clear previous errors
        const pageSize = 5; // Increased page size for better UX

        try {
            const params = new URLSearchParams({
                telegramId,
                isSpecialist: role === "specialist",
                currentDate: dayjs().format('YYYY-MM-DD'), // Or maybe just pass isArchive=true? Depends on API
                pageSize,
            });
            // Only add lastDocId if it exists (for subsequent pages)
            if (lastDocId && !isInitial) {
                params.append('lastDocId', lastDocId);
            }

            console.log("Fetching archive with params:", params.toString());
            const response = await fetch(`${apiUrl}/Appointments/GetArchiveAppointments?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            console.log("Received data:", data);

            // Ensure data is an array
            if (!Array.isArray(data)) {
                console.error("Received non-array data:", data);
                throw new Error("Некорректный ответ от сервера.");
            }


            setArchive(prev => isInitial ? data : [...prev, ...data]);

            if (data.length > 0) {
                setLastDocId(data[data.length - 1].id); // Update lastDocId from the last item received
            }

            if (data.length < pageSize) {
                setHasMore(false); // No more items to fetch
                console.log("No more data to fetch.");
            }

        } catch (err) {
            console.error("Ошибка при загрузке архива:", err);
            setError(err.message || "Произошла ошибка при загрузке архива.");
            // Optionally stop trying if there's an error
            // setHasMore(false);
        } finally {
            setIsLoading(false);
            loadingRef.current = false;
            if (isInitial) {
                setInitialLoadComplete(true);
            }
        }
    }, [apiUrl, hasMore, lastDocId, role, telegramId]); // Dependencies for useCallback


    // Effect for Telegram Back Button
    useEffect(() => {
        const handleBack = () => navigate(-1); // Navigate back
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
    }, [navigate]);

    // Initial fetch effect
    useEffect(() => {
        if (telegramId) {
            // Reset state for initial load if telegramId changes (though unlikely in SPA context)
            setArchive([]);
            setLastDocId(null);
            setHasMore(true);
            setInitialLoadComplete(false);
            loadingRef.current = false; // Reset ref
            fetchArchive(true); // Pass true for initial load
        } else {
            // Handle case where telegramId is not available
            setInitialLoadComplete(true); // Consider load complete if no ID
            setError("Не удалось определить пользователя Telegram.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [telegramId]); // Dependency on telegramId only for initial load trigger


    // Optional: Basic scroll-to-load more functionality (can be replaced with useIntersection hook)
    const [scroll] = useWindowScroll();
    useEffect(() => {
        if (!isLoading && hasMore && initialLoadComplete) {
            const { y } = scroll;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            // Trigger fetch when user is near the bottom (e.g., 300px away)
            if (scrollHeight - (y + clientHeight) < 300) {
                fetchArchive();
            }
        }
    }, [scroll, isLoading, hasMore, fetchArchive, initialLoadComplete]);


    return (
        <Container size="sm" py="lg"> {/* Added padding */}
            <Stack gap="lg">
                {/* Back button handled by Telegram integration */}

                <Title order={2} ta="center" >
                    <IconCalendar size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Ваш архив записей
                </Title>

                {!initialLoadComplete && !error && (
                    <Center mt="xl"><Loader /></Center>
                )}

                {error && initialLoadComplete && (
                    <Alert icon={<IconInfoCircle size="1rem" />} title="Ошибка" color="red" radius="md">
                        {error}
                    </Alert>
                )}


                {initialLoadComplete && !error && archive.length === 0 && (
                    <Center mt="xl">
                        <Text c="dimmed">Архивных записей пока нет.</Text>
                    </Center>
                )}

                {archive.length > 0 && (
                    <Stack gap="md">
                        {archive.map((appointment) => (
                            <Card shadow="sm" p="lg" radius="md" withBorder key={appointment.id}>
                                <Stack gap="sm">
                                    <Group justify="space-between">
                                        <Text fw={500} size="lg">
                                            {dayjs(appointment.date).format('D MMMM YYYY')}
                                        </Text>
                                        <Badge variant="light" color="gray">
                                            <IconClock size={14} style={{ marginRight: 4 }} /> {appointment.startTime}
                                        </Badge>
                                    </Group>

                                    <Divider />

                                    <Stack gap="xs" mt="sm">
                                        <Group gap="xs">
                                            <IconReceipt size={16} color={theme.colors.gray[6]} />
                                            <Text size="sm"><strong>Услуги:</strong> {appointment.services || '-'}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <IconMessageCircle size={16} color={theme.colors.gray[6]} />
                                            <Text size="sm"><strong>Комментарий:</strong> {appointment.comment || '-'}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <IconHourglass size={16} color={theme.colors.gray[6]} />
                                            <Text size="sm"><strong>Длительность:</strong> {appointment.totalDuration != null ? `${appointment.totalDuration} мин.` : '-'}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <Text size="sm" fw={500}><strong>Сумма:</strong> {appointment.totalPrice != null ? `${appointment.totalPrice} руб.` : '-'}</Text>
                                        </Group>

                                        {/* Specialist specific info */}
                                        {role === "specialist" && (
                                            <>
                                                {/* Maybe description is part of the slot, not the appointment? Check data structure */}
                                                {/* <Text size="sm"><strong>Описание слота:</strong> {appointment.description || '-'}</Text> */}
                                                <Button
                                                    mt="sm"
                                                    variant="light"
                                                    size="sm"
                                                    leftSection={<IconExternalLink size={16} />}
                                                    onClick={(e) => {
                                                        e.preventDefault(); // Prevent potential card click issues
                                                        if (appointment.usernameClient) {
                                                            window.Telegram?.WebApp?.openTelegramLink(`https://t.me/${appointment.usernameClient}`);
                                                        } else {
                                                            // Maybe show a popup if username is missing?
                                                            window.Telegram?.WebApp?.showPopup?.({ message: "Имя пользователя клиента не найдено." });
                                                        }
                                                    }}
                                                    disabled={!appointment.usernameClient} // Disable if no username
                                                >
                                                    Профиль клиента @{appointment.usernameClient || '???'}
                                                </Button>
                                            </>
                                        )}

                                        {/* Client specific info */}
                                        {role === "client" && (
                                            <Button
                                                mt="sm"
                                                variant="light"
                                                size="sm"
                                                leftSection={<IconUserCircle size={16} />}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    navigate(`/profile/${appointment.specialistId}`)
                                                }}
                                            >
                                                Профиль специалиста
                                            </Button>
                                        )}
                                    </Stack>
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* Load More Button or End Message */}
                <Center mt="lg">
                    {isLoading && initialLoadComplete && <Loader size="sm" />} {/* Show loader only during subsequent loads */}
                    {!isLoading && hasMore && initialLoadComplete && archive.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => fetchArchive()}
                            disabled={isLoading}
                            leftSection={<IconDownload size={16} />}
                        >
                            Загрузить ещё
                        </Button>
                    )}
                    {!hasMore && initialLoadComplete && archive.length > 0 && (
                        <Text c="dimmed" size="sm">Больше записей нет</Text>
                    )}
                </Center>

            </Stack>
        </Container>
    );
}

export default ArchivePage;
