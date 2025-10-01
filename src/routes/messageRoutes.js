import express from "express";
import { ProtectedRoutes } from "../middleware/auth.js";
import {
  getUnreadCount,
  saveImageMessage,
} from "../controllers/messageController.js";
import upload from "../config/multer.js";

const routes = express.Router();

routes.get("/unread-count/:id", ProtectedRoutes, getUnreadCount);

routes.post(
  "/image/:id",
  ProtectedRoutes,
  upload.single("image"),
  saveImageMessage
);

export default routes;
