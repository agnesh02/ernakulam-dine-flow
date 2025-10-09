import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
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

// Helper functions for common socket operations
export const joinStaffRoom = (restaurantId?: string) => {
  const socket = getSocket();
  socket.emit('join:staff', restaurantId);
};

export const joinCustomerRoom = (orderId: string) => {
  const socket = getSocket();
  socket.emit('join:customer', orderId);
};

export const onNewOrder = (callback: (order: any) => void) => {
  const socket = getSocket();
  socket.on('order:new', callback);
};

export const onOrderStatusUpdate = (callback: (data: any) => void) => {
  const socket = getSocket();
  socket.on('order:statusUpdate', callback);
};

export const onOrderPaid = (callback: (order: any) => void) => {
  const socket = getSocket();
  socket.on('order:paid', callback);
};

export const removeOrderListeners = () => {
  const socket = getSocket();
  socket.off('order:new');
  socket.off('order:statusUpdate');
  socket.off('order:paid');
};

