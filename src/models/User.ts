import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IUser } from '@/types';

const userSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone:    { type: String, required: true },
    address: {
      street:  { type: String, default: '' },
      city:    { type: String, default: '' },
      state:   { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    avatar:   { type: String, default: '' },
    role:     { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },

    // ✅ New 3 fields for email verification
    isVerified: {
      type:    Boolean,
      default: false,       // register ke baad false hoga
    },
    verifyToken: {
      type: String,         // random token store hoga
    },
    verifyTokenExpire: {
      type: Date,             
    },
    resetPasswordToken:   { type: String },  
    resetPasswordExpire:  { type: Date },    
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return ;
  this.password = await bcrypt.hash(this.password, 12);

});

userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateResetPasswordToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min

  return rawToken;
};

// ✅ Verification token generate karne ka method
userSchema.methods.generateVerifyToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.verifyToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.verifyTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token; // raw token email mein jaayega
};

export default mongoose.model<IUser>('User', userSchema);