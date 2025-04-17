import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../../Context/UserContext';

function ProfilePage() {
    const { role } = useContext(UserContext);
    const { telegramId } = useParams();

    // Логика для получения данных о специалисте (например, через API)
    // ...

    if (role === 'client') {
        // Отображаем профиль специалиста для клиента
        return (
            <div>
                <h1>Профиль специалиста {telegramId}</h1>
                {/* ... */}
            </div>
        );
    } else {
        // Отображаем свой профиль для специалиста (с возможностью редактирования)
        return (
            <div>
                <h1>Мой профиль {telegramId}</h1>
                {/* ... */}
            </div>
        );
    } 
}

export default ProfilePage;