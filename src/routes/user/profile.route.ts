import { Router } from 'express';
import { updateProfile, changePassword } from '../../controllers/userController';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.put('/',                 updateProfile);   // PUT /api/v1/user/profile
router.put('/change-password',  changePassword);  // PUT /api/v1/user/profile/change-password

export default router;