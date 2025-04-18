import React, { useState } from 'react';

function CustomPrompt({ isOpen, onClose, onConfirm, message, defaultValue, type }) {
    const [value, setValue] = useState(defaultValue || '');

    const handleConfirm = () => {
        if (type === 'number' && isNaN(parseFloat(value))) {
            alert("Пожалуйста, введите корректное число");
            return;
        }
        onConfirm(value);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="custom-prompt">
            <div className="custom-prompt-content">
                <p>{message}</p>
                <input
                    type={type || "text"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <button onClick={handleConfirm}>ОК</button>
                <button onClick={handleCancel}>Отмена</button>
            </div>
        </div>
    );
}

export default CustomPrompt;