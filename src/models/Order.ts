import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  product:  mongoose.Types.ObjectId;
  name:     string;
  image:    string;
  price:    number;
  quantity: number;
}

export interface IShippingAddress {
  street:  string;
  city:    string;
  state:   string;
  pincode: string;
  country: string;
  phone:   string;
}

export interface IPaymentResult {
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
  status:              string;
}

export interface IOrder extends Document {
  user:            mongoose.Types.ObjectId;
  orderItems:      IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod:   'razorpay' | 'cod';
  paymentResult?:  IPaymentResult;
  itemsPrice:      number;
  shippingPrice:   number;
  totalPrice:      number;
  isPaid:          boolean;
  paidAt?:         Date;
  isDelivered:     boolean;
  deliveredAt?:    Date;
  orderStatus:     'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    orderItems: [
      {
        product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name:     { type: String, required: true },
        image:    { type: String, default: '' },
        price:    { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    shippingAddress: {
      street:  { type: String, required: true },
      city:    { type: String, required: true },
      state:   { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
      phone:   { type: String, required: true },
    },
    paymentMethod: {
      type:    String,
      enum:    ['razorpay', 'cod'],
      default: 'razorpay',
    },
    paymentResult: {
      razorpay_order_id:   { type: String },
      razorpay_payment_id: { type: String },
      razorpay_signature:  { type: String },
      status:              { type: String },
    },
    itemsPrice:   { type: Number, required: true, default: 0 },
    shippingPrice:{ type: Number, required: true, default: 0 },
    totalPrice:   { type: Number, required: true, default: 0 },
    isPaid:       { type: Boolean, default: false },
    paidAt:       { type: Date },
    isDelivered:  { type: Boolean, default: false },
    deliveredAt:  { type: Date },
    orderStatus: {
      type:    String,
      enum:    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', orderSchema);