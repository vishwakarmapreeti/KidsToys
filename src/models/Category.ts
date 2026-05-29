import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name:        string;
  slug:        string;
  description: string;
  image:       string;
  isActive:    boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type:     String,
      required: [true, 'Category name is required'],
      unique:   true,
      trim:     true,
    },
    slug: {
      type:      String,
      unique:    true,
      lowercase: true,
    },
    description: {
      type:    String,
      default: '',
    },
    image: {
      type:    String,
      default: '',
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto generate slug from name
categorySchema.pre('save', async function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

export default mongoose.model<ICategory>('Category', categorySchema);