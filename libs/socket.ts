"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(`${process.env.NEXT_PUBLIC_API_BASE_URL}/orders`, {
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
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
    socket.emit("join_table", { table_id: tableId });
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
  socket.on("order_status_updated", callback);
  return () => socket.off("order_status_updated", callback);
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
  socket.on("order_item_updated", callback);
  return () => socket.off("order_item_updated", callback);
};
