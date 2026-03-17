import User from "../models/user.model.js";
import Message from '../models/message.model.js';
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUSerId = req.user._id;
        const filteredUsers = await User.find({
            _id: { $ne: loggedInUSerId }
        }).select("-password");

        res.status(200).json(filteredUsers);

    } catch (error) {
        console.error("get user sidebar error:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req,res) => {
  try {

    const { id } = req.params;

    const message = await Message.findById(id);

    if(!message){
      return res.status(404).json({error:"Message not found"});
    }

    // only sender can delete
    if(message.senderId.toString() !== req.user._id.toString()){
      return res.status(403).json({error:"Not authorized"});
    }

    await Message.findByIdAndDelete(id);

    // realtime delete event
    io.emit("messageDeleted", id);

    res.status(200).json({message:"Message deleted"});

  } catch (error) {

    console.error("Error deleting message:", error.message);
    res.status(500).json({error:"Internal server error"});

  }
};