import { Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import getRazorpay from '../config/razorpay';
import { AuthRequest } from '../types';

// ─── CREATE ORDER ─────────────────────────────────────────
// @route  POST /api/v1/user/orders
// @access Private
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shippingAddress, paymentMethod = 'razorpay', orderItems } = req.body;

    // Validate shipping address
    if (!shippingAddress?.street || !shippingAddress?.city ||
        !shippingAddress?.state  || !shippingAddress?.pincode ||
        !shippingAddress?.phone) {
      res.status(400).json({ message: 'Complete shipping address is required' });
      return;
    }

    let items = orderItems;

    // Agar orderItems nahi aaye toh cart se lo
    if (!items || items.length === 0) {
      const cart = await Cart.findOne(
        { user: req.user?._id } as any
      ).populate('items.product');

      if (!cart || cart.items.length === 0) {
        res.status(400).json({ message: 'Cart is empty' });
        return;
      }

      items = cart.items.map((item: any) => ({
        product:  item.product._id,
        name:     item.product.name,
        image:    item.product.images[0] || '',
        price:    item.price,
        quantity: item.quantity,
      }));
    }

    // Calculate prices
    const itemsPrice = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity, 0
    );

    // Free shipping above ₹500
    const shippingPrice = itemsPrice > 500 ? 0 : 50;
    const totalPrice    = itemsPrice + shippingPrice;

    // Create order
    const order = await Order.create({
      user:            req.user?._id,
      orderItems:      items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
    });

    // Clear cart after order created
    if (!orderItems) {
      await Cart.findOneAndUpdate(
        { user: req.user?._id } as any,
        { items: [], totalPrice: 0 }
      );
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── CREATE RAZORPAY ORDER ────────────────────────────────
// @route  POST /api/v1/user/orders/:id/razorpay
// @access Private
export const createRazorpayOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = req.params['id'] as string;

    const order = await Order.findOne(
      { _id: new mongoose.Types.ObjectId(orderId), user: req.user?._id } as any
    );

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.isPaid) {
      res.status(400).json({ message: 'Order already paid' });
      return;
    }

    const razorpay = getRazorpay();

    // Razorpay order banao
    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(order.totalPrice * 100), // paise mein
      currency: 'INR',
      receipt:  `order_${order._id}`,
      notes: {
        orderId:  order._id.toString(),
        userId:   req.user?._id?.toString() || '',
      },
    });

    res.json({
      success: true,
      razorpayOrder,
      key:     process.env.RAZORPAY_KEY_ID,
      order,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── VERIFY RAZORPAY PAYMENT ──────────────────────────────
// @route  POST /api/v1/user/orders/:id/verify-payment
// @access Private
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = req.params['id'] as string;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Signature verify karo
    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ message: 'Payment verification failed' });
      return;
    }

    // Order update karo
    const order = await (Order as any).findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(orderId) },
      {
        isPaid:      true,
        paidAt:      new Date(),
        orderStatus: 'processing',
        paymentResult: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          status: 'paid',
        },
      },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Stock kam karo
    for (const item of order.orderItems) {
      await (Product as any).findOneAndUpdate(
        { _id: item.product },
        { $inc: { stock: -item.quantity } }
      );
    }

    res.json({ success: true, message: 'Payment verified', order });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── GET MY ORDERS ────────────────────────────────────────
// @route  GET /api/v1/user/orders/my
// @access Private
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find(
      { user: req.user?._id } as any
    ).sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── GET SINGLE ORDER ─────────────────────────────────────
// @route  GET /api/v1/user/orders/:id
// @access Private
export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = req.params['id'] as string;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: 'Invalid order ID' });
      return;
    }

    const order = await Order.findOne(
      {
        _id:  new mongoose.Types.ObjectId(orderId),
        user: req.user?._id,
      } as any
    ).populate('user', 'name email phone');

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── CANCEL ORDER ─────────────────────────────────────────
// @route  PUT /api/v1/user/orders/:id/cancel
// @access Private
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = req.params['id'] as string;

    const order = await Order.findOne(
      {
        _id:  new mongoose.Types.ObjectId(orderId),
        user: req.user?._id,
      } as any
    );

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Sirf pending orders cancel ho sakte hain
    if (!['pending', 'processing'].includes(order.orderStatus)) {
      res.status(400).json({
        message: 'Order cannot be cancelled at this stage',
      });
      return;
    }

    order.orderStatus = 'cancelled';
    await order.save();

    // Stock wapas karo
    for (const item of order.orderItems) {
      await (Product as any).findOneAndUpdate(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );
    }

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── ADMIN — GET ALL ORDERS ───────────────────────────────
// @route  GET /api/v1/admin/orders
// @access Admin
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status) query.orderStatus = status;

    const pageNum  = Number(page);
    const limitNum = Number(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      page:    pageNum,
      pages:   Math.ceil(total / limitNum),
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── ADMIN — UPDATE ORDER STATUS ──────────────────────────
// @route  PUT /api/v1/admin/orders/:id/status
// @access Admin
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderId = req.params['id'] as string;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const order = await (Order as any).findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(orderId) },
      {
        orderStatus: status,
        ...(status === 'delivered' && {
          isDelivered: true,
          deliveredAt: new Date(),
        }),
      },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
