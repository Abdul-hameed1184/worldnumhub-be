// src/scripts/seedTransactions.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Transaction from '../models/transaction.model.js';

dotenv.config();
const MONGO_URI = process.env.MONGODB_URI;

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const userId = '6887e4624fd5f3030c25e196'; // <-- use your real user ID

    const dummyTxns = [
      {
        user: userId,
        service: "Virtual US Number",
        amount: 2000,
        tx_ref: "TXN123456",
        flw_ref: "FLW987654",
        status: "successful",
      },
      {
        user: userId,
        service: "SMS Package",
        amount: 1500,
        tx_ref: "TXN234567",
        flw_ref: "FLW876543",
        status: "pending",
      },
    ];

    await Transaction.insertMany(dummyTxns);
    console.log("✅ Seeded transactions");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    process.exit(1);
  }
};

seed();
