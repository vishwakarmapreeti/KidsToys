import { Router } from 'express';
import {
  getAllOrders,
  updateOrderStatus,
} from '../../controllers/orderController';
import { protect, adminOnly } from '../../middleware/authMiddleware';

const router = Router();

router.use(protect, adminOnly);

router.get('/',           getAllOrders);      // All orders
router.put('/:id/status', updateOrderStatus); // Update status

export default router;