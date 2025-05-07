import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; 
import {
    Container,
    Stack,
    Title,
    Text,
    TextInput,
    Button,
    Group,
    Paper, // To visually group the link and button
    CopyButton, // Mantine's built-in copy functionality
    Tooltip, // To show feedback on copy
    ActionIcon // For a copy icon button
} from '@mantine/core';
import { IconLink, IconCopy, IconCheck, IconChevronLeft } from '@tabler/icons-react';

function ProfileLinkPage({ profileLink }) {
    const navigate = useNavigate();

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

    return (
        <Container size="sm" py="lg">
            <Stack gap="lg">
                {/* Back button handled by Telegram integration */}
                <Title order={2} ta="center">
                    <Group justify="center" gap="xs">
                        <IconLink size={28} />
                        <span>Ваша ссылка на профиль</span>
                    </Group>
                </Title>

                <Text ta="center" c="dimmed" size="sm">
                    Поделитесь этой ссылкой с клиентами, чтобы они могли легко просмотреть ваш профиль и записаться на услуги.
                </Text>

                <Paper shadow="xs" p="md" radius="md" withBorder>
                    <Stack gap="md">
                        <Text fw={500}>Ссылка для клиентов:</Text>
                        <Group gap="xs" wrap="nowrap" preventGrowOverflow={false}>
                            <TextInput
                                value={profileLink}
                                readOnly
                                styles={{ input: { overflow: 'hidden', textOverflow: 'ellipsis' } }} // Handle long links
                                style={{ flexGrow: 1, minWidth: 0 }} // Ensure input grows and shrinks
                                aria-label="Ссылка на профиль"
                            />
                            <CopyButton value={profileLink} timeout={2000}>
                                {({ copied, copy }) => (
                                    <Tooltip label={copied ? 'Скопировано!' : 'Копировать'} withArrow position="right">
                                        <ActionIcon
                                            color={copied ? 'teal' : 'gray'}
                                            variant="filled" // Or "light" or "outline"
                                            onClick={copy}
                                            size="lg" // Match TextInput size
                                        >
                                            {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </CopyButton>
                        </Group>
                        <Text size="xs" c="dimmed">
                            Нажмите на иконку, чтобы скопировать ссылку в буфер обмена.
                        </Text>
                    </Stack>
                </Paper>

                {/* Optional: QR Code display */}
                <Paper shadow="xs" p="md" radius="md" withBorder mt="lg">
                    <Stack align="center" gap="xs">
                        <Text fw={500}>QR-код для быстрой ссылки:</Text>
                        <QRCodeCanvas value={profileLink} size={128} level="H" />
                        <Text size="xs" c="dimmed">Клиенты могут отсканировать этот код камерой телефона.</Text>
                    </Stack>
                </Paper>

                {/* Optional: Share button */}
                {window.Telegram?.WebApp?.isVersionAtLeast('6.1') && ( // Check for Telegram WebApp version for share API
                    <Button
                        mt="lg"
                        fullWidth
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'cyan' }}
                        onClick={() => {
                            window.Telegram.WebApp.openTelegramLink(
                                `https://t.me/share/url?url=${encodeURIComponent(profileLink)}&text=${encodeURIComponent("Записывайтесь ко мне на услуги!")}`
                            );
                            // Or use Telegram's built-in share if appropriate for the Mini App context
                            // window.Telegram.WebApp.showShareDialog({ url: profileLink, text: "Check out my profile!" });
                        }}
                    >
                        Поделиться в Telegram
                    </Button>
                )}
            </Stack>
        </Container>
    );
}

export default ProfileLinkPage;