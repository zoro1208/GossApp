// import { useChatStore } from "../store/useChatStore.js";
// import { useEffect, useRef } from "react";
// import { Copy, Reply, Trash2, FileText } from "lucide-react";

// import ChatHeader from "./ChatHeader.jsx";
// import MessageInput from "./MessageInput.jsx";
// import MessageSkeleton from "./skeletons/MessageSkeleton.jsx";
// import { useAuthStore } from "../store/useAuthStore.js";
// import { formatMessageTime } from "../lib/utils.js";

// const ChatContainer = () => {
//   const {
//     messages,
//     getMessages,
//     isMessagesLoading,
//     selectedUser,
//     subscribeToMessages,
//     unsubscribeFromMessages,
//     deleteMessage,
//     setReplyingTo,
//     typingUsers,
//   } = useChatStore();

//   const { authUser } = useAuthStore();
//   const messageEndRef = useRef(null);

//   useEffect(() => {
//     if (!selectedUser?._id) return;
//     getMessages(selectedUser._id);
//     subscribeToMessages();
//     return () => unsubscribeFromMessages();
//   }, [selectedUser?._id]);

//   useEffect(() => {
//     if (messageEndRef.current && messages) {
//       messageEndRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages]);

//   if (isMessagesLoading) {
//     return (
//       <div className="flex-1 flex flex-col overflow-auto">
//         <ChatHeader />
//         <MessageSkeleton />
//         <MessageInput />
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full">
//       <ChatHeader />

//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {messages.map((message) => (
//           <div
//             key={message._id}
//             className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
//             ref={messageEndRef}
//           >
//             {/* AVATAR */}
//             <div className="chat-image avatar">
//               <div className="size-10 rounded-full border">
//                 <img
//                   src={
//                     message.senderId === authUser._id
//                       ? authUser.profilePic || "/avatar.png"
//                       : selectedUser?.profilePic || "/avatar.png"
//                   }
//                   alt="profile"
//                 />
//               </div>
//             </div>

//             {/* TIME */}
//             <div className="chat-header mb-1">
//               <time className="text-xs opacity-50 ml-1">
//                 {formatMessageTime(message.createdAt)}
//               </time>
//             </div>

//             {/* MESSAGE + ACTIONS */}
//             <div className="flex flex-col max-w-xs relative group">
//               {/* ACTION BAR (shows above bubble on hover) */}
//               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition mb-1">
//                 {message.text && (
//                   <button
//                     onClick={() => navigator.clipboard.writeText(message.text || "")}
//                     className="bg-base-200 hover:bg-blue-500 text-blue-500 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1"
//                   >
//                     <Copy size={12} /> Copy
//                   </button>
//                 )}

//                 <button
//                   onClick={() => setReplyingTo(message)}
//                   className="bg-base-200 hover:bg-green-500 text-green-500 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1"
//                 >
//                   <Reply size={12} /> Reply
//                 </button>

//                 {message.senderId === authUser._id && (
//                   <button
//                     onClick={() => deleteMessage(message._id)}
//                     className="bg-base-200 hover:bg-red-500 text-red-500 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1"
//                   >
//                     <Trash2 size={12} /> Delete
//                   </button>
//                 )}
//               </div>

//               {/* CHAT BUBBLE */}
//               <div className="chat-bubble flex flex-col">
//                 {/* IMAGE */}
//                 {message.image && (
//                   <img
//                     src={message.image}
//                     alt="Attachment"
//                     className="sm:max-w-[200px] rounded-md mb-2 border"
//                   />
//                 )}

//                 {/* FILE */}
//                 {message.file && (
//                   <a
//                     href={message.file}
//                     download={message.fileName || "file"}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center gap-2 p-2 rounded-md border bg-base-200 hover:bg-base-300 transition mb-2"
//                   >
//                     <FileText size={16} /> {message.fileName || "Download File"}
//                   </a>
//                 )}

//                 {/* TEXT */}
//                 {message.text && <p>{message.text}</p>}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* TYPING INDICATOR */}
//       {typingUsers?.includes(selectedUser?._id) && (
//         <div className="chat chat-start">
//           <div className="chat-image avatar">
//             <div className="size-10 rounded-full border">
//               <img src={selectedUser?.profilePic || "/avatar.png"} alt="profile" />
//             </div>
//           </div>
//           <div className="chat-bubble text-sm opacity-70">typing...</div>
//         </div>
//       )}

//       <MessageInput />
//     </div>
//   );
// };

// export default ChatContainer;

import { useChatStore } from "../store/useChatStore.js";
import { useEffect, useRef } from "react";
import { Copy, Reply, Trash2, FileText } from "lucide-react";

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
    typingUsers,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  /* ================= FETCH + SOCKET ================= */
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [
    selectedUser?._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* ================= SAFETY ================= */
  if (!authUser) return null;

  /* ================= LOADING ================= */
  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div className="flex flex-col h-full">
      <ChatHeader />

      {/* ================= MESSAGES ================= */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isMe = message.senderId === authUser._id;

          return (
            <div
              key={message._id}
              className={`chat ${isMe ? "chat-end" : "chat-start"}`}
            >
              {/* AVATAR */}
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isMe
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
              <div className="flex flex-col max-w-xs relative group">
                {/* ACTION BAR */}
                <div className="absolute -top-6 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  {message.text && (
                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(message.text || "");
                        } else {
                          alert("Clipboard not supported");
                        }
                      }}
                      className="bg-base-200 hover:bg-blue-500 text-blue-500 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  )}

                  <button
                    onClick={() => setReplyingTo(message)}
                    className="bg-base-200 hover:bg-green-500 text-green-500 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    <Reply size={12} /> Reply
                  </button>

                  {isMe && (
                    <button
                      onClick={() => deleteMessage(message._id)}
                      className="bg-base-200 hover:bg-red-500 text-red-500 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>

                {/* CHAT BUBBLE */}
                <div className="chat-bubble flex flex-col">
                  {/* IMAGE */}
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2 border"
                    />
                  )}

                  {/* FILE */}
                  {message.file && (
                    <a
                      href={message.file}
                      download={message.fileName || "file"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md border bg-base-200 hover:bg-base-300 transition mb-2"
                    >
                      <FileText size={16} />{" "}
                      {message.fileName || "Download File"}
                    </a>
                  )}

                  {/* TEXT */}
                  {message.text && <p>{message.text}</p>}
                </div>
              </div>

              {/* LAST MESSAGE REF (for scroll) */}
              {index === messages.length - 1 && (
                <div ref={messageEndRef}></div>
              )}
            </div>
          );
        })}

        {/* ================= TYPING INDICATOR ================= */}
        {typingUsers?.includes(selectedUser?._id) && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={selectedUser?.profilePic || "/avatar.png"}
                  alt="profile"
                />
              </div>
            </div>
            <div className="chat-bubble text-sm opacity-70">typing...</div>
          </div>
        )}
      </div>

      {/* ================= INPUT ================= */}
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
