import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

export const api = axios.create({
    baseURL: apiUrl,
    withCredentials: true,   // refresh cookie için şart
});

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
// Access token store (localStorage veya zustand)
export function getAccess() {
    return localStorage.getItem(ACCESS_KEY);
}

export function setAccess(token, refresh) {
    localStorage.setItem(ACCESS_KEY, token);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
}

api.interceptors.request.use((config) => {
    const token = getAccess();
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

// --- RESPONSE INTERCEPTOR (refresh mekanizması) ---
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        // Token expired → 401
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    const refreshRes = await axios.post(
                        `${apiUrl}/refresh`,
                        {},
                        { withCredentials: true }
                    );

                    const newToken = refreshRes.data.access_token;
                    setAccess(newToken);

                    // bekleyen requestleri çöz
                    queue.forEach((cb) => cb(newToken));
                    queue = [];
                } catch (err) {
                    queue = [];
                    isRefreshing = false;
                    throw err;
                }

                isRefreshing = false;
            }

            return new Promise((resolve) => {
                queue.push((newToken) => {
                    original.headers["Authorization"] = `Bearer ${newToken}`;
                    resolve(api(original));
                });
            });
        }

        return Promise.reject(error);
    }
);
