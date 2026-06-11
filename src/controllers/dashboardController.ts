import { Response } from 'express';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { AuthRequest } from '@/types/index';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {

    // ── Basic counts ──────────────────────────────────
    const [
      totalOrders,
      totalProducts,
      totalUsers,
      paidOrders,
    ] = await Promise.all([
      Order.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({}),
      Order.find({ isPaid: true } as any),
    ]);

    // Total revenue
    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + order.totalPrice, 0
    );

    // ── Order status counts ───────────────────────────
    const [pending, processing, shipped, delivered, cancelled] = await Promise.all([
      Order.countDocuments({ orderStatus: 'pending' }   as any),
      Order.countDocuments({ orderStatus: 'processing' } as any),
      Order.countDocuments({ orderStatus: 'shipped' }   as any),
      Order.countDocuments({ orderStatus: 'delivered' } as any),
      Order.countDocuments({ orderStatus: 'cancelled' } as any),
    ]);

    // ── Monthly revenue (last 6 months) ───────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          isPaid:    true,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Fill missing months
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date();
      d.setMonth(d.getMonth() - i);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = monthlyRevenue.find(
        m => m._id.year === year && m._id.month === month
      );
      revenueData.push({
        month:   months[month - 1],
        revenue: found?.revenue || 0,
        orders:  found?.orders  || 0,
      });
    }

    // ── Recent orders ─────────────────────────────────
    const recentOrders = await Order.find({} as any)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // ── Top products ──────────────────────────────────
    const topProducts = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id:      '$orderItems.product',
          name:     { $first: '$orderItems.name' },
          image:    { $first: '$orderItems.image' },
          sold:     { $sum: '$orderItems.quantity' },
          revenue:  { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
    ]);

    // ── New users this month ──────────────────────────
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    } as any);

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalUsers,
        newUsersThisMonth,
        orderStatus: { pending, processing, shipped, delivered, cancelled },
      },
      revenueData,
      recentOrders,
      topProducts,
    });

  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};