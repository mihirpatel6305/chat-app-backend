import express from "express";
import { ProtectedRoutes } from "../middleware/auth.js";
import {
  getUnreadCount,
  saveImageMessage,
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

export default routes;
