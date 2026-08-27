import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authApi, getToken } from '../services/selfHostedApi';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (!getToken()) {
                    setIsAuthenticated(false);
                    return;
                }
                const user = await authApi.getUser();
                setIsAuthenticated(!!user);
            } catch (err) {
                console.error('ProtectedRoute: session check failed', err);
                setIsAuthenticated(false);
            }
        };
        checkAuth();
    }, []);

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-trini-red mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/signup?next=${next}`} replace />;
    }

    return <>{children}</>;
};
