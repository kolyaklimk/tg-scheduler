import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Container,
    Stack,
    Center,
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
    ColorInput,
    Paper,
    ScrollArea,
    useMantineTheme,
    Badge,
    LoadingOverlay,
    Box,
    Image, // For displaying image thumbnails
    Accordion, // For the recent images section
    CopyButton, // To copy image URLs
    ActionIcon, // For copy button icon
    Tooltip, // For copy feedback
    Anchor // For clickable links
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
    IconChevronLeft,
    IconCopy,
    IconCheck,
    IconExternalLink,
    IconHistory // For recent images
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');

const formatDateForDisplay = (dateString) => dayjs(dateString).format('D MMMM YYYY');
const formatTimestampForDisplay = (timestamp) => {
    if (!timestamp) {
        return 'Неизвестно';
    }

    // 1. Check for Firebase JS SDK-like Timestamp object structure
    if (typeof timestamp === 'object' && timestamp !== null && typeof timestamp.toDate === 'function') {
        // This handles Timestamps from the Firebase JS SDK directly
        return dayjs(timestamp.toDate()).format('DD.MM.YYYY HH:mm');
    }

    // 2. Check for the structure you might get from some C# serializers if not converted to string
    // (e.g., if it was manually constructed or from a library that outputs this)
    if (typeof timestamp === 'object' && timestamp !== null && typeof timestamp._seconds === 'number') {
        return dayjs.unix(timestamp._seconds).format('DD.MM.YYYY HH:mm');
    }

    // 3. Check if it's already a parseable string (ideally ISO 8601)
    if (typeof timestamp === 'string') {
        const parsedDate = dayjs(timestamp);
        if (parsedDate.isValid()) {
            return parsedDate.format('DD.MM.YYYY HH:mm');
        }
    }

    // 4. If it's a number, assume it's Unix milliseconds (less common for Firestore Timestamps directly)
    if (typeof timestamp === 'number') {
         const parsedDate = dayjs(timestamp);
         if (parsedDate.isValid()) {
             return parsedDate.format('DD.MM.YYYY HH:mm');
         }
    }


    console.warn("Unrecognized timestamp format:", timestamp);
    return 'Неизвестно';
};


function GenerateImagePage({ telegramId, apiUrl }) {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useMantineTheme();

    const { dates: initialDates = [] } = location.state || {};

    const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
    const [subscriptionChecked, setSubscriptionChecked] = useState(false);
    const [schedules, setSchedules] = useState({});
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
    const [pageError, setPageError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const [panelColor, setPanelColor] = useState(theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white);
    const [fontColor, setFontColor] = useState(theme.colorScheme === 'dark' ? theme.white : theme.black);
    const [customHeaderText, setCustomHeaderText] = useState('');
    const [useRandomBackground, setUseRandomBackground] = useState(false);
    const [dateFormatStyles, setDateFormatStyles] = useState(['bold']);
    const [timeFormatStyles, setTimeFormatStyles] = useState([]);

    const [generatedImageUrl, setGeneratedImageUrl] = useState(null); // For the latest generated image
    const [recentImages, setRecentImages] = useState([]);
    const [isLoadingRecentImages, setIsLoadingRecentImages] = useState(false);

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

    const fetchSubscription = useCallback(async () => {
        if (!telegramId) {
            setPageError("Не удалось определить пользователя для проверки подписки.");
            setSubscriptionChecked(true);
            return;
        }
        try {
            const response = await fetch(`${apiUrl}/User/GetSubscriptionStatus?telegramId=${telegramId}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка проверки подписки: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            setIsSubscriptionActive(data.isActive === true);
        } catch (error) {
            console.error("Error fetching subscription:", error);
            setPageError(prev => `${prev ? prev + '\n' : ''}Не удалось проверить статус подписки: ${error.message}.`);
            setIsSubscriptionActive(false);
        } finally {
            setSubscriptionChecked(true);
        }
    }, [telegramId, apiUrl]);

    const fetchSchedulesForDates = useCallback(async () => {
        if (initialDates.length === 0 || !telegramId) return;
        setIsLoadingSchedules(true);
        // setPageError(null); // Don't clear subscription error
        const newSchedules = {};
        let fetchFailed = false;
        for (const date of initialDates) {
            try {
                const formattedDate = dayjs(date).format('YYYY-MM-DD');
                const response = await fetch(`${apiUrl}/Schedule/GetSchedule?telegramId=${telegramId}&date=${formattedDate}`);
                if (!response.ok) {
                    newSchedules[date] = { error: true, slots: [] }; fetchFailed = true; continue;
                }
                const data = await response.json();
                newSchedules[date] = {
                    error: false,
                    slots: Array.isArray(data) ? data.filter(slot => slot.status === true).sort((a, b) => a.startTime.localeCompare(b.startTime)) : []
                };
            } catch (error) {
                newSchedules[date] = { error: true, slots: [] }; fetchFailed = true;
            }
        }
        if (fetchFailed) {
            setPageError(prev => `${prev ? prev + '\n' : ''}Не удалось загрузить расписание для некоторых дат.`);
        }
        setSchedules(newSchedules);
        setIsLoadingSchedules(false);
    }, [initialDates, telegramId, apiUrl]);

    const fetchRecentImages = useCallback(async () => {
        if (!telegramId) return;
        setIsLoadingRecentImages(true);
        try {
            const response = await fetch(`${apiUrl}/User/GetUserGeneratedImages?telegramId=${telegramId}&limit=10`);
            if (!response.ok) {
                throw new Error(`Ошибка загрузки недавних изображений: ${response.status}`);
            }
            const data = await response.json();
            setRecentImages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching recent images:", error);
            setPageError(prev => `${prev ? prev + '\n' : ''}Не удалось загрузить недавние изображения.`);
        } finally {
            setIsLoadingRecentImages(false);
        }
    }, [telegramId, apiUrl]);

    useEffect(() => {
        fetchSubscription();
        fetchRecentImages();
    }, [fetchSubscription, fetchRecentImages]); // Called once on mount

    useEffect(() => {
        if (subscriptionChecked) {
            fetchSchedulesForDates();
        }
    }, [subscriptionChecked, fetchSchedulesForDates]);


    const handleGenerateImage = async () => {
        setIsGenerating(true);
        setGeneratedImageUrl(null); // Clear previous generated image URL
        setPageError(null); // Clear previous errors before new attempt

        const generationDataPayload = {
            selectedDatesData: initialDates.map(date => ({
                date,
                availableSlots: schedules[date]?.slots?.map(slot => slot.startTime) || []
            })),
            // Conditionally add premium features, ensuring not to send nulls if not subscribed
            ...(isSubscriptionActive && {
                panelColor: panelColor || (theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white), // Default if somehow null
                fontColor: fontColor || (theme.colorScheme === 'dark' ? theme.white : theme.black), // Default if somehow null
                customHeaderText: customHeaderText || "",
                useRandomBackground: useRandomBackground === true, // Ensure boolean
                dateFormatStyles: dateFormatStyles || [],
                timeFormatStyles: timeFormatStyles || [],
            })
        };

        try {
            const response = await fetch(`${apiUrl}/ImageGenerator/GenerateScheduleImage?telegramId=${telegramId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(generationDataPayload)
            });

            const responseData = await response.json(); // Always try to parse JSON

            if (!response.ok) {
                throw new Error(responseData.message || responseData.title || `Ошибка генерации: ${response.status}`);
            }

            setGeneratedImageUrl(responseData.imageUrl);
            window.Telegram?.WebApp?.showPopup?.({ title: "Успех!", message: "Изображение успешно сгенерировано!" });
            fetchRecentImages(); // Refresh the list of recent images

        } catch (error) {
            console.error("Error during image generation:", error);
            setPageError(`Не удалось сгенерировать изображение: ${error.message}`);
            window.Telegram?.WebApp?.showPopup?.({ title: "Ошибка", message: `Не удалось сгенерировать изображение: ${error.message}` });
        } finally {
            setIsGenerating(false);
        }
    };

    // Determine if ready to display main form or show loading/error
    const isPageReady = subscriptionChecked && (initialDates.length === 0 || (!isLoadingSchedules && Object.keys(schedules).length > 0));


    if (!subscriptionChecked || (initialDates.length > 0 && isLoadingSchedules && Object.keys(schedules).length === 0 && !pageError)) {
        return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />;
    }

    if (initialDates.length === 0 && subscriptionChecked) {
        // Allow viewing recent images even if no dates selected for new generation
    } else if (initialDates.length === 0) { // Should not happen if logic above is correct
        return (
            <Container size="sm" py="lg">
                <Alert icon={<IconAlertCircle size="1rem" />} title="Нет данных" color="orange" radius="md">
                    Не выбраны даты для генерации изображения.
                    <Button mt="md" onClick={() => navigate(-1)} variant="outline">Назад</Button>
                </Alert>
            </Container>
        );
    }


    return (
        <Container size="md" py="lg">
            <Stack gap="xl">
                <Title order={2} ta="center">
                    <Group justify="center" gap="xs"> <IconPhoto size={28} /> <span>Генерация изображения</span> </Group>
                </Title>

                {pageError && (
                    <Alert icon={<IconAlertCircle size="1rem" />} title="Внимание" color="orange" radius="md" withCloseButton onClose={() => setPageError(null)}>
                        <Text component="pre" ff="monospace" style={{ whiteSpace: 'pre-wrap' }}>{pageError}</Text>
                    </Alert>
                )}

                {/* Section for Selected Dates and Generation Form */}
                {initialDates.length > 0 && (
                    <>
                        <Paper shadow="sm" p="lg" radius="md" withBorder>
                            <Title order={4} mb="md">Выбранные даты и свободное время:</Title>
                            {isLoadingSchedules && <Center my="md"><Loader /></Center>}
                            {!isLoadingSchedules && (
                                <ScrollArea.Autosize maxHeight={200} type="hover">
                                    <Stack gap="md">
                                        {initialDates.map((dateStr) => (
                                            <Box key={dateStr}>
                                                <Text fw={500}>{formatDateForDisplay(dateStr)}</Text>
                                                {schedules[dateStr]?.error ? (
                                                    <Text c="red" size="sm">Ошибка загрузки расписания.</Text>
                                                ) : schedules[dateStr]?.slots.length > 0 ? (
                                                    <Group gap="xs" mt={4} wrap="wrap">
                                                        {schedules[dateStr].slots.map(slot => (
                                                            <Badge key={slot.id || slot.startTime} variant="light" leftSection={<IconClock size={12} />}>
                                                                {slot.startTime}
                                                            </Badge>
                                                        ))}
                                                    </Group>
                                                ) : (<Text c="dimmed" size="sm">Нет свободных слотов.</Text>)}
                                                {initialDates.indexOf(dateStr) < initialDates.length - 1 && <Divider my="sm" variant="dotted" />}
                                            </Box>
                                        ))}
                                    </Stack>
                                </ScrollArea.Autosize>
                            )}
                        </Paper>

                        {isSubscriptionActive && subscriptionChecked && (
                            <Paper shadow="sm" p="lg" radius="md" withBorder>
                                <Title order={4} mb="md">
                                    <Group gap="xs"> <IconPremiumRights size={20} color={theme.colors.yellow[6]} /> <span>Настройки (Премиум)</span> </Group>
                                </Title>
                                <Stack gap="lg">
                                    <ColorInput label="Цвет панели" value={panelColor} onChange={setPanelColor} icon={<IconPalette size={16} />} swatches={[...theme.colors.gray, ...theme.colors.blue, ...theme.colors.teal, theme.white, theme.black]} />
                                    <ColorInput label="Цвет шрифта" value={fontColor} onChange={setFontColor} icon={<IconTextColor size={16} />} swatches={[theme.white, theme.black, ...theme.colors.gray]} />
                                    <TextInput label="Текст над расписанием" placeholder="Свободные окошки" value={customHeaderText} onChange={(e) => setCustomHeaderText(e.currentTarget.value)} icon={<IconTextPlus size={16} />} />
                                    <Divider label="Стилизация текста" labelPosition="center" />
                                    <Box>
                                        <Text size="sm" fw={500} mb={4}>Стиль для ДАТ</Text>
                                        <Checkbox.Group value={dateFormatStyles} onChange={setDateFormatStyles}>
                                            <Group mt="xs">
                                                <Checkbox value="bold" label="Жирный" />
                                                <Checkbox value="italic" label="Курсив" />
                                                <Checkbox value="underline" label="Подчеркнутый" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Box>
                                    <Box><Text size="sm" fw={500} mb={4}>Стиль для ВРЕМЕНИ</Text>
                                        <Checkbox.Group value={timeFormatStyles} onChange={setTimeFormatStyles}>
                                            <Group mt="xs" >
                                                <Checkbox value="bold" label="Жирный" />
                                                <Checkbox value="italic" label="Курсив" />
                                                <Checkbox value="underline" label="Подчеркнутый" />
                                            </Group>
                                        </Checkbox.Group>
                                    </Box>
                                    <Divider />
                                    <Checkbox label="Случайный фон" checked={useRandomBackground} onChange={(e) => setUseRandomBackground(e.currentTarget.checked)} icon={IconWand} mt="xs" />
                                </Stack>
                            </Paper>
                        )}
                        {!isSubscriptionActive && subscriptionChecked && (
                            <Alert icon={<IconLock size="1rem" />} title="Расширенные настройки недоступны" color="blue" radius="md">
                                Для доступа к расширенным настройкам оформите подписку.
                                <Button mt="sm" variant='outline' onClick={() => navigate('/subscription')}>К подписке</Button>
                            </Alert>
                        )}

                        {generatedImageUrl && (
                            <Paper shadow="sm" p="lg" radius="md" withBorder mt="md" bg={theme.colors.green[0]}>
                                <Title order={5} mb="sm">Изображение сгенерировано:</Title>
                                <Image src={generatedImageUrl} alt="Сгенерированное расписание" radius="sm" maw={300} mx="auto" mb="sm" />
                                <Anchor href={generatedImageUrl} target="_blank" size="sm">
                                    <Group gap="xs"> <IconExternalLink size={14} /> Открыть в новой вкладке </Group>
                                </Anchor>
                            </Paper>
                        )}

                        <Button fullWidth size="lg" mt="xl" onClick={handleGenerateImage} loading={isGenerating}
                            disabled={isLoadingSchedules || (initialDates.length > 0 && (!schedules || Object.keys(schedules).length !== initialDates.length || initialDates.some(d => schedules[d]?.error)))}
                            leftSection={<IconPhoto size={20} />}>
                            Сгенерировать изображение
                        </Button>
                    </>
                )}
                {initialDates.length === 0 && subscriptionChecked && (
                    <Text c="dimmed" ta="center" mt="lg">
                        Выберите даты на странице расписания, чтобы сгенерировать новое изображение.
                    </Text>
                )}


                {/* Recent Images Section */}
                <Accordion mt="xl" variant="separated" defaultValue="recent-images">
                    <Accordion.Item value="recent-images">
                        <Accordion.Control icon={<IconHistory size={20} />}>
                            Недавние изображения ({recentImages.length})
                        </Accordion.Control>
                        <Accordion.Panel>
                            {isLoadingRecentImages && <Center><Loader /></Center>}
                            {!isLoadingRecentImages && recentImages.length === 0 && (
                                <Text c="dimmed" size="sm" ta="center">Нет ранее сгенерированных изображений.</Text>
                            )}
                            {!isLoadingRecentImages && recentImages.length > 0 && (
                                <ScrollArea.Autosize maxHeight={400}>
                                    <Stack gap="md">
                                        {recentImages.map((img, index) => (
                                            <Card key={img.id || index} p="sm" radius="md" withBorder>
                                                <Group justify="space-between" wrap="nowrap">
                                                    <Group gap="xs" align="center">
                                                        <Image src={img.url} alt={`Изображение ${index + 1}`} width={60} height={60} radius="sm" fit="contain" />
                                                        <Stack gap={0}>
                                                            <Anchor href={img.url} target="_blank" size="sm" lineClamp={1}>{img.url}</Anchor>
                                                            <Text size="xs" c="dimmed">
                                                                Создано: {formatTimestampForDisplay(img.createdAt)}
                                                            </Text>
                                                        </Stack>
                                                    </Group>
                                                    <CopyButton value={img.url} timeout={2000}>
                                                        {({ copied, copy }) => (
                                                            <Tooltip label={copied ? 'Скопировано!' : 'Копировать URL'} withArrow>
                                                                <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy} variant="subtle">
                                                                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </CopyButton>
                                                </Group>
                                            </Card>
                                        ))}
                                    </Stack>
                                </ScrollArea.Autosize>
                            )}
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>

            </Stack>
        </Container>
    );
}

export default GenerateImagePage;
