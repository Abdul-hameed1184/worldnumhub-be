import fs from "fs/promises";

// In-memory transactions (replace with DB in production)
let transactions = [];

export const getAllServices = async (req, res) => {
  try {
    const raw = await fs.readFile('./services.json', 'utf8');

    res.json(JSON.parse(raw));
  } catch (err) {
    console.error("Error reading services.json", err);
    res.status(500).json({ message: "Failed to load services" });
  }
};

export const getTransactions = (req, res) => {
  res.json(transactions);
};

export const createTransaction = (req, res) => {
  const { service, amount, tx_ref, flw_ref } = req.body;
  const txn = {
    service,
    amount,
    tx_ref,
    flw_ref,
    status: "pending",
    createdAt: new Date(),
  };
  transactions.push(txn);
  res.json({ ok: true });
};

export const flutterwaveWebhook = (req, res) => {
  const { data } = req.body;
  if (data?.status === "successful") {
    transactions = transactions.map((t) =>
      t.tx_ref === data.tx_ref
        ? { ...t, status: "successful", flw_ref: data.flw_ref }
        : t
    );
  }
  res.sendStatus(200);
};
