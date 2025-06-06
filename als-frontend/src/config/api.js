// API Configuration - Production without port (uses standard HTTPS port 443)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001'

export {
  API_BASE_URL,
  API_URL,
  SOCKET_URL
} 