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
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [isImageLoading, setIsImageLoading] = useState(false);

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
                setName(data.name || '');
                setDescription(data.description || '');
                setProfileImageUrl(data.profileImageUrl || '');
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
            Telegram.WebApp.showPopup({ message: "Пожалуйста, введите название услуги." });
            return;
        }

        if (services.hasOwnProperty(newServiceName)) {
            Telegram.WebApp.showPopup({ message: "Услуга с таким названием уже существует!" });
            return;
        }
        const price = Number(newServicePrice);
        const duration = Number(newServiceDuration);

        if (isNaN(price) || price < 0) {
            Telegram.WebApp.showPopup({ message: "Пожалуйста, введите корректную цену (число больше или равно 0)." });
            return;
        }

        if (isNaN(duration) || duration <= 0) {
            Telegram.WebApp.showPopup({ message: "Пожалуйста, введите корректное время (число больше нуля)." });
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

    const handleServiceDetailChange = (name, field, value) => {
        const parsedValue = field === 'price' ? Number(value) : Number(value)
        if (isNaN(parsedValue)) {
            Telegram.WebApp.showPopup({ message: field === 'price' ? "Цена должна быть числом!" : "Длительность должна быть числом!", });
            return;
        }

        setServices(prevServices => ({
            ...prevServices,
            [name]: {
                ...prevServices[name],
                [field]: Number(value)
            }
        }));
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImageLoading(true);

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch(`${apiUrl}/User/UploadImage`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setProfileImageUrl(data.imageUrl);
            } else {
                Telegram.WebApp.showPopup({ message: "Произошла ошибка при загрузке изображения." });
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            Telegram.WebApp.showPopup({ message: "Произошла ошибка при загрузке изображения." });
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            for (const name in services) {
                if (!name) {
                    Telegram.WebApp.showPopup({ message: "Название услуги не может быть пустым!" });
                    return;
                }
                if (isNaN(services[name].price) || services[name].price < 0) {
                    Telegram.WebApp.showPopup({ message: "Пожалуйста, введите корректную цену (число больше или равно 0)." });
                    return;
                }
                if (isNaN(services[name].duration) || services[name].duration <= 0) {
                    Telegram.WebApp.showPopup({ message: "Пожалуйста, введите корректное время (число больше 0)." });
                    return;
                }
            }

            const profileData = {
                telegramId: telegramId,
                working: working,
                contactInfo: contactInfo,
                portfolioLink: portfolioLink,
                location: location,
                name: name,
                description: description,
                services: services,
                profileImageUrl: profileImageUrl
            };

            const response = await fetch(`${apiUrl}/User/SaveSpecialist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            if (response.ok) {
                console.log("Specialist data saved successfully!");
                Telegram.WebApp.showPopup({ message: "Профиль успешно сохранён!", });
            } else {
                console.error("Error saving specialist data:", response.status);
                Telegram.WebApp.showPopup({ message: "Произошла ошибка при сохранении профиля.", });
            }
        } catch (error) {
            console.error("Error saving specialist data:", error);
            Telegram.WebApp.showPopup({ message: "Произошла ошибка при сохранении профиля.", });
        }
    };

    if (role === 'client') {
        return (
            <div>
                <div className="profile-image-container">
                    {profileImageUrl && <img src={profileImageUrl} alt="Аватарка специалиста" />}
                </div>
                <p>Имя: {name}</p>
                <button onClick={() => navigate('/schedule')}>Записаться</button> 
                <p>Описание: {description}</p>
                <p>Контакты: {contactInfo}</p>
                <p>Портфолио: <a href={portfolioLink}>{portfolioLink}</a></p>
                <p>Местоположение: {location}</p>
                <h2>Услуги:</h2>
                <ul>
                    {Object.entries(services).map(([name, details]) => (
                        <li key={name}>
                            {name} - Цена: {details.price} - Длительность: {details.duration} мин.
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
                    <h2>Аватарка:</h2>
                    <div className="profile-image-container">
                        {isImageLoading ? (
                            <div className="loading-indicator">Загрузка...</div>
                        ) : (
                            profileImageUrl && <img src={profileImageUrl} alt="Аватарка специалиста" />
                        )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
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
                            <span> - Цена:
                                <input
                                    type="number"
                                    placeholder="Цена"
                                    value={details.price}
                                    onChange={(e) => handleServiceDetailChange(name, 'price', e.target.value)}
                                />
                            </span>
                            <span> - Длительность :
                                <input
                                    type="number"
                                    placeholder="Длительность"
                                    value={details.duration}
                                    onChange={(e) => handleServiceDetailChange(name, 'duration', e.target.value)}
                                />
                            </span>
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