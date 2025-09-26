import Message from "../models/message.js";
import { userSocketMap, io } from "../websocket/index.js";

export async function getChatMessage(req, res) {
  const user = req.user;
  const { id: receiverId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: user._id, receiverId: receiverId },
        { senderId: receiverId, receiverId: user._id },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error in getChatMessage >>", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function saveImageMessage(req, res) {
  try {
    if (!req?.file) {
      return res
        .status(400)
        .json({ message: "Please send an image as form-data" });
    }

    const senderId = req.user?._id;
    if (!senderId) {
      return res.status(401).json({ message: "Sender not authenticated" });
    }

    const receiverId = req.params?.id;
    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    const imageUrl = req.file.path;

    const newMessage = new Message({
      senderId,
      receiverId,
      image: imageUrl,
    });

    const newMsg = await newMessage.save();

    const socketId = userSocketMap.get(newMsg?.receiverId.toString());
    io.to(socketId).emit("imageMessage", newMsg);
    res.status(200).send({ message: "image Send successfully", newMessage });
  } catch (error) {
    console.error("error in saveImageMessage function>>", error);
    res.status(500).send({ message: "Error in save image", error });
  }
}

export async function saveMessage({ senderId, receiverId, text, isUnread }) {
  try {
    const message = await Message.create({
      senderId,
      receiverId,
      text,
      isUnread,
    });
    return message;
  } catch (error) {
    console.error("Error saving message >>", error);
    throw error;
  }
}

export async function markAsRead({ userId, chatWithId }) {
  try {
    const result = await Message.updateMany(
      {
        senderId: chatWithId,
        receiverId: userId,
        isUnread: true,
      },
      { $set: { isUnread: false } }
    );
    return result;
  } catch (error) {
    console.error("Error in MarkAsRead >>", error);
    throw error;
  }
}

export async function getUnreadCount(req, res) {
  const userId = req.user._id;
  try {
    const unreadCounts = await Message.aggregate([
      { $match: { receiverId: userId, isUnread: true } },
      { $group: { _id: "$senderId", unreadCount: { $sum: 1 } } },
      { $project: { userId: "$_id", unreadCount: 1, _id: 0 } },
    ]);
    res
      .status(200)
      .send({ message: "Succefully fetched UnreadCounts", unreadCounts });
  } catch (error) {
    res.status(500).send("Something is Wrong in getUnreadCount", error);
  }
}

export async function fetchMessages(
  { senderId, receiverId },
  limit = 5,
  before
) {
  try {
    const query = {
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    };

    if (before) {
      query.createdAt = { $lt: before };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    return messages;
  } catch (error) {
    console.error("Error in fetchMessages >>", error);
  }
}
