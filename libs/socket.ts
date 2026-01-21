"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/orders`,
      {
        transports: ["websocket", "polling"],
        autoConnect: false,
      },
    );
  }
  return socket;
};

export const connectSocket = () => {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

export const joinTable = (tableId: string) => {
  const socket = getSocket();
  if (socket.connected) {
    // Guests only join table-specific rooms, not restaurant rooms
    console.log(`Joining table room: ${tableId}`);
    socket.emit("join-table", { table_id: tableId });
  }
};

// Event listeners
export const onOrderStatusUpdated = (
  callback: (data: {
    order_id: string;
    status: string;
    timestamp: string;
  }) => void,
) => {
  const socket = getSocket();
  socket.on("order-status-updated", callback);
  return () => socket.off("order-status-updated", callback);
};

export const onOrderItemUpdated = (
  callback: (data: {
    order_item_id: string;
    status: string;
    rejected_reason?: string;
    timestamp: string;
  }) => void,
) => {
  const socket = getSocket();
  socket.on("order-item-updated", callback);
  return () => socket.off("order-item-updated", callback);
};
