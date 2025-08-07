import axios from "axios";
import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProduction, // true in production, false in development
    sameSite: isProduction ? "none" : "lax", // 'none' for cross-site cookies in prod, 'lax' for local
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export async function sendEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD
    }
  });

  await transporter.sendMail({
    from: '"Your App" <your@gmail.com>',
    to,
    subject,
    html
  });
}



export const flutterwaveRequest = axios.create({
  baseURL: "https://api.flutterwave.com/v3",
  headers: {
    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, // use your real secret key in .env
    "Content-Type": "application/json"
  }
});
