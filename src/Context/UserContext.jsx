import React, { createContext, useState } from 'react';

export const UserContext = createContext(null);

export const UserProvider = ({ children, initialRole }) => {
    const [role, setRole] = useState(initialRole);

    return (
        <UserContext.Provider value={{ role, setRole }}>
            {children}
        </UserContext.Provider>
    );
};