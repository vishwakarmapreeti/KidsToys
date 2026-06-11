import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Order from '../models/Order';
import { AuthRequest } from '../types';

// ─── GET ALL USERS ────────────────────────────────────────
// @route  GET /api/v1/admin/users
// @access Admin
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const query: any = {};
    if (role)   query.role = role;
    if (search) {
      query.$or = [
        { name:  { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum  = Number(page);
    const limitNum = Number(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query as any)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query as any),
    ]);

    res.json({
      success: true,
      total,
      page:    pageNum,
      pages:   Math.ceil(total / limitNum),
      users,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── GET SINGLE USER ──────────────────────────────────────
// @route  GET /api/v1/admin/users/:id
// @access Admin
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params['id'] as string;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(
      new mongoose.Types.ObjectId(userId)
    ).select('-password') as any;

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // User ke orders bhi fetch karo
    const orders = await Order.find({ user: user._id } as any)
      .sort({ createdAt: -1 })
      .limit(5);

    const totalOrders  = await Order.countDocuments({ user: user._id } as any);
    const totalSpent   = orders.reduce((sum: number, o: any) => sum + o.totalPrice, 0);

    res.json({ success: true, user, orders, totalOrders, totalSpent });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── BLOCK / UNBLOCK USER ─────────────────────────────────
// @route  PATCH /api/v1/admin/users/:id/block
// @access Admin
export const toggleBlockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params['id'] as string;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(
      new mongoose.Types.ObjectId(userId)
    ) as any;

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Admin ko block nahi kar sakte
    if (user.role === 'admin') {
      res.status(403).json({ message: 'Cannot block an admin user' });
      return;
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive ? 'User unblocked' : 'User blocked',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── DELETE USER ──────────────────────────────────────────
// @route  DELETE /api/v1/admin/users/:id
// @access Admin
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params['id'] as string;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(
      new mongoose.Types.ObjectId(userId)
    ) as any;

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.role === 'admin') {
      res.status(403).json({ message: 'Cannot delete an admin user' });
      return;
    }

    await User.findOneAndDelete({ _id: new mongoose.Types.ObjectId(userId) } as any);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── UPDATE USER ROLE ─────────────────────────────────────
// @route  PATCH /api/v1/admin/users/:id/role
// @access Admin
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params['id'] as string;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const user = await (User as any).findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};  


// ─── UPDATE OWN PROFILE ───────────────────────────────────
// @route  PUT /api/v1/user/profile
// @access Private
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, address } = req.body;

    const user = await (User as any).findOneAndUpdate(
      { _id: req.user?._id },
      { name, phone, address },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────
// @route  PUT /api/v1/user/profile/change-password
// @access Private
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Both passwords are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters' });
      return;
    }

    const user = await User.findOne(
      { _id: req.user?._id } as any
    ).select('+password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};