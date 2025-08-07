import crypto from "crypto";

// Middleware to verify Flutterwave webhook signature
export const verifyFlutterwaveWebhook = (req, res, next) => {
  const secretHash = process.env.FLW_SECRET_HASH;
  const flutterwaveSignature = req.headers["verif-hash"];

  if (!flutterwaveSignature) {
    return res.status(400).json({ error: "No signature found" });
  }

  const generatedHash = crypto
    .createHmac("sha256", secretHash)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (generatedHash !== flutterwaveSignature) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  // Signature is valid
  next();
};
