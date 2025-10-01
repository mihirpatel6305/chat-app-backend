import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

export async function loginUser(req, res) {
  try {
    let { email, password } = req.body;

    email = email?.trim();
    password = password?.trim();

    const errors = [];
    if (!validator.isEmail(email))
      errors.push({ field: "email", message: "Invalid email format" });
    if (!password || password.length > 6)
      errors.push({ field: "password", message: "Invalid password" });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found",
        errors: [{ field: "email", message: "No account with this email" }],
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid credentials",
        errors: [{ field: "password", message: "Incorrect password" }],
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Success",
      data: { user, token },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error",
      errors: [],
    });
  }
}

export async function signupUser(req, res) {
  try {
    let { name, email, password } = req.body;

    name = name?.trim();
    email = email?.trim();
    password = password?.trim();

    const errors = [];

    if (!name) {
      errors.push({
        field: "name",
        message: "Name is required",
      });
    }

    if (!validator.isEmail(email)) {
      errors.push({
        field: "email",
        message: "Invalid email format",
      });
    }

    if (password.length < 6) {
      errors.push({
        field: "password",
        message: "Password must be at least 6 characters",
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: errors,
      });
    }

    const isEmailExist = await User.findOne({ email });
    if (isEmailExist) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
        errors: [{ field: "email", message: "Email already registered" }],
      });
    }

    const saltRounds = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({
      success: true,
      statusCode: 200,
      message: "Success",
      data: { user, token },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal server error",
      errors: [],
    });
  }
}
