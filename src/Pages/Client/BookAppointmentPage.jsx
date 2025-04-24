import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function BookAppointmentPage({ apiUrl }) {
    const [searchText, setSearchText] = useState('');
    const [specialists, setSpecialists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSearch = async () => {
        const trimmed = searchText.trim();
        if (trimmed === '') return;

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
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Записаться на приём</h1>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Поиск специалиста по имени"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ padding: '8px', width: '60%', marginRight: '10px' }}
                />
                <button onClick={handleSearch}>Поиск</button>
            </div>

            {loading && <p>Загрузка...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div>
                {specialists.map(specialist => (
                    <div
                        key={specialist.telegramId}
                        onClick={() => handleSpecialistClick(specialist.telegramId)}
                        style={{
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            padding: '10px',
                            marginBottom: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src={specialist.profileImageUrl || 'https://via.placeholder.com/80'}
                                alt={specialist.name}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    marginRight: '15px'
                                }}
                            />
                            <div>
                                <h2>{specialist.name}</h2>
                                <p>{specialist.description}</p>
                                <p>Локация: {specialist.location}</p>
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
