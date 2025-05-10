import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Container,
    Stack,
    Title,
    Text,
    Button,
    Loader,
    Alert,
    Card,
    Group,
    Divider,
    Checkbox,
    TextInput,
    ColorInput, // For color selection
    SegmentedControl, // For predefined color choices (alternative)
    Paper,
    ScrollArea,
    useMantineTheme,
    Badge,
    LoadingOverlay, // For overall page loading
    Box
} from '@mantine/core';
import {
    IconPhoto,
    IconAlertCircle,
    IconCalendarEvent,
    IconClock,
    IconPalette,
    IconTextColor,
    IconTextPlus,
    IconWand,
    IconLock,
    IconPremiumRights,
    IconChevronLeft
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');

// Helper to format date for display
const formatDateForDisplay = (dateString) => dayjs(dateString).format('D MMMM YYYY');

function GenerateImagePage({ telegramId, apiUrl }) {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useMantineTheme();

    // Dates passed from SchedulePage
    const { dates: initialDates = [] } = location.state || {};

    const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
    const [subscriptionChecked, setSubscriptionChecked] = useState(false);
    const [schedules, setSchedules] = useState({}); // Store schedules keyed by date
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
    const [pageError, setPageError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false); // For the generate button

    // Premium features state
    const [panelColor, setPanelColor] = useState(theme.white);
    const [fontColor, setFontColor] = useState(theme.black);
    const [customHeaderText, setCustomHeaderText] = useState('');
    const [useRandomBackground, setUseRandomBackground] = useState(false);
    const [dateFormatStyles, setDateFormatStyles] = useState([]); 
    const [timeFormatStyles, setTimeFormatStyles] = useState([]); 

    // Effect for Telegram Back Button
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

    // 1. Fetch subscription status
    useEffect(() => {
        if (!telegramId) {
            setPageError("Не удалось определить пользователя для проверки подписки.");
            setSubscriptionChecked(true);
            return;
        }

        const fetchSubscription = async () => {
            try {
                const response = await fetch(`${apiUrl}/User/GetSubscriptionStatus?telegramId=${telegramId}`); // Use the new endpoint
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Ошибка проверки подписки: ${response.status} - ${errorText}`);
                }
                const data = await response.json(); // Expecting { isActive: boolean, expiryDate?: string, message?: string }

                setIsSubscriptionActive(data.isActive === true);
                // You could also store data.expiryDate or data.message if needed for display
                if (!data.isActive) {
                    console.log("Subscription status:", data.message || "Inactive");
                }

            } catch (error) {
                console.error("Error fetching subscription:", error);
                setPageError(`Не удалось проверить статус подписки: ${error.message}. Функции премиум могут быть недоступны.`);
                setIsSubscriptionActive(false);
            } finally {
                setSubscriptionChecked(true);
            }
        };

        fetchSubscription();
    }, [telegramId, apiUrl]);

    // 2. Fetch schedules for each selected date
    const fetchSchedulesForDates = useCallback(async () => {
        if (initialDates.length === 0 || !telegramId) return;

        setIsLoadingSchedules(true);
        setPageError(null); // Clear previous errors
        const newSchedules = {};
        let fetchFailed = false;

        for (const date of initialDates) {
            try {
                const formattedDate = dayjs(date).format('YYYY-MM-DD'); // Ensure correct format
                const response = await fetch(`${apiUrl}/Schedule/GetSchedule?telegramId=${telegramId}&date=${formattedDate}`);
                if (!response.ok) {
                    console.warn(`Failed to fetch schedule for ${date}: ${response.status}`);
                    newSchedules[date] = { error: true, slots: [] }; // Mark error for this date
                    fetchFailed = true;
                    continue;
                }
                const data = await response.json();
                newSchedules[date] = {
                    error: false,
                    // Filter for status: true and ensure slots is an array
                    slots: Array.isArray(data) ? data.filter(slot => slot.status === true).sort((a, b) => a.startTime.localeCompare(b.startTime)) : []
                };
            } catch (error) {
                console.error(`Error fetching schedule for ${date}:`, error);
                newSchedules[date] = { error: true, slots: [] };
                fetchFailed = true;
            }
        }
        if (fetchFailed) {
            setPageError(prev => prev ? `${prev}\nНе удалось загрузить расписание для некоторых дат.` : "Не удалось загрузить расписание для некоторых дат.");
        }
        setSchedules(newSchedules);
        setIsLoadingSchedules(false);
    }, [initialDates, telegramId, apiUrl]);

    useEffect(() => {
        if (subscriptionChecked) { // Fetch schedules only after subscription status is known (or if it fails)
            fetchSchedulesForDates();
        }
    }, [subscriptionChecked, fetchSchedulesForDates]);


    const handleGenerateImage = async () => {
        setIsGenerating(true);
        // 1. Collect all data
        const generationData = {
            selectedDatesData: initialDates.map(date => ({
                date,
                availableSlots: schedules[date]?.slots.map(slot => slot.startTime) || []
            })),
            ...(isSubscriptionActive && { // Conditionally add premium features
                panelColor,
                fontColor,
                customHeaderText,
                useRandomBackground,
                dateFormatStyles, // <-- ADDED
                timeFormatStyles, // <-- ADDED
            })
        };

        console.log("Data for image generation:", generationData);

        // 2. Send to backend or image generation service
        try {
            // Example:
            // const response = await fetch(`${apiUrl}/ImageGenerator/Generate`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(generationData)
            // });
            // if (!response.ok) throw new Error('Image generation failed');
            // const result = await response.json(); // e.g., { imageUrl: '...' }
            // window.Telegram.WebApp.showPopup({ title: "Успех!", message: "Изображение генерируется." });
            // Potentially navigate to a page showing the image or progress

            // SIMULATE API CALL
            await new Promise(resolve => setTimeout(resolve, 2000));
            window.Telegram?.WebApp?.showPopup?.({ title: "Отправлено на генерацию", message: "Изображение будет создано в фоновом режиме." });
            navigate(-1); // Go back after sending

        } catch (error) {
            console.error("Error during image generation:", error);
            window.Telegram?.WebApp?.showPopup?.({ title: "Ошибка", message: `Не удалось сгенерировать изображение: ${error.message}` });
        } finally {
            setIsGenerating(false);
        }
    };


    if (!subscriptionChecked || (initialDates.length > 0 && isLoadingSchedules && Object.keys(schedules).length === 0)) {
        return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />;
    }

    if (initialDates.length === 0) {
        return (
            <Container size="sm" py="lg">
                <Alert icon={<IconAlertCircle size="1rem" />} title="Нет данных" color="orange" radius="md">
                    Не выбраны даты для генерации изображения. Пожалуйста, вернитесь и выберите даты на странице расписания.
                    <Button mt="md" onClick={() => navigate(-1)} variant="outline">Назад</Button>
                </Alert>
            </Container>
        );
    }


    return (
        <Container size="md" py="lg">
            <Stack gap="xl">
                <Title order={2} ta="center">
                    <Group justify="center" gap="xs">
                        <IconPhoto size={28} />
                        <span>Генерация изображения расписания</span>
                    </Group>
                </Title>

                {pageError && (
                    <Alert icon={<IconAlertCircle size="1rem" />} title="Внимание" color="orange" radius="md">
                        <Text component="pre" ff="monospace" style={{ whiteSpace: 'pre-wrap' }}>{pageError}</Text>
                    </Alert>
                )}

                <Paper shadow="sm" p="lg" radius="md" withBorder>
                    <Title order={4} mb="md">Выбранные даты и свободное время:</Title>
                    {isLoadingSchedules && <Center my="md"><Loader /></Center>}
                    {!isLoadingSchedules && initialDates.length > 0 && (
                        <ScrollArea.Autosize maxHeight={300} type="hover">
                            <Stack gap="md">
                                {initialDates.map((dateStr) => (
                                    <Box key={dateStr}>
                                        <Text fw={500}>{formatDateForDisplay(dateStr)}</Text>
                                        {schedules[dateStr]?.error ? (
                                            <Text c="red" size="sm">Не удалось загрузить расписание на эту дату.</Text>
                                        ) : schedules[dateStr]?.slots.length > 0 ? (
                                            <Group gap="xs" mt={4}>
                                                {schedules[dateStr].slots.map(slot => (
                                                    <Badge
                                                        key={slot.id || slot.startTime}
                                                        variant="light"
                                                        leftSection={<IconClock size={12} />}
                                                    >
                                                        {slot.startTime}
                                                    </Badge>
                                                ))}
                                            </Group>
                                        ) : (
                                            <Text c="dimmed" size="sm">Нет свободных слотов</Text>
                                        )}
                                        <Divider my="sm" variant="dotted" />
                                    </Box>
                                ))}
                            </Stack>
                        </ScrollArea.Autosize>
                    )}
                </Paper>

                {/* Premium Features Section */}
                {isSubscriptionActive && subscriptionChecked && (
                    <Paper shadow="sm" p="lg" radius="md" withBorder>
                        <Title order={4} mb="md">
                            <Group gap="xs">
                                <IconPremiumRights size={20} color={theme.colors.yellow[6]} />
                                <span>Настройки (Премиум)</span>
                            </Group>
                        </Title>
                        <Stack gap="md">
                            <ColorInput
                                label="Цвет панели"
                                placeholder="Выберите цвет"
                                value={panelColor}
                                onChange={setPanelColor}
                                icon={<IconPalette size={16} />}
                                swatches={[...theme.colors.gray, ...theme.colors.blue, ...theme.colors.teal, ...theme.colors.grape, theme.white, theme.black]} // Example swatches
                            />
                            <ColorInput
                                label="Цвет шрифта"
                                placeholder="Выберите цвет"
                                value={fontColor}
                                onChange={setFontColor}
                                icon={<IconTextColor size={16} />}
                                swatches={[theme.white, theme.black, ...theme.colors.gray, ...theme.colors.blue, ...theme.colors.red]}
                            />
                            <TextInput
                                label="Текст над расписанием"
                                placeholder="Например, 'Свободные окошки на этой неделе'"
                                value={customHeaderText}
                                onChange={(e) => setCustomHeaderText(e.currentTarget.value)}
                                icon={<IconTextPlus size={16} />}
                            />
                            <Box>
                                <Text size="sm" fw={500} mb={4}>Стиль шрифта для ДАТ</Text>
                                <Checkbox.Group
                                    value={dateFormatStyles}
                                    onChange={setDateFormatStyles}
                                >
                                    <Group mt="xs">
                                        <Checkbox value="bold" label="Жирный" />
                                        <Checkbox value="italic" label="Курсив" />
                                        <Checkbox value="underline" label="Подчеркнутый" />
                                    </Group>
                                </Checkbox.Group>
                            </Box>
                            <Box>
                                <Text size="sm" fw={500} mb={4}>Стиль шрифта для ВРЕМЕНИ</Text>
                                <Checkbox.Group
                                    value={timeFormatStyles}
                                    onChange={setTimeFormatStyles}
                                >
                                    <Group mt="xs">
                                        <Checkbox value="bold" label="Жирный" />
                                        <Checkbox value="italic" label="Курсив" />
                                        <Checkbox value="underline" label="Подчеркнутый" />
                                    </Group>
                                </Checkbox.Group>
                            </Box>
                            <Checkbox
                                label="Использовать случайный фон"
                                checked={useRandomBackground}
                                onChange={(event) => setUseRandomBackground(event.currentTarget.checked)}
                                icon={IconWand}
                            />
                        </Stack>
                    </Paper>
                )}

                {!isSubscriptionActive && subscriptionChecked && (
                    <Alert icon={<IconLock size="1rem" />} title="Расширенные настройки недоступны" color="blue" radius="md">
                        Для доступа к настройкам цвета, текста и фона оформите подписку.
                        <Button mt="sm" variant='outline' onClick={() => navigate('/subscription')}>Перейти к подписке</Button>
                    </Alert>
                )}


                <Button
                    fullWidth
                    size="lg"
                    mt="xl"
                    onClick={handleGenerateImage}
                    loading={isGenerating}
                    disabled={isLoadingSchedules || Object.keys(schedules).length === 0 && initialDates.length > 0} // Disable if still loading initial data
                    leftSection={<IconPhoto size={20} />}
                >
                    Сгенерировать изображение
                </Button>
            </Stack>
        </Container>
    );
}

export default GenerateImagePage;