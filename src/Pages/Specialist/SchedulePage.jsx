import React, { useState, useEffect } from 'react';
import { DatePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');

function SchedulePage({ telegramId, apiUrl }) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]); // для выбора нескольких дат
    const [isCreatingImage, setIsCreatingImage] = useState(false); // режим "создания изображения"
    const [timeSlots, setTimeSlots] = useState([]);
    const [startTime, setStartTime] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(true);
    const [showTimeSlotForm, setShowTimeSlotForm] = useState(false);

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
                console.error("Error fetching specialist:", error);
            }
        };
        if (telegramId && selectedDate && !isCreatingImage) {
            fetchTimeSlots();
        }
    }, [telegramId, selectedDate, isCreatingImage]);

    const handleCreateTimeSlot = async () => {
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
                setTimeSlots(prev => [...prev, timeSlotData]);
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

    const toggleCreateImageMode = () => {
        setIsCreatingImage(prev => !prev);
        setSelectedDates([]); // сбрасываем выбор при включении/выключении
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

    return (
        <div className="schedule-page">
            <h1>Расписание</h1>

            <button onClick={toggleCreateImageMode}>
                {isCreatingImage ? 'Отмена' : 'Создать изображение'}
            </button>

            {isCreatingImage && (
                <button onClick={() => console.log("Создать изображение из дат:", selectedDates)}>
                    Создать
                </button>
            )}

            <DatePicker
                locale="ru"
                multiple
                value={isCreatingImage ? selectedDates : selectedDate}
                onChange={handleDateClick}
                minDate={dayjs().toDate()}
                maxDate={dayjs().add(365, 'days').toDate()}
                getDayProps={(date) => ({
                    style: {
                        borderBottom: isCreatingImage && selectedDates.some(d => dayjs(d).isSame(date, 'day')) ? '2px solid red' : undefined,
                    },
                })}
            />

            {!isCreatingImage && showTimeSlotForm && (
                <div>
                    <h2>Добавить время</h2>
                    <input
                        type="time"
                        placeholder="Время начала"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                    <textarea
                        placeholder="Описание"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <select value={status} onChange={(e) => setStatus(e.target.value === 'false')}>
                        <option value="true">Свободно</option>
                        <option value="false">Занято</option>
                    </select>

                    <button onClick={handleCreateTimeSlot}>Создать</button>
                </div>
            )}

            {!isCreatingImage && (
                <>
                    <h2>Время</h2>
                    <ul>
                        {timeSlots.map((slot, index) => (
                            <li key={index}>
                                {slot.startTime} - {slot.status ? 'Занято' : 'Свободно'} : {slot.description}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

export default SchedulePage;
