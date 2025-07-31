import express from 'express';
import { getAllServices, getTransactions, createTransaction, flutterwaveWebhook } from '../controllers/service.controller.js';

const router = express.Router();

router.get('/', getAllServices);
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.post('/flutterwave-webhook', flutterwaveWebhook);

export default router;
