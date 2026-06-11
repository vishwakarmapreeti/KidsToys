import { Response } from 'express';
import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist';
import { AuthRequest } from '../types';

// ─── GET WISHLIST ─────────────────────────────────────────
// @route  GET /api/v1/user/wishlist
// @access Private
export const getWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wishlist = await Wishlist.findOne(
      { user: req.user?._id } as any
    ).populate('products', 'name images price discountPrice ratings stock isActive slug brand');

    if (!wishlist) {
      res.json({ success: true, wishlist: { products: [] } });
      return;
    }

    res.json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── TOGGLE WISHLIST ──────────────────────────────────────
// @route  POST /api/v1/user/wishlist/toggle/:productId
// @access Private
export const toggleWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = req.params['productId'] as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    const pid = new mongoose.Types.ObjectId(productId);

    // Wishlist dhundo ya banao
    let wishlist = await Wishlist.findOne({ user: req.user?._id } as any);

    if (!wishlist) {
      // Naya wishlist banao aur product add karo
      wishlist = await Wishlist.create({
        user:     req.user?._id,
        products: [pid],
      });

      res.status(201).json({
        success: true,
        message: 'Added to wishlist',
        added:   true,
        wishlist,
      });
      return;
    }

    // Product already hai wishlist mein?
    const alreadyExists = wishlist.products.some(
      p => p.toString() === productId
    );

    if (alreadyExists) {
      // ✅ Remove karo
      wishlist.products = wishlist.products.filter(
        p => p.toString() !== productId
      );
      await wishlist.save();

      res.json({
        success: true,
        message: 'Removed from wishlist',
        added:   false,
        wishlist,
      });
    } else {
      // ✅ Add karo
      wishlist.products.push(pid);
      await wishlist.save();

      res.json({
        success: true,
        message: 'Added to wishlist',
        added:   true,
        wishlist,
      });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── CLEAR WISHLIST ───────────────────────────────────────
// @route  DELETE /api/v1/user/wishlist/clear
// @access Private
export const clearWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user?._id } as any);

    if (!wishlist) {
      res.json({ success: true, message: 'Wishlist is already empty' });
      return;
    }

    wishlist.products = [];
    await wishlist.save();

    res.json({ success: true, message: 'Wishlist cleared' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── CHECK IF IN WISHLIST ─────────────────────────────────
// @route  GET /api/v1/user/wishlist/check/:productId
// @access Private
export const checkWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = req.params['productId'] as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    const wishlist = await Wishlist.findOne({ user: req.user?._id } as any);

    const isInWishlist = wishlist
      ? wishlist.products.some(p => p.toString() === productId)
      : false;

    res.json({ success: true, isInWishlist });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
