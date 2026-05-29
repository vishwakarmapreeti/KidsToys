import { Router } from 'express';
import {
  createProduct, updateProduct, deleteProduct,
} from '@/controllers/productController';
import { protect, adminOnly } from '@/middleware/authMiddleware';
import upload from '@/middleware/upload';

const router = Router();

// Admin only routes
router.post('/', protect, adminOnly, upload.array('images', 5), createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;

