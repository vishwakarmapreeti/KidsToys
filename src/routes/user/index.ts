import { Router } from 'express';
import authRoute from './auth.route';
import productRoute from './product.route';

const router = Router();

router.use('/auth', authRoute);
router.use('/product', productRoute);

export default router;