import { Express } from "express";
import { db } from "./db";
import { storage } from "./storage";
import { 
  adminUsers, 
  auditLogs,
  products,
  orders,
  users,
  brands,
  categories,
  coupons,
  banners,
  contentPages,
  aiConfig,
  storeSettings,
  notifications,
  orderItems,
  paymentSettings
} from "@shared/schema";
import { eq, desc, and, sql, gte, lte, or, like } from "drizzle-orm";
import {
  AdminRequest,
  hashPassword,
  verifyPassword,
  generateToken,
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  isAdminAuthenticated,
  initializeAdminUser,
  logAuditAction,
  isAccountLocked,
  handleFailedLogin,
  resetLoginAttempts
} from "./adminAuth";

export function setupAdminRoutes(app: Express) {
  // Initialize default admin user
  initializeAdminUser();

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, otpToken } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Get admin user
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email));

      if (!admin) {
        await handleFailedLogin(email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if account is locked
      if (isAccountLocked(admin)) {
        return res.status(423).json({ 
          message: "Account is locked due to too many failed attempts. Please try again later." 
        });
      }

      // Verify password
      const validPassword = await verifyPassword(password, admin.passwordHash);
      if (!validPassword) {
        await handleFailedLogin(email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check 2FA if enabled
      if (admin.totpEnabled && admin.totpSecret) {
        if (!otpToken) {
          return res.status(200).json({ 
            requiresOTP: true,
            message: "Please enter your 2FA code" 
          });
        }

        const validOTP = verify2FAToken(admin.totpSecret, otpToken);
        if (!validOTP) {
          return res.status(401).json({ message: "Invalid 2FA code" });
        }
      }

      // Reset login attempts
      await resetLoginAttempts(admin.id);

      // Generate token
      const token = generateToken(admin.id, admin.email, admin.role || "admin");

      // Log audit action
      await logAuditAction(
        admin.id,
        "LOGIN",
        "admin",
        admin.id,
        null,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          totpEnabled: admin.totpEnabled
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Setup 2FA
  app.post("/api/admin/2fa/setup", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const adminId = req.admin!.id;
      
      // Generate secret
      const secret = generate2FASecret(req.admin!.email);
      
      // Save secret to database
      await db
        .update(adminUsers)
        .set({
          totpSecret: secret.base32,
          updatedAt: new Date()
        })
        .where(eq(adminUsers.id, adminId));

      // Generate QR code
      const qrCode = await generateQRCode(secret.otpauth_url!);

      res.json({
        secret: secret.base32,
        qrCode
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  // Enable 2FA
  app.post("/api/admin/2fa/enable", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { token } = req.body;
      const adminId = req.admin!.id;

      // Get admin's secret
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, adminId));

      if (!admin || !admin.totpSecret) {
        return res.status(400).json({ message: "2FA not setup" });
      }

      // Verify token
      const valid = verify2FAToken(admin.totpSecret, token);
      if (!valid) {
        return res.status(400).json({ message: "Invalid 2FA code" });
      }

      // Enable 2FA
      await db
        .update(adminUsers)
        .set({
          totpEnabled: true,
          updatedAt: new Date()
        })
        .where(eq(adminUsers.id, adminId));

      await logAuditAction(
        adminId,
        "ENABLE_2FA",
        "admin",
        adminId,
        null,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "2FA enabled successfully" });
    } catch (error) {
      console.error("2FA enable error:", error);
      res.status(500).json({ message: "Failed to enable 2FA" });
    }
  });

  // Dashboard statistics
  app.get("/api/admin/dashboard/stats", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      // Get real statistics from database
      const [totalProducts] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products);

      const [totalOrders] = await db
        .select({ 
          count: sql<number>`count(*)`,
          revenue: sql<number>`sum(total_amount)` 
        })
        .from(orders);

      const [totalUsers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      const [totalBrands] = await db
        .select({ count: sql<number>`count(*)` })
        .from(brands);

      // Get recent orders
      const recentOrders = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(5);

      // Get revenue by date (last 7 days)
      const revenueByDate = await db
        .select({
          date: sql<string>`DATE(created_at)`,
          revenue: sql<number>`sum(total_amount)`
        })
        .from(orders)
        .where(
          gte(orders.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        )
        .groupBy(sql`DATE(created_at)`)
        .orderBy(sql`DATE(created_at)`);

      res.json({
        totalProducts: totalProducts?.count || 0,
        totalOrders: totalOrders?.count || 0,
        totalRevenue: totalOrders?.revenue || 0,
        totalUsers: totalUsers?.count || 0,
        totalBrands: totalBrands?.count || 0,
        recentOrders,
        revenueByDate
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Orders management using storage interface
  app.get("/api/admin/orders", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      // Get orders using storage interface
      const ordersList = await storage.getAllOrders({
        status: status as string,
        search: search as string,
        limit: Number(limit),
        offset
      });

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        ordersList.map(async (order) => {
          const orderDetails = await storage.getOrderById(order.id);
          return {
            ...order,
            items: orderDetails?.items || []
          };
        })
      );

      // Get total count for pagination
      const allOrders = await storage.getAllOrders({
        status: status as string,
        search: search as string
      });

      res.json({
        orders: ordersWithItems,
        totalCount: allOrders.length,
        currentPage: Number(page),
        totalPages: Math.ceil(allOrders.length / Number(limit))
      });
    } catch (error) {
      console.error("Orders fetch error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update order status
  app.put("/api/admin/orders/:orderId/status", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      await logAuditAction(
        req.admin!.id,
        "UPDATE_ORDER_STATUS",
        "order",
        orderId,
        { oldStatus: order.status, newStatus: status },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "Order status updated successfully", order: updatedOrder });
    } catch (error) {
      console.error("Order status update error:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Users management
  app.get("/api/admin/users", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      
      const conditions = [];
      
      if (search) {
        conditions.push(
          or(
            like(users.email, `%${search}%`),
            like(users.firstName, `%${search}%`),
            like(users.lastName, `%${search}%`)
          )
        );
      }

      const offset = (Number(page) - 1) * Number(limit);
      
      const usersList = await db
        .select()
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(Number(limit))
        .offset(offset);

      const [totalCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      res.json({
        users: usersList,
        totalCount: totalCount?.count || 0,
        currentPage: Number(page),
        totalPages: Math.ceil((totalCount?.count || 0) / Number(limit))
      });
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Coupons management
  app.get("/api/admin/coupons", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const couponsList = await db
        .select()
        .from(coupons)
        .orderBy(desc(coupons.createdAt));

      res.json(couponsList);
    } catch (error) {
      console.error("Coupons fetch error:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  // Create coupon
  app.post("/api/admin/coupons", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const couponData = req.body;

      const [newCoupon] = await db
        .insert(coupons)
        .values(couponData)
        .returning();

      await logAuditAction(
        req.admin!.id,
        "CREATE_COUPON",
        "coupon",
        newCoupon.id,
        couponData,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(newCoupon);
    } catch (error) {
      console.error("Coupon create error:", error);
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });

  // Update coupon
  app.put("/api/admin/coupons/:couponId", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { couponId } = req.params;
      const updates = req.body;

      const [updatedCoupon] = await db
        .update(coupons)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(coupons.id, couponId))
        .returning();

      await logAuditAction(
        req.admin!.id,
        "UPDATE_COUPON",
        "coupon",
        couponId,
        updates,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(updatedCoupon);
    } catch (error) {
      console.error("Coupon update error:", error);
      res.status(500).json({ message: "Failed to update coupon" });
    }
  });

  // Delete coupon
  app.delete("/api/admin/coupons/:couponId", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { couponId } = req.params;

      await db
        .delete(coupons)
        .where(eq(coupons.id, couponId));

      await logAuditAction(
        req.admin!.id,
        "DELETE_COUPON",
        "coupon",
        couponId,
        null,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
      console.error("Coupon delete error:", error);
      res.status(500).json({ message: "Failed to delete coupon" });
    }
  });

  // Product management using storage interface
  app.get("/api/admin/products", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { search, categoryId, brandId, page = 1, limit = 20 } = req.query;
      
      const products = await storage.getProducts({
        search: search as string,
        categoryId: categoryId as string,
        brandId: brandId as string,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit)
      });

      // Ensure consistent response format for frontend
      res.json({
        products: products,
        total: products.length,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (error) {
      console.error("Products fetch error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create product
  app.post("/api/admin/products", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const productData = req.body;
      
      // Generate slug from name
      const slug = productData.name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const newProduct = await storage.createProduct({
        ...productData,
        slug,
        images: productData.images || [],
        sizes: productData.sizes || [],
        isActive: true,
        viewCount: 0
      });

      await logAuditAction(
        req.admin!.id,
        "CREATE_PRODUCT",
        "product",
        newProduct.id,
        productData,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(newProduct);
    } catch (error) {
      console.error("Product create error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product
  app.put("/api/admin/products/:productId", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { productId } = req.params;
      const updates = req.body;
      
      // Generate new slug if name is updated
      if (updates.name) {
        updates.slug = updates.name.toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }

      const updatedProduct = await storage.updateProduct(productId, updates);
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      await logAuditAction(
        req.admin!.id,
        "UPDATE_PRODUCT",
        "product",
        productId,
        updates,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(updatedProduct);
    } catch (error) {
      console.error("Product update error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/admin/products/:productId", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { productId } = req.params;

      // Soft delete by marking as inactive
      await storage.updateProduct(productId, { isActive: false });

      await logAuditAction(
        req.admin!.id,
        "DELETE_PRODUCT",
        "product",
        productId,
        null,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Product delete error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Categories management
  app.get("/api/admin/categories", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Categories fetch error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create category
  app.post("/api/admin/categories", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const categoryData = req.body;
      
      const slug = categoryData.name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const newCategory = await storage.createCategory({
        ...categoryData,
        slug
      });

      await logAuditAction(
        req.admin!.id,
        "CREATE_CATEGORY",
        "category",
        newCategory.id,
        categoryData,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(newCategory);
    } catch (error) {
      console.error("Category create error:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Brands management
  app.get("/api/admin/brands", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      console.error("Brands fetch error:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  // Create brand
  app.post("/api/admin/brands", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const brandData = req.body;
      
      const slug = brandData.name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const newBrand = await storage.createBrand({
        ...brandData,
        slug
      });

      await logAuditAction(
        req.admin!.id,
        "CREATE_BRAND",
        "brand",
        newBrand.id,
        brandData,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(newBrand);
    } catch (error) {
      console.error("Brand create error:", error);
      res.status(500).json({ message: "Failed to create brand" });
    }
  });

  // Banners management
  app.get("/api/admin/banners", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const bannersList = await db
        .select()
        .from(banners)
        .orderBy(banners.sortOrder);

      res.json(bannersList);
    } catch (error) {
      console.error("Banners fetch error:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });

  // Create banner
  app.post("/api/admin/banners", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const bannerData = req.body;

      const [newBanner] = await db
        .insert(banners)
        .values(bannerData)
        .returning();

      await logAuditAction(
        req.admin!.id,
        "CREATE_BANNER",
        "banner",
        newBanner.id,
        bannerData,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(newBanner);
    } catch (error) {
      console.error("Banner create error:", error);
      res.status(500).json({ message: "Failed to create banner" });
    }
  });

  // Update banner
  app.put("/api/admin/banners/:bannerId", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { bannerId } = req.params;
      const updates = req.body;

      const [updatedBanner] = await db
        .update(banners)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(banners.id, bannerId))
        .returning();

      await logAuditAction(
        req.admin!.id,
        "UPDATE_BANNER",
        "banner",
        bannerId,
        updates,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(updatedBanner);
    } catch (error) {
      console.error("Banner update error:", error);
      res.status(500).json({ message: "Failed to update banner" });
    }
  });

  // AI Configuration
  app.get("/api/admin/ai-config", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const aiConfigList = await db
        .select()
        .from(aiConfig)
        .orderBy(aiConfig.feature);

      res.json(aiConfigList);
    } catch (error) {
      console.error("AI config fetch error:", error);
      res.status(500).json({ message: "Failed to fetch AI configuration" });
    }
  });

  // Update AI config
  app.put("/api/admin/ai-config/:feature", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { feature } = req.params;
      const updates = req.body;

      const [existing] = await db
        .select()
        .from(aiConfig)
        .where(eq(aiConfig.feature, feature));

      let result;
      if (existing) {
        [result] = await db
          .update(aiConfig)
          .set({
            ...updates,
            updatedAt: new Date()
          })
          .where(eq(aiConfig.feature, feature))
          .returning();
      } else {
        [result] = await db
          .insert(aiConfig)
          .values({
            feature,
            ...updates
          })
          .returning();
      }

      await logAuditAction(
        req.admin!.id,
        existing ? "UPDATE_AI_CONFIG" : "CREATE_AI_CONFIG",
        "ai_config",
        feature,
        updates,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(result);
    } catch (error) {
      console.error("AI config update error:", error);
      res.status(500).json({ message: "Failed to update AI configuration" });
    }
  });

  // Store settings
  app.get("/api/admin/settings", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const settingsList = await db
        .select()
        .from(storeSettings)
        .orderBy(storeSettings.key);

      res.json(settingsList);
    } catch (error) {
      console.error("Settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update store setting
  app.put("/api/admin/settings/:key", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;

      const [existing] = await db
        .select()
        .from(storeSettings)
        .where(eq(storeSettings.key, key));

      let result;
      if (existing) {
        [result] = await db
          .update(storeSettings)
          .set({
            value,
            description,
            updatedAt: new Date()
          })
          .where(eq(storeSettings.key, key))
          .returning();
      } else {
        [result] = await db
          .insert(storeSettings)
          .values({
            key,
            value,
            description
          })
          .returning();
      }

      await logAuditAction(
        req.admin!.id,
        existing ? "UPDATE_SETTING" : "CREATE_SETTING",
        "setting",
        key,
        { value },
        req.ip,
        req.headers["user-agent"]
      );

      res.json(result);
    } catch (error) {
      console.error("Setting update error:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Payment Settings API endpoints
  app.get("/api/admin/payment-settings", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const [settings] = await db
        .select()
        .from(paymentSettings)
        .where(eq(paymentSettings.isActive, true))
        .limit(1);

      res.json(settings || {
        upiId: "",
        qrCodeUrl: "",
        bankDetails: {},
        isActive: false
      });
    } catch (error) {
      console.error("Payment settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch payment settings" });
    }
  });

  app.put("/api/admin/payment-settings", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { upiId, qrCodeUrl, bankDetails, isActive } = req.body;

      // Deactivate all existing settings first
      await db
        .update(paymentSettings)
        .set({ isActive: false });

      // Insert new settings
      const [newSettings] = await db
        .insert(paymentSettings)
        .values({
          upiId,
          qrCodeUrl,
          bankDetails,
          isActive
        })
        .returning();

      await logAuditAction(
        req.admin!.id,
        "UPDATE_PAYMENT_SETTINGS",
        "payment_settings",
        newSettings.id,
        { upiId, qrCodeUrl, bankDetails, isActive },
        req.ip,
        req.headers["user-agent"]
      );

      res.json(newSettings);
    } catch (error) {
      console.error("Payment settings update error:", error);
      res.status(500).json({ message: "Failed to update payment settings" });
    }
  });

  // Audit logs
  app.get("/api/admin/audit-logs", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { adminId, entityType, startDate, endDate, page = 1, limit = 50 } = req.query;
      
      const conditions = [];
      
      if (adminId) {
        conditions.push(eq(auditLogs.adminId, adminId as string));
      }
      
      if (entityType) {
        conditions.push(eq(auditLogs.entityType, entityType as string));
      }
      
      if (startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(startDate as string)));
      }
      
      if (endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(endDate as string)));
      }

      const offset = (Number(page) - 1) * Number(limit);
      
      const logs = await db
        .select({
          log: auditLogs,
          admin: adminUsers
        })
        .from(auditLogs)
        .leftJoin(adminUsers, eq(auditLogs.adminId, adminUsers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(Number(limit))
        .offset(offset);

      const [totalCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      res.json({
        logs: logs.map(({ log, admin }) => ({
          ...log,
          adminEmail: admin?.email
        })),
        totalCount: totalCount?.count || 0,
        currentPage: Number(page),
        totalPages: Math.ceil((totalCount?.count || 0) / Number(limit))
      });
    } catch (error) {
      console.error("Audit logs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Send notification
  app.post("/api/admin/notifications/send", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { userIds, title, message, type } = req.body;

      const notificationPromises = userIds.map((userId: string) =>
        db.insert(notifications).values({
          userId,
          title,
          message,
          type: type || "system"
        })
      );

      await Promise.all(notificationPromises);

      await logAuditAction(
        req.admin!.id,
        "SEND_NOTIFICATION",
        "notification",
        undefined,
        { userIds, title, message },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "Notifications sent successfully" });
    } catch (error) {
      console.error("Notification send error:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  // Content pages management
  app.get("/api/admin/pages", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const pages = await db
        .select()
        .from(contentPages)
        .orderBy(contentPages.slug);

      res.json(pages);
    } catch (error) {
      console.error("Pages fetch error:", error);
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  // Update content page
  app.put("/api/admin/pages/:slug", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { slug } = req.params;
      const updates = req.body;

      const [existing] = await db
        .select()
        .from(contentPages)
        .where(eq(contentPages.slug, slug));

      let result;
      if (existing) {
        [result] = await db
          .update(contentPages)
          .set({
            ...updates,
            updatedAt: new Date()
          })
          .where(eq(contentPages.slug, slug))
          .returning();
      } else {
        [result] = await db
          .insert(contentPages)
          .values({
            slug,
            ...updates
          })
          .returning();
      }

      await logAuditAction(
        req.admin!.id,
        existing ? "UPDATE_PAGE" : "CREATE_PAGE",
        "page",
        slug,
        updates,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(result);
    } catch (error) {
      console.error("Page update error:", error);
      res.status(500).json({ message: "Failed to update page" });
    }
  });
}