import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage({ role, telegramId }) {
    const [activeAppointments, setActiveAppointments] = useState([]);
    const currentDate = dayjs().format('YYYY-MM-DD');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchActiveAppointments = async () => {
            try {
                const response = await fetch(`${apiUrl}/Appointments/GetActiveAppointments?telegramId=${telegramId}&date=${currentDate}`);
                if (response.ok) {
                    const data = await response.json();
                    setActiveAppointments(data);
                } else {
                    console.error("Ошибка при получении активных записей");
                }
            } catch (error) {
                console.error("Ошибка сети при получении активных записей:", error);
            }
        };

        if (telegramId) {
            fetchActiveAppointments();
        }
    }, [telegramId]);

    return (
        <div>
            <h1>Главная страница</h1>
            <p>Ваша роль: {role}</p>

            {role === 'client' ? (
                <div>
                    <h2>Ваши активные записи на {selectedDate}</h2>
                    {activeAppointments.length === 0 ? (
                        <p>Нет активных записей на выбранную дату.</p>
                    ) : (
                        activeAppointments.map((appointment, index) => (
                            <div key={index}>
                                <h3>Запись на {appointment.date}</h3>
                                <p><strong>Услуга:</strong> {appointment.services}</p>
                                <p><strong>Комментарий:</strong> {appointment.comment}</p>
                                <p><strong>Сумма:</strong> {appointment.totalPrice}</p>
                                <p><strong>Длительность:</strong> {appointment.totalDuration} мин.</p>
                                <button
                                    onClick={() => navigate(`/profile/${appointment.specialistId}`)}
                                >
                                    Перейти в профиль специалиста
                                </button>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div>
                    <h2>Административная панель</h2>
                    {/* Здесь могут быть другие компоненты для ролей администраторов или специалистов */}
                </div>
            )}
        </div>
    );
}

export default HomePage;
