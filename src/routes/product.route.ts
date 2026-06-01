import { Router } from 'express';
import {
  getProducts, getProduct, getProductBySlug, getProductsByCategory,
} from '../controllers/productController';

const router = Router();

// Public routes — Anyone can use these
router.get('/', getProducts);                    // Search, filter, sort, paginate
router.get('/category/:catId', getProductsByCategory); // Get by category
router.get('/slug/:slug', getProductBySlug);     // Get by slug
router.get('/:id', getProduct);                  // Get single by ID

export default router;
