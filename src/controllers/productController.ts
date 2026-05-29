import { Request, Response } from 'express';
import Product from '@/models/Product';

// @route  POST /api/products  (Admin)
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, description, price, discountPrice,
      category, brand, stock, ageGroup, tags, isFeatured,
    } = req.body;

    // Multiple images from Cloudinary
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


// @route  GET /api/products  (Public) — filter, search, sort, paginate
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      keyword, category, minPrice, maxPrice,
      ageGroup, sort, page = 1, limit = 12, featured,
    } = req.query;

    const query: any = { isActive: true };

    // Search by keyword  search in any field: name, description, tags
    if (keyword) {
      query.$or = [
        { name:        { $regex: keyword, $options: 'i' } },  //regex for case-insensitive search text search
        { description: { $regex: keyword, $options: 'i' } },    //others are exact match search case insensitive search
        { tags:        { $in: [new RegExp(keyword as string, 'i')] } },
      ];
    }

    

    // Filter by category
    if (category)  query.category  = category;
    if (ageGroup)  query.ageGroup  = ageGroup;
    if (featured)  query.isFeatured = featured === 'true';

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sort options
    const sortOptions: any = {
      newest:       { createdAt: -1 },
      oldest:       { createdAt:  1 },
      price_low:    { price:      1 },
      price_high:   { price:     -1 },
      top_rated:    { ratings:   -1 },
    };
    const sortBy = sortOptions[sort as string] || { createdAt: -1 };

    // Pagination
    const pageNum  = Number(page);
    const limitNum = Number(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')   //   Gets category details.
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({
      success:  true,
      total,
      page:     pageNum,
      pages:    Math.ceil(total / limitNum),
      products,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


// @route  GET /api/products/:id  (Public)
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({
      _id:      req.params.id,
      isActive: true,
    }).populate('category', 'name slug');

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


// @route  GET /api/products/slug/:slug  (Public)
export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({
      slug:     req.params.slug,
      isActive: true,
    }).populate('category', 'name slug');

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


// @route  PUT /api/products/:id  (Admin)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData: any = { ...req.body };

    if (req.files && (req.files as any[]).length > 0) {
      updateData.images = (req.files as any[]).map((f: any) => f.path);
    }

    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = JSON.parse(updateData.tags);
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
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


// @route  DELETE /api/products/:id  (Admin) — Soft delete
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
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

// @route  GET /api/products/category/:catId  (Public)
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({
      category: req.params.catId,
      isActive: true,
    }).populate('category', 'name slug');

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};