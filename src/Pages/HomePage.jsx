import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Stack,
    Title,
    Text,
    Card,
    Button,
    Group,
    Loader,
    Center,
    Alert,
    Badge,
    Divider, // For visual separation inside cards
    useMantineTheme,
    ActionIcon // For smaller action buttons if needed
} from '@mantine/core';
import {
    IconCalendarDue, // Upcoming/Active Appointments
    IconClockHour4, // Unconfirmed Appointments
    IconInfoCircle, // Error icon
    IconUserCircle, // Profile icon
    IconExternalLink, // Link icon
    IconCheck, // Confirm icon
    IconX, // Cancel icon
    IconCalendar,
    IconClock,
    IconMessageCircle,
    IconReceipt,
    IconHourglass,
    IconUser
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru'); // Ensure locale is set

function HomePage({ role, telegramId, apiUrl }) {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const theme = useMantineTheme();

    // Memoized fetch function
    const fetchAppointments = useCallback(async () => {
        if (!telegramId || !role) {
            setIsLoading(false);
            return; // Don't fetch if essential info is missing
        }

        setIsLoading(true);
        setError(null);
        setAppointments([]); // Clear previous data before fetching

        const currentDate = dayjs().format('YYYY-MM-DD');
        let url = '';

        try {
            if (role === "client") {
                // Fetch active (upcoming and confirmed) appointments for the client
                url = `${apiUrl}/Appointments/GetActiveAppointments?telegramId=${telegramId}&date=${currentDate}`;
            } else if (role === "specialist") {
                // Fetch unconfirmed appointment requests for the specialist
                url = `${apiUrl}/Appointments/GetUnconfirmedAppointments?telegramId=${telegramId}&date=${currentDate}`; // Assuming date filter is needed
            } else {
                throw new Error("Неизвестная роль пользователя.");
            }

            console.log(`Fetching appointments from: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            console.log("Received appointments:", data);
            // Ensure data is an array
            if (!Array.isArray(data)) {
                console.error("Received non-array data:", data);
                throw new Error("Некорректный ответ от сервера.");
            }

            setAppointments(data);

        } catch (err) {
            console.error(`Ошибка при получении записей (${role}):`, err);
            setError(err.message || "Произошла ошибка при загрузке данных.");
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, role, telegramId]); // Dependencies for useCallback

    // Fetch data on mount and when role/telegramId changes
    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]); // fetchAppointments is memoized

    // --- Action Handlers ---

    const handleCancelAppointment = async (timeSlotId, appointmentId) => {
        // Use appointmentId if available and preferred by API, otherwise fallback to timeSlotId
        const targetId = appointmentId || timeSlotId;
        if (!targetId) {
            console.error("Missing ID for cancellation");
            window.Telegram?.WebApp?.showPopup?.({ message: "Ошибка: Не найден ID для отмены." });
            return;
        }

        // Use Telegram's confirmation dialog if available, otherwise fallback to window.confirm
        const confirmAction = (text) => {
            return new Promise((resolve) => {
                if (window.Telegram?.WebApp?.showConfirm) {
                    window.Telegram.WebApp.showConfirm(text, (ok) => resolve(ok));
                } else {
                    resolve(window.confirm(text));
                }
            });
        };

        const confirmed = await confirmAction("Вы уверены, что хотите отменить эту запись?");
        if (!confirmed) return;

        try {
            // Choose the correct endpoint based on role (or use a unified endpoint if available)
            // Assuming CancelAppointment works for both client cancelling and specialist rejecting
            const response = await fetch(`${apiUrl}/Appointments/CancelAppointment?timeSlotId=${targetId}`, { // Using timeSlotId as per original code
                method: 'POST'
            });

            if (response.ok) {
                // Remove the cancelled/rejected appointment from the list
                setAppointments(prev => prev.filter(appt => (appt.id || appt.timeSlotId) !== targetId)); // Check both potential ID fields
                window.Telegram?.WebApp?.showPopup?.({ message: "Запись успешно отменена." });
            } else {
                const errorText = await response.text();
                console.error("Cancel/Reject failed:", response.status, errorText);
                window.Telegram?.WebApp?.showPopup?.({ message: `Ошибка при отмене записи: ${errorText || response.statusText}` });
            }
        } catch (err) {
            console.error("Сетевая ошибка при отмене записи:", err);
            window.Telegram?.WebApp?.showPopup?.({ message: "Сетевая ошибка при отмене записи!" });
        }
    };

    const handleConfirmAppointment = async (timeSlotId, appointmentId) => {
        // Use appointmentId if available and preferred by API, otherwise fallback to timeSlotId
        const targetId = appointmentId || timeSlotId;
        if (!targetId) {
            console.error("Missing ID for confirmation");
            window.Telegram?.WebApp?.showPopup?.({ message: "Ошибка: Не найден ID для подтверждения." });
            return;
        }

        const confirmAction = (text) => {
            return new Promise((resolve) => {
                if (window.Telegram?.WebApp?.showConfirm) {
                    window.Telegram.WebApp.showConfirm(text, (ok) => resolve(ok));
                } else {
                    resolve(window.confirm(text));
                }
            });
        };

        const confirmed = await confirmAction("Подтвердить эту запись?");
        if (!confirmed) return;

        try {
            const response = await fetch(`${apiUrl}/Appointments/ConfirmAppointment?timeSlotId=${targetId}`, { // Using timeSlotId as per original code
                method: 'POST'
            });

            if (response.ok) {
                // Remove the confirmed appointment from the unconfirmed list
                setAppointments(prev => prev.filter(appt => (appt.id || appt.timeSlotId) !== targetId)); // Check both potential ID fields
                window.Telegram?.WebApp?.showPopup?.({ message: "Запись успешно подтверждена." });
            } else {
                const errorText = await response.text();
                console.error("Confirmation failed:", response.status, errorText);
                window.Telegram?.WebApp?.showPopup?.({ message: `Ошибка при подтверждении записи: ${errorText || response.statusText}` });
            }
        } catch (err) {
            console.error("Сетевая ошибка при подтверждении записи:", err);
            window.Telegram?.WebApp?.showPopup?.({ message: "Сетевая ошибка при подтверждении записи!" });
        }
    };

    // --- Render Logic ---

    const renderClientView = () => (
        <Stack gap="lg">
            <Title order={2} ta="center" >
                <IconCalendarDue size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Ваши активные записи
            </Title>
            {appointments.length === 0 ? (
                <Center mt="xl"><Text c="dimmed">У вас нет предстоящих записей.</Text></Center>
            ) : (
                <Stack gap="md">
                    {appointments.map((appointment) => (
                        <Card shadow="sm" p="lg" radius="md" withBorder key={appointment.id || appointment.timeSlotId}> {/* Use unique ID */}
                            <Stack gap="sm">
                                <Group justify="space-between">
                                    <Text fw={500} size="lg">
                                        {dayjs(appointment.date).format('D MMMM YYYY')}
                                    </Text>
                                    {/* Optionally show status if API provides it (e.g., Confirmed) */}
                                    <Badge variant="light" color={appointment.isConfirmed ? 'green' : 'yellow'}>
                                        <IconClock size={14} style={{ marginRight: 4 }} /> {appointment.startTime} {appointment.isConfirmed ? '(Подтверждена)' : '(Ожидает)'}
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

                                    <Button
                                        mt="md"
                                        variant="light"
                                        size="sm"
                                        leftSection={<IconUserCircle size={16} />}
                                        onClick={() => navigate(`/profile/${appointment.specialistId}`)}
                                    >
                                        Профиль специалиста
                                    </Button>
                                    {/* Add Cancel button for Client if needed and allowed by API */}
                                    {/* <Button
                                        mt="xs"
                                        variant="outline"
                                        color="red"
                                        size="sm"
                                        leftSection={<IconX size={16} />}
                                        onClick={() => handleCancelAppointment(appointment.timeSlotId, appointment.id)}
                                    >
                                        Отменить запись
                                    </Button> */}
                                </Stack>
                            </Stack>
                        </Card>
                    ))}
                </Stack>
            )}
        </Stack>
    );

    const renderSpecialistView = () => (
        <Stack gap="lg">
            <Title order={2} ta="center">
                <IconClockHour4 size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Заявки на подтверждение
            </Title>
            {appointments.length === 0 ? (
                <Center mt="xl"><Text c="dimmed">Нет новых заявок на запись.</Text></Center>
            ) : (
                <Stack gap="md">
                    {appointments.map((slot) => ( // Assuming data is slot info extended with appointment details
                        <Card shadow="sm" p="lg" radius="md" withBorder key={slot.id || slot.timeSlotId}>
                            <Stack gap="sm">
                                <Group justify="space-between">
                                    <Text fw={500} size="lg">
                                        {dayjs(slot.date).format('D MMMM YYYY')}
                                    </Text>
                                    <Badge variant='light' color="orange">
                                        <IconClock size={14} style={{ marginRight: 4 }} /> {slot.startTime} (Ожидает)
                                    </Badge>
                                </Group>
                                <Divider />
                                <Stack gap="xs" mt="sm">
                                    {/* Display client info more prominently */}
                                    <Group gap="xs">
                                        <IconUser size={16} color={theme.colors.gray[6]} />
                                        <Text size="sm">
                                            <strong>Клиент:</strong> {slot.clientUsername ? `@${slot.clientUsername}` : `ID: ${slot.clientId || '???'}`}
                                        </Text>
                                        {slot.clientUsername && (
                                            <ActionIcon
                                                variant="subtle"
                                                color="blue"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.Telegram?.WebApp?.openTelegramLink(`https://t.me/${slot.clientUsername}`);
                                                }}
                                                title={`Открыть профиль @${slot.clientUsername}`}
                                            >
                                                <IconExternalLink size={16} />
                                            </ActionIcon>
                                        )}
                                    </Group>
                                    <Group gap="xs">
                                        <IconReceipt size={16} color={theme.colors.gray[6]} />
                                        <Text size="sm"><strong>Услуги:</strong> {slot.services || '-'}</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <IconMessageCircle size={16} color={theme.colors.gray[6]} />
                                        <Text size="sm"><strong>Комментарий:</strong> {slot.comment || '-'}</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <IconHourglass size={16} color={theme.colors.gray[6]} />
                                        <Text size="sm"><strong>Длительность:</strong> {slot.totalDuration != null ? `${slot.totalDuration} мин.` : '-'}</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <Text size="sm" fw={500}><strong>Сумма:</strong> {slot.totalPrice != null ? `${slot.totalPrice} руб.` : '-'}</Text>
                                    </Group>
                                    {slot.description && (
                                        <Text size="xs" c="dimmed">Описание слота: {slot.description}</Text>
                                    )}
                                </Stack>

                                <Group justify="center" mt="xs"> 
                                    <Button
                                        variant="outline"
                                        color="red"
                                        size="xs"
                                        leftSection={<IconX size={14} />} // Icon size might need adjustment too
                                        onClick={() => handleCancelAppointment(slot.timeSlotId, slot.id)}
                                    >
                                        Отклонить
                                    </Button>
                                    <Button
                                        variant="filled"
                                        color="green"
                                        size="xs"
                                        leftSection={<IconCheck size={14} />} // Icon size might need adjustment too
                                        onClick={() => handleConfirmAppointment(slot.timeSlotId, slot.id)}
                                    >
                                        Подтвердить
                                    </Button>
                                </Group>
                            </Stack>
                        </Card>
                    ))}
                </Stack>
            )}
        </Stack>
    );

    // --- Main Render ---
    return (
        <Container size="sm" py="lg">
            {isLoading ? (
                <Center mt="xl"><Loader /></Center>
            ) : error ? (
                <Alert icon={<IconInfoCircle size="1rem" />} title="Ошибка" color="red" radius="md" mt="lg">
                    {error}
                </Alert>
            ) : (
                // Render view based on role AFTER loading is false and no error
                role === 'client' ? renderClientView() : renderSpecialistView()
            )}
        </Container>
    );
}

export default HomePage;
