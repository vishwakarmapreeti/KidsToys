import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name:         string;
  slug:         string;
  description:  string;
  price:        number;
  discountPrice: number;
  images:       string[];
  category:     mongoose.Types.ObjectId;
  brand:        string;
  stock:        number;
  ratings:      number;
  numReviews:   number;
  ageGroup:     string;
  tags:         string[];
  isActive:     boolean;
  isFeatured:   boolean;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type:     String,
      required: [true, 'Product name is required'],
      trim:     true,
    },
    slug: {
      type:      String,
      unique:    true,
      lowercase: true,
    },
    description: {
      type:     String,
      required: [true, 'Description is required'],
    },
    price: {
      type:     Number,
      required: [true, 'Price is required'],
      min:      0,
    },
    discountPrice: {
      type:    Number,
      default: 0,
    },
    images: {
      type:    [String],
      default: [],
    },
    category: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Category',
      required: [true, 'Category is required'],
    },
    brand: {
      type:    String,
      default: '',
    },
    stock: {
      type:    Number,
      default: 0,
      min:     0,
    },
    ratings: {
      type:    Number,
      default: 0,
    },
    numReviews: {
      type:    Number,
      default: 0,
    },
    ageGroup: {
      type: String,
      enum: ['0-2', '3-5', '6-8', '9-12', '13+'],
    },
    tags: {
      type:    [String],
      default: [],
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    isFeatured: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto generate slug from name
productSchema.pre('save', async function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

export default mongoose.models.Product || mongoose.model('Product', productSchema);