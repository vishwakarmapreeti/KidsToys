import { Router } from 'express';
import {
  createOrder,
  createRazorpayOrder,
  verifyPayment,
  getMyOrders,
  getOrder,
  cancelOrder,
} from '../../controllers/orderController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/',                       createOrder);        // Create 
router.get('/my',                      getMyOrders);        // My orders
router.get('/:id',                     getOrder);           // Single order
router.post('/:id/razorpay',           createRazorpayOrder);// Razorpay order
router.post('/:id/verify-payment',     verifyPayment);      // Verify payment
router.put('/:id/cancel',              cancelOrder);        // Cancel order

export default router;