import express from "express";
import { ProtectedRoutes } from "../middleware/auth.js";
import {
  getChatMessage,
  getUnreadCount,
  saveImageMessage,
} from "../controllers/messageController.js";
import upload from "../config/multer.js";

const routes = express.Router();

routes.get("/:id", ProtectedRoutes, getChatMessage);

routes.get("/unreadCount/:id", ProtectedRoutes, getUnreadCount);

routes.post(
  "/sendImage/:id",
  ProtectedRoutes,
  upload.single("image"),
  saveImageMessage
);

export default routes;
