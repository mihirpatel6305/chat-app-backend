import mongoose, { model } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      minlength: 1,
    },
    image: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "seen"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Message = model("Message", messageSchema);
export default Message;
