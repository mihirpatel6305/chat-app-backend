import { Server } from "socket.io";
import {
  fetchMessages,
  markAsRead,
  saveMessage,
  setMessageDelivered,
  setMessageSeen,
} from "../controllers/messageController.js";

let io;
const userSocketMap = new Map();
const activeUserMap = new Map();

function setupSocketIO(server) {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://chat-app-frontend-one-xi.vercel.app",
  ];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
  });

  io.on("connection", (socket) => {
    console.log("connection>>", socket.id);

    // Set userId with socketId in Map
    socket.on("user_connected", (userId) => {
      userSocketMap.set(userId, socket.id);
      io.emit("onlineUsers", Array.from(userSocketMap.keys()));
    });

    // Active if Receiver already open sender chat window
    socket.on("active", ({ senderId, receiverId }) => {
      activeUserMap.set(senderId, receiverId);
    });

    socket.on("inActive", ({ senderId }) => {
      activeUserMap.delete(senderId);
    });

    socket.on("message", async ({ senderId, receiverId, text, tempId }) => {
      const isChatOpen =
        activeUserMap.has(receiverId) &&
        activeUserMap.get(receiverId) === senderId;

      const msg = {
        senderId,
        receiverId,
        text,
        status: isChatOpen ? "seen" : "sent",
      };
      const message = await saveMessage(msg);

      // For message send acknowledge
      const senderSocketId = userSocketMap.get(senderId);
      io.to(senderSocketId).emit("message_sent", { ...message, tempId });

      // Sending to receiver here
      const socketId = userSocketMap.get(receiverId);
      io.to(socketId).emit("message", message);
    });

    socket.on("message_delivered", async (message) => {
      // Update status in DB
      const updatedMsg = await setMessageDelivered(message);

      const senderSocketId = userSocketMap.get(message?.senderId);
      io.to(senderSocketId).emit("message_delivered", updatedMsg);
    });

    socket.on("message_seen", async (message) => {
      const updatedMsg = await setMessageSeen(message);

      const senderSocketId = userSocketMap.get(message?.senderId);
      io.to(senderSocketId).emit("message_seen", updatedMsg);
    });

    socket.on("mark_as_read", async ({ userId, chatWithId }) => {
      if (userId && chatWithId) {
        await markAsRead({ userId, chatWithId });

        const socketId = userSocketMap.get(chatWithId);
        io.to(socketId).emit("mark_as_read", { seenby: userId });
      } else {
        console.error("mark_as_read failed: userId or chatWithId is missing", {
          userId,
          chatWithId,
        });
      }
    });

    // For Typing Indicator
    socket.on("start_typing", ({ senderId, receiverId }) => {
      const socketId = userSocketMap.get(receiverId);
      io.to(socketId).emit("start_typing", { senderId });
    });

    socket.on("stop_typing", ({ senderId, receiverId }) => {
      const socketId = userSocketMap.get(receiverId);
      io.to(socketId).emit("stop_typing", { senderId });
    });

    // Sending initial messages from DB
    socket.on(
      "getInitialMessages",
      async ({ senderId, receiverId, before }) => {
        const limit = 15;
        const messages = await fetchMessages(
          { senderId, receiverId },
          limit,
          before
        );
        socket.emit("getInitialMessages", messages);
      }
    );

    socket.on("getPrevMessages", async ({ senderId, receiverId, before }) => {
      const limit = 10;
      const messages = await fetchMessages(
        { senderId, receiverId },
        limit,
        before
      );
      socket.emit("getPrevMessages", messages);
    });

    socket.on("logout", (userId) => {
      const socketId = userSocketMap.get(userId);
      if (socketId) {
        io.sockets.sockets.get(socketId)?.disconnect(true);
        userSocketMap.delete(userId);
        io.emit("onlineUsers", Array.from(userSocketMap.keys()));
      }
    });

    socket.on("disconnect", () => {
      console.log("disconnected >>>", socket.id);
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          activeUserMap.delete(userId);
        }
      }
      io.emit("onlineUsers", Array.from(userSocketMap.keys()));
    });
  });
}

export default setupSocketIO;
export { io, userSocketMap };
