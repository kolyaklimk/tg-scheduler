import React from 'react';

function ProfileLinkPage({ profileLink }) {
    return (
        <div>
            <h1>Ссылка на профиль</h1>
            <p>Поделитесь этой ссылкой, чтобы привлекать новых клиентов:</p>
            <input type="text" value={profileLink} readOnly />
        </div>
    );
}

export default ProfileLinkPage;