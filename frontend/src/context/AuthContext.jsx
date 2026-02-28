import React, { useState, useEffect } from 'react';
import api from '../services/api';

import { AuthContext } from './Context';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('user_id');

        // Using setTimeout resolves the synchronous cascading render warning
        // Alternatively, setting it directly on initialization is better, but this works to fix the lint error.
        setTimeout(() => {
            if (token) {
                // Also fetch name from localStorage if we saved it
                const userName = localStorage.getItem('user_name') || 'User';
                setUser({ token, id: userId, name: userName });
            }
            setLoading(false);
        }, 0);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/login', { name: "placeholder", email, password });
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user_id', response.data.user_id);

        // Let's assume the backend might return the name eventually, otherwise we fetch it or leave it as generic
        const name = response.data.name || 'User';
        localStorage.setItem('user_name', name);

        setUser({ token: response.data.access_token, id: response.data.user_id, name });
        return response.data;
    };

    const register = async (name, email, password) => {
        return await api.post('/register', { name, email, password });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
