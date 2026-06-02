import { Router } from 'express';
import authRoute from './auth.route';
import productRoute from './product.route';
import categoryRoute from '../admin/category.route';
import cartRoute from './cart.route';
import wishlistRoute from './wishlist.route';
import orderRoute from './order.route';
const router = Router();

router.use('/auth', authRoute);
router.use('/product', productRoute);
router.use('/category', categoryRoute);
router.use('/cart',     cartRoute);     
router.use('/wishlist', wishlistRoute);
router.use('/orders',   orderRoute);     
export default router;