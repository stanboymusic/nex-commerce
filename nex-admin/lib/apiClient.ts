import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nex-users.vercel.app/api'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiClient = api
