import { Router } from 'express';
import {
  getAllUsers,
  getUser,
  toggleBlockUser,
  deleteUser,
  updateUserRole,
} from '../../controllers/userController';
import { protect, adminOnly } from '../../middleware/authMiddleware';

const router = Router();

router.use(protect, adminOnly);

router.get('/',              getAllUsers);      // GET    all users
router.get('/:id',           getUser);         // GET    single user
router.patch('/:id/block',   toggleBlockUser); // PATCH  block/unblock
router.patch('/:id/role',    updateUserRole);  // PATCH  update role
router.delete('/:id',        deleteUser);      // DELETE delete user

export default router;