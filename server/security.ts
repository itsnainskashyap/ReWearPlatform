import crypto from "crypto";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { AdminRequest } from "./adminAuth";

// Security configuration
const REQUIRED_SECRET_LENGTH = 32;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Known insecure secrets that must never be used in production
const INSECURE_SECRETS = new Set([
  "your-secret-key-change-in-production",
  "79e04f92d36370c3092872fd7d0f696b783473b0a669120e2b05d7d89a741dbe",
  "default-secret",
  "change-me",
  "secret",
  "test-secret"
]);

/**
 * Validates that secrets are secure and not using default values
 */
export function validateSecrets(): { isValid: boolean; error?: string } {
  const jwtSecret = process.env.JWT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;

  // In production, secrets must be provided and secure
  if (IS_PRODUCTION) {
    if (!jwtSecret) {
      return { isValid: false, error: "JWT_SECRET environment variable is required in production" };
    }
    
    if (!sessionSecret) {
      return { isValid: false, error: "SESSION_SECRET environment variable is required in production" };
    }

    if (jwtSecret.length < REQUIRED_SECRET_LENGTH) {
      return { isValid: false, error: `JWT_SECRET must be at least ${REQUIRED_SECRET_LENGTH} characters long` };
    }

    if (sessionSecret.length < REQUIRED_SECRET_LENGTH) {
      return { isValid: false, error: `SESSION_SECRET must be at least ${REQUIRED_SECRET_LENGTH} characters long` };
    }

    if (INSECURE_SECRETS.has(jwtSecret)) {
      return { isValid: false, error: "JWT_SECRET is using a known insecure default value" };
    }

    if (INSECURE_SECRETS.has(sessionSecret)) {
      return { isValid: false, error: "SESSION_SECRET is using a known insecure default value" };
    }
  }

  return { isValid: true };
}

/**
 * Gets JWT secret or throws error if insecure
 */
export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    if (IS_PRODUCTION) {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    // Generate a secure random secret for development
    return crypto.randomBytes(32).toString('hex');
  }
  
  if (IS_PRODUCTION && INSECURE_SECRETS.has(secret)) {
    throw new Error("Cannot use insecure default JWT_SECRET in production");
  }
  
  return secret;
}

/**
 * Gets session secret or throws error if insecure
 */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) {
    if (IS_PRODUCTION) {
      throw new Error("SESSION_SECRET environment variable is required in production");
    }
    // Generate a secure random secret for development
    return crypto.randomBytes(32).toString('hex');
  }
  
  if (IS_PRODUCTION && INSECURE_SECRETS.has(secret)) {
    throw new Error("Cannot use insecure default SESSION_SECRET in production");
  }
  
  return secret;
}

/**
 * Role-based authorization middleware
 */
export function authorizeAdmin(allowedRoles: string[]) {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ 
        message: "Authentication required",
        code: "AUTH_REQUIRED" 
      });
    }

    const adminRole = req.admin.role || "admin";
    
    if (!allowedRoles.includes(adminRole)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        required: allowedRoles,
        current: adminRole
      });
    }

    next();
  };
}

/**
 * Centralized validation middleware using Zod
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedError = fromZodError(error);
        return res.status(400).json({
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: formattedError.message,
          errors: error.errors
        });
      }
      
      return res.status(400).json({
        message: "Invalid request data",
        code: "INVALID_DATA"
      });
    }
  };
}

/**
 * Rate limiting configurations
 */
export const rateLimits = {
  // Admin login attempts - strict limit
  adminLogin: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
      message: "Too many login attempts",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: "15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test'
  }),

  // 2FA verification - allow more attempts but still limited
  twoFactor: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: {
      message: "Too many 2FA verification attempts",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: "15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test'
  }),

  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      message: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: "15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test'
  }),

  // Media and PDF uploads - more restrictive
  upload: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    message: {
      message: "Too many upload attempts",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: "10 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test'
  })
};

/**
 * Security headers middleware using Helmet
 */
export function getSecurityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-eval'"], // Required for development
        connectSrc: ["'self'", "https:", "wss:"],
        mediaSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Disable for compatibility
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    }
  });
}

/**
 * Enhanced file validation for uploads
 */
export const fileValidation = {
  // Video file filter
  videoFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo'
    ];
    
    const allowedExtensions = ['.mp4', '.webm', '.mov', '.avi'];
    const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
    
    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(extension || '')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`), false);
    }
  },

  // PDF file filter
  pdfFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf' && file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },

  // Image file filter
  imageFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
    
    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(extension || '')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image type. Allowed: ${allowedExtensions.join(', ')}`), false);
    }
  },

  // Sanitize filename
  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 100); // Limit length
  }
};

/**
 * Security audit middleware
 */
export function securityAudit(req: Request, res: Response, next: NextFunction) {
  // Log security-relevant headers and information
  const securityContext = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    referer: req.headers.referer,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  };

  // Attach security context to request for audit logging
  (req as any).securityContext = securityContext;
  
  next();
}