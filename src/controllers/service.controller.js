import fs from "fs/promises";
import Transaction from "../models/transaction.model.js";


export const getAllServices = async (req, res) => {
  try {
    const raw = await fs.readFile('./services.json', 'utf8');

    res.json(JSON.parse(raw));
  } catch (err) {
    console.error("Error reading services.json", err);
    res.status(500).json({ message: "Failed to load services" });
  }
};


export const createTransaction = async (req, res) => {
  const { service, amount, tx_ref, flw_ref, userId } = req.body;

  try {
    const txn = await Transaction.create({
      service,
      amount,
      tx_ref,
      flw_ref,
      user: userId,
    });

    res.status(201).json({ ok: true, txn });
  } catch (err) {
    console.error("Create txn error:", err);
    res.status(500).json({ message: "Failed to create transaction" });
  }
};

// Get all transactions for a user
export const getUserTransactions = async (req, res) => {
  const userId = req.params.userId;

  try {
    const txns = await Transaction.find({ user: userId }).sort({ createdAt: -1 });
    res.json(txns);
  } catch (err) {
    console.error("Fetch txns error:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// Webhook to update transaction status from Flutterwave
export const flutterwaveWebhook = async (req, res) => {
  const { data } = req.body;

  if (data?.status === "successful") {
    await Transaction.findOneAndUpdate(
      { tx_ref: data.tx_ref },
      { status: "successful", flw_ref: data.flw_ref }
    );
  }

  res.sendStatus(200);
};