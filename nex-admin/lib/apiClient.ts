import axios from 'axios';
import PocketBase from 'pocketbase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nex-users.vercel.app/api';

// Inicializamos PocketBase para obtener la sesión del admin
export const pb = new PocketBase('https://nexcommerce.fly.dev');

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente desde PocketBase
apiClient.interceptors.request.use((config) => {
  const token = pb.authStore.token; // token activo de PocketBase
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = apiClient;
