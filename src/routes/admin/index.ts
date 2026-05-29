import { Router } from 'express';
import category from './category.route';
import product from './product.route';

const router = Router();

router.use('/category', category);
router.use('/product', product);

export default router;