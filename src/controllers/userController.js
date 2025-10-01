import User from "../models/user.js";

export async function getAllUser(req, res) {
  const loginUserId = req.user?._id;

  try {
    const allUser = await User.find({ _id: { $ne: loginUserId } });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Successfully fetched all users",
      data: { users: allUser },
    });
  } catch (error) {
    console.error("Error in getAllUser >>", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      errors: [],
    });
  }
}

export const getLoginUser = (req, res) => {
  const user = req?.user;

  try {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Success",
      data: { user },
    });
  } catch (error) {
    console.error("Error in getLoginUser >>", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      errors: [],
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const id = req.params?.id;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found",
        errors: [
          { field: "receiverId", message: "No user exists with this ID" },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "User fetched successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Error in getUser >>", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      errors: [],
    });
  }
};
