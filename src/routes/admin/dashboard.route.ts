import { Router } from 'express';
import { getDashboardStats } from '../../controllers/dashboardController';
import { protect, adminOnly } from '../../middleware/authMiddleware';

const router = Router();

router.get('/', protect, adminOnly, getDashboardStats);

export default router;