import { useState, useEffect, useRef, useCallback } from 'react'
import socket from '../utils/socket'
import { API_URL } from '../config/api'

function PlatformStreaming({ platform, employee, onClose }) {
  const [isConnected, setIsConnected] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [loginStatus, setLoginStatus] = useState({ status: 'connecting', message: 'Connecting...' })
  const [isStreaming, setIsStreaming] = useState(false)
  const canvasRef = useRef(null)
  const lastInteractionRef = useRef(Date.now())
  const connectionTimeoutRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    // Set up connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (!isConnected) {
        setLoginStatus({ 
          status: 'error', 
          message: 'Connection timeout. Server may be busy. Please try again.' 
        })
      }
    }, 30000) // 30 second timeout

    // Connect socket
    socket.connect()

    socket.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
      clearTimeout(connectionTimeoutRef.current)
      // Join room for this employee
      socket.emit('join-employee-room', employee.id)
      startPlatformStream()
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
      setIsStreaming(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setLoginStatus({ 
        status: 'error', 
        message: 'Failed to connect to server. Please check your connection.' 
      })
    })

    socket.on('screenshot', (data) => {
      setScreenshot(data.screenshot)
      if (!isStreaming) {
        setIsStreaming(true)
      }
    })

    socket.on('login-status', (status) => {
      setLoginStatus(status)
    })

    socket.on('stream-started', () => {
      setLoginStatus({ status: 'started', message: 'Stream started successfully' })
    })

    socket.on('stream-error', (error) => {
      setLoginStatus({ status: 'error', message: error.message })
    })

    socket.on('stream-stopped', () => {
      setIsStreaming(false)
      setLoginStatus({ status: 'disconnected', message: 'Stream stopped' })
    })

    socket.on('page-error', () => {
      // Page error occurred
    })

    socket.on('page-dialog', () => {
      // Page dialog detected
    })

    socket.on('interaction-error', () => {
      // Interaction error occurred
    })

    return () => {
      clearTimeout(connectionTimeoutRef.current)
      if (socket.connected) {
        // Stop any active stream before disconnecting
        socket.emit('stop-platform-stream', { employeeId: employee.id })
        // Give it a moment to send the stop signal
        setTimeout(() => {
          socket.disconnect()
        }, 100)
      }
    }
  }, [employee.id, platform.id])

  const startPlatformStream = async () => {
    try {
      setLoginStatus({ status: 'initializing', message: 'Fetching platform credentials...' })
      
      // Fetch platform with credentials for streaming
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/platforms/${platform._id}/streaming`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch platform credentials')
      }

      const result = await response.json()
      const platformWithCredentials = result.data.platform

      setLoginStatus({ status: 'initializing', message: 'Initializing platform stream...' })
      
      socket.emit('start-platform-stream', {
        employeeId: employee.id,
        platformId: platform._id,
        employee: employee,
        platform: platformWithCredentials // Use platform with credentials
      })
    } catch {
      setLoginStatus({ 
        status: 'error', 
        message: 'Failed to fetch platform credentials. Please contact support.' 
      })
    }
  }

  const stopStream = () => {
    if (socket.connected) {
      socket.emit('stop-platform-stream', { employeeId: employee.id })
    }
    
    // Immediately stop the stream and close modal
    setIsStreaming(false)
    setLoginStatus({ status: 'disconnecting', message: 'Closing platform...' })
    
    // Close modal after a short delay to show the disconnecting message
    setTimeout(() => {
      onClose()
    }, 500)
  }

  // Handle user interactions with debouncing
  const sendInteraction = useCallback((interaction) => {
    const now = Date.now()
    if (now - lastInteractionRef.current < 50) { // Debounce to 50ms
      return
    }
    lastInteractionRef.current = now

    if (socket.connected && isStreaming) {
      socket.emit('user-interaction', {
        employeeId: employee.id,
        interaction
      })
    }
  }, [isStreaming, employee.id])

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Make sure canvas is focused for keyboard events
    canvas.focus()

    const rect = canvas.getBoundingClientRect()
    const scaleX = 1280 / rect.width  // Original browser width / canvas display width
    const scaleY = 720 / rect.height  // Original browser height / canvas display height
    
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    sendInteraction({
      type: 'click',
      x: Math.round(x),
      y: Math.round(y)
    })
  }

  const handleCanvasKeyDown = (event) => {
    event.preventDefault()
    
    if (event.key.length === 1) {
      // Regular character
      sendInteraction({
        type: 'type',
        text: event.key
      })
    } else {
      // Special key
      sendInteraction({
        type: 'keypress',
        key: event.key
      })
    }
  }

  const handleCanvasWheel = (event) => {
    event.preventDefault()
    
    sendInteraction({
      type: 'scroll',
      deltaY: event.deltaY
    })
  }

  // Handle canvas mouse enter to ensure it can receive focus
  const handleCanvasMouseEnter = () => {
    if (canvasRef.current) {
      canvasRef.current.focus()
    }
  }

  // Draw screenshot on canvas
  useEffect(() => {
    if (screenshot && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      
      img.src = screenshot
    }
  }, [screenshot])

  const getStatusColor = (status) => {
    switch (status) {
      case 'connecting':
      case 'initializing':
      case 'started':
        return 'text-blue-600'
      case 'navigating':
      case 'logging-in':
        return 'text-yellow-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connecting':
      case 'initializing':
      case 'navigating':
      case 'logging-in':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        )
      case 'success':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-7xl mx-4 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {platform.platformName} - {platform.clientName}
              </h3>
              <p className="text-sm text-gray-500">Platform ID: {platform.platformId}</p>
            </div>
            <div className={`flex items-center space-x-2 ${getStatusColor(loginStatus.status)}`}>
              {getStatusIcon(loginStatus.status)}
              <span className="text-sm font-medium">{loginStatus.message}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isStreaming && (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Streaming</span>
              </div>
            )}
            <button
              onClick={stopStream}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Close Platform
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 bg-gray-100">
          {isStreaming ? (
            <div className="h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                onClick={handleCanvasClick}
                onKeyDown={handleCanvasKeyDown}
                onWheel={handleCanvasWheel}
                onMouseEnter={handleCanvasMouseEnter}
                tabIndex={0}
                className="max-w-full max-h-full border border-gray-300 rounded-lg shadow-lg bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{
                  aspectRatio: '16/9',
                  objectFit: 'contain'
                }}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  {loginStatus.status === 'error' ? (
                    <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <div className="mx-auto h-16 w-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {loginStatus.status === 'error' ? 'Connection Failed' : 'Preparing Platform'}
                </h3>
                <p className="text-gray-500">{loginStatus.message}</p>
                {loginStatus.status !== 'error' && (
                  <div className="mt-4">
                    <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100">
                      <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-purple-200 border-t-purple-600 rounded-full"></div>
                      Logging in automatically...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {isStreaming && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.414l.707-.707zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                </svg>
                <span>Click to interact</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Type to enter text</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span>Scroll to navigate</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlatformStreaming 