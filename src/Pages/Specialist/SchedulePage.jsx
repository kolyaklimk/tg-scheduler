import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');

function SchedulePage() {
    const { telegramId } = useParams();
    const role = localStorage.getItem('userRole');
    const navigate = useNavigate();
    const [parsedServices, setParsedServices] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);
    const [isCreatingImage, setIsCreatingImage] = useState(false);
    const [timeSlots, setTimeSlots] = useState([]);
    const [startTime, setStartTime] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(true);
    const [showTimeSlotForm, setShowTimeSlotForm] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [userTelegramId, setUserTelegramId] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const [comment, setComment] = useState('');
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const id = window.Telegram.WebApp.initDataUnsafe?.user?.id;
        setUserTelegramId(String(id));
        setParsedServices(JSON.parse(localStorage.getItem('specialistServices')));
    }, []);

    useEffect(() => {
        const fetchTimeSlots = async () => {
            if (!selectedDate) return;
            try {
                const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
                const response = await fetch(`${apiUrl}/Schedule/GetSchedule?telegramId=${telegramId}&date=${formattedDate}`);
                if (response.ok) {
                    const data = await response.json();
                    setTimeSlots(sortTimeSlots(data));
                    if (role === "specialist") {
                        setEditingSlot(null);
                        setStartTime('');
                        setDescription('');
                        setStatus(true);
                    }
                }
            } catch (error) {
                console.error("Error fetching schedule:", error);
            }
        };
        if (telegramId && selectedDate && !isCreatingImage) {
            fetchTimeSlots();
        }
    }, [telegramId, selectedDate, isCreatingImage]);

    const handleCreateImage = () => {
        const formattedDates = selectedDates.map(d => dayjs(d).format('YYYY-MM-DD'));
        navigate('/generate-image', { state: { dates: formattedDates } });
    };

    const handleCreateTimeSlot = async () => {
        if (!startTime) {
            Telegram.WebApp.showPopup({ message: "StartTime is required!" });
            return;
        }

        const isDuplicate = timeSlots.some(slot => slot.startTime === startTime);
        if (isDuplicate) {
            Telegram.WebApp.showPopup({ message: "Этот временной слот уже существует!" });
            return;
        }

        try {
            const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
            const timeSlotData = {
                date: formattedDate,
                startTime,
                description,
                status,
                clientId: ""
            };

            const response = await fetch(`${apiUrl}/Schedule/CreateTimeSlot?telegramId=${telegramId}&date=${formattedDate}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timeSlotData)
            });

            if (response.ok) {
                const data = await response.json();
                const newTimeSlot = { ...timeSlotData, id: data.id };
                setTimeSlots(prev => sortTimeSlots([...prev, newTimeSlot]));

                setStartTime('');
                setDescription('');
                setStatus(true);
            } else {
                Telegram.WebApp.showPopup({ message: "Error CreateTimeSlot!" });
            }
        } catch (error) {
            console.error("Error creating time slot:", error);
        }
    };

    const handleUpdateTimeSlot = async (timeSlotId) => {
        try {
            const timeSlotData = {
                status,
                description,
                clientId: ""
            };

            const response = await fetch(`${apiUrl}/Schedule/UpdateTimeSlot?timeSlotId=${timeSlotId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timeSlotData)
            });

            if (response.ok) {
                setTimeSlots(prev => prev.map(slot => (slot.id === timeSlotId ? { ...slot, ...timeSlotData } : slot)));
                setEditingSlot(null);
            } else {
                Telegram.WebApp.showPopup({ message: "Error updating time slot!" });
            }
        } catch (error) {
            console.error("Error updating time slot:", error);
        }
    };

    const handleDeleteTimeSlot = async (timeSlotId) => {
        try {
            const response = await fetch(`${apiUrl}/Schedule/DeleteTimeSlot?timeSlotId=${timeSlotId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const updatedTimeSlots = timeSlots.filter(slot => slot.id !== timeSlotId);
                setTimeSlots(sortTimeSlots(updatedTimeSlots));
            } else {
                Telegram.WebApp.showPopup({ message: "Error deleting time slot!" });
            }
        } catch (error) {
            console.error("Error deleting time slot:", error);
        }
    };

    const toggleCreateImageMode = () => {
        setIsCreatingImage(prev => !prev);
        setSelectedDates([]);
    };

    const handleDateClick = (date) => {
        if (!isCreatingImage) {
            setSelectedDate(date);
            setShowTimeSlotForm(date !== null);

            setSelectedSlot(null);
            setSelectedServices([]);
            setComment('');
            return;
        }

        const alreadySelected = selectedDates.some(d => dayjs(d).isSame(date, 'day'));
        if (alreadySelected) {
            setSelectedDates(prev => prev.filter(d => !dayjs(d).isSame(date, 'day')));
        } else {
            setSelectedDates(prev => [...prev, date]);
        }
    };

    const handleCancelEdit = () => {
        setEditingSlot(null);
        setStartTime('');
        setDescription('');
        setStatus(true);
    };

    const sortTimeSlots = (slots) => {
        return [...slots].sort((a, b) => {
            const [aH, aM] = a.startTime.split(':').map(Number);
            const [bH, bM] = b.startTime.split(':').map(Number);
            return aH * 60 + aM - (bH * 60 + bM);
        });
    };

    const handleSlotClick = (slot) => {
        setSelectedSlot(slot);
    };

    const handleServiceToggle = (serviceName) => {
        const serviceData = parsedServices[serviceName];

        setSelectedServices((prev) => {
            const exists = prev.find(s => s.name === serviceName);
            return exists
                ? prev.filter(s => s.name !== serviceName)
                : [...prev, { name: serviceName, price: serviceData.price, duration: serviceData.duration }];
        });
    };


    const handleBookingSubmit = async () => {
        if (!selectedSlot || selectedServices.length === 0) {
            Telegram.WebApp.showPopup({ message: "Выберите слот и хотя бы одну услугу!" });
            return;
        }

        const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
        const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);

        const desiredStart = dayjs(`${dayjs(selectedDate).format('YYYY-MM-DD')}T${selectedSlot.startTime}`);
        const desiredEnd = desiredStart.add(totalDuration, 'minute');
        const hasConflict = timeSlots.some(slot => {
            
            if (slot.status === true || slot.id === selectedSlot.id) return false;

            const slotStart = dayjs(`${dayjs(selectedDate).format('YYYY-MM-DD')}T${slot.startTime}`);

            return desiredStart.isBefore(slotStart) && desiredEnd.isAfter(slotStart);
        });



        if (hasConflict) {
            Telegram.WebApp.showPopup({ message: "Во время желаемой услуги уже есть записи" });
            return;
        }

        const appointmentData = {
            clientId: userTelegramId,
            specialistId: telegramId,
            comment: comment,
            services: selectedServices.map(s => s.name).join(", "),
            totalPrice,
            totalDuration,
            startTime: selectedSlot.startTime,
            date: dayjs(selectedDate).format('YYYY-MM-DD'),
            status: false,
            isConfirmed: false,
        };

        try {
            const response = await fetch(`${apiUrl}/Appointments/BookAppointment?timeSlotId=${selectedSlot.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(appointmentData),
            });

            if (response.ok) {
                Telegram.WebApp.showPopup({ message: "Бронирование успешно!" });
                navigate('/');
            } else {
                Telegram.WebApp.showPopup({ message: "Ошибка бронирования." });
            }
        } catch (err) {
            console.error(err);
            Telegram.WebApp.showPopup({ message: "Ошибка при отправке запроса."});
        }
    };

    return (
        <div className="schedule-page">
            <h1>Расписание</h1>

            <button onClick={toggleCreateImageMode}>
                {isCreatingImage ? 'Отмена' : 'Создать изображение'}
            </button>

            {isCreatingImage && (
                <button onClick={handleCreateImage}>
                    Создать
                </button>
            )}

            <DatePicker
                locale="ru"
                multiple={isCreatingImage}
                value={isCreatingImage ? selectedDates : selectedDate}
                onChange={handleDateClick}
                minDate={dayjs().toDate()}
                maxDate={dayjs().add(365, 'days').toDate()}
                getDayProps={(date) => {
                    const isSelected =
                        isCreatingImage
                            ? selectedDates.some(d => dayjs(d).isSame(date, 'day'))
                            : selectedDate && dayjs(date).isSame(selectedDate, 'day');

                    return {
                        style: {
                            backgroundColor: isSelected ? '#f0f0f0' : undefined,
                            borderRadius: isSelected ? '6px' : undefined,
                        }
                    };
                }}
            />

            {role == "specialist" && !isCreatingImage && showTimeSlotForm && (
                <div>
                    <h2>{editingSlot ? 'Редактировать время' : 'Добавить время'}</h2>
                    <input
                        type="time"
                        placeholder="Время начала"
                        value={startTime}
                        disabled={editingSlot}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                    <textarea
                        placeholder="Описание"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <select value={status} onChange={(e) => setStatus(e.target.value === 'true')}>
                        <option value="true">Свободно</option>
                        <option value="false">Занято</option>
                    </select>

                    {editingSlot ? (
                        <>
                            <button onClick={() => handleUpdateTimeSlot(editingSlot.id)}>Сохранить изменения</button>
                            <button onClick={handleCancelEdit}>Отмена</button>
                        </>
                    ) : (
                        <button onClick={handleCreateTimeSlot}>Создать</button>
                    )}
                    <h2>Время</h2>
                    <ul>
                        {timeSlots.map((slot) => (
                            <li key={slot.id}>
                                {slot.startTime} - {slot.status ? 'Свободно' : 'Занято'} : {slot.description}

                                {(slot.status === false && slot.isConfirmed === false) ? (
                                    
                                    <button onClick={() => window.location.href = '/'}>
                                        Ответить на заявку
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => {
                                            setEditingSlot(slot);
                                            setStartTime(slot.startTime);
                                            setDescription(slot.description);
                                            setStatus(slot.status);
                                        }}>
                                            Редактировать
                                        </button>
                                        <button onClick={() => handleDeleteTimeSlot(slot.id)}>Удалить</button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>

                </div>
            )}

            {role === "client" && (
                <div>
                    {selectedDate && (
                        <div>
                            {timeSlots.length ?
                                <div>
                                    <h2>Выберите время</h2>
                                    <div>
                                        {timeSlots.map(slot => {
                                            const isSelected = selectedSlot?.id === slot.id;
                                            const isDisabled = slot.status === false;

                                            return (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => handleSlotClick(slot)}
                                                    disabled={isDisabled}
                                                    style={{
                                                        backgroundColor: isSelected ? '#4caf50' : '#e0e0e0',
                                                        color: isSelected ? 'white' : 'black',
                                                        margin: '5px',
                                                        padding: '10px 20px',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                        textDecoration: isDisabled ? 'line-through' : 'none',
                                                        opacity: isDisabled ? 0.5 : 1,
                                                    }}
                                                >
                                                    {slot.startTime}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                : <p>В этот день нет свободного времени</p>}
                        </div>
                    )}


                    {selectedSlot && (
                        <div>
                            <h2>Выберите услуги</h2>
                            <div>
                                {parsedServices
                                    ? Object.entries(parsedServices).map(([serviceName, serviceData]) => (
                                        <label key={serviceName}>
                                            <input
                                                type="checkbox"
                                                checked={selectedServices.some(s => s.name === serviceName)}
                                                onChange={() => handleServiceToggle(serviceName)}
                                            />
                                            {serviceName} — {serviceData.price} руб. / {serviceData.duration} мин
                                        </label>
                                    ))
                                    : <p>Нет доступных услуг</p>}
                            </div>

                            <div>
                                <label>Комментарий</label>
                                <textarea
                                    placeholder="Ваш комментарий"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            <button onClick={handleBookingSubmit}>
                                Записаться
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SchedulePage;
