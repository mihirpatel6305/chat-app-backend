import express from "express";
import { loginUser, signupUser } from "../controllers/authController.js";

const routes = express.Router();

routes.post("/login", loginUser);

routes.post("/signup", signupUser);

export default routes;
