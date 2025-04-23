import React, { useState, useEffect } from 'react';
import { DatePicker } from '@mantine/dates';
import { Button, Input, Textarea, Select } from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
dayjs.locale('ru');

function SchedulePage({ telegramId, apiUrl }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState([]);
    const [startTime, setStartTime] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(true); 

    useEffect(() => {
        const fetchTimeSlots = async () => {
            try {
                const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');

                const response = await fetch(`${apiUrl}/Schedule/GetSchedule?telegramId=${telegramId}&date=${formattedDate}`);

                if (response.ok) {
                    const data = await response.json();
                    setTimeSlots(data)
                }
            }
            catch (error) {
                console.error("Error fetching specialist:", error);
            }
        };

        fetchTimeSlots()
    }, [selectedDate, telegramId]);

    const handleCreateTimeSlot = async () => {
        try {
            const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
            const response = await fetch(`${apiUrl}/Schedule/CreateTimeSlot?telegramId=${telegramId}&date=${formattedDate}&startTime=${startTime}&status=${status}&description=${description}`, {
                method: 'POST',
            });
            if (response.ok) {
                const data = await fetch(`${apiUrl}/Schedule/GetSchedule?telegramId=${telegramId}&date=${formattedDate}`);
                if (data.ok) {
                    const responseData = await data.json()
                    setTimeSlots(responseData)
                }

                setStartTime('');
                setDescription('');
                setStatus(true);
            }
            else {
                console.error("Error CreateTimeSlot");
            }
        }
        catch (error) {
            console.error("Error fetching specialist:", error);
        }

    };
    return (
        <div>
            <h1>Расписание</h1>
            <DatePicker
                locale="ru"
                label="Выберите дату"
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={dayjs().toDate()}
                maxDate={dayjs().add(365, 'days').toDate()} 
            />

            <h2>Добавить время</h2>
            <Input
                type="time"
                placeholder="Время начала"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
            />
            <Textarea
                placeholder="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <Select
                data={[
                    { value: "false", label: "Свободно" },
                    { value: "true", label: "Занято" }
                ]}
                value={String(status)}
                onChange={(value) => setStatus(value === "true")}
            />

            <Button onClick={handleCreateTimeSlot}>Создать</Button>

            <h2>Время</h2>
            <ul>
                {timeSlots.map((slot, index) => (
                    <li key={index}>
                        {slot.startTime} - {slot.status} : {slot.description}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default SchedulePage;