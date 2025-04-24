import { useLocation } from 'react-router-dom';

function GenerateImagePage() {
    const location = useLocation();
    const { dates } = location.state || { dates: [] };

    return (
        <div>
            <h1>Создание изображения</h1>
            <ul>
                {dates.map((date, idx) => <li key={idx}>{date}</li>)}
            </ul>
        </div>
    );
}

export default GenerateImagePage;