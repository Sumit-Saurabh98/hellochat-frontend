import { Message } from "@/app/chat/page";
import { User } from "@/context/AppContext";
import React, { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { Check, CheckCheck } from "lucide-react";
import Image from "next/image";

interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
}

const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // seen feature
  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set();
    return messages.filter((message) => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  }, [messages]);

  // Handle scroll events to detect if user is scrolling up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // If user scrolls up from bottom, disable auto-scroll
    if (!isNearBottom && shouldAutoScroll) {
      setShouldAutoScroll(false);
      setUserHasScrolled(true);
    }
    
    // If user scrolls back to bottom, enable auto-scroll
    if (isNearBottom && !shouldAutoScroll) {
      setShouldAutoScroll(true);
      setUserHasScrolled(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive (only if user hasn't scrolled up)
  useEffect(() => {
    if (shouldAutoScroll && !userHasScrolled) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [uniqueMessages, shouldAutoScroll, userHasScrolled]);

  // Reset scroll state when switching users
  useEffect(() => {
    setShouldAutoScroll(true);
    setUserHasScrolled(false);
    // Scroll to bottom when switching users
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [selectedUser]);

  return (
    <div className="flex-1 overflow-hidden">
      <div 
        ref={scrollContainerRef}
        className="h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2 custom-scroll"
        onScroll={handleScroll}
        style={{ scrollBehavior: 'smooth' }}
      >
        {!selectedUser ? (
          <p className="text-gray-400 text-center mt-20">
            Please select a user to start chatting 📩
          </p>
        ) : (
          <>
            {uniqueMessages.length === 0 ? (
              <p className="text-gray-400 text-center mt-20">
                No messages yet. Start the conversation! 💬
              </p>
            ) : (
              uniqueMessages.map((e, i) => {
                const isSentByMe = e.sender === loggedInUser?._id;
                const uniqueKey = `${e._id}-${i}`;

                return (
                  <div
                    className={`flex flex-col gap-1 mt-2 ${
                      isSentByMe ? "items-end" : "items-start"
                    }`}
                    key={uniqueKey}
                  >
                    <div
                      className={`rounded-lg p-3 max-w-sm break-words ${
                        isSentByMe
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {e.messageType === "image" && e.image && (
                        <div className="relative group">
                          <Image
                            width={500}
                            height={500}
                            src={e.image.url}
                            alt="shared image"
                            className="max-w-full h-auto rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {e.text && <p className="mt-1 whitespace-pre-wrap">{e.text}</p>}
                    </div>

                    <div
                      className={`flex items-center gap-1 text-xs text-gray-400 ${
                        isSentByMe ? "pr-2 flex-row-reverse" : "pl-2"
                      }`}
                    >
                      <span>{moment(e.createdAt).format("hh:mm A . MMM D")}</span>

                      {isSentByMe && (
                        <div className="flex items-center ml-1">
                          {e.seen ? (
                            <div className="flex items-center gap-1 text-blue-400">
                              <CheckCheck className="w-3 h-3" />
                              {e.seenAt && (
                                <span>{moment(e.seenAt).format("hh:mm A")}</span>
                              )}
                            </div>
                          ) : (
                            <Check className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>
      
      {/* Scroll to bottom button - shows when user has scrolled up */}
      {userHasScrolled && (
        <button
          onClick={() => {
            setShouldAutoScroll(true);
            setUserHasScrolled(false);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200 z-10"
          aria-label="Scroll to bottom"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ChatMessages;