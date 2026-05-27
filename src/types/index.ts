import { Request } from 'express';
import { Document } from 'mongoose';

export interface IAddress {
  street:  string;
  city:    string;
  state:   string;
  pincode: string;
  country: string;
}

export interface IUser extends Document {
  name:     string;
  email:    string;
  password: string;
  phone:    string;
  address:  IAddress;
  avatar:   string;
  role:     'user' | 'admin';
  isActive: boolean;
  isVerified:         boolean;        
  verifyToken?:       string;         
  verifyTokenExpire?: Date;          
  resetPasswordToken?:  string;
  resetPasswordExpire?: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
  generateVerifyToken(): string;
  generateResetPasswordToken(): string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}