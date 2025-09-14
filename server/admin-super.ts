// Super Admin specific endpoints - critical security operations
import { Express } from "express";
import { db } from "./db";
import { adminUsers, auditLogs } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { AdminRequest, hashPassword, logAuditAction, isAdminAuthenticated } from "./adminAuth";
import { rateLimits, authorizeAdmin, validate } from "./security";
import { z } from "zod";

export function setupSuperAdminRoutes(app: Express) {
  // Create new admin user - super_admin only
  const createAdminSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(12, "Password must be at least 12 characters"),
    role: z.enum(['admin', 'super_admin'])
  });

  app.post("/api/admin/super/users", 
    rateLimits.general,
    isAdminAuthenticated,
    authorizeAdmin(['super_admin']),
    validate(createAdminSchema),
    async (req: AdminRequest, res) => {
    try {
      const { email, password, role } = req.body;

      // Check if admin already exists
      const [existingAdmin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email));

      if (existingAdmin) {
        return res.status(409).json({ 
          message: "Admin user already exists with this email",
          code: "ADMIN_EXISTS"
        });
      }

      const passwordHash = await hashPassword(password);
      const [newAdmin] = await db
        .insert(adminUsers)
        .values({
          email,
          passwordHash,
          role
        })
        .returning();

      // Comprehensive audit logging
      await logAuditAction(
        req.admin!.id,
        "CREATE_ADMIN",
        "admin",
        newAdmin.id,
        {
          newAdminEmail: email,
          newAdminRole: role,
          createdByRole: req.admin!.role,
          timestamp: new Date().toISOString()
        },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        message: "Admin user created successfully",
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          role: newAdmin.role
        }
      });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Update admin user role - super_admin only
  const updateAdminRoleSchema = z.object({
    role: z.enum(['admin', 'super_admin'])
  });

  app.patch("/api/admin/super/users/:adminId/role", 
    rateLimits.general,
    isAdminAuthenticated,
    authorizeAdmin(['super_admin']),
    validate(updateAdminRoleSchema),
    async (req: AdminRequest, res) => {
    try {
      const { adminId } = req.params;
      const { role } = req.body;

      // Cannot change own role
      if (adminId === req.admin!.id) {
        return res.status(400).json({ 
          message: "Cannot change your own role",
          code: "SELF_ROLE_CHANGE"
        });
      }

      const [updatedAdmin] = await db
        .update(adminUsers)
        .set({ role, updatedAt: new Date() })
        .where(eq(adminUsers.id, adminId))
        .returning();

      if (!updatedAdmin) {
        return res.status(404).json({ message: "Admin user not found" });
      }

      // Comprehensive audit logging
      await logAuditAction(
        req.admin!.id,
        "UPDATE_ADMIN_ROLE",
        "admin",
        adminId,
        {
          newRole: role,
          targetAdminEmail: updatedAdmin.email,
          updatedByRole: req.admin!.role,
          timestamp: new Date().toISOString()
        },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "Admin role updated successfully" });
    } catch (error) {
      console.error("Update admin role error:", error);
      res.status(500).json({ message: "Failed to update admin role" });
    }
  });

  // Get audit logs - super_admin only
  app.get("/api/admin/super/audit-logs", 
    rateLimits.general,
    isAdminAuthenticated,
    authorizeAdmin(['super_admin']),
    async (req: AdminRequest, res) => {
    try {
      const { page = 1, limit = 50, action, entityType, adminId } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const conditions = [];
      if (action) {
        conditions.push(eq(auditLogs.action, action as string));
      }
      if (entityType) {
        conditions.push(eq(auditLogs.entityType, entityType as string));
      }
      if (adminId) {
        conditions.push(eq(auditLogs.adminId, adminId as string));
      }

      const logs = await db
        .select()
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(Number(limit))
        .offset(offset);

      const [totalCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      res.json({
        logs,
        totalCount: totalCount?.count || 0,
        currentPage: Number(page),
        totalPages: Math.ceil((totalCount?.count || 0) / Number(limit))
      });
    } catch (error) {
      console.error("Audit logs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // System settings management - super_admin only
  const updateSystemSettingsSchema = z.object({
    siteName: z.string().optional(),
    siteDescription: z.string().optional(),
    maintenanceMode: z.boolean().optional(),
    apiRateLimit: z.number().positive().optional(),
    maxFileUploadSize: z.number().positive().optional()
  });

  app.patch("/api/admin/super/system/settings", 
    rateLimits.general,
    isAdminAuthenticated,
    authorizeAdmin(['super_admin']),
    validate(updateSystemSettingsSchema),
    async (req: AdminRequest, res) => {
    try {
      const settings = req.body;

      // Comprehensive audit logging
      await logAuditAction(
        req.admin!.id,
        "UPDATE_SYSTEM_SETTINGS",
        "system",
        "settings",
        {
          changes: settings,
          adminRole: req.admin!.role,
          timestamp: new Date().toISOString()
        },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "System settings updated successfully", settings });
    } catch (error) {
      console.error("System settings update error:", error);
      res.status(500).json({ message: "Failed to update system settings" });
    }
  });

  // Delete admin user - super_admin only (except self)
  app.delete("/api/admin/super/users/:adminId", 
    rateLimits.general,
    isAdminAuthenticated,
    authorizeAdmin(['super_admin']),
    async (req: AdminRequest, res) => {
    try {
      const { adminId } = req.params;

      // Cannot delete own account
      if (adminId === req.admin!.id) {
        return res.status(400).json({ 
          message: "Cannot delete your own account",
          code: "SELF_DELETE"
        });
      }

      const [adminToDelete] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, adminId));

      if (!adminToDelete) {
        return res.status(404).json({ message: "Admin user not found" });
      }

      await db
        .delete(adminUsers)
        .where(eq(adminUsers.id, adminId));

      // Comprehensive audit logging
      await logAuditAction(
        req.admin!.id,
        "DELETE_ADMIN",
        "admin",
        adminId,
        {
          deletedAdminEmail: adminToDelete.email,
          deletedAdminRole: adminToDelete.role,
          deletedByRole: req.admin!.role,
          timestamp: new Date().toISOString()
        },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "Admin user deleted successfully" });
    } catch (error) {
      console.error("Delete admin error:", error);
      res.status(500).json({ message: "Failed to delete admin user" });
    }
  });
}