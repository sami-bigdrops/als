// Smart environment detection
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

// Production settings from environment variables
const PRODUCTION_DOMAIN = import.meta.env.VITE_PRODUCTION_DOMAIN || 'http://biz.bigdropsmarketing.com'

// Auto-detect API URLs based on environment
const getApiUrls = () => {
  // PRIORITY 1: If explicitly set in environment variables, use those (highest priority)
  if (import.meta.env.VITE_API_URL) {
    // Check if the URL includes port 5001 and domain is production domain
    const apiUrl = import.meta.env.VITE_API_URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL
    
    // Fix production URLs that incorrectly include :5001
    if (baseUrl && baseUrl.includes('biz.bigdropsmarketing.com:5001')) {
      return {
        API_BASE_URL: baseUrl.replace(':5001', ''),
        API_URL: apiUrl.replace(':5001', ''),
        SOCKET_URL: socketUrl.replace(':5001', '')
      }
    }
    
    return {
      API_BASE_URL: baseUrl || apiUrl.replace('/api', ''),
      API_URL: apiUrl,
      SOCKET_URL: socketUrl || apiUrl.replace('/api', '')
    }
  }
  
  // PRIORITY 2: If running on localhost AND no env vars, auto-detect localhost
  if (isLocalhost) {
    return {
      API_BASE_URL: 'http://localhost:5001',
      API_URL: 'http://localhost:5001/api', 
      SOCKET_URL: 'http://localhost:5001'
    }
  }
  
  // PRIORITY 3: Production auto-detection (fallback)
  return {
    API_BASE_URL: PRODUCTION_DOMAIN,
    API_URL: `${PRODUCTION_DOMAIN}/api`,
    SOCKET_URL: PRODUCTION_DOMAIN
  }
}

const { API_BASE_URL, API_URL, SOCKET_URL } = getApiUrls()

export {
  API_BASE_URL,
  API_URL,
  SOCKET_URL
} 