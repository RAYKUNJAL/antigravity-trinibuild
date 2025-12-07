import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * EMERGENCY ADMIN BYPASS
 * This bypasses ALL authentication and gets you into the admin area immediately
 * Just visit /admin/bypass and you're in
 */
export const AdminBypass: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Create a fake admin user in localStorage
        const fakeAdminUser = {
            id: 'emergency-admin-' + Date.now(),
            email: 'admin@trinibuild.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            subscription_tier: 'Community Plan'
        };

        // Store it
        localStorage.setItem('user', JSON.stringify(fakeAdminUser));

        console.log('✅ Emergency admin access granted');

        // Redirect to admin dashboard
        navigate('/admin/command-center');
    }, [navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔓 Emergency Admin Access</h1>
                <p style={{ fontSize: '1.2rem' }}>Bypassing authentication...</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '1rem' }}>
                    Redirecting to admin dashboard...
                </p>
            </div>
        </div>
    );
};
