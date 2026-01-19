import axios from 'axios';
import { useAdminStore } from '@/store/admin.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nex-users.vercel.app/api';

console.log('[apiClient] Production API URL initialized:', API_URL);

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically add token from store
apiClient.interceptors.request.use((config) => {
  const token = useAdminStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = apiClient;
