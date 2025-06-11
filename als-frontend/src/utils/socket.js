import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

// Create socket with optimized configuration for production
const socket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
  withCredentials: true,
  timeout: 20000, // 20 second timeout
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000, // Start with 2 second delay
  reconnectionDelayMax: 10000, // Max 10 second delay
  maxReconnectionAttempts: 5,
  // Performance optimizations for production
  autoConnect: false, // Manual connection control
  forceNew: false, // Reuse connection when possible
  // Additional production optimizations
  upgrade: true, // Allow transport upgrades
  rememberUpgrade: true, // Remember successful upgrades
});

// Add global error handling
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

export default socket; 