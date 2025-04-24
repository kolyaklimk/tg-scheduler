import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function BookAppointmentPage({ apiUrl }) {
    const [searchText, setSearchText] = useState('');
    const [specialists, setSpecialists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiUrl}/User/SearchSpecialists?searchText=${searchText}`);
            if (!response.ok) throw new Error('Ошибка при получении специалистов');
            const data = await response.json();
            setSpecialists(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSpecialistClick = (telegramId) => {
        navigate(`/profile/${telegramId}`);
    };

    return (
        <div>
            <h1>Записаться на приём</h1>

            <div>
                <input
                    type="text"
                    placeholder="Поиск специалиста по имени"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
                <button
                    onClick={handleSearch}
                >
                    Поиск
                </button>
            </div>

            {loading && <p>Загрузка...</p>}
            {error && <p >{error}</p>}

            <div >
                {specialists.map(specialist => (
                    <div
                        key={specialist.telegramId}
                        onClick={() => handleSpecialistClick(specialist.telegramId)}
                    >
                        <div >
                            <img
                                src={specialist.photoUrl || 'https://via.placeholder.com/80'}
                                alt={specialist.name}
                            />
                            <div>
                                <h2 >{specialist.name}</h2>
                                <p >{specialist.description}</p>
                                <p >Локация: {specialist.location}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {specialists.length === 0 && !loading && <p>Специалисты не найдены</p>}
            </div>
        </div>
    );
}

export default BookAppointmentPage;
