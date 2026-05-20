import axios from 'axios';
import { API_URL } from './config';
import { useAuthStore } from '../store/authStore';

export const http = axios.create({
  baseURL: API_URL,
  timeout: 12_000,
  headers: {
    'Content-Type': 'application/json'
  }
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
