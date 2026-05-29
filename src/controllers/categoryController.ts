import { Request, Response } from 'express';
import Category from '@/models/Category';
import cloudinary from '@config/cloudinary';

// @route  POST /api/categories  (Admin)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const image = (req.file as any)?.path || '';

    const category = await Category.create({ name, description, image });

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


// @route  GET /api/categories  (Public)
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @route  GET /api/categories/:id  (Public)
export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @route  PUT /api/categories/:id  (Admin)
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;
    const image = (req.file as any)?.path;
    const categoryId = req.params.id;

    console.log('🔄 Update Category Request:', { categoryId, name, description, isActive });

    // Get current category
    const currentCategory = await Category.findById(categoryId);
    if (!currentCategory) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    console.log('📦 Current Category:', { id: currentCategory._id, name: currentCategory.name });

    // Check if another category already has this name
    if (name && name !== currentCategory.name) {
      console.log('🔍 Checking for duplicate name:', name);
      const existingCategory = await Category.findOne({ name, _id: { $ne: categoryId } });
      if (existingCategory) {
        console.log('❌ Duplicate found:', existingCategory.name);
        res.status(400).json({ message: `Category with name "${name}" already exists` });
        return;
      }
      console.log('✅ No duplicate found');
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (image) updateData.image = image;

    console.log('📝 Update Data:', updateData);

    const category = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Category updated:', { id: category?._id, name: category?.name });
    res.json({ success: true, category });
  } catch (error) {
    console.error('❌ Update category error:', (error as Error).message);
    console.error('Stack:', (error as Error).stack);
    res.status(500).json({ message: (error as Error).message });
  }
};


// @route  DELETE /api/categories/:id  (Admin)
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },  // Soft delete
      { new: true }
    );

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};