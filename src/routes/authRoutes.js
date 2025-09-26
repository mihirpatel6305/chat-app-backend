import express from "express";
import { loginUser, signinUser } from "../controllers/authController.js";

const routes = express.Router();

routes.post("/login", loginUser);

routes.post("/signin", signinUser);

export default routes;
