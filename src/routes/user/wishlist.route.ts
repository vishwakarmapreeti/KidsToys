import { Router } from 'express';
import {
  getWishlist,
  toggleWishlist,
  clearWishlist,
  checkWishlist,
} from '../../controllers/wishlistController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

router.use(protect);  // sab routes protected

router.get('/',                    getWishlist);    // GET    /api/v1/user/wishlist
router.post('/toggle/:productId',  toggleWishlist); // POST   /api/v1/user/wishlist/toggle/:productId
router.get('/check/:productId',    checkWishlist);  // GET    /api/v1/user/wishlist/check/:productId
router.delete('/clear',            clearWishlist);  // DELETE /api/v1/user/wishlist/clear

export default router;