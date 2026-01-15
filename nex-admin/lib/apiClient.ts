import axios from 'axios'
import { useAdminStore } from '@/store/admin.store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nex-users.vercel.app/api'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add interceptor to attach token
api.interceptors.request.use((config) => {
  // Get token from store (client-side only)
  if (typeof window !== 'undefined') {
    const token = useAdminStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const apiClient = api
