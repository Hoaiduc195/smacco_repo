import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Firebase token
apiClient.interceptors.request.use(async (config) => {
  // TODO: Get Firebase token from auth context
  // const token = await getFirebaseToken();
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;
