import crypto from 'crypto';
import { Request, Response } from 'express';
import User from '@/models/User';
import generateToken from '@/utils/generateToken'
import sendEmail from '@/utils/sendEmail';
import { AuthRequest } from '@/types/index';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─── REGISTER ───────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, address, adminSecret } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
    
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    let role: 'user' | 'admin' = 'user';
    if (adminSecret) {
      const trimmedSecret = String(adminSecret).trim();
      const envSecret = String(process.env.ADMIN_SECRET).trim();
      console.log('🔐 Admin Secret Debug:', {
        received: `"${trimmedSecret}"`,
        expected: `"${envSecret}"`,
        receivedLength: trimmedSecret.length,
        expectedLength: envSecret.length,
        receivedChars: Array.from(trimmedSecret).map(c => `${c}(${c.charCodeAt(0)})`).join(', '),
        expectedChars: Array.from(envSecret).map(c => `${c}(${c.charCodeAt(0)})`).join(', '),
        match: trimmedSecret === envSecret,
      });
      if (trimmedSecret === envSecret) {
        role = 'admin';
      } else {
     
        res.status(403).json({ message: 'Invalid admin secret key' });
        return;
      }
    }

    const user = await User.create({
      name, email, password, phone, address, role,
    });

    console.log('👤 User created:', { id: user._id, email: user.email });

    // Verification token banao
    const verifyToken = user.generateVerifyToken();
    await user.save();

    const verifyURL = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    console.log('🔗 Verify URL:', verifyURL);

    try {
      console.log('📧 Starting email send process for:', user.email);
      await sendEmail({
        to: user.email,
        subject: 'Kids Toys — Verify Your Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
            <h2 style="color: #FF6B6B;">Welcome to Kids Toys Store! 🧸</h2>
            <p>Hi <b>${user.name}</b>,</p>
            <p>Please verify your email by clicking the button below:</p>
            <a href="${verifyURL}"
              style="display:inline-block; padding:12px 24px; background:#FF6B6B;
                     color:white; border-radius:6px; text-decoration:none;
                     font-weight:bold; margin:16px 0;">
              Verify Email
            </a>
            <p>This link expires in <b>24 hours</b>.</p>
            <p>If you did not register, ignore this email.</p>
          </div>
        `,
      });
      console.log('✅ Email sent successfully!');
    
    } catch (emailError) {
      console.error('❌ Email sending error:', (emailError as Error).message);
      console.error('Stack:', (emailError as Error).stack);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
    });
  
  } catch (error) {
    console.error('💥 Register controller error:', (error as Error).message);

    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── VERIFY EMAIL ────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    // URL se raw token lo aur hash karo
    const token = String(req.params.token);
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // DB mein dhundo — token match ho aur expire na hua ho
    const user = await User.findOne({
      verifyToken: hashedToken,
      verifyTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ message: 'Token is invalid or has expired' });
      return;
    }


    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.',
    });

  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── LOGIN ───────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // ✅ Check karo — verified hai ya nahi
    if (!user.isVerified) {
      res.status(401).json({
        message: 'Please verify your email before logging in.',
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);
    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });

  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── LOGOUT ──────────────────────────────────────────────
export const logout = (req: Request, res: Response): void => {
  res.cookie('token', '', { maxAge: 0 });
  res.json({ success: true, message: 'Logged out successfully' });
};

// ─── GET ME ──────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


// ─── FORGOT PASSWORD ─────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
 

    const { email } = req.body;

    // 1. User dhundo
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'No account found with this email' });
      return;
    }

    // 2. Reset token banao
    const rawToken = user.generateResetPasswordToken();
    await user.save();
    console.log('🔑 Reset token generated for:', email);

    // 3. Reset URL banao
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    console.log('🔗 Reset URL:', resetURL);

    // 4. Email bhejo
    try {
      await sendEmail({
        to: user.email,
        subject: 'Kids Toys — Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
            <h2 style="color: #FF6B6B;">Password Reset Request 🔐</h2>
            <p>Hi <b>${user.name}</b>,</p>
            <p>We received a request to reset your password.</p>
            <a href="${resetURL}"
              style="display:inline-block; padding:12px 24px; background:#FF6B6B;
                     color:white; border-radius:6px; text-decoration:none;
                     font-weight:bold; margin:16px 0;">
              Reset Password
            </a>
            <p>This link expires in <b>15 minutes</b>.</p>
            <p>If you did not request this, ignore this email.</p>
          </div>
        `,
      });
 
    } catch (emailError) {
      // Email fail ho toh token bhi hatao
      console.error(' Email failed:', (emailError as Error).message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(500).json({ message: 'Email could not be sent' });
      return;
    }

    res.json({
      success: true,
      message: 'Password reset link sent to your email',
    });

  } catch (error) {
    console.error('Forgot password error:', (error as Error).message);
    res.status(500).json({ message: (error as Error).message });
  }
};

// ─── RESET PASSWORD ──────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
  

    const token = String(req.params.token);
    const { password } = req.body;

    // 1. Token hash karo
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

   

    // 2. User dhundo — token match + expire na hua ho
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      console.log('❌ Token invalid or expired');
      res.status(400).json({ message: 'Token is invalid or has expired' });
      return;
    }

  

    // 3. Password update karo
    user.password = password; // model mein pre-save hash hoga
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

  

    res.json({
      success: true,
      message: 'Password reset successful! You can now login.',
    });

  } catch (error) {
    console.error('💥 Reset password error:', (error as Error).message);
    res.status(500).json({ message: (error as Error).message });
  }
};