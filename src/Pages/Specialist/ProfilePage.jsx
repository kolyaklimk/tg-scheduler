import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ProfilePage.css'
function ProfilePage() {
    const { telegramId } = useParams();
    const role = localStorage.getItem('userRole');
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const [contactInfo, setContactInfo] = useState('');
    const [portfolioLink, setPortfolioLink] = useState('');
    const [location, setLocation] = useState('');
    const [services, setServices] = useState({});
    const [working, setWorking] = useState(false);

    useEffect(() => {
        const fetchSpecialist = async () => {
            try {
                const response = await fetch(`${apiUrl}/User/GetUser?telegramId=${telegramId}`);
                const data = await response.json();
                setContactInfo(data.contactInfo || '');
                setPortfolioLink(data.portfolioLink || '');
                setLocation(data.location || '');
                setServices(data.services || {}); // Получаем словарь услуг
                setWorking(data.working || false);
            } catch (error) {
                console.error("Error fetching specialist:", error);
            }
        };

        if (telegramId && role === 'specialist') {
            fetchSpecialist();
        }
    }, [telegramId, role, apiUrl]);

    const handleContactInfoChange = (e) => {
        setContactInfo(e.target.value);
    };

    const handlePortfolioLinkChange = (e) => {
        setPortfolioLink(e.target.value);
    };

    const handleLocationChange = (e) => {
        setLocation(e.target.value);
    };

    const handleServiceChange = (name, value) => {
        const price = Number(value);
        if (isNaN(price)) {
            alert("Цена должна быть числом!");
            return;
        }
        setServices({ ...services, [name]: price });
    };

    const handleRemoveService = (name) => {
        const newServices = { ...services };
        delete newServices[name];
        setServices(newServices);
    };

    const handleAddService = () => {
        const newServiceName = prompt("Введите название новой услуги:");
        if (!newServiceName) {
            return;
        }
        const newServicePrice = prompt("Введите цену новой услуги:");
        if (!newServicePrice || isNaN(newServicePrice)) {
            alert("Неверная цена");
            return;
        }
        setServices(prevServices => ({ ...prevServices, [newServiceName]: Number(newServicePrice) })); // Устанавливаем цену по умолчанию 0
    };


    const handleSubmit = async () => {
        try {

            for (const name in services) {
                if (!name) {
                    alert("Название услуги не может быть пустым!");
                    return;
                }
                if (services[name] < 0) {
                    alert("Цена услуги должна быть больше или равна 0!");
                    return;
                }
            }


            const response = await fetch(`${apiUrl}/User/SaveSpecialist?telegramId=${telegramId}&working=${working}&contactInfo=${contactInfo}&portfolioLink=${portfolioLink}&location=${location}`, {
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

    const handleWorkingChange = (event) => {
        setWorking(event.target.checked);
    };

    if (role === 'client') {
        // Отображаем профиль специалиста для клиента
        return (
            <div>
                <h1>Профиль специалиста {telegramId}</h1>
                <p>Информация о специалисте</p>
            </div>
        );
    } else {
        // Отображаем свой профиль для специалиста (с возможностью редактирования)
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
                            onChange={handleWorkingChange}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div>
                    <h2>Контакты</h2>
                    <textarea value={contactInfo} onChange={handleContactInfoChange} />
                </div>

                <div>
                    <h2>Ссылка на портфолио</h2>
                    <input type="text" value={portfolioLink} onChange={handlePortfolioLinkChange} />
                </div>

                <div>
                    <h2>Местоположение</h2>
                    <input type="text" value={location} onChange={handleLocationChange} />
                </div>

                <div>
                    <h2>Услуги</h2>
                    {Object.entries(services).map(([name, price]) => (
                        <div key={name}>
                            <span>{name}</span>
                            <input
                                type="number"
                                placeholder="Цена"
                                value={price}
                                onChange={(e) => handleServiceChange(name, e.target.value)}
                            />
                            <button onClick={() => handleRemoveService(name)}>Удалить</button>
                        </div>
                    ))}
                    <button onClick={handleAddService}>Добавить услугу</button>
                </div>
            </div>
        );
    }
}

export default ProfilePage;