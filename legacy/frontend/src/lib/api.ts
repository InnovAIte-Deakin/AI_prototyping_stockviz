import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
  withCredentials: false,
  timeout: 15000,
})

export default api
