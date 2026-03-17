import { useChatStore } from "../store/useChatStore.js";
import { useEffect, useRef } from "react";
import { Copy, Reply, Trash2 } from "lucide-react";

import ChatHeader from "./ChatHeader.jsx";
import MessageInput from "./MessageInput.jsx";
import MessageSkeleton from "./skeletons/MessageSkeleton.jsx";
import { useAuthStore } from "../store/useAuthStore.js";
import { formatMessageTime } from "../lib/utils.js";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    setReplyingTo,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // load messages
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id]);

  // auto scroll
  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id
                ? "chat-end"
                : "chat-start"
            }`}
            ref={messageEndRef}
          >
            {/* AVATAR */}
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser?.profilePic || "/avatar.png"
                  }
                  alt="profile"
                />
              </div>
            </div>

            {/* TIME */}
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>

            {/* MESSAGE + ACTIONS */}
            <div className="flex flex-col gap-1 group max-w-xs">

              {/* ACTION BAR ABOVE MESSAGE */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">

                {/* COPY */}
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(message.text || "")
                  }
                  className="bg-base-200 hover:bg-blue-500 text-blue-500 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                >
                  <Copy size={12} /> Copy
                </button>

                {/* REPLY */}
                <button
                  onClick={() => setReplyingTo(message)}
                  className="bg-base-200 hover:bg-green-500 text-green-500 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                >
                  <Reply size={12} /> Reply
                </button>

                {/* DELETE */}
                {message.senderId === authUser._id && (
                  <button
                    onClick={() => deleteMessage(message._id)}
                    className="bg-base-200 hover:bg-red-500 text-red-500 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>

              {/* MESSAGE BUBBLE */}
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}

                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;