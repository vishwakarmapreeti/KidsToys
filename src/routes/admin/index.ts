import { Router } from 'express';
import category from './category.route';
import product from './product.route';
import orderRoute from './order.route';

const router = Router();

router.use('/category', category);
router.use('/product', product);
router.use('/orders',   orderRoute);  
export default router;