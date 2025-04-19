import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ProfilePage.css';

function ProfilePage() {
    const { telegramId } = useParams();
    const role = localStorage.getItem('userRole');
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const [contactInfo, setContactInfo] = useState('');
    const [portfolioLink, setPortfolioLink] = useState('');
    const [location, setLocation] = useState('');
    const [services, setServices] = useState({});
    const [working, setWorking] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');
    const [newServiceDuration, setNewServiceDuration] = useState('');

    useEffect(() => {
        const fetchSpecialist = async () => {
            try {
                const response = await fetch(`${apiUrl}/User/GetUser?telegramId=${telegramId}`);
                const data = await response.json();
                setContactInfo(data.contactInfo || '');
                setPortfolioLink(data.portfolioLink || '');
                setLocation(data.location || '');
                setServices(data.services || {});
                setWorking(data.working || false);
            } catch (error) {
                console.error("Error fetching specialist:", error);
            }
        };

        fetchSpecialist();
    }, [telegramId, role, apiUrl]);

    const handleRemoveService = (name) => {
        const newServices = { ...services };
        delete newServices[name];
        setServices(newServices);
    };

    const handleAddService = () => {
        if (!newServiceName) {
            alert("Пожалуйста, введите название услуги.");
            return;
        }

        if (services.hasOwnProperty(newServiceName)) {
            alert("Услуга с таким названием уже существует!");
            return;
        }
        const price = Number(newServicePrice);
        const duration = Number(newServiceDuration);

        if (isNaN(price) || price < 0) {
            alert("Пожалуйста, введите корректную цену (число больше или равно 0).");
            return;
        }

        if (isNaN(duration) || duration <= 0) {
            alert("Пожалуйста, введите корректное время (число больше нуля).");
            return;
        }

        setServices(prevServices => ({
            ...prevServices,
            [newServiceName]: { price: Number(newServicePrice), duration: Number(newServiceDuration) }
        }));
        setNewServiceName('');
        setNewServicePrice('');
        setNewServiceDuration('');
    };


    const handleSubmit = async () => {
        try {
            for (const name in services) {
                if (!name) {
                    alert("Название услуги не может быть пустым!");
                    return;
                }
                if (isNaN(services[name].price) || services[name].price < 0) {
                    alert("Пожалуйста, введите корректную цену (число больше или равно 0).");
                    return;
                }
                if (isNaN(services[name].duration) || services[name].duration <= 0) {
                    alert("Пожалуйста, введите корректное время (число больше 0).");
                    return;
                }
            }

            const response = await fetch(`${apiUrl}/User/SaveSpecialist?
            telegramId=${telegramId}&working=${working}&contactInfo=${contactInfo}&portfolioLink=${portfolioLink}&location=${location}&name=${name}&description=${description}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(services)
            });

            if (response.ok) {
                console.log("Specialist data saved successfully!");
                alert("Профиль успешно сохранён!");
            } else {
                console.error("Error saving specialist data:", response.status);
                alert("Произошла ошибка при сохранении профиля.");
            }
        } catch (error) {
            console.error("Error saving specialist data:", error);
            alert("Произошла ошибка при сохранении профиля.");
        }
    };

    if (role === 'client') {
        return (
            <div>
                <h1>Профиль специалиста {telegramId}</h1>
                <p>Имя: {name}</p>
                <p>Описание: {description}</p>
                <p>Контакты: {contactInfo}</p>
                <p>Портфолио: <a href={portfolioLink}>{portfolioLink}</a></p>
                <p>Местоположение: {location}</p>
                <h2>Услуги:</h2>
                <ul>
                    {Object.entries(services).map(([name, details]) => (
                        <li key={name}>
                            {name} - {details.price} - {details.duration} минут
                        </li>
                    ))}
                </ul>
            </div>
        );
    } else if (role === 'specialist') {
        return (
            <div>
                <h1>Мой профиль</h1>
                <button onClick={handleSubmit}>Сохранить</button>

                <div>
                    <h2>Работает:</h2>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={working}
                            onChange={(e) => setWorking(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                <div>
                    <h2>Имя:</h2>
                    <textarea value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <h2>Описание</h2>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                    <h2>Контакты</h2>
                    <textarea value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} />
                </div>

                <div>
                    <h2>Ссылка на портфолио</h2>
                    <input type="text" value={portfolioLink} onChange={(e) => setPortfolioLink(e.target.value)} />
                </div>

                <div>
                    <h2>Местоположение</h2>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>

                <div>
                    <h2>Услуги</h2>
                    <div>
                        <input
                            type="text"
                            placeholder="Название новой услуги"
                            value={newServiceName}
                            onChange={(e) => setNewServiceName(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Цена"
                            value={newServicePrice}
                            onChange={(e) => setNewServicePrice(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Длительность"
                            value={newServiceDuration}
                            onChange={(e) => setNewServiceDuration(e.target.value)}
                        />
                        <button onClick={handleAddService}>Добавить услугу</button>
                    </div>
                    {Object.entries(services).map(([name, details]) => (
                        <div key={name}>
                            <span>{name}</span>
                            <span> - Цена: {details.price} -  Длительность : {details.duration} </span>
                            <button onClick={() => handleRemoveService(name)}>Удалить</button>
                        </div>
                    ))}
                </div>
            </div>
        );
    } else {
        return <div>Роль не определена.</div>;
    }
}

export default ProfilePage;