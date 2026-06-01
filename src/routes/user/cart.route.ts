import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../../controllers/cartController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

// Sab routes protected hain — login zaroori hai
router.use(protect);

router.get('/',                  getCart);        // GET    /api/v1/user/cart
router.post('/',              addToCart);      // POST   /api/v1/user/cart
router.put('/:itemId',    updateCartItem); // PUT    /api/v1/user/cart/:itemId
router.delete('/clear',          clearCart);      // DELETE /api/v1/user/cart
router.delete('/:itemId', removeFromCart); // DELETE /api/v1/user/cart/:itemId

export default router;