import axios from 'axios';

const laravelBaseURL = import.meta.env.VITE_LARAVEL_URL || 'http://127.0.0.1:8000';
const fastApiBaseURL = import.meta.env.VITE_FASTAPI_URL || 'http://127.0.0.1:5000';

export const laravelClient = axios.create({
  baseURL: `${laravelBaseURL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fastApiClient = axios.create({
  baseURL: fastApiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional response interceptor for centralized error logging
[laravelClient, fastApiClient].forEach((client) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // eslint-disable-next-line no-console
      console.error('[API Error]', error?.response?.status, error?.response?.data || error.message);
      return Promise.reject(error);
    }
  );
});
