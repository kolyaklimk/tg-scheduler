import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Stack,
    Title,
    Text,
    Card,
    Button,
    Loader,
    Center,
    Group,
    Badge,
    Divider,
    useMantineTheme,
    Alert,
    Box // Keep Box for the intersection target
} from '@mantine/core';
import { IconInfoCircle, IconUserCircle, IconCalendar, IconClock, IconMessageCircle, IconReceipt, IconHourglass, IconExternalLink, IconDownload } from '@tabler/icons-react';
// Import useIntersection
import { useIntersection } from '@mantine/hooks';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');

function ArchivePage({ telegramId, role, apiUrl }) {
    const [archive, setArchive] = useState([]);
    const [lastDocId, setLastDocId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const loadingRef = useRef(false); // Prevent multiple simultaneous fetches

    // --- fetchArchive (Memoized) ---
    const fetchArchive = useCallback(async (isInitial = false) => {
        // Prevent fetching if already loading, no more items, or no telegramId
        if (loadingRef.current || !hasMore || !telegramId) {
            console.log("Fetch skipped:", { loading: loadingRef.current, hasMore, telegramId });
            return;
        }

        loadingRef.current = true;
        setIsLoading(true);
        if (isInitial) setError(null); // Clear previous errors only on initial load
        const pageSize = 5; // Keep page size

        try {
            const params = new URLSearchParams({
                telegramId,
                isSpecialist: role === "specialist",
                currentDate: dayjs().format('YYYY-MM-DD'), // Removed, assuming API handles archive logic
                pageSize,
            });
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

            if (!Array.isArray(data)) {
                console.error("Received non-array data:", data);
                throw new Error("Некорректный ответ от сервера.");
            }

            setArchive(prev => isInitial ? data : [...prev, ...data]);

            if (data.length > 0) {
                setLastDocId(data[data.length - 1].id);
            }

            if (data.length < pageSize) {
                setHasMore(false);
                console.log("No more data to fetch.");
            }

        } catch (err) {
            console.error("Ошибка при загрузке архива:", err);
            setError(err.message || "Произошла ошибка при загрузке архива.");
            // Consider stopping further fetches on error?
            // setHasMore(false);
        } finally {
            setIsLoading(false);
            loadingRef.current = false;
            if (isInitial) {
                setInitialLoadComplete(true);
            }
        }
    }, [apiUrl, hasMore, lastDocId, role, telegramId]); // Dependencies for useCallback

    // --- Telegram Back Button Effect ---
    useEffect(() => {
        const handleBack = () => navigate(-1);
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

    // --- Initial Fetch Effect ---
    useEffect(() => {
        if (telegramId) {
            setArchive([]); setLastDocId(null); setHasMore(true);
            setInitialLoadComplete(false); loadingRef.current = false; setError(null); // Reset error on new ID load
            fetchArchive(true);
        } else {
            setInitialLoadComplete(true);
            setError("Не удалось определить пользователя Telegram.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [telegramId]); // Only depends on telegramId for initial load trigger


    // --- Intersection Observer Logic ---
    const lastCardRef = useRef(null); // Ref for the intersection target element
    const { ref: intersectionRef, entry } = useIntersection({
        root: null, // Use viewport as root
        threshold: 0.5, // Trigger when 50% of the target is visible
    });

    // Assign the ref to the correct element using a callback ref pattern
    // This is needed because the element might not exist on initial render
    // and we need to ensure the ref passed to useIntersection is updated
    const setRefs = useCallback(
        (node) => {
            lastCardRef.current = node; // Keep track of the DOM node
            intersectionRef(node);    // Pass the node to Mantine's intersection hook ref setter
        },
        [intersectionRef] // Dependency ensures this callback updates if intersectionRef changes
    );


    // Effect to fetch more data when the intersection target becomes visible
    useEffect(() => {
        // Check if the target element is intersecting, we have more data, aren't loading, and initial load is done
        if (entry?.isIntersecting && hasMore && !isLoading && initialLoadComplete) {
            console.log("Intersection observer triggered fetch.");
            fetchArchive(); // Fetch next page
        }
    }, [entry?.isIntersecting, hasMore, isLoading, initialLoadComplete, fetchArchive]);
    // --- End of Intersection Observer Logic ---


    return (
        <Container size="sm" py="lg">
            <Stack gap="lg">
                <Title order={2} ta="center">Архив записей</Title>

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
                        {archive.map((appointment, index) => (
                            <Card
                                shadow="sm"
                                p="lg"
                                radius="md"
                                withBorder
                                key={appointment.id || index}
                                // Attach the callback ref to the LAST element in the list
                                ref={index === archive.length - 1 ? setRefs : null}
                            >
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
                                        <Group gap="xs"><IconReceipt size={16} color={theme.colors.gray[6]} /> <Text size="sm"><strong>Услуги:</strong> {appointment.services || '-'}</Text></Group>
                                        <Group gap="xs"><IconMessageCircle size={16} color={theme.colors.gray[6]} /> <Text size="sm"><strong>Комментарий:</strong> {appointment.comment || '-'}</Text></Group>
                                        <Group gap="xs"><IconHourglass size={16} color={theme.colors.gray[6]} /><Text size="sm"><strong>Длительность:</strong> {appointment.totalDuration != null ? `${appointment.totalDuration} мин.` : '-'}</Text></Group>
                                        <Group gap="xs"><Text size="sm" fw={500}><strong>Сумма:</strong> {appointment.totalPrice != null ? `${appointment.totalPrice} руб.` : '-'}</Text></Group>
                                        {role === "specialist" && (
                                            <Button mt="sm" variant="light" size="sm" leftSection={<IconExternalLink size={16} />} onClick={(e) => { e.preventDefault(); if (appointment.usernameClient) { window.Telegram?.WebApp?.openTelegramLink(`https://t.me/${appointment.usernameClient}`); } else { window.Telegram?.WebApp?.showPopup?.({ message: "Имя пользователя клиента не найдено." }); } }} disabled={!appointment.usernameClient}> Профиль клиента @{appointment.usernameClient || '???'} </Button>
                                        )}
                                        {role === "client" && (
                                            <Button mt="sm" variant="light" size="sm" leftSection={<IconUserCircle size={16} />} onClick={(e) => { e.preventDefault(); navigate(`/profile/${appointment.specialistId}`) }} > Профиль специалиста </Button>
                                        )}
                                    </Stack>
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* Loading indicator at the bottom */}
                <Center mt="lg" style={{ minHeight: 40 }}>
                    {isLoading && initialLoadComplete && <Loader size="sm" />} {/* Show only during subsequent loads */}
                    {!isLoading && !hasMore && initialLoadComplete && archive.length > 0 && (
                        <Text c="dimmed" size="sm">Больше записей нет</Text>
                    )}
                </Center>

            </Stack>
        </Container>
    );
}

export default ArchivePage;
