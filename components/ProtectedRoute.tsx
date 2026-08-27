import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authApi, getToken } from '../services/selfHostedApi';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

function isAdminRole(role?: string | null) {
    return role === 'admin' || role === 'super_admin';
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

/** Login wall for /admin*. No token and planted localStorage.user are not a session. No admin chrome. */
export const AdminRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const location = useLocation();
    const next = encodeURIComponent(location.pathname + location.search);
    const loginTo = `/login?next=${next}`;
    const [ok, setOk] = useState<boolean | null>(getToken() ? null : false);

    useEffect(() => {
        if (!getToken()) {
            setOk(false);
            return;
        }
        let cancelled = false;
        authApi.getUser()
            .then((user) => {
                if (!cancelled) setOk(!!user && isAdminRole(user.role));
            })
            .catch(() => {
                if (!cancelled) setOk(false);
            });
        return () => { cancelled = true; };
    }, []);

    if (ok === false) {
        return <Navigate to={loginTo} replace />;
    }

    if (ok === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <p className="text-sm text-gray-600">Sign in required.</p>
            </div>
        );
    }

    return <>{children}</>;
};
