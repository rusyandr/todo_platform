import axios from 'axios';

const API_URL =
  import.meta.env.PROD
    ? 'https://todo-platform-449e.onrender.com'
    : 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
