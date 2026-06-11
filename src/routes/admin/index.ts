import { Router } from 'express';
import category from './category.route';
import product from './product.route';
import orderRoute from './order.route';
import userRoute     from './user.route';
import dashboardRoute from './dashboard.route';
const router = Router();

router.use('/category', category);
router.use('/product', product);
router.use('/orders',   orderRoute);  
router.use('/users',    userRoute); 
router.use('/dashboard', dashboardRoute);
export default router;