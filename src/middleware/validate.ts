import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// ─── VALIDATION MIDDLEWARE ────────────────────────────────
// This middleware validates request data against Zod schemas
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate body, params, and query
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error: any) {
      // Extract error messages from Zod validation
     const errors = error.issues.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      console.error('❌ Validation Error:', errors);

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }
  };
};
