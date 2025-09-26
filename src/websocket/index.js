import { Server } from "socket.io";
import {
  fetchMessages,
  markAsRead,
  saveMessage,
} from "../controllers/messageController.js";

let io;
const userSocketMap = new Map();
const activeUserMap = new Map();

function setupSocketIO(server) {
  const allowedOrigins = [
    "http://localhost:5173", // dev
    "https://your-frontend-domain.com", // prod
  ];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS (socket.io)"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("connection>>", socket.id);

    socket.on("user_connected", (userId) => {
      userSocketMap.set(userId, socket.id);
      io.emit("onlineUsers", Array.from(userSocketMap.keys()));
    });

    socket.on("active", ({ senderId, receiverId }) => {
      activeUserMap.set(senderId, receiverId);
    });

    socket.on("inActive", ({ senderId }) => {
      activeUserMap.delete(senderId);
    });

    socket.on("message", async ({ senderId, receiverId, text }) => {
      const isChatOpen =
        activeUserMap.has(receiverId) &&
        activeUserMap.get(receiverId) === senderId;

      const msg = { senderId, receiverId, text, isUnread: !isChatOpen };
      const message = await saveMessage(msg);
      const socketId = userSocketMap.get(receiverId);
      io.to(socketId).emit("message", message);
    });

    socket.on("mark_as_read", async ({ userId, chatWithId }) => {
      if (userId && chatWithId) {
        await markAsRead({ userId, chatWithId });
      } else {
        console.error("mark_as_read failed: userId or chatWithId is missing", {
          userId,
          chatWithId,
        });
      }
    });

    socket.on("start_typing", ({ senderId, receiverId }) => {
      const socketId = userSocketMap.get(receiverId);
      io.to(socketId).emit("start_typing", { senderId });
    });

    socket.on("stop_typing", ({ senderId, receiverId }) => {
      const socketId = userSocketMap.get(receiverId);
      io.to(socketId).emit("stop_typing", { senderId });
    });

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
      const limit = 5;
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
        }
      }
      io.emit("onlineUsers", Array.from(userSocketMap.keys()));
    });
  });
}

export default setupSocketIO;
export { io, userSocketMap };
