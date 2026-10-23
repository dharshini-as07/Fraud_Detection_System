import { io } from 'socket.io-client';

// Dynamically determine Socket.IO server URL based on current client address
const getSocketURL = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '5001') {
      return window.location.origin;
    }
    return `${window.location.protocol}//${window.location.hostname}:5001`;
  }
  return 'http://localhost:5001';
};

const SOCKET_SERVER_URL = getSocketURL();

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      console.log(`[Socket.IO Client] Connected to server: ${socket.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO Client] Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket.IO Client] Connection error:', error.message);
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
