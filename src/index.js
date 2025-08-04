import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import serviceRoutes from "./routes/services.routes.js";
import { connectDB } from "./lib/db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://worldnumhub.vercel.app",
];

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("Blocked by CORS:", origin); // debug log
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());

app.use("/api/auth", authRoutes); // Optional
// app.use("/api/transaction", (req, res) => {
//   res.status(200).json({ message: "Transaction endpoint is working" });
// });
app.use("/api/services", serviceRoutes);

app.listen(PORT, () => {
  console.log(`server running on port ${PORT} `);
  console.log(`http://localhost:${PORT}`);
  connectDB();
});
