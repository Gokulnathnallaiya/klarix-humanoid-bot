// Centralized API configuration
// Use environment variables with fallbacks for development

export const API_CONFIG = {
  // Base API URL
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  
  // WebSocket URL
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  
  // Camera feed URL
  CAMERA_FEED_URL: process.env.NEXT_PUBLIC_CAMERA_FEED_URL || 'http://localhost:8000/api/robot/camera/stream',
} as const

// Helper to get full API endpoint
export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_CONFIG.BASE_URL}${cleanPath}`
}

// Helper to get WebSocket endpoint
export const getWsUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_CONFIG.WS_URL}${cleanPath}`
}
