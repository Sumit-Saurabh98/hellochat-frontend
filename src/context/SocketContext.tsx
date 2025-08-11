"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { CHAT_SERVICE, useAppData } from "./AppContext";

interface SocketContextType {
  socket: Socket | null; 
  onlineUsers: string[]
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers:[]
});

interface ProviderProps {
  children: React.ReactNode;
}

export const SocketProvider = ({ children }: ProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAppData();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
  if (!user?._id) return;

  if (socket) return;

  const newSocket = io(CHAT_SERVICE, {
    query: { userId: user._id },
  });

  setSocket(newSocket);

  const handleOnlineUsers = (users: string[]) => {
    setOnlineUsers(users);
  };

  newSocket.on("getOnlineUser", handleOnlineUsers);

  return () => {
    newSocket.off("getOnlineUser", handleOnlineUsers);
    newSocket.disconnect();
  };
}, [user?._id]);


  const value = useMemo(() => ({ socket, onlineUsers }), [socket, onlineUsers]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const SocketData = () => useContext(SocketContext);
