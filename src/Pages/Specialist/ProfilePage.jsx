import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function ProfilePage() {
    const { telegramId } = useParams();
    const role = localStorage.getItem('userRole');

    const [contactInfo, setContactInfo] = useState('');
    const [portfolioLink, setPortfolioLink] = useState('');
    const [location, setLocation] = useState('');
    const [services, setServices] = useState([{ name: '', price: '' }]);

    useEffect(() => {
        // Логика для получения данных о специалисте из API
        // и заполнения состояния компонента
    }, [telegramId]);

    const handleContactInfoChange = (e) => {
        setContactInfo(e.target.value);
    };

    const handlePortfolioLinkChange = (e) => {
        setPortfolioLink(e.target.value);
    };

    const handleLocationChange = (e) => {
        setLocation(e.target.value);
    };

    const handleAddService = () => {
        setServices([...services, { name: '', price: '' }]);
    };

    const handleRemoveService = (index) => {
        const newServices = [...services];
        newServices.splice(index, 1);
        setServices(newServices);
    };

    const handleServiceChange = (index, field, value) => {
        const newServices = [...services];
        newServices[index][field] = value;
        setServices(newServices);
    };

    const handleSubmit = () => {
        // Логика для сохранения данных в API
        console.log("Contact Info:", contactInfo);
        console.log("Portfolio Link:", portfolioLink);
        console.log("Location:", location);
        console.log("Services:", services);
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
                    {services.map((service, index) => (
                        <div key={index}>
                            <input
                                type="text"
                                placeholder="Название услуги"
                                value={service.name}
                                onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Цена"
                                value={service.price}
                                onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                            />
                            <button onClick={() => handleRemoveService(index)}>Удалить</button>
                        </div>
                    ))}
                    <button onClick={handleAddService}>Добавить услугу</button>
                </div>
            </div>
        );
    }
}

export default ProfilePage;