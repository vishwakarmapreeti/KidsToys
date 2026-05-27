import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const generateToken = (userId: string, role: string): string => {
  const secret: Secret = process.env.JWT_SECRET || 'secret';

  const options: SignOptions = {
    expiresIn: '7d',
  };

  return jwt.sign(
    { id: userId, role },
    secret,
    options
  );
};

export default generateToken;