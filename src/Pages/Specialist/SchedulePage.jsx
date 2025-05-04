import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mantine/dates';
import {
    Container,
    Stack,
    Group,
    Button,
    Title,
    Text,
    Center,
    Paper,
    TimeInput,
    Textarea,
    Divider,
    Card,
    Badge,
    Checkbox,
    SimpleGrid,
    Loader, // Added for potential loading states
    useMantineTheme, // Added for theme access
    Box // Added for flexible layout
} from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');

// Import icons for buttons (optional but enhances UI)
import { IconCalendar, IconPhoto, IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconClock, IconSend, IconChevronLeft } from '@tabler/icons-react';

function SchedulePage() {
    const { telegramId } = useParams();
    const role = localStorage.getItem('userRole');
    const navigate = useNavigate();
    const [parsedServices, setParsedServices] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);
    const [isCreatingImage, setIsCreatingImage] = useState(false);
    const [timeSlots, setTimeSlots] = useState([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false); // Added loading state
    const [startTime, setStartTime] = useState('');
    const [description, setDescription] = useState('');
    const [showTimeSlotForm, setShowTimeSlotForm] = useState(false); // Keep original logic flag
    const [editingSlot, setEditingSlot] = useState(null);
    const [userTelegramId, setUserTelegramId] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const [comment, setComment] = useState('');
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const theme = useMantineTheme(); // Access theme for colors, spacing

    useEffect(() => {
        const id = window.Telegram.WebApp.initDataUnsafe?.user?.id;
        setUserTelegramId(String(id));
        try {
            const services = JSON.parse(localStorage.getItem('specialistServices') || '{}');
            setParsedServices(services);
        } catch (e) {
            console.error("Error parsing specialist services from localStorage", e);
            setParsedServices({}); // Set to empty object on error
        }
        // Ensure Telegram WebApp is ready before accessing properties
        if (window.Telegram?.WebApp?.ready) {
            window.Telegram.WebApp.BackButton.onClick(() => navigate(-1));
            window.Telegram.WebApp.BackButton.show();
        }
        return () => {
            if (window.Telegram?.WebApp?.BackButton?.isVisible) {
                window.Telegram.WebApp.BackButton.offClick(() => navigate(-1));
                window.Telegram.WebApp.BackButton.hide();
            }
        };
    }, [navigate]);

    useEffect(() => {
        const fetchTimeSlots = async () => {
            if (!selectedDate || isCreatingImage) return;
            setIsLoadingSlots(true); // Start loading
            setEditingSlot(null);   // Reset editing state when date changes
            setStartTime('');       // Reset form
            setDescription('');     // Reset form
            setSelectedSlot(null);  // Reset client selection
            setSelectedServices([]); // Reset client selection
            setComment('');         // Reset client selection
            try {
                const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
                const response = await fetch(`${apiUrl}/Schedule/GetSchedule?telegramId=${telegramId}&date=${formattedDate}`);
                if (response.ok) {
                    const data = await response.json();
                    // Ensure data is an array before sorting
                    const slotsArray = Array.isArray(data) ? data : [];
                    setTimeSlots(sortTimeSlots(slotsArray)); // Sort immediately
                } else {
                    setTimeSlots([]); // Set empty array on error
                    console.error("Failed to fetch schedule, status:", response.status);
                    // Optionally show error to user via Telegram popup
                    window.Telegram?.WebApp?.showPopup?.({ message: `Ошибка загрузки расписания: ${response.status}` });
                }
            } catch (error) {
                setTimeSlots([]); // Set empty array on network error
                console.error("Error fetching schedule:", error);
                window.Telegram?.WebApp?.showPopup?.({ message: "Сетевая ошибка при загрузке расписания." });
            } finally {
                setIsLoadingSlots(false); // Stop loading
            }
        };

        if (telegramId && selectedDate && !isCreatingImage) {
            fetchTimeSlots();
        } else {
            setTimeSlots([]); // Clear slots if no date selected or in image mode
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [telegramId, selectedDate, isCreatingImage, apiUrl]); // Keep dependencies, apiUrl added

    // --- LOGIC FUNCTIONS (UNCHANGED) ---
    const handleCreateImage = () => {
        const formattedDates = selectedDates.map(d => dayjs(d).format('YYYY-MM-DD'));
        navigate('/generate-image', { state: { dates: formattedDates } });
    };

    const handleCreateTimeSlot = async () => {
        if (!startTime) {
            window.Telegram?.WebApp?.showPopup?.({ message: "Время начала обязательно!" });
            return;
        }
        const isDuplicate = timeSlots.some(slot => slot.startTime === startTime);
        if (isDuplicate) {
            window.Telegram?.WebApp?.showPopup?.({ message: "Этот временной слот уже существует!" });
            return;
        }
        try {
            const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
            const timeSlotData = { date: formattedDate, startTime, description, status: true, clientId: "" };
            const response = await fetch(`${apiUrl}/Schedule/CreateTimeSlot?telegramId=${telegramId}&date=${formattedDate}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(timeSlotData)
            });
            if (response.ok) {
                const data = await response.json();
                const newTimeSlot = { ...timeSlotData, id: data.id };
                setTimeSlots(prev => sortTimeSlots([...prev, newTimeSlot]));
                setStartTime(''); setDescription('');
            } else {
                window.Telegram?.WebApp?.showPopup?.({ message: "Ошибка создания временного слота!" });
            }
        } catch (error) { console.error("Error creating time slot:", error); window.Telegram?.WebApp?.showPopup?.({ message: "Сетевая ошибка при создании слота." }); }
    };

    const handleUpdateTimeSlot = async (timeSlotId) => {
        try {
            const timeSlotData = { description, clientId: "" }; // Only description is editable here as per original code
            const response = await fetch(`${apiUrl}/Schedule/UpdateTimeSlot?timeSlotId=${timeSlotId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(timeSlotData)
            });
            if (response.ok) {
                setTimeSlots(prev => sortTimeSlots(prev.map(slot => (slot.id === timeSlotId ? { ...slot, description: description } : slot))));
                setEditingSlot(null); setStartTime(''); setDescription(''); // Reset form fully
            } else {
                window.Telegram?.WebApp?.showPopup?.({ message: "Ошибка обновления временного слота!" });
            }
        } catch (error) { console.error("Error updating time slot:", error); window.Telegram?.WebApp?.showPopup?.({ message: "Сетевая ошибка при обновлении слота." }); }
    };

    const handleDeleteTimeSlot = async (timeSlotId) => {
        // Optional: Add confirmation dialog
        // const confirmDelete = window.confirm("Удалить этот слот?"); if (!confirmDelete) return;
        try {
            const response = await fetch(`${apiUrl}/Schedule/DeleteTimeSlot?timeSlotId=${timeSlotId}`, { method: 'DELETE' });
            if (response.ok) {
                setTimeSlots(prev => prev.filter(slot => slot.id !== timeSlotId));
            } else {
                window.Telegram?.WebApp?.showPopup?.({ message: "Ошибка удаления временного слота!" });
            }
        } catch (error) { console.error("Error deleting time slot:", error); window.Telegram?.WebApp?.showPopup?.({ message: "Сетевая ошибка при удалении слота." }); }
    };

    const handleCancelAppointment = async (timeSlotId) => {
        const confirmCancel = window.confirm("Вы уверены, что хотите отменить запись?"); if (!confirmCancel) return;
        try {
            const response = await fetch(`${apiUrl}/Appointments/CancelAppointment?timeSlotId=${timeSlotId}`, { method: 'POST' });
            if (response.ok) {
                // Refetch schedule for the current date to update state accurately
                const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
                const updatedResponse = await fetch(`${apiUrl}/Schedule/GetSchedule?telegramId=${telegramId}&date=${formattedDate}`);
                if (updatedResponse.ok) setTimeSlots(sortTimeSlots(await updatedResponse.json()));
                window.Telegram?.WebApp?.showPopup?.({ message: "Запись успешно отменена." });
            } else { window.Telegram?.WebApp?.showPopup?.({ message: "Ошибка при отмене записи!" }); }
        } catch (error) { console.error("Ошибка при отмене записи:", error); window.Telegram?.WebApp?.showPopup?.({ message: "Ошибка сети при отмене записи!" }); }
    };

    const handleConfirmAppointment = async (timeSlotId) => {
        const confirmAction = window.confirm("Вы уверены, что хотите подтвердить запись?"); if (!confirmAction) return;
        try {
            const response = await fetch(`${apiUrl}/Appointments/ConfirmAppointment?timeSlotId=${timeSlotId}`, { method: 'POST' });
            if (response.ok) {
                // Refetch schedule for the current date
                const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
                const updatedResponse = await fetch(`${apiUrl}/Schedule/GetSchedule?telegramId=${telegramId}&date=${formattedDate}`);
                if (updatedResponse.ok) setTimeSlots(sortTimeSlots(await updatedResponse.json()));
                window.Telegram?.WebApp?.showPopup?.({ message: "Запись успешно подтверждена." });
            } else { window.Telegram?.WebApp?.showPopup?.({ message: "Ошибка при подтверждении записи!" }); }
        } catch (error) { console.error("Ошибка при подтверждении записи:", error); window.Telegram?.WebApp?.showPopup?.({ message: "Ошибка сети при подтверждении записи!" }); }
    };

    const handleBookingSubmit = async () => {
        if (!selectedSlot || selectedServices.length === 0) {
            window.Telegram?.WebApp?.showPopup?.({ message: "Выберите слот и хотя бы одну услугу!" }); return;
        }
        const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
        const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
        const desiredStart = dayjs(`${dayjs(selectedDate).format('YYYY-MM-DD')}T${selectedSlot.startTime}`);
        const desiredEnd = desiredStart.add(totalDuration, 'minute');

        // Refined conflict check: check against *all other* booked slots
        const hasConflict = timeSlots.some(slot => {
            // Skip the selected slot itself and any free slots
            if (slot.id === selectedSlot.id || slot.status === true) return false;

            // Find the end time of the potentially conflicting slot
            // Assuming 'totalDuration' exists on booked slots, otherwise use a default or fetch it
            const slotStart = dayjs(`${dayjs(selectedDate).format('YYYY-MM-DD')}T${slot.startTime}`);
            const slotDuration = slot.totalDuration || 60; // Default to 60 mins if duration isn't available
            const slotEnd = slotStart.add(slotDuration, 'minute');

            // Check for overlap: (StartA < EndB) and (EndA > StartB)
            return desiredStart.isBefore(slotEnd) && desiredEnd.isAfter(slotStart);
        });

        if (hasConflict) {
            window.Telegram?.WebApp?.showPopup?.({ message: "Выбранные услуги пересекаются с существующей записью. Выберите другое время или услуги." }); return;
        }

        const appointmentData = {
            usernameClient: window.Telegram.WebApp.initDataUnsafe?.user?.username || 'unknown', // Add fallback
            clientId: userTelegramId, specialistId: telegramId, comment: comment,
            services: selectedServices.map(s => s.name).join(", "), totalPrice, totalDuration,
            startTime: selectedSlot.startTime, date: dayjs(selectedDate).format('YYYY-MM-DD'),
            status: false, // status means 'booked'
            isConfirmed: false, // booking needs confirmation by specialist
        };

        try {
            const response = await fetch(`${apiUrl}/Appointments/BookAppointment?timeSlotId=${selectedSlot.id}`, {
                method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify(appointmentData),
            });
            if (response.ok) {
                window.Telegram?.WebApp?.showPopup?.({ message: "Бронирование успешно! Ожидайте подтверждения." });
                // Maybe navigate away or show success state
                navigate(`/client-appointments/${userTelegramId}`); // Example redirect
            } else {
                const errorData = await response.text(); // Get more details on failure
                console.error("Booking failed:", errorData);
                window.Telegram?.WebApp?.showPopup?.({ message: `Ошибка бронирования: ${errorData || response.statusText}` });
            }
        } catch (err) { console.error(err); window.Telegram?.WebApp?.showPopup?.({ message: "Сетевая ошибка при отправке запроса." }); }
    };

    // --- HELPER FUNCTIONS (UNCHANGED LOGIC, ADDED SORT) ---
    const sortTimeSlots = (slots) => {
        // Ensure slots is an array before sorting
        if (!Array.isArray(slots)) return [];
        return [...slots].sort((a, b) => {
            const [aH, aM] = a.startTime.split(':').map(Number);
            const [bH, bM] = b.startTime.split(':').map(Number);
            return aH * 60 + aM - (bH * 60 + bM);
        });
    };

    const toggleCreateImageMode = () => {
        setIsCreatingImage(prev => !prev);
        setSelectedDates([]); // Reset multi-select dates when toggling
        setSelectedDate(null); // Reset single-select date
        setTimeSlots([]);      // Clear time slots when toggling mode
    };

    const handleDateClick = (date) => {
        if (!isCreatingImage) {
            setSelectedDate(date);
            // setShowTimeSlotForm(date !== null); // Logic handled by selectedDate presence
            // Reset client selections when date changes (handled in useEffect)
        } else {
            const alreadySelected = selectedDates.some(d => dayjs(d).isSame(date, 'day'));
            if (alreadySelected) {
                setSelectedDates(prev => prev.filter(d => !dayjs(d).isSame(date, 'day')));
            } else {
                setSelectedDates(prev => [...prev, date]);
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingSlot(null); setStartTime(''); setDescription('');
    };

    const handleSlotClick = (slot) => {
        if (slot.status === false) return; // Prevent selecting booked slots
        setSelectedSlot(slot);
        // Reset dependent state if needed
        setSelectedServices([]);
        setComment('');
    };

    const handleServiceToggle = (serviceName) => {
        if (!parsedServices || !parsedServices[serviceName]) {
            console.warn("Service data not found for:", serviceName);
            return; // Prevent adding if data is missing
        }
        const serviceData = parsedServices[serviceName];
        setSelectedServices((prev) => {
            const exists = prev.find(s => s.name === serviceName);
            return exists
                ? prev.filter(s => s.name !== serviceName)
                : [...prev, { name: serviceName, price: serviceData.price || 0, duration: serviceData.duration || 0 }]; // Add default values
        });
    };
    // --- END OF LOGIC ---


    // --- RENDER SECTION ---
    return (
        <Container size="sm" p="md">
            <Stack gap="lg"> {/* Vertical spacing */}
                {/* Back Button handled by Telegram.WebApp.BackButton */}
                <Title order={2} ta="center">Расписание</Title>

                {/* Image Generation Toggle */}
                {role === "specialist" && (
                    <Group justify="flex-end">
                        {isCreatingImage && selectedDates.length > 0 && (
                            <Button
                                leftSection={<IconPhoto size={16} />}
                                onClick={handleCreateImage}
                                variant="gradient"
                                gradient={{ from: 'teal', to: 'blue' }}
                            >
                                Создать ({selectedDates.length})
                            </Button>
                        )}
                        <Button
                            onClick={toggleCreateImageMode}
                            variant="outline"
                            leftSection={isCreatingImage ? <IconX size={16} /> : <IconCalendar size={16} />}
                        >
                            {isCreatingImage ? 'Отмена выбора дат' : 'Выбрать даты для картинки'}
                        </Button>
                    </Group>
                )}


                {/* Date Picker */}
                <Center>
                    <DatePicker
                        locale="ru"
                        multiple={isCreatingImage}
                        value={isCreatingImage ? selectedDates : selectedDate}
                        onChange={handleDateClick}
                        minDate={dayjs().startOf('day').toDate()} // Start from today
                        maxDate={dayjs().add(1, 'year').toDate()} // Limit to 1 year ahead
                        getDayProps={(date) => {
                            const isSelected = isCreatingImage
                                ? selectedDates.some(d => dayjs(d).isSame(date, 'day'))
                                : selectedDate && dayjs(date).isSame(selectedDate, 'day');
                            return {
                                style: {
                                    backgroundColor: isSelected ? theme.colors.blue[1] : undefined,
                                    // borderRadius: isSelected ? '50%' : undefined, // Make selection circular
                                    border: isSelected ? `1px solid ${theme.colors.blue[5]}` : '1px solid transparent', // Highlight border
                                },
                            };
                        }}
                        renderDay={(date) => { // Optional: Custom rendering (e.g., dots for available days - needs backend logic)
                            const day = date.getDate();
                            // Add logic here to check if day has slots (would require fetching availability overview)
                            // const hasSlots = checkAvailabilityFor(date);
                            return (
                                <div>{day}</div> // Placeholder
                            );
                        }}
                    />
                </Center>

                {/* Divider */}
                {selectedDate && !isCreatingImage && <Divider my="md" />}

                {/* Loading Indicator */}
                {isLoadingSlots && <Center><Loader /></Center>}

                {/* Specialist: Time Slot Management */}
                {role === "specialist" && selectedDate && !isCreatingImage && !isLoadingSlots && (
                    <Stack gap="md">
                        <Title order={4}>{editingSlot ? 'Редактировать слот' : 'Добавить новый слот'}</Title>
                        <Paper shadow="xs" p="md" withBorder>
                            <Stack>
                                <TimeInput
                                    label="Время начала"
                                    placeholder="ЧЧ:ММ"
                                    value={startTime}
                                    onChange={(event) => setStartTime(event.currentTarget.value)}
                                    disabled={!!editingSlot} // Disable if editing (time shouldn't change)
                                    required
                                    leftSection={<IconClock size={16} />}
                                />
                                <Textarea
                                    label="Описание (заметка для себя)"
                                    placeholder="Необязательное описание..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    autosize
                                    minRows={2}
                                />
                                <Group justify="flex-end">
                                    {editingSlot ? (
                                        <>
                                            <Button onClick={handleCancelEdit} variant="default">Отмена</Button>
                                            <Button
                                                leftSection={<IconEdit size={16} />}
                                                onClick={() => handleUpdateTimeSlot(editingSlot.id)}
                                            >
                                                Сохранить
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            leftSection={<IconPlus size={16} />}
                                            onClick={handleCreateTimeSlot}
                                            disabled={!startTime} // Disable if time is not set
                                        >
                                            Добавить слот
                                        </Button>
                                    )}
                                </Group>
                            </Stack>
                        </Paper>

                        <Title order={4} mt="lg">Слоты на {dayjs(selectedDate).format('D MMMM YYYY')}</Title>
                        {timeSlots.length > 0 ? (
                            <Stack gap="sm">
                                {timeSlots.map((slot) => (
                                    <Card shadow="sm" p="md" radius="md" withBorder key={slot.id}>
                                        <Stack gap="xs">
                                            <Group justify="space-between">
                                                <Group gap="xs">
                                                    <Text fw={500} size="lg">{slot.startTime}</Text>
                                                    <Badge
                                                        variant="light"
                                                        color={slot.status ? 'green' : (slot.isConfirmed ? 'blue' : 'orange')}
                                                    >
                                                        {slot.status ? 'Свободно' : (slot.isConfirmed ? 'Подтверждено' : 'Ожидает')}
                                                    </Badge>
                                                </Group>
                                                {/* Actions for FREE slots */}
                                                {slot.status === true && (
                                                    <Group gap="xs">
                                                        <Button
                                                            variant="subtle" color="gray" size="xs"
                                                            onClick={() => { setEditingSlot(slot); setStartTime(slot.startTime); setDescription(slot.description || ''); }}
                                                            leftSection={<IconEdit size={14} />}
                                                            disabled={!!editingSlot && editingSlot.id !== slot.id} // Disable if another is being edited
                                                        >
                                                            Ред.
                                                        </Button>
                                                        <Button
                                                            variant="subtle" color="red" size="xs"
                                                            onClick={() => handleDeleteTimeSlot(slot.id)}
                                                            leftSection={<IconTrash size={14} />}
                                                            disabled={!!editingSlot} // Disable if editing another
                                                        >
                                                            Удал.
                                                        </Button>
                                                    </Group>
                                                )}
                                            </Group>

                                            {/* Description for FREE slots */}
                                            {slot.status === true && slot.description && (
                                                <Text size="sm" c="dimmed">Заметка: {slot.description}</Text>
                                            )}

                                            {/* Details for BOOKED slots */}
                                            {slot.status === false && (
                                                <Paper p="xs" radius="sm" withBorder >
                                                    <Stack gap="xs">
                                                        <Text size="sm"><strong>Клиент:</strong> {slot.clientUsername || `ID: ${slot.clientId}`}</Text> {/* Assuming clientUsername is available */}
                                                        <Text size="sm"><strong>Услуги:</strong> {slot.services || '-'}</Text>
                                                        <Text size="sm"><strong>Комментарий:</strong> {slot.comment || '-'}</Text>
                                                        <Text size="sm"><strong>Длительность:</strong> {slot.totalDuration || '?'} мин.</Text>
                                                        <Text size="sm"><strong>Сумма:</strong> {slot.totalPrice != null ? `${slot.totalPrice} руб.` : '-'}</Text>

                                                        {/* Actions only for the PARENT slot of a multi-slot booking */}
                                                        {slot.parent === slot.id && ( // Show actions only on the primary booking slot
                                                            <Group justify="flex-end" mt="xs">
                                                                {!slot.isConfirmed ? (
                                                                    <>
                                                                        <Button
                                                                            size="xs" variant="outline" color="red"
                                                                            onClick={() => handleCancelAppointment(slot.id)}
                                                                            leftSection={<IconX size={14} />}
                                                                        >
                                                                            Отклонить
                                                                        </Button>
                                                                        <Button
                                                                            size="xs" variant="filled" color="green"
                                                                            onClick={() => handleConfirmAppointment(slot.id)}
                                                                            leftSection={<IconCheck size={14} />}
                                                                        >
                                                                            Подтвердить
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Button
                                                                        size="xs" variant="filled" color="red"
                                                                        onClick={() => handleCancelAppointment(slot.id)}
                                                                        leftSection={<IconX size={14} />}
                                                                    >
                                                                        Отменить запись
                                                                    </Button>
                                                                )}
                                                            </Group>
                                                        )}
                                                    </Stack>
                                                </Paper>
                                            )}
                                            {/* Note for non-parent booked slots (optional) */}
                                            {slot.status === false && slot.parent !== slot.id && (
                                                <Text size="xs" c="dimmed">Продолжение записи от {timeSlots.find(s => s.id === slot.parent)?.startTime || '??:??'}</Text>
                                            )}
                                        </Stack>
                                    </Card>
                                ))}
                            </Stack>
                        ) : (
                            <Text c="dimmed" ta="center">На выбранную дату слотов нет.</Text>
                        )}
                    </Stack>
                )}

                {/* Client: Time Slot Selection & Booking */}
                {role === "client" && selectedDate && !isCreatingImage && !isLoadingSlots && (
                    <Stack gap="lg">
                        {timeSlots.length > 0 ? (
                            <Box>
                                <Title order={4} mb="sm">Выберите время</Title>
                                <SimpleGrid cols={{ base: 3, xs: 4, sm: 5 }} spacing="sm">
                                    {timeSlots.map(slot => {
                                        const isSelected = selectedSlot?.id === slot.id;
                                        const isDisabled = slot.status === false; // Slot is booked
                                        return (
                                            <Button
                                                key={slot.id}
                                                variant={isSelected ? 'filled' : (isDisabled ? 'light' : 'outline')}
                                                color={isSelected ? 'blue' : 'gray'}
                                                onClick={() => handleSlotClick(slot)}
                                                disabled={isDisabled}
                                                style={{ textDecoration: isDisabled ? 'line-through' : 'none' }}
                                            >
                                                {slot.startTime}
                                            </Button>
                                        );
                                    })}
                                </SimpleGrid>
                            </Box>
                        ) : (
                            <Text c="dimmed" ta="center">Свободных слотов на эту дату нет.</Text>
                        )}

                        {/* Service Selection & Booking Form (Appears when a slot is selected) */}
                        {selectedSlot && (
                            <Paper shadow="xs" p="md" radius="md" withBorder mt="lg">
                                <Stack gap="md">
                                    <Title order={4}>Выберите услуги для {selectedSlot.startTime}</Title>
                                    {parsedServices && Object.keys(parsedServices).length > 0 ? (
                                        <Stack gap="xs">
                                            {Object.entries(parsedServices).map(([serviceName, serviceData]) => (
                                                <Checkbox
                                                    key={serviceName}
                                                    label={`${serviceName} (${serviceData?.price || 0} руб. / ${serviceData?.duration || 0} мин)`}
                                                    checked={selectedServices.some(s => s.name === serviceName)}
                                                    onChange={() => handleServiceToggle(serviceName)}
                                                />
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Text size="sm" c="dimmed">У этого специалиста пока нет добавленных услуг.</Text>
                                    )}

                                    <Textarea
                                        label="Комментарий к записи (необязательно)"
                                        placeholder="Ваши пожелания или важная информация..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        autosize
                                        minRows={2}
                                    />

                                    {/* Display Total Price & Duration */}
                                    {selectedServices.length > 0 && (
                                        <Group justify="space-between" >
                                            <Text>Итого:</Text>
                                            <Text fw={500}>
                                                {selectedServices.reduce((sum, s) => sum + (s.price || 0), 0)} руб. / {selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0)} мин.
                                            </Text>
                                        </Group>
                                    )}

                                    <Button
                                        fullWidth
                                        mt="md"
                                        onClick={handleBookingSubmit}
                                        disabled={selectedServices.length === 0} // Disable if no services selected
                                        leftSection={<IconSend size={16} />}
                                    >
                                        Записаться
                                    </Button>
                                </Stack>
                            </Paper>
                        )}
                    </Stack>
                )}

            </Stack>
        </Container>
    );
}

export default SchedulePage;
