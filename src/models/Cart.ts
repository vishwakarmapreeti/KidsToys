import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
     _id?:     mongoose.Types.ObjectId;
  product:  mongoose.Types.ObjectId;
  quantity: number;
  price:    number;
}

export interface ICart extends Document {
  user:       mongoose.Types.ObjectId;
  items:      ICartItem[];
  totalPrice: number;
}

const cartItemSchema = new Schema<ICartItem>({
  product: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Product',
    required: true,
  },
  quantity: {
    type:    Number,
    required: true,
    min:     1,
    default: 1,
  },
  price: {
    type:     Number,
    required: true,
  },
});

const cartSchema = new Schema<ICart>(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,  // ek user ka ek hi cart
    },
    items:      { type: [cartItemSchema], default: [] },
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto calculate totalPrice before save
cartSchema.pre('save', function()  {
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );
  
});

export default mongoose.model<ICart>('Cart', cartSchema);