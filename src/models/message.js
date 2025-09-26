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
    isUnread: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Message = model("Message", messageSchema);
export default Message;
