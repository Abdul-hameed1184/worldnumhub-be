import bcrypt from 'bcrypt'
import { generateToken } from '../lib/utils.js';
import User from '../models/user.model.js';

export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6)
      return res.json({ error: "password must be at least 6 characters long" });

    // const duplicate = User.findOne({email})
    // if(duplicate) return res.status(400).json({ message: 'email already exists' });
    const duplicate = await User.findOne({ email }); // Add 'await' here
    if (duplicate) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    if (newUser) {
      newUser.save();
      generateToken(newUser._id, res);

      res
        .status(201)
        .json({
          message: "user created successfully",
          // token: generateToken(newUser._id, res),
        });
      // res.json({ message: 'user created successfully' });
    }
  } catch (error) {
    console.log("signup controller error", error.message);
    res.status(500).json({ message: "Internal Server error" });
  }
  // check if user already exists
};

export const login = async (req, res) => {

  const { email, password } = req.body;

  try {

    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

     generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.log(error.message)
  }
};
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 0,
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server error" });
  }
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Internal Server error" });
    }
};