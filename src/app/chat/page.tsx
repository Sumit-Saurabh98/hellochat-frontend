"use client";

import ChatSidebar from "@/components/ChatSidebar";
import Loading from "@/components/Loading";
import { CHAT_SERVICE, useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast from "react-hot-toast";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";
import { SocketData } from "@/context/SocketContext";

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}
const ChatPage = () => {
  const {
    isAuth,
    loading,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    setChats,
  } = useAppData();

  const {onlineUsers, socket} = SocketData()

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAllUser, setShowAllUser] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeOut, setTypingTimeOut] = useState<NodeJS.Timeout | null>(
    null
  );
  const router = useRouter();
  const handleLogout = () => logoutUser();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);

  const fetchChat = useCallback(async () => {
  const token = Cookies.get("token");
  try {
    const { data } = await axios.get(
      `${CHAT_SERVICE}/api/v1/message/${selectedUser}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setMessages(data.messages);
    setUser(data.user);
    await fetchChats();
  } catch (error) {
    console.log(error);
    toast.error("Failed to load messages");
  }
}, [selectedUser, fetchChats]);

interface NewMessage {
  text: string;
  sender: string;
}


const moveChatToTop = useCallback((chatId: string, newMessage: NewMessage, updatedUnseenCount=true) => {
  setChats((prev)=>{
    if(!prev) return null;

    const updatedChats = [...prev];

    const chatIndex = updatedChats.findIndex((chat)=>chat.chat._id === chatId);

    if(chatIndex !== -1) {
      const [moveChat] = updatedChats.splice(chatIndex, 1);

      const updatedChat = {
        ...moveChat,
        chat: {
          ...moveChat.chat,
          latestMessage: {
            text: newMessage.text,
            sender: newMessage.sender,
          },
          updatedAt: new Date().toISOString(),
          unseenCount: updatedUnseenCount && newMessage.sender !== loggedInUser?._id ? (moveChat.chat.unseenCount || 0) + 1 : moveChat.chat.unseenCount || 0,
        }
      }

      updatedChats.unshift(updatedChat);
    }

    return updatedChats
    
  })
}, [setChats, loggedInUser]);

const resetUnseenCount = useCallback((chatId: string) => {
  setChats((prev) => {
    if (!prev) return prev;

    let changed = false;
    const updated = prev.map((chat) => {
      if (chat.chat._id === chatId && chat.chat.unseenCount !== 0) {
        changed = true;
        return {
          ...chat,
          chat: {
            ...chat.chat,
            unseenCount: 0,
          },
        };
      }
      return chat;
    });

    return changed ? updated : prev;
  });
}, [setChats]); 


  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${CHAT_SERVICE}/api/v1/chat/new`,
        {
          userId: loggedInUser?._id,
          otherUserId: u._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedUser(data.chatId);
      setShowAllUser(false);
      await fetchChats();
    } catch {
      toast.error("Failed to start chat");
    }
  }

  const handleMessageSend = async(e: FormEvent, imageFile?: File | null) =>{
    e.preventDefault();

    if (!message.trim() && !imageFile) return;

    if (!selectedUser) return;

    // TODO: socket setup

    if(typingTimeOut){
      clearTimeout(typingTimeOut);
      setTypingTimeOut(null)
    }

    socket?.emit("stopTyping", {
      chatId:selectedUser,
      userId: loggedInUser?._id
    })

    const token = Cookies.get("token");

    try {
       const formData = new FormData();

      formData.append("chatId", selectedUser);

      if (message.trim()) {
        formData.append("text", message);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await axios.post(
        `${CHAT_SERVICE}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((prev) => {
        const currentMessages = prev || [];
        const messageExists = currentMessages.some(
          (msg) => msg._id === data.message._id
        );

        if (!messageExists) {
          return [...currentMessages, data.message];
        }
        return currentMessages;
      });

      setMessage("");

      const displayText = imageFile ? "📷 image" : message;

      moveChatToTop(selectedUser, {
        text: displayText,
        sender: data.sender,
      }, false)

    } catch {
      toast.error("Failed to send message");
    }
  }

  const handleTyping = (value:string)=>{
    setMessage(value);

    if(!selectedUser || !socket) return;

    // TODO: socket setup

    if(value.trim()){
      socket.emit("typing", {
        chatId:selectedUser,
        userId:loggedInUser?._id
      })
    }

    if(typingTimeOut){
      clearTimeout(typingTimeOut);
    }

    const timeout = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId:selectedUser,
        userId: loggedInUser?._id
      })
    }, 2000);

    setTypingTimeOut(timeout);
  }

  useEffect(()=>{

    socket?.on("newMessage", (message) => {
      console.log("Received new message:", message);

      if (selectedUser === message.chatId) {
        setMessages((prev) => {
          const currentMessages = prev || [];
          const messageExists = currentMessages.some(
            (msg) => msg._id === message._id
          );

          if (!messageExists) {
            return [...currentMessages, message];
          }
          return currentMessages;
        });

        moveChatToTop(message.chatId, message, false);
      }else{
        moveChatToTop(message.chatId, message, true);
      }
    });

    socket?.on("userTyping", (data)=>{
      console.log(`User ${data.userId} is typing in chat ${data.chatId}`);
      if(data.chatId === selectedUser && data.userId !== loggedInUser?._id){
        setIsTyping(true);
      }
    })

    socket?.on("userStoppedTyping", (data)=>{
      console.log(`User ${data.userId} is stopped typing in chat ${data.chatId}`);
      if(data.chatId === selectedUser && data.userId !== loggedInUser?._id){
        setIsTyping(false);
      }
    })


    return ()=>{
      socket?.off("newMessage");
      socket?.off("userTyping");
      socket?.off("userStoppedTyping");
    }
  }, [selectedUser, socket, loggedInUser?._id, moveChatToTop])
  

  useEffect(() => {
  if (!selectedUser || !socket) return;

  socket.emit("joinChat", selectedUser);

  return () => {
    socket.emit("leaveChat", selectedUser);
  };
}, [selectedUser, socket]);

useEffect(() => {
  if (!selectedUser) return;
  fetchChat();
  resetUnseenCount(selectedUser);
}, [selectedUser, fetchChat, resetUnseenCount]);


  useEffect(()=>{
    return()=>{
      if(typingTimeOut){
        clearTimeout(typingTimeOut);
      }
    }
  }, [typingTimeOut])

  if (loading) return <Loading />;
  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUsers={showAllUser}
        setShowAllUsers={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
        createChat={createChat}
        onlineUsers={onlineUsers}
      />
      <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-white/10">
        <ChatHeader
          user={user}
          setSidebarOpen={setSidebarOpen}
          isTyping={isTyping}
          onlineUsers={onlineUsers}
        />

        <ChatMessages
          selectedUser={selectedUser}
          messages={messages}
          loggedInUser={loggedInUser}
        />

        <MessageInput
        selectedUser={selectedUser}
        message={message}
        setMessage={handleTyping}
        handleMessageSend={handleMessageSend}
        />
      </div>
    </div>
  );
};
export default ChatPage;
