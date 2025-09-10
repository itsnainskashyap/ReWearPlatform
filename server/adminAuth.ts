import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { adminUsers, auditLogs } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(adminId: string, email: string, role: string): string {
  return jwt.sign(
    { id: adminId, email, role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Generate 2FA secret
export function generate2FASecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `ReWeara Admin (${email})`,
    length: 32
  });
  return secret;
}

// Generate QR code for 2FA
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return await QRCode.toDataURL(otpauthUrl);
}

// Verify 2FA token
export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  });
}

// Admin authentication middleware
export async function isAdminAuthenticated(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, decoded.id));

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role || "admin"
    };

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}

// Initialize default admin user
export async function initializeAdminUser() {
  try {
    const adminEmail = "rewearaofficials@gmail.com";
    const [existingAdmin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, adminEmail));

    if (!existingAdmin) {
      const passwordHash = await hashPassword("reweara@2025");
      await db.insert(adminUsers).values({
        email: adminEmail,
        passwordHash,
        role: "super_admin"
      });
      console.log("Default admin user created");
    }
  } catch (error) {
    console.error("Error initializing admin user:", error);
  }
}

// Log audit action
export async function logAuditAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  changes?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.insert(auditLogs).values({
      adminId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error("Error logging audit action:", error);
  }
}

// Check if account is locked
export function isAccountLocked(admin: any): boolean {
  if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
    return true;
  }
  return false;
}

// Handle failed login attempt
export async function handleFailedLogin(email: string) {
  try {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email));

    if (admin) {
      const attempts = (admin.loginAttempts || 0) + 1;
      const updates: any = {
        loginAttempts: attempts,
        updatedAt: new Date()
      };

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCK_TIME);
      }

      await db
        .update(adminUsers)
        .set(updates)
        .where(eq(adminUsers.id, admin.id));
    }
  } catch (error) {
    console.error("Error handling failed login:", error);
  }
}

// Reset login attempts
export async function resetLoginAttempts(adminId: string) {
  try {
    await db
      .update(adminUsers)
      .set({
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
        updatedAt: new Date()
      })
      .where(eq(adminUsers.id, adminId));
  } catch (error) {
    console.error("Error resetting login attempts:", error);
  }
}