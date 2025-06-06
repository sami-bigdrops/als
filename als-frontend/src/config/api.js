// Smart environment detection
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

// Auto-detect API URLs based on environment
const getApiUrls = () => {
  // PRIORITY 1: If explicitly set in environment variables, use those (highest priority)
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL
    
    return {
      API_BASE_URL: baseUrl || apiUrl.replace('/api', ''),
      API_URL: apiUrl,
      SOCKET_URL: socketUrl || apiUrl.replace('/api', '')
    }
  }
  
  // PRIORITY 2: If running on localhost, use localhost
  if (isLocalhost) {
    return {
      API_BASE_URL: 'http://localhost:5001',
      API_URL: 'http://localhost:5001/api', 
      SOCKET_URL: 'http://localhost:5001'
    }
  }
  
  // PRIORITY 3: Production - Use current domain for API calls
  const currentProtocol = window.location.protocol
  const currentHostname = window.location.hostname
  const productionBaseUrl = `${currentProtocol}//${currentHostname}`
  
  return {
    API_BASE_URL: productionBaseUrl,
    API_URL: `${productionBaseUrl}/api`,
    SOCKET_URL: productionBaseUrl
  }
}

const { API_BASE_URL, API_URL, SOCKET_URL } = getApiUrls()

// Debug output (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    hostname: window.location.hostname,
    isLocalhost,
    API_BASE_URL,
    API_URL,
    SOCKET_URL
  })
}

export {
  API_BASE_URL,
  API_URL,
  SOCKET_URL
} 