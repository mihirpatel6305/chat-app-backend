import Message from "../models/message.js";
import { userSocketMap, io } from "../websocket/index.js";

export async function saveImageMessage(req, res) {
  try {
    if (!req?.file) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: [
          { field: "image", message: "Please send an image as form-data" },
        ],
      });
    }

    const senderId = req.user?._id;
    if (!senderId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Unauthorized",
        errors: [{ field: "senderId", message: "Sender not authenticated" }],
      });
    }

    const receiverId = req.params?.id;
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: [{ field: "receiverId", message: "Pass valid ReciverId" }],
      });
    }

    const imageUrl = req.file?.path;

    const newMessage = new Message({
      senderId,
      receiverId,
      image: imageUrl,
      status: "sent",
    });

    const newMsg = await newMessage.save();

    // Emitting Image message to receiver here by socket event
    const socketId = userSocketMap.get(newMsg?.receiverId.toString());
    io.to(socketId).emit("imageMessage", newMsg);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Image sent successfully",
      data: { newMessage: newMsg },
    });
  } catch (error) {
    console.error("Error in saveImageMessage >>", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      errors: [],
    });
  }
}

export async function getUnreadCount(req, res) {
  const userId = req?.user?._id;
  try {
    const unreadCounts = await Message.aggregate([
      { $match: { receiverId: userId, status: { $ne: "seen" } } },
      { $group: { _id: "$senderId", unreadCount: { $sum: 1 } } },
      { $project: { userId: "$_id", unreadCount: 1, _id: 0 } },
    ]);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Successfully fetched unread counts",
      data: { unreadCounts },
    });
  } catch (error) {
    console.error("Error in getUnreadCount >>", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      errors: [],
    });
  }
}

export async function setAllDelivered(req, res) {
  try {
    const userId = req?.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    const result = await Message.updateMany(
      { receiverId: userId, status: "sent" },
      { $set: { status: "delivered" } }
    );

    const deliveredMessages = await Message.find({
      receiverId: userId,
      status: "delivered",
    });

    // Emit message_delivered event to each sender
    deliveredMessages.forEach((msg) => {
      const senderSocketId = userSocketMap.get(msg.senderId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_delivered", msg);
      }
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "All sent messages are now marked as delivered",
      data: { updatedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Error in setAllDelivered >>", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      errors: [],
    });
  }
}

export async function getLatestMsg(req, res) {
  const userId = req.user._id;

  try {
    const latestMessages = await Message.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
          },
          lastMessageAt: { $first: "$createdAt" },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Successfully fetched latest messages",
      data: { latestMessages },
    });
  } catch (error) {
    console.error("Error in getLatestMsg >>", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      errors: [],
    });
  }
}

export async function saveMessage({ senderId, receiverId, text, status }) {
  try {
    const message = await Message.create({
      senderId,
      receiverId,
      text,
      status,
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
        status: { $ne: "seen" },
      },
      { $set: { status: "seen" } }
    );
    return result;
  } catch (error) {
    console.error("Error in MarkAsRead >>", error);
    throw error;
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

export async function setMessageDelivered(message) {
  try {
    const result = await Message.findByIdAndUpdate(
      { _id: message._id, status: { $ne: "seen" } },
      { $set: { status: "delivered" } },
      { new: true }
    );

    return result;
  } catch (error) {
    console.error("Error in setMessageDelivered >>", error);
    throw error;
  }
}

export async function setMessageSeen(message) {
  try {
    const result = await Message.findByIdAndUpdate(
      message._id,
      { $set: { status: "seen" } },
      { new: true }
    );

    return result;
  } catch (error) {
    console.error("Error in setMessageSeen >>", error);
    throw error;
  }
}
