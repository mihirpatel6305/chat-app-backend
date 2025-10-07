import express from "express";
import { ProtectedRoutes } from "../middleware/auth.js";
import {
  getUnreadCount,
  saveImageMessage,
  setAllDelivered,
} from "../controllers/messageController.js";
import { uploadImageMiddleware } from "../middleware/uploadHandler.js";

const routes = express.Router();

routes.get("/unread-count/:id", ProtectedRoutes, getUnreadCount);

routes.post(
  "/image/:id",
  ProtectedRoutes,
  uploadImageMiddleware,
  saveImageMessage
);

routes.put("/delivered", ProtectedRoutes, setAllDelivered);

export default routes;
