import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

function HomePage({ role, telegramId, apiUrl }) {
    const [activeAppointments, setActiveAppointments] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchActiveAppointments = async () => {
            const currentDate = dayjs().format('YYYY-MM-DD');

            try {
                let url = '';
                if (role === "client") {
                    url = `${apiUrl}/Appointments/GetActiveAppointments?telegramId=${telegramId}&date=${currentDate}`;
                }
                if (role === "specialist") {
                    url = `${apiUrl}/Appointments/GetUnconfirmedAppointments?telegramId=${telegramId}&date=${currentDate}`;
                }

                if (url) {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        setActiveAppointments(data);
                    } else {
                        console.error("Ошибка при получении записей");
                    }
                }
            } catch (error) {
                console.error("Ошибка сети при получении записей:", error);
            }
        };

        if (telegramId) {
            fetchActiveAppointments();
        }
    }, [telegramId]);

    const handleCancelAppointment = async (timeSlotId) => {
        const confirmCancel = window.confirm("Вы уверены, что хотите отменить запись?");
        if (!confirmCancel) return;

        try {
            const response = await fetch(`${apiUrl}/Appointments/CancelAppointment?timeSlotId=${timeSlotId}`, {
                method: 'POST'
            });

            if (response.ok) {
                setActiveAppointments(prev => prev.filter(slot => slot.id !== timeSlotId));
                Telegram.WebApp?.showPopup({ message: "Запись успешно отменена." });
            } else {
                Telegram.WebApp?.showPopup({ message: "Ошибка при отмене записи!" });
            }
        } catch (error) {
            console.error("Ошибка при отмене записи:", error);
            Telegram.WebApp?.showPopup({ message: "Ошибка сети при отмене записи!" });
        }
    };

    const handleConfirmAppointment = async (timeSlotId) => {
        const confirmAction = window.confirm("Вы уверены, что хотите подтвердить запись?");
        if (!confirmAction) return;

        try {
            const response = await fetch(`${apiUrl}/Appointments/ConfirmAppointment?timeSlotId=${timeSlotId}`, {
                method: 'POST'
            });

            if (response.ok) {
                setActiveAppointments(prev => prev.filter(slot => slot.id !== timeSlotId));
                Telegram.WebApp?.showPopup({ message: "Запись успешно подтверждена." });
            } else {
                Telegram.WebApp?.showPopup({ message: "Ошибка при подтверждении записи!" });
            }
        } catch (error) {
            console.error("Ошибка при подтверждении записи:", error);
            Telegram.WebApp?.showPopup({ message: "Ошибка сети при подтверждении записи!" });
        }
    };

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
                                <button onClick={() => navigate(`/profile/${appointment.specialistId}`)} >
                                    Перейти в профиль специалиста
                                </button>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div>
                    <h2>Неподтверждённые записи</h2>
                    {activeAppointments.length === 0 ? (
                        <p>Нет новых заявок</p>
                    ) : (
                        activeAppointments.map((slot, index) => (
                            <div key={index}>
                                <h3>Запись на {slot.date}, {slot.startTime}</h3>
                                <p><strong>Комментарий:</strong> {slot.comment}</p>
                                <p><strong>Услуги:</strong> {slot.services}</p>
                                <p><strong>Сумма:</strong> {slot.totalPrice}</p>
                                <p><strong>Длительность:</strong> {slot.totalDuration} мин.</p>
                                <p><strong>Описание:</strong> {slot.description}</p>
                                <button onClick={() => window.open(`https://t.me/${slot.usernameClient}`, '_blank')} >
                                    Клиент
                                </button>
                                {slot.parent === slot.id && (
                                    <div>
                                        <button onClick={() => handleConfirmAppointment(slot.id)}>Подтвердить</button>
                                        <button onClick={() => handleCancelAppointment(slot.id)}>Отменить</button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default HomePage;
