import { post, get } from './apiClient';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export const authService = {
    // Register a new user
    register: async (userData: any): Promise<AuthResponse> => {
        const response = await post<AuthResponse>('/auth/register', userData);
        if (response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
    },

    // Login an existing user
    login: async (credentials: any): Promise<AuthResponse> => {
        const response = await post<AuthResponse>('/auth/login', credentials);
        if (response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
    },

    // Logout the user
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
    },

    // Get current user from local storage
    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    // Check if user is authenticated
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    }
};
