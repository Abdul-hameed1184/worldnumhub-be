import fs from "fs/promises";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import { v4 as uuidv4 } from "uuid";
import { flutterwaveRequest } from "../lib/utils.js";
import axios from "axios";

export const getAllServices = async (req, res) => {
  try {
    const raw = await fs.readFile("./services.json", "utf8");

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
    const txns = await Transaction.find({ user: userId }).sort({
      createdAt: -1,
    });
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

export const verifyTransaction = async (req, res) => {
  const tx_ref = req.params.tx_ref?.trim();
  console.log("Verifying tx_ref:", tx_ref);

  if (!tx_ref) {
    return res.status(400).json({ error: "Transaction reference is required" });
  }

  try {
    const transaction = await Transaction.findOne({ tx_ref });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found in DB" });
    }

    console.log("Transaction found in DB:", transaction);

    let flwRes;

    try {
      flwRes = await axios.get(
        `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          },
        }
      );
    } catch (err) {
      const flwError = err.response?.data;
      console.error("Flutterwave verification error:", flwError || err.message);

      // If Flutterwave says transaction doesn't exist → mark failed
      if (
        flwError?.status === "error" &&
        flwError?.message?.includes("No transaction was found")
      ) {
        transaction.status = "failed";
        await transaction.save();

        return res.json({
          message: "Transaction marked as failed (not found on Flutterwave)",
          status: "failed",
        });
      }

      return res.status(500).json({
        error: "Failed to verify transaction",
        details: flwError || err.message,
      });
    }

    const { data } = flwRes.data;
    console.log("Flutterwave response:", data);

    const flutterwaveAmount = Number(data.amount);
    const transactionAmount = Number(transaction.amount);

    // 1️⃣ Successful payment
    if (data.status === "successful" && flutterwaveAmount === transactionAmount) {
      if (transaction.status !== "successful") {
        transaction.status = "successful";
        await transaction.save();

        await User.findByIdAndUpdate(transaction.user, {
          $inc: { balance: transactionAmount },
        });
      }
    }
    // 2️⃣ Cancelled by user on payment page
    else if (data.status === "cancelled") {
      transaction.status = "cancelled";
      await transaction.save();
    }
    // 3️⃣ Any other state → failed
    else {
      transaction.status = "failed";
      await transaction.save();
    }

    return res.json({
      message: "Transaction verified",
      status: transaction.status,
    });
  } catch (err) {
    console.error("Verification error:", err.response?.data || err.message);
    return res.status(500).json({
      error: "Failed to verify transaction",
      details: err.response?.data || err.message,
    });
  }
};




export const fundWallet = async (req, res) => {
  const { userId, amount, email } = req.body;

  if (!userId || !amount || !email) {
    return res
      .status(400)
      .json({ error: "userId, amount, and email are required" });
  }

  try {
    const tx_ref = uuidv4();

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref,
        amount,
        currency: "NGN",
        redirect_url: `${process.env.FRONTEND_URL}/payment-success`,
        customer: {
          email,
        },
        customizations: {
          title: "Wallet Funding",
          logo: "../icon.png", // your logo
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paymentLink = response.data?.data?.link;

    if (!paymentLink) {
      return res
        .status(500)
        .json({ error: "Failed to get payment link from Flutterwave" });
    }

    // Save pending transaction
    await Transaction.create({
      user: userId,
      type: "credit",
      amount,
      status: "pending",
      tx_ref: tx_ref,
      service: "fund-wallet",
    });
    

    res.status(200).json({ link: paymentLink });
  } catch (err) {
    console.error("Flutterwave Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
};

/**
 * Webhook for Payment Verification
 */
export const webhook = async (req, res) => {
  const event = req.body;

  if (event.event === "charge.completed") {
    const txRef = event.data.tx_ref;
    const status = event.data.status;

    // Find Transaction
    const transaction = await Transaction.findOne({ reference: txRef });
    console.log(transaction);

    if (!transaction) return res.sendStatus(404);

    if (status === "successful" && transaction.status !== "successful") {
      // Mark as successful
      transaction.status = "successful";
      await transaction.save();

      // Increment User Balance
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { balance: transaction.amount },
      });
    } else {
      transaction.status = "failed";
      await transaction.save();
    }
  }

  res.sendStatus(200);
};

/**
 * Get Balance
 */
export const getBalance = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.sendStatus(404);
  res.json({ balance: user.balance });
};

/**
 * Transfer Funds
 */
export const transferFunds = async (req, res) => {
  const { userId, amount, bank_code, account_number } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.balance < amount)
    return res.status(400).json({ error: "Insufficient balance" });

  const reference = uuidv4();

  try {
    // Initiate transfer
    const transferRes = await flutterwaveRequest.post("/transfers", {
      account_bank: bank_code,
      account_number,
      amount,
      currency: "NGN",
      reference,
      narration: "Payout from wallet",
    });

    // Debit User
    user.balance -= amount;
    await user.save();

    // Log transaction
    await Transaction.create({
      user: userId,
      type: "debit",
      amount,
      status: "successful",
      reference,
    });

    res.json({ transfer: transferRes.data.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transfer failed" });
  }
};
