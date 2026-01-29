import { AuthResponse } from "@/types/api";

export interface UserProfile {
    userId: string;
    fullName: string;
    email?: string;
    role?: string;
}

export const authHelper = {
    // Decode JWT token directly in client (without external libraries for simplicity)
    getUserFromToken: (): UserProfile | null => {
        if (typeof window === 'undefined') return null;

        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            // JWT parts: Header.Payload.Signature
            const payloadBase64 = token.split('.')[1];
            if (!payloadBase64) return null;

            // Fix Base64 format if needed
            const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                window.atob(base64)
                    .split('')
                    .map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    })
                    .join('')
            );

            const decoded = JSON.parse(jsonPayload);

            // Map JWT claims to our UserProfile interface
            // Update these keys based on your actual JWT payload structure (e.g., http://schemas.xmlsoap.org/.../name)
            return {
                userId: decoded.sub || decoded.userId || decoded.id,
                fullName: decoded.FullName || decoded.fullName || decoded.name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.email,
                email: decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
                role: decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            };
        } catch (error) {
            console.error("Failed to decode token", error);
            return null;
        }
    },

    getToken: () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    },

    logout: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
};
