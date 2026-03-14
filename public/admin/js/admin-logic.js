// Shared Admin Logic

/**
 * Check if admin is logged in
 */
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
    return token;
}

/**
 * Handle Logout
 */
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    window.location.href = 'index.html';
}

/**
 * Generic API Fetcher for Admin
 */
async function adminFetch(endpoint, options = {}) {
    const token = checkAuth();
    if (!token) return;

    const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(endpoint, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });

    if (response.status === 401 || response.status === 403) {
        logout();
        return;
    }

    return response;
}
