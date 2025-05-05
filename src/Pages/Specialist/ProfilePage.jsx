import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Stack,
    Title,
    Text,
    Button,
    Group,
    Paper,
    TextInput,
    Textarea,
    NumberInput,
    Switch,
    Avatar,
    FileInput,
    Loader,
    Badge,
    Center,
    Alert,
    Divider,
    ActionIcon,
    SimpleGrid, // For arranging service inputs
    Box, // For layout flexibility
    Anchor, // For links
    List, // For displaying services in client view
    useMantineTheme,
    LoadingOverlay, // For image upload loading
} from '@mantine/core';
import {
    IconUser, IconBriefcase, IconMail, IconLink, IconMapPin, IconListDetails, IconCheck, IconX,
    IconDeviceFloppy, IconUpload, IconPlus, IconTrash, IconInfoCircle, IconExternalLink, IconCalendarPlus, IconEdit, IconChevronLeft
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks'; // Useful for text inputs if needed

function ProfilePage() {
    const { telegramId: profileTelegramId } = useParams(); // Rename to avoid conflict
    const currentUserRole = localStorage.getItem('userRole');
    const currentUserTelegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString(); // Get current user's ID
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const theme = useMantineTheme();

    // --- State ---
    const [profileData, setProfileData] = useState({
        contactInfo: '',
        portfolioLink: '',
        location: '',
        services: {},
        working: false,
        name: '',
        description: '',
        profileImageUrl: '',
    });
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [error, setError] = useState(null);

    // State for adding new services (only for specialist view)
    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');
    const [newServiceDuration, setNewServiceDuration] = useState('');

    // Determine if the current user is viewing their own profile (specialist only)
    const isOwnProfile = currentUserRole === 'specialist' && currentUserTelegramId === profileTelegramId;

    // --- Effects ---

    // Fetch profile data
    const fetchProfile = useCallback(async () => {
        setIsLoadingProfile(true);
        setError(null);
        try {
            // Use the telegramId from the URL param
            const response = await fetch(`${apiUrl}/User/GetUser?telegramId=${profileTelegramId}`);
            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${await response.text()}`);
            }
            const data = await response.json();

            // Validate and set state
            setProfileData({
                contactInfo: data.contactInfo || '',
                portfolioLink: data.portfolioLink || '',
                location: data.location || '',
                // Ensure services is always an object
                services: typeof data.services === 'object' && data.services !== null ? data.services : {},
                working: !!data.working, // Ensure boolean
                name: data.name || `Специалист #${profileTelegramId}`, // Fallback name
                description: data.description || '',
                profileImageUrl: data.profileImageUrl || '',
            });

            // Cache services if viewing a specialist profile (for booking later)
            if (data.role === 'specialist') {
                localStorage.setItem(`specialistServices-${profileTelegramId}`, JSON.stringify(data.services || {}));
            }

        } catch (err) {
            console.error("Error fetching profile:", err);
            setError(err.message || "Не удалось загрузить профиль.");
            // Set default structure on error to prevent render issues
            setProfileData({ contactInfo: '', portfolioLink: '', location: '', services: {}, working: false, name: 'Ошибка', description: '', profileImageUrl: '' });
        } finally {
            setIsLoadingProfile(false);
        }
    }, [apiUrl, profileTelegramId]);

    useEffect(() => {
        if (profileTelegramId) {
            fetchProfile();
        } else {
            setError("Не указан ID специалиста.");
            setIsLoadingProfile(false);
        }
        // Add Telegram Back button integration
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
            // Clear cached services for this specific specialist when leaving the page? Maybe not necessary.
            // localStorage.removeItem(`specialistServices-${profileTelegramId}`);
        };
    }, [profileTelegramId, fetchProfile, navigate]);


    // --- Handlers (Specialist Own Profile Only) ---

    const handleFieldChange = (field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleServiceChange = (currentName, field, value) => {
        const numericValue = Number(value);
        // Basic validation (can be enhanced)
        if (field !== 'name' && (isNaN(numericValue) || (field === 'duration' && numericValue <= 0) || (field === 'price' && numericValue < 0))) {
            // Show transient error, maybe highlight the input?
            console.warn(`Invalid value for ${field}: ${value}`);
            // Keep the old value or allow invalid input temporarily until save?
            // For now, let's allow it and validate on save
        }

        setProfileData(prev => ({
            ...prev,
            services: {
                ...prev.services,
                [currentName]: {
                    ...prev.services[currentName],
                    [field]: field === 'price' || field === 'duration' ? numericValue : value // Store numbers
                }
            }
        }));
    };


    const handleAddService = () => {
        const trimmedName = newServiceName.trim();
        if (!trimmedName) {
            window.Telegram?.WebApp?.showPopup?.({ message: "Название услуги не может быть пустым." });
            return;
        }
        if (profileData.services.hasOwnProperty(trimmedName)) {
            window.Telegram?.WebApp?.showPopup?.({ message: "Услуга с таким названием уже существует!" });
            return;
        }
        const price = Number(newServicePrice);
        const duration = Number(newServiceDuration);

        if (isNaN(price) || price < 0) {
            window.Telegram?.WebApp?.showPopup?.({ message: "Введите корректную цену (≥ 0)." });
            return;
        }
        if (isNaN(duration) || duration <= 0) {
            window.Telegram?.WebApp?.showPopup?.({ message: "Введите корректную длительность (> 0)." });
            return;
        }

        setProfileData(prev => ({
            ...prev,
            services: {
                ...prev.services,
                [trimmedName]: { price, duration }
            }
        }));
        // Clear inputs
        setNewServiceName('');
        setNewServicePrice('');
        setNewServiceDuration('');
    };

    const handleRemoveService = (nameToRemove) => {
        // Optional: Confirmation dialog
        setProfileData(prev => {
            const updatedServices = { ...prev.services };
            delete updatedServices[nameToRemove];
            return { ...prev, services: updatedServices };
        });
    };

    const handleImageUpload = async (file) => {
        if (!file) return;
        setIsImageUploading(true);
        setError(null); // Clear previous errors

        const formData = new FormData();
        formData.append("image", file);
        // Add telegramId to associate the image (Backend needs to handle this)
        formData.append("telegramId", profileTelegramId);

        try {
            const response = await fetch(`${apiUrl}/User/UploadImage`, {
                method: 'POST',
                body: formData,
                // Headers might not be needed if backend expects multipart/form-data correctly
            });

            if (!response.ok) {
                throw new Error(`Ошибка загрузки ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            if (!data.imageUrl) {
                throw new Error("Ответ сервера не содержит URL изображения.");
            }
            handleFieldChange('profileImageUrl', data.imageUrl); // Update profile state directly
            window.Telegram?.WebApp?.showPopup?.({ message: "Аватар обновлен." });

        } catch (err) {
            console.error("Error uploading image:", err);
            setError("Произошла ошибка при загрузке изображения.");
            window.Telegram?.WebApp?.showPopup?.({ message: `Ошибка загрузки: ${err.message}` });
        } finally {
            setIsImageUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!isOwnProfile) return; // Should not happen, but safeguard

        setIsSaving(true);
        setError(null);

        // Frontend Validation before sending
        let validationError = null;
        if (!profileData.name?.trim()) {
            validationError = "Имя не может быть пустым.";
        }
        for (const name in profileData.services) {
            const service = profileData.services[name];
            if (isNaN(service.price) || service.price < 0) {
                validationError = `Некорректная цена для услуги "${name}".`; break;
            }
            if (isNaN(service.duration) || service.duration <= 0) {
                validationError = `Некорректная длительность для услуги "${name}".`; break;
            }
        }

        if (validationError) {
            setError(validationError);
            window.Telegram?.WebApp?.showPopup?.({ message: validationError });
            setIsSaving(false);
            return;
        }


        try {
            // Construct payload (ensure services are correctly formatted if needed)
            const payload = {
                telegramId: profileTelegramId, // The ID of the profile being edited
                name: profileData.name,
                working: profileData.working,
                contactInfo: profileData.contactInfo,
                portfolioLink: profileData.portfolioLink,
                location: profileData.location,
                description: profileData.description,
                services: profileData.services, // Send the whole object
                profileImageUrl: profileData.profileImageUrl,
            };

            console.log("Saving profile data:", payload);

            const response = await fetch(`${apiUrl}/User/SaveSpecialist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Ошибка сохранения ${response.status}: ${await response.text()}`);
            }

            console.log("Specialist data saved successfully!");
            // Update cached services after successful save
            localStorage.setItem(`specialistServices-${profileTelegramId}`, JSON.stringify(profileData.services));
            window.Telegram?.WebApp?.showPopup?.({ message: "Профиль успешно сохранён!" });
            // Optionally navigate away or show a persistent success message

        } catch (err) {
            console.error("Error saving specialist data:", err);
            setError(err.message || "Произошла ошибка при сохранении профиля.");
            window.Telegram?.WebApp?.showPopup?.({ message: `Ошибка сохранения: ${err.message}` });
        } finally {
            setIsSaving(false);
        }
    };


    // --- Render Logic ---

    if (isLoadingProfile) {
        return <Center style={{ height: '80vh' }}><Loader /></Center>;
    }

    // Client View or Viewing Another Specialist's Profile
    if (!isOwnProfile) {
        return (
            <Container size="sm" py="lg">
                <Stack gap="lg">
                    {error && (
                        <Alert icon={<IconInfoCircle size="1rem" />} title="Ошибка" color="red" radius="md">
                            {error}
                        </Alert>
                    )}
                    <Paper shadow="xs" p="lg" radius="md" withBorder>
                        <Stack align="center" gap="md">
                            <Avatar
                                src={profileData.profileImageUrl || null} // Use null if empty for default avatar
                                size={120}
                                radius="50%"
                                alt={profileData.name || 'Аватар'}
                            />
                            <Title order={2} ta="center">{profileData.name}</Title>
                            {profileData.working ? (
                                <Badge color="green" variant="light">Принимает записи</Badge>
                            ) : (
                                <Badge color="gray" variant="light">Сейчас не работает</Badge>
                            )}
                        </Stack>
                    </Paper>

                    {profileData.description && (
                        <Paper shadow="xs" p="lg" radius="md" withBorder>
                            <Title order={4} mb="xs">Описание</Title>
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{profileData.description}</Text>
                        </Paper>
                    )}

                    <Paper shadow="xs" p="lg" radius="md" withBorder>
                        <Title order={4} mb="md">Контактная информация</Title>
                        <Stack gap="sm">
                            {profileData.contactInfo && <Group gap="xs"><IconMail size={18} /><Text>{profileData.contactInfo}</Text></Group>}
                            {profileData.location && <Group gap="xs"><IconMapPin size={18} /><Text>{profileData.location}</Text></Group>}
                            {profileData.portfolioLink && (
                                <Group gap="xs">
                                    <IconLink size={18} />
                                    <Anchor href={profileData.portfolioLink.startsWith('http') ? profileData.portfolioLink : `//${profileData.portfolioLink}`} target="_blank" rel="noopener noreferrer">
                                        Портфолио
                                    </Anchor>
                                </Group>
                            )}
                            {!profileData.contactInfo && !profileData.location && !profileData.portfolioLink && (
                                <Text c="dimmed" size="sm">Контактная информация не указана.</Text>
                            )}
                        </Stack>
                    </Paper>

                    <Paper shadow="xs" p="lg" radius="md" withBorder>
                        <Title order={4} mb="md">Услуги</Title>
                        {Object.keys(profileData.services).length > 0 ? (
                            <List
                                spacing="sm"
                                size="sm"
                                icon={<IconCheck size={16} color={theme.colors.blue[6]} />}
                            >
                                {Object.entries(profileData.services).map(([name, details]) => (
                                    <List.Item key={name}>
                                        {name} - <strong>{details.price} руб.</strong> / {details.duration} мин.
                                    </List.Item>
                                ))}
                            </List>
                        ) : (
                            <Text c="dimmed" size="sm">Специалист пока не добавил услуги.</Text>
                        )}
                    </Paper>

                    {/* Only show "Book Appointment" if the profile belongs to a specialist and they are working */}
                    {profileData.working && (
                        <Button
                            fullWidth
                            size="lg"
                            onClick={() => navigate(`/schedule/${profileTelegramId}`)}
                            leftSection={<IconCalendarPlus size={20} />}
                            disabled={Object.keys(profileData.services).length === 0} // Disable if no services
                            title={Object.keys(profileData.services).length === 0 ? "Специалист не добавил услуги" : ""}
                        >
                            Записаться к специалисту
                        </Button>
                    )}
                </Stack>
            </Container>
        );
    }

    // Specialist Editing Own Profile View
    return (
        <Container size="sm" py="lg">
            <LoadingOverlay visible={isSaving} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Title order={2}>Редактировать профиль</Title>
                    <Button
                        onClick={handleSubmit}
                        leftSection={<IconDeviceFloppy size={18} />}
                        loading={isSaving}
                        disabled={isImageUploading} // Disable save while image uploads
                    >
                        Сохранить
                    </Button>
                </Group>

                {error && (
                    <Alert icon={<IconInfoCircle size="1rem" />} title="Ошибка" color="red" radius="md" withDismissible onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Stack gap="md">
                        <TextInput
                            label="Имя (Как вас видят клиенты)"
                            placeholder="Введите ваше имя или псевдоним"
                            value={profileData.name}
                            onChange={(e) => handleFieldChange('name', e.currentTarget.value)}
                            required
                            leftSection={<IconUser size={16} />}
                        />
                        <Switch
                            label="Принимаю записи (виден клиентам)"
                            checked={profileData.working}
                            onChange={(e) => handleFieldChange('working', e.currentTarget.checked)}
                            thumbIcon={profileData.working ? <IconCheck size={12} /> : <IconX size={12} />}
                        />
                        <Box pos="relative">
                            <LoadingOverlay visible={isImageUploading} zIndex={1} overlayProps={{ radius: "sm", blur: 2 }} />
                            <Group align="flex-start" wrap="nowrap">
                                <Avatar
                                    src={profileData.profileImageUrl || null}
                                    size={90}
                                    radius="50%"
                                    alt="Аватар"
                                />
                                <FileInput
                                    label="Аватар"
                                    placeholder="Загрузить изображение..."
                                    accept="image/png,image/jpeg,image/gif"
                                    onChange={handleImageUpload}
                                    leftSection={<IconUpload size={16} />}
                                    clearable // Allow removing image? Maybe need separate button
                                    disabled={isImageUploading}
                                    style={{ flexGrow: 1 }}
                                />
                            </Group>
                        </Box>
                        <Textarea
                            label="Описание профиля"
                            placeholder="Расскажите о себе, своем опыте..."
                            value={profileData.description}
                            onChange={(e) => handleFieldChange('description', e.currentTarget.value)}
                            autosize
                            minRows={3}
                        />
                    </Stack>
                </Paper>

                <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Title order={4} mb="md">Контактная информация</Title>
                    <Stack gap="md">
                        <TextInput
                            label="Контакты (Email, Телефон, TG)"
                            placeholder="Как с вами связаться"
                            value={profileData.contactInfo}
                            onChange={(e) => handleFieldChange('contactInfo', e.currentTarget.value)}
                            leftSection={<IconMail size={16} />}
                        />
                        <TextInput
                            label="Ссылка на портфолио"
                            placeholder="https://..."
                            value={profileData.portfolioLink}
                            onChange={(e) => handleFieldChange('portfolioLink', e.currentTarget.value)}
                            leftSection={<IconLink size={16} />}
                        />
                        <TextInput
                            label="Местоположение (Город, Адрес)"
                            placeholder="Где вы принимаете"
                            value={profileData.location}
                            onChange={(e) => handleFieldChange('location', e.currentTarget.value)}
                            leftSection={<IconMapPin size={16} />}
                        />
                    </Stack>
                </Paper>


                <Paper shadow="xs" p="lg" radius="md" withBorder>
                    <Title order={4} mb="md">Услуги</Title>
                    <Stack gap="md">
                        {/* Add New Service Form */}
                        <Paper p="sm" withBorder radius="sm">
                            <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm" mb="sm">
                                <TextInput
                                    placeholder="Название услуги"
                                    value={newServiceName}
                                    onChange={(e) => setNewServiceName(e.currentTarget.value)}
                                />
                                <NumberInput
                                    placeholder="Цена (руб.)"
                                    value={newServicePrice}
                                    onChange={setNewServicePrice} // Handles string/number conversion
                                    min={0}
                                    step={50}
                                    allowDecimal={false}
                                />
                                <NumberInput
                                    placeholder="Длит. (мин.)"
                                    value={newServiceDuration}
                                    onChange={setNewServiceDuration}
                                    min={1}
                                    step={15}
                                    allowDecimal={false}
                                />
                            </SimpleGrid>
                            <Button
                                fullWidth
                                leftSection={<IconPlus size={16} />}
                                onClick={handleAddService}
                                variant='light'
                                size='sm'
                            >
                                Добавить услугу
                            </Button>
                        </Paper>

                        {/* Existing Services List */}
                        {Object.keys(profileData.services).length > 0 ? (
                            <Stack gap="sm" mt="md">
                                {Object.entries(profileData.services).map(([name, details]) => (
                                    <Paper p="sm" shadow="xs" radius="sm" withBorder key={name}>
                                        <Group justify="space-between" wrap="nowrap" gap="xs" >
                                            {/* Make name editable? For now, no. */}
                                            <Text fw={500} style={{ flexShrink: 0, marginRight: 'auto' }}>{name}</Text>
                                            <Group gap="xs" wrap="nowrap">
                                                <NumberInput
                                                    aria-label={`Цена для ${name}`}
                                                    value={details.price}
                                                    onChange={(value) => handleServiceChange(name, 'price', value)}
                                                    min={0} step={50} hideControls
                                                    styles={{ input: { width: '80px', textAlign: 'right' } }}
                                                    rightSection="₽" rightSectionWidth={20}
                                                />
                                                <NumberInput
                                                    aria-label={`Длительность для ${name}`}
                                                    value={details.duration}
                                                    onChange={(value) => handleServiceChange(name, 'duration', value)}
                                                    min={1} step={15} hideControls
                                                    styles={{ input: { width: '70px', textAlign: 'right' } }}
                                                    rightSection="м" rightSectionWidth={20}
                                                />
                                                <ActionIcon
                                                    variant="subtle" color="red"
                                                    onClick={() => handleRemoveService(name)}
                                                    title={`Удалить ${name}`}
                                                >
                                                    <IconTrash size={18} />
                                                </ActionIcon>
                                            </Group>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        ) : (
                            <Text c="dimmed" size="sm" ta="center" mt="md">У вас пока нет добавленных услуг.</Text>
                        )}
                    </Stack>
                </Paper>
                <Button
                    mt="lg"
                    onClick={handleSubmit}
                    leftSection={<IconDeviceFloppy size={18} />}
                    loading={isSaving}
                    size="lg"
                    fullWidth
                    disabled={isImageUploading}
                >
                    Сохранить все изменения
                </Button>

            </Stack>
        </Container>
    );
}

export default ProfilePage;