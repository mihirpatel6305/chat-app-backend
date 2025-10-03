import multer from "multer";
import upload from "../config/multer.js";

export const uploadImageMiddleware = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "File too large. Max 5MB.",
        });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Only image files are allowed.",
        });
      }
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: err.message,
      });
    } else if (err) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: "Something went wrong during upload.",
      });
    }
    next();
  });
};
