import express from 'express';
import { getAllServices, createTransaction, getUserTransactions, flutterwaveWebhook } from '../controllers/service.controller.js';

const router = express.Router();

router.get('/', getAllServices);

router.post("/", createTransaction);
router.get("/user/:userId", getUserTransactions);
router.post("/webhook", flutterwaveWebhook);

export default router;
