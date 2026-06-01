import { Response } from 'express';
import mongoose from 'mongoose';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { AuthRequest } from '@/types/index';

// ─── GET CART ────────────────────────────────────────────
export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne(
      { user: req.user?._id } as any
    ).populate('items.product', 'name images price discountPrice stock isActive slug');

    if (!cart) {
      res.json({ success: true, cart: { items: [], totalPrice: 0 } });
      return;
    }

    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── ADD TO CART ─────────────────────────────────────────
export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      res.status(400).json({ message: 'Product ID is required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    // ✅ findOne with as any
    const product = await Product.findOne(
      { _id: new mongoose.Types.ObjectId(productId), isActive: true } as any
    );

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({ message: `Only ${product.stock} items available` });
      return;
    }

    const price = product.discountPrice > 0 ? product.discountPrice : product.price;

    let cart = await Cart.findOne({ user: req.user?._id } as any);

    if (!cart) {
      cart = await Cart.create({
        user:  req.user?._id,
        items: [{ product: product._id, quantity, price }],
      });
    } else {
      const existingIdx = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (existingIdx > -1) {
        const newQty = cart.items[existingIdx].quantity + quantity;
        if (newQty > product.stock) {
          res.status(400).json({ message: `Only ${product.stock} items available` });
          return;
        }
        cart.items[existingIdx].quantity = newQty;
      } else {
        cart.items.push({ product: product._id as any, quantity, price });
      }

      await cart.save();
    }

    // ✅ findOne instead of findById
    const populatedCart = await Cart.findOne(
      { _id: cart._id } as any
    ).populate('items.product', 'name images price discountPrice stock isActive slug');

    res.status(201).json({
      success: true,
      message: 'Product added to cart',
      cart:    populatedCart,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── UPDATE CART ITEM ────────────────────────────────────
export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quantity } = req.body;
    const itemId = req.params['itemId'] as string;

    if (!quantity || quantity < 1) {
      res.status(400).json({ message: 'Quantity must be at least 1' });
      return;
    }

    const cart = await Cart.findOne({ user: req.user?._id } as any);

    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    const itemIdx = cart.items.findIndex(
      item => item._id?.toString() === itemId
    );

    if (itemIdx === -1) {
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    // ✅ findOne instead of findById
    const product = await Product.findOne(
      { _id: cart.items[itemIdx].product } as any
    );

    if (product && quantity > product.stock) {
      res.status(400).json({ message: `Only ${product.stock} items available` });
      return;
    }

    cart.items[itemIdx].quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findOne(
      { _id: cart._id } as any
    ).populate('items.product', 'name images price discountPrice stock isActive slug');

    res.json({ success: true, message: 'Cart updated', cart: populatedCart });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── REMOVE FROM CART ────────────────────────────────────
export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const itemId = req.params['itemId'] as string;

    const cart = await Cart.findOne({ user: req.user?._id } as any);

    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    cart.items = cart.items.filter(
      item => item._id?.toString() !== itemId
    );

    await cart.save();

    const populatedCart = await Cart.findOne(
      { _id: cart._id } as any
    ).populate('items.product', 'name images price discountPrice stock isActive slug');

    res.json({ success: true, message: 'Item removed', cart: populatedCart });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── CLEAR CART ──────────────────────────────────────────
export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne({ user: req.user?._id } as any);

    if (!cart) {
      res.json({ success: true, message: 'Cart is already empty' });
      return;
    }

    cart.items      = [];
    cart.totalPrice = 0;
    await cart.save();

    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};