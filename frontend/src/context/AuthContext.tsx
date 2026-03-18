import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

interface AuthContextType {
    user: any;
    setUser: (user: any) => void;
    login: (userData: any) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('clgcrush_user');

            if (token) {
                try {
                    // Forcefully fetch latest profile to get role updates
                    const res = await fetch(`${API_BASE_URL}/users/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setUser(data);
                        localStorage.setItem('clgcrush_user', JSON.stringify({ ...data, token }));
                    } else if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (e) {
                    if (storedUser) setUser(JSON.parse(storedUser));
                }
            } else if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        };

        fetchUser();
    }, []);

    const login = (userData: any) => {
        setUser(userData);
        localStorage.setItem('clgcrush_user', JSON.stringify(userData));
        if (userData.token) {
            localStorage.setItem('token', userData.token);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('clgcrush_user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
