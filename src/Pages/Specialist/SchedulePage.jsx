import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');

function SchedulePage({ telegramId, apiUrl }) {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);
    const [isCreatingImage, setIsCreatingImage] = useState(false);
    const [timeSlots, setTimeSlots] = useState([]);
    const [startTime, setStartTime] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(true);
    const [showTimeSlotForm, setShowTimeSlotForm] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);

    useEffect(() => {
        const fetchTimeSlots = async () => {
            try {
                const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
                const response = await fetch(`${apiUrl}/Schedule/GetSchedule?telegramId=${telegramId}&date=${formattedDate}`);
                if (response.ok) {
                    const data = await response.json();
                    setTimeSlots(data);
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
                console.error("Error CreateTimeSlot");
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

            const response = await fetch(`${apiUrl}/Schedule/UpdateTimeSlot?telegramId=${telegramId}&timeSlotId=${timeSlotId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(timeSlotData)
            });

            if (response.ok) {
                setTimeSlots(prev => prev.map(slot => (slot.id === timeSlotId ? { ...slot, ...timeSlotData } : slot)));
                setEditingSlot(null);
            } else {
                console.error("Error updating time slot");
            }
        } catch (error) {
            console.error("Error updating time slot:", error);
        }
    };

    const handleDeleteTimeSlot = async (timeSlotId) => {
        try {
            const response = await fetch(`${apiUrl}/Schedule/DeleteTimeSlot?telegramId=${telegramId}&timeSlotId=${timeSlotId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const updatedTimeSlots = timeSlots.filter(slot => slot.id !== timeSlotId);
                setTimeSlots(sortTimeSlots(updatedTimeSlots));
            } else {
                console.error("Error deleting time slot");
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
            const timeA = dayjs(a.startTime, 'HH:mm');
            const timeB = dayjs(b.startTime, 'HH:mm');
            return timeA.valueOf() - timeB.valueOf();
        });
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

            {!isCreatingImage && showTimeSlotForm && (
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
                </div>
            )}

            {!isCreatingImage && (
                <>
                    <h2>Время</h2>
                    <ul>
                        {timeSlots.map((slot, index) => (
                                <li key={slot.id}>
                                    {slot.startTime} - {slot.status ? 'Свободно' : 'Занято'} : {slot.description}
                                    <button onClick={() => {
                                        setEditingSlot(slot);
                                        setStartTime(slot.startTime);
                                        setDescription(slot.description);
                                        setStatus(slot.status);
                                    }}>
                                        Редактировать
                                    </button>
                                    <button onClick={() => handleDeleteTimeSlot(slot.id)}>Удалить</button>
                                </li>
                            ))}

                    </ul>
                </>
            )}
        </div>
    );
}

export default SchedulePage;
