let configuredApiUrl = import.meta.env.VITE_API_URL;
let configuredSocketUrl = import.meta.env.VITE_SOCKET_URL;

// Auto-correct common mistake: user providing base URL without /api
if (configuredApiUrl && !configuredApiUrl.endsWith('/api')) {
    configuredApiUrl = `${configuredApiUrl.replace(/\/$/, '')}/api`;
}

// Fallback logic for Socket URL based on API URL if not explicitly provided
if (!configuredSocketUrl && configuredApiUrl) {
    configuredSocketUrl = configuredApiUrl.replace(/\/api$/, '');
}

export const API_BASE_URL = configuredApiUrl || 'http://localhost:5000/api';
export const SOCKET_URL = configuredSocketUrl || 'http://localhost:5000';

