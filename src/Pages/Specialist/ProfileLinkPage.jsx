import React, { useEffect, useRef } from 'react'; // Added useRef
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; // Correct named import
import {
    Container,
    Stack,
    Title,
    Text,
    TextInput,
    Button,
    Group,
    Paper,
    CopyButton,
    Tooltip,
    ActionIcon,
    Center // For centering QR code and button
} from '@mantine/core';
import { IconLink, IconCopy, IconCheck, IconChevronLeft, IconQrcode, IconDownload } from '@tabler/icons-react';

function ProfileLinkPage({ profileLink }) {
    const navigate = useNavigate();
    const qrCodeRef = useRef(null); // Ref to access the QR code canvas

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

    const handleDownloadQR = () => {
        if (qrCodeRef.current) {
            // The qrcode.react library renders the QRCodeCanvas component which contains a canvas element.
            // We need to find that inner canvas element.
            const canvasElement = qrCodeRef.current.querySelector('canvas');
            if (canvasElement) {
                const pngUrl = canvasElement
                    .toDataURL("image/png")
                    .replace("image/png", "image/octet-stream"); // Prompt for download

                let downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = "profile_qr_code.png"; // Filename for download
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            } else {
                console.error("QR Code canvas element not found.");
                // Optionally show a user-facing error
                window.Telegram?.WebApp?.showPopup?.({ message: "Не удалось найти QR-код для скачивания." });
            }
        }
    };


    return (
        <Container size="sm" py="lg">
            <Stack gap="lg">
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
                                styles={{ input: { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                                style={{ flexGrow: 1, minWidth: 0 }}
                                aria-label="Ссылка на профиль"
                            />
                            <CopyButton value={profileLink} timeout={2000}>
                                {({ copied, copy }) => (
                                    <Tooltip label={copied ? 'Скопировано!' : 'Копировать'} withArrow position="right">
                                        <ActionIcon
                                            color={copied ? 'teal' : 'gray'}
                                            variant="filled"
                                            onClick={copy}
                                            size="lg"
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

                {/* QR Code display and download */}
                {profileLink && ( // Only show QR if profileLink exists
                    <Paper shadow="xs" p="lg" radius="md" withBorder mt="lg">
                        <Stack align="center" gap="md">
                            <Group gap="xs">
                                <IconQrcode size={20} />
                                <Text fw={500}>QR-код для быстрой ссылки:</Text>
                            </Group>
                            {/*
                                The QRCodeCanvas component itself is a div wrapper.
                                We give this wrapper a ref to find the inner canvas.
                            */}
                            <div ref={qrCodeRef} style={{ display: 'inline-block', background: 'white', padding: '10px', borderRadius: '4px' }}>
                                <QRCodeCanvas
                                    value={profileLink}
                                    size={160} // Increased size for better scannability/download quality
                                    level="H" // High error correction
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    imageSettings={{ // Optional: Add a small logo in the center
                                        // src: "url_to_your_logo.png",
                                        // height: 30,
                                        // width: 30,
                                        // excavate: true, // Clears out space for the logo
                                    }}
                                />
                            </div>
                            <Text size="sm" c="dimmed" ta="center">
                                Клиенты могут отсканировать этот код камерой телефона.
                            </Text>
                            <Button
                                onClick={handleDownloadQR}
                                leftSection={<IconDownload size={16} />}
                                variant="light"
                                mt="xs"
                            >
                                Скачать QR-код
                            </Button>
                        </Stack>
                    </Paper>
                )}


                {window.Telegram?.WebApp?.isVersionAtLeast('6.1') && (
                    <Button
                        mt="lg"
                        fullWidth
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'cyan' }}
                        onClick={() => {
                            window.Telegram.WebApp.openTelegramLink(
                                `https://t.me/share/url?url=${encodeURIComponent(profileLink)}&text=${encodeURIComponent("Записывайтесь ко мне на услуги!")}`
                            );
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