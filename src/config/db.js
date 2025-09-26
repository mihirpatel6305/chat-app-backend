import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

function connectDB() {
  try {
    mongoose.connect(MONGO_URL);
    console.log("connected successfully");
  } catch (error) {
    console.error("Connection error>>", error);
  }
}

export default connectDB;
