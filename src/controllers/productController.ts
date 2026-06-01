import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '@/models/Product';
import Category from '@/models/Category';

// ─── CREATE PRODUCT ──────────────────────────────────────
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, description, price, discountPrice,
      category, brand, stock, ageGroup, tags, isFeatured,
    } = req.body;

    const images = (req.files as any[])?.map((f: any) => f.path) || [];

    const product = await Product.create({
      name, description, price, discountPrice,
      category, brand, stock, ageGroup,
      tags: tags ? JSON.parse(tags) : [],
      isFeatured: isFeatured === 'true',
      images,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── GET ALL PRODUCTS ────────────────────────────────────
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      keyword, category, minPrice, maxPrice,
      ageGroup, sort, page = 1, limit = 12, featured,
    } = req.query;

    const query: any = { isActive: true };

    if (category) {
      const categoryStr = Array.isArray(category)
        ? String(category[0])
        : String(category);
  console.log('1. categoryStr:', categoryStr);           // ← add karo
  console.log('2. type:', typeof categoryStr);           // ← add karo

      const isObjectId = /^[a-f\d]{24}$/i.test(categoryStr);
  console.log('3. isObjectId:', isObjectId);   
      if (isObjectId) {
        query.category = new mongoose.Types.ObjectId(categoryStr);
      } else {
        // ✅ as any lagao — TypeScript error fix
        console.log('4. Finding category by slug...');       
        const categoryDoc = await (Category as any).findOne({
          slug:     categoryStr,
          isActive: true,
        });
 console.log('5. categoryDoc found:', categoryDoc);  
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          // Category nahi mili — empty result, 500 nahi
          res.json({
            success:  true,
            total:    0,
            page:     1,
            pages:    0,
            products: [],
          });
          return;
        }
      }
    }

    if (keyword) {
      query.$or = [
        { name:        { $regex: String(keyword), $options: 'i' } },
        { description: { $regex: String(keyword), $options: 'i' } },
        { tags:        { $in: [new RegExp(String(keyword), 'i')] } },
      ];
    }

    if (ageGroup) query.ageGroup   = String(ageGroup);
    if (featured) query.isFeatured = featured === 'true';

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortOptions: any = {
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
      price_low:  { price:      1 },
      price_high: { price:     -1 },
      top_rated:  { ratings:   -1 },
    };

    const sortBy   = sortOptions[sort as string] || { createdAt: -1 };
    const pageNum  = Number(page);
    const limitNum = Number(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      page:    pageNum,
      pages:   Math.ceil(total / limitNum),
      products,
    });

  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── GET SINGLE PRODUCT ──────────────────────────────────
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramId = req.params['id'] as string;  // ✅ explicit cast

    if (!mongoose.Types.ObjectId.isValid(paramId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    const id = new mongoose.Types.ObjectId(paramId);

    const product = await Product.findOne(
      { _id: id, isActive: true } as any
    ).populate('category', 'name slug');

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── GET PRODUCT BY SLUG ─────────────────────────────────
export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params['slug'] as string;

    const product = await Product.findOne(
      { slug, isActive: true } as any  // ✅ as any add karo
    ).populate('category', 'name slug');

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── UPDATE PRODUCT ──────────────────────────────────────
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramId = req.params['id'] as string;  // ✅ explicit cast

    if (!mongoose.Types.ObjectId.isValid(paramId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    const updateData: any = { ...req.body };

    if (req.files && (req.files as any[]).length > 0) {
      updateData.images = (req.files as any[]).map((f: any) => f.path);
    }

    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = JSON.parse(updateData.tags);
    }

  const product = await (Product as any).findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(paramId) },
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }


    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── DELETE PRODUCT ──────────────────────────────────────
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramId = req.params['id'] as string;  // ✅ explicit cast

    if (!mongoose.Types.ObjectId.isValid(paramId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

  const product = await (Product as any).findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(paramId) },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── GET PRODUCTS BY CATEGORY ────────────────────────────
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const catId = req.params['catId'] as string;

    if (!mongoose.Types.ObjectId.isValid(catId)) {
      res.status(400).json({ message: 'Invalid category ID' });
      return;
    }

    const products = await Product.find({
      category: new mongoose.Types.ObjectId(catId),  
      isActive: true,
    } as any).populate('category', 'name slug');   

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};