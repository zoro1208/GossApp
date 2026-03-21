// import User from "../models/user.model.js";
// import Message from "../models/message.model.js";
// import cloudinary from "../lib/cloudinary.js";
// import { getReceiverSocketId, io } from "../lib/socket.js";

// // ✅ GET USERS (sidebar)
// export const getUsersForSidebar = async (req, res) => {
//   try {
//     const loggedInUserId = req.user._id;

//     const filteredUsers = await User.find({
//       _id: { $ne: loggedInUserId },
//     }).select("-password");

//     res.status(200).json(filteredUsers);
//   } catch (error) {
//     console.error("get user sidebar error:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // ✅ GET MESSAGES
// export const getMessages = async (req, res) => {
//   try {
//     const { id: userToChatId } = req.params;
//     const myId = req.user._id;

//     const messages = await Message.find({
//       $or: [
//         { senderId: myId, receiverId: userToChatId },
//         { senderId: userToChatId, receiverId: myId },
//       ],
//     });

//     res.status(200).json(messages);
//   } catch (error) {
//     console.log("Error in getMessages:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const sendMessage = async (req, res) => {
//   try {
//     const { text } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     let imageUrl, fileUrl, fileName;

//     // For image (still base64)
//     if (req.body.image) {
//       const uploadResponse = await cloudinary.uploader.upload(req.body.image, {
//         folder: "chat_images",
//       });
//       imageUrl = uploadResponse.secure_url;
//     }

//     // For files (PDF/DOC)
//     if (req.files?.file) {
//       const uploadResponse = await cloudinary.uploader.upload(req.files.file.tempFilePath, {
//         resource_type: "auto",
//         folder: "chat_files",
//       });
//       fileUrl = uploadResponse.secure_url;
//       fileName = req.files.file.name;
//     }

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       text,
//       image: imageUrl,
//       file: fileUrl,
//       fileName,
//     });

//     console.log(file);

//     await newMessage.save();

//     // realtime
//     const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMessage);

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error("sendMessage error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // ✅ DELETE MESSAGE
// export const deleteMessage = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const message = await Message.findById(id);

//     if (!message) {
//       return res.status(404).json({ error: "Message not found" });
//     }

//     // ✅ only sender can delete
//     if (message.senderId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ error: "Not authorized" });
//     }

//     await Message.findByIdAndDelete(id);

//     // ✅ realtime delete
//     io.emit("messageDeleted", id);

//     res.status(200).json({ message: "Message deleted" });

//   } catch (error) {
//     console.error("Error deleting message:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

/* ================= GET USERS ================= */
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("get user sidebar error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* ================= GET MESSAGES ================= */
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }); // ✅ FIX: sorted messages

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ================= SEND MESSAGE ================= */
export const sendMessage = async (req, res) => {
  try {
    const { text, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !req.body.image && !req.files?.file) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    let imageUrl = null;
    let fileUrl = null;
    let fileName = null;

    /* ===== IMAGE UPLOAD ===== */
    if (req.body.image) {
      const uploadResponse = await cloudinary.uploader.upload(req.body.image, {
        folder: "chat_images",
      });
      imageUrl = uploadResponse.secure_url;
    }

    /* ===== FILE UPLOAD ===== */
    if (req.files?.file) {
      const uploadResponse = await cloudinary.uploader.upload(
        req.files.file.tempFilePath,
        {
          resource_type: "auto",
          folder: "chat_files",
        }
      );
      fileUrl = uploadResponse.secure_url;
      fileName = req.files.file.name;
    }

    /* ===== CREATE MESSAGE ===== */
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      file: fileUrl,
      fileName,
      replyTo: replyTo || null, // ✅ FIX: reply support
    });

    await newMessage.save();

    /* ===== REALTIME SEND ===== */
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // also send back to sender (sync UI)
    io.to(req.user.socketId).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ================= DELETE MESSAGE ================= */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    /* ===== AUTH CHECK ===== */
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Message.findByIdAndDelete(id);

    /* ===== REALTIME DELETE (ONLY USERS IN CHAT) ===== */
    const receiverSocketId = getReceiverSocketId(message.receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", id);
    }

    io.to(req.user.socketId).emit("messageDeleted", id);

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.error("Error deleting message:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
