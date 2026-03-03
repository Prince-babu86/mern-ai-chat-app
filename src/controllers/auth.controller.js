import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

async function registerUser(req, res) {
  const { email, fullname, password } = req.body;

  try {
    let user;
    user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({
        message: "User already exists with this email",
      });
    }

    user = User.create({
      email,
      fullname,
      password,
    });

    const token = jwt.sign({id:user._id, email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {});

    return res.status(201).json({
      message: "User created sucesfully",
      user,
      token,
    });
  } catch (error) {
    console.error(error);
  }
}

async function Login(req, res) {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password is required",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
      });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(404).json({
        message: "Wrong password",
      });
    }

    const token = jwt.sign({ id:user._id, email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {});

    return res.status(201).json({
      message: "User Login sucesfully",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
  }
}

async function Logout(req, res) {}

export default {
  registerUser,
  Login,
  Logout,
};
