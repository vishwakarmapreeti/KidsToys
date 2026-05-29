import { Router } from 'express';
import {
  createCategory, getCategories, getCategory,
  updateCategory, deleteCategory,
} from '@/controllers/categoryController';
import { protect, adminOnly } from '@/middleware/authMiddleware';
import upload from '@/middleware/upload';

const router = Router();

router.get('/',     getCategories);
router.get('/:id',  getCategory);
router.post('/',    protect, adminOnly, upload.single('image'), createCategory);
router.put('/:id',  protect, adminOnly, upload.single('image'), updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

export default router;