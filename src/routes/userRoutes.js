import express from "express";
import {
  getAllUser,
  getLoginUser,
  getUser,
} from "../controllers/userController.js";
import { ProtectedRoutes } from "../middleware/auth.js";

const routes = express.Router();

routes.get("/users", ProtectedRoutes, getAllUser);

routes.get("/me", ProtectedRoutes, getLoginUser);

routes.get("/:id", ProtectedRoutes, getUser);

export default routes;
