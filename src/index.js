import express from "express";
import dotenv from "dotenv";
import cors from 'cors'
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js"
import { connectDB } from "./lib/db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;



app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://worldnumhub.vercel.app/"
    ],
    credentials: true,
  })
);
app.use(cookieParser())

app.use('/api/auth', authRoutes)

app.listen(PORT, ()=> {
  console.log(`server running on port ${PORT} `)
  connectDB();
})