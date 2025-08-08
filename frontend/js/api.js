const API_BASE_URL = 'http://localhost:5000/api';

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
}

const authAPI = {
    login: (username, password) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    register: (username, email, password) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }
};

const pagesAPI = {
    getPages: (page = 1, paginate = 20) => {
        return apiRequest(`/pages?page=${page}&paginate=${paginate}`);
    },

    getPageDetails: (id) => {
        return apiRequest(`/pages/${id}`);
    },

    getPageLinks: (pageId, page = 1, paginate = 50) => {
        return apiRequest(`/pages/${pageId}/links?page=${page}&paginate=${paginate}`);
    },

    addPage: (url) => {
        return apiRequest('/pages', {
            method: 'POST',
            body: JSON.stringify({ url })
        });
    },

    deletePage: (id) => {
        return apiRequest(`/pages/${id}`, {
            method: 'DELETE'
        });
    },

    deleteLink: (linkId) => {
        return apiRequest(`/pages/links/${linkId}`, {
            method: 'DELETE'
        });
    }
};

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}
