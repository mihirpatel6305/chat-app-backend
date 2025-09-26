import User from "../models/user.js";

export async function getAllUser(req, res) {
  const loginUserId = req.user._id;
  try {
    const allUser = await User.find({ _id: { $ne: loginUserId } });
    res.status(201).json(allUser);
  } catch (error) {
    console.error("Error in getAllUser>>", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const getLoginUser = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in getLoginUser", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getUser", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
