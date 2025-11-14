import { Toaster } from '@/components/ui/sonner';
import { fetchSheet } from '@/lib/fetchers';
import type { UserPermissions } from '@/types/sheets';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthState {
    loggedIn: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    user: UserPermissions;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const stored = localStorage.getItem('auth');
        if (stored) {
            try {
                const { username } = JSON.parse(stored);
                fetchSheet('USER').then((res) => {
                    const user = (res as UserPermissions[]).find((user) => user.username === username);
                    if (user) {
                        setUserPermissions(user);
                        setLoggedIn(true);
                    }
                    setLoading(false);
                }).catch((error) => {
                    console.error('Error fetching user data:', error);
                    localStorage.removeItem('auth');
                    setLoading(false);
                });
            } catch (error) {
                console.error('Error parsing stored auth data:', error);
                localStorage.removeItem('auth');
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    async function login(username: string, password: string) {
        try {
            const users = (await fetchSheet('USER')) as UserPermissions[];
            const user = users.find((user) => user.username === username && user.password === password);
            if (user === undefined) {
                return false;
            }

            localStorage.setItem('auth', JSON.stringify({ username }));
            setUserPermissions(user);
            setLoggedIn(true);
            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    }

    function logout() {
        localStorage.removeItem('auth');
        setLoggedIn(false);
        setUserPermissions(null);
    }

    // Create a default user object to prevent undefined errors
    const defaultUser: UserPermissions = userPermissions || {} as UserPermissions;

    return (
        <AuthContext.Provider value={{ 
            login, 
            loggedIn, 
            logout, 
            user: defaultUser, 
            loading 
        }}>
            {children}
            <Toaster expand richColors theme="light" closeButton />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};