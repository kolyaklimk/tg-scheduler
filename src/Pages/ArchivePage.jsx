import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

function ArchivePage({ telegramId, role, apiUrl }) {
    const [archive, setArchive] = useState([]);
    const [lastDocId, setLastDocId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();

    const fetchArchive = async () => {
        if (loading || !hasMore) return;
        const pageSize = 2;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                telegramId,
                isSpecialist: role === "specialist",
                currentDate: dayjs().format('YYYY-MM-DD'),
                pageSize,
                lastDocId: lastDocId || ''
            });

            const response = await fetch(`${apiUrl}/Appointments/GetArchiveAppointments?${params.toString()}`);

            if (response.ok) {
                const data = await response.json();

                if (data.length < pageSize) {
                    setHasMore(false);
                }
                setArchive(prev => [...prev, ...data]);
                setLastDocId(data[data.length - 1].id);
            } else {
                console.error("Ошибка при получении архива записей");
            }
        } catch (error) {
            console.error("Ошибка при загрузке архива:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (telegramId) {
            fetchArchive();
        }
    }, [telegramId]);

    return (
        <div>
            <h1>Архив</h1>
            {archive.length === 0 ? (
                <p>Записей пока нет</p>
            ) : (
                archive.map((appointment, index) => (
                    <div key={index}>
                        <h3>Дата: {appointment.date}, {appointment.startTime}</h3>
                        <p><strong>Услуга:</strong> {appointment.services}</p>
                        <p><strong>Комментарий:</strong> {appointment.comment}</p>
                        <p><strong>Сумма:</strong> {appointment.totalPrice}</p>
                        <p><strong>Длительность:</strong> {appointment.totalDuration} мин.</p>
                        {role === "specialist" && (
                            <div>
                                <p><strong>Описание:</strong> {appointment.description}</p>
                                <button onClick={() => window.open(`https://t.me/${appointment.usernameClient}`, '_blank')}
                                >
                                    Клиент
                                </button>
                            </div>
                        )}
                        {role === "client" && (
                            <button
                                onClick={() => navigate(`/profile/${appointment.specialistId}`)}
                            >
                                Перейти в профиль специалиста
                            </button>
                        )}
                    </div>
                ))
            )}
            {hasMore ? (
                <button onClick={fetchArchive} disabled={loading}>
                    {loading ? 'Загрузка...' : 'Загрузить ещё'}
                </button>
            ) : (
                    <div>
                        <p>Больше записей нет</p>
                    </div>
            )}
        </div>
    );
}

export default ArchivePage;
