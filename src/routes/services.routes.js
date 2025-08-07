import express from "express";
import {
  getAllServices,
  createTransaction,
  getUserTransactions,
  fundWallet,
  webhook,
  getBalance,
  transferFunds,
  verifyTransaction,
} from "../controllers/service.controller.js";

const router = express.Router();

router.get("/", getAllServices);

router.get("/:userId/balance", getBalance);
router.get("/verify/:tx_ref/", verifyTransaction);
router.post("/", createTransaction);
router.get("/user/:userId", getUserTransactions);
router.post("/fund-wallet", fundWallet);
router.post("/webhook", webhook);
router.get("/transactions", getUserTransactions);
router.post("/transfer", transferFunds);

export default router;
