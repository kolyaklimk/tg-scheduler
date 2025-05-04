import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

function HomePage({ role, telegramId, apiUrl }) {
    const [activeAppointments, setActiveAppointments] = useState([]);
    const currentDate = dayjs().format('YYYY-MM-DD');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchActiveAppointments = async () => {
            try {
                if (role === "client") {
                    const response = await fetch(`${apiUrl}/Appointments/GetActiveAppointments?telegramId=${telegramId}&date=${currentDate}`);
                    if (response.ok) {
                        const data = await response.json();
                        setActiveAppointments(data);
                    } else {
                        console.error("Ошибка при получении активных записей");
                    }
                }
                if (role === "specialist") {

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
                    <h2>Ваши активные записи</h2>
                    {activeAppointments.length === 0 ? (
                        <p>Нет активных записей</p>
                    ) : (
                        activeAppointments.map((appointment, index) => (
                            <div key={index}>
                                <h3>Запись на {appointment.date}, {appointment.startTime}</h3>
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
