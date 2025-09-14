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
import {
  insertCategorySchema,
  updateCategorySchema,
  insertBannerSchema,
  insertPromotionalPopupSchema,
  type InsertCategory,
  type UpdateCategory,
  type InsertBanner,
  type InsertPromotionalPopup,
  featuredProductsPanelSettingsSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

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

      // Handle missing brand_id by setting to null if empty
      const productToCreate = {
        ...productData,
        slug,
        images: productData.images || [],
        sizes: productData.sizes || [],
        brandId: productData.brandId && productData.brandId.trim() !== '' ? productData.brandId : null,
        isActive: true,
        viewCount: 0
      };

      const newProduct = await storage.createProduct(productToCreate);

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

  // Banner Management Routes
  
  // Get all banners for admin
  app.get("/api/admin/banners", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const banners = await storage.getBanners(); // Get all banners for admin view
      res.json(banners);
    } catch (error) {
      console.error("Banners fetch error:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });

  // Get single banner by ID
  app.get("/api/admin/banners/:bannerId", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { bannerId } = req.params;
      const banner = await storage.getBannerById(bannerId);
      
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      
      res.json(banner);
    } catch (error) {
      console.error("Banner fetch error:", error);
      res.status(500).json({ message: "Failed to fetch banner" });
    }
  });

  // Create banner
  app.post("/api/admin/banners", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const validationResult = insertBannerSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid banner data", 
          errors: validationResult.error.issues 
        });
      }

      const newBanner = await storage.createBanner(validationResult.data);

      await logAuditAction(
        req.admin!.id,
        "CREATE_BANNER",
        "banner",
        newBanner.id,
        validationResult.data,
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
      
      const validationResult = insertBannerSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid banner data", 
          errors: validationResult.error.issues 
        });
      }

      const updatedBanner = await storage.updateBanner(bannerId, validationResult.data);
      
      if (!updatedBanner) {
        return res.status(404).json({ message: "Banner not found" });
      }

      await logAuditAction(
        req.admin!.id,
        "UPDATE_BANNER",
        "banner",
        bannerId,
        validationResult.data,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(updatedBanner);
    } catch (error) {
      console.error("Banner update error:", error);
      res.status(500).json({ message: "Failed to update banner" });
    }
  });

  // Delete banner
  app.delete("/api/admin/banners/:bannerId", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { bannerId } = req.params;

      // Check if banner exists first
      const existingBanner = await storage.getBannerById(bannerId);
      if (!existingBanner) {
        return res.status(404).json({ message: "Banner not found" });
      }

      await storage.deleteBanner(bannerId);

      await logAuditAction(
        req.admin!.id,
        "DELETE_BANNER",
        "banner",
        bannerId,
        null,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "Banner deleted successfully" });
    } catch (error) {
      console.error("Banner delete error:", error);
      res.status(500).json({ message: "Failed to delete banner" });
    }
  });

  // Promotional Popup Management Routes
  
  // Get all promotional popups for admin
  app.get("/api/admin/promotional-popups", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const popups = await storage.getPromotionalPopups(); // Get all popups for admin view
      res.json(popups);
    } catch (error) {
      console.error("Promotional popups fetch error:", error);
      res.status(500).json({ message: "Failed to fetch promotional popups" });
    }
  });

  // Get single promotional popup by ID
  app.get("/api/admin/promotional-popups/:popupId", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { popupId } = req.params;
      const popup = await storage.getPromotionalPopupById(popupId);
      
      if (!popup) {
        return res.status(404).json({ message: "Promotional popup not found" });
      }
      
      res.json(popup);
    } catch (error) {
      console.error("Promotional popup fetch error:", error);
      res.status(500).json({ message: "Failed to fetch promotional popup" });
    }
  });

  // Create promotional popup
  app.post("/api/admin/promotional-popups", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const validationResult = insertPromotionalPopupSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid promotional popup data", 
          errors: validationResult.error.issues 
        });
      }

      const newPopup = await storage.createPromotionalPopup(validationResult.data);

      await logAuditAction(
        req.admin!.id,
        "CREATE_PROMOTIONAL_POPUP",
        "promotional_popup",
        newPopup.id,
        validationResult.data,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(newPopup);
    } catch (error) {
      console.error("Promotional popup create error:", error);
      res.status(500).json({ message: "Failed to create promotional popup" });
    }
  });

  // Update promotional popup
  app.put("/api/admin/promotional-popups/:popupId", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { popupId } = req.params;
      
      const validationResult = insertPromotionalPopupSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid promotional popup data", 
          errors: validationResult.error.issues 
        });
      }

      const updatedPopup = await storage.updatePromotionalPopup(popupId, validationResult.data);
      
      if (!updatedPopup) {
        return res.status(404).json({ message: "Promotional popup not found" });
      }

      await logAuditAction(
        req.admin!.id,
        "UPDATE_PROMOTIONAL_POPUP",
        "promotional_popup",
        popupId,
        validationResult.data,
        req.ip,
        req.headers["user-agent"]
      );

      res.json(updatedPopup);
    } catch (error) {
      console.error("Promotional popup update error:", error);
      res.status(500).json({ message: "Failed to update promotional popup" });
    }
  });

  // Delete promotional popup
  app.delete("/api/admin/promotional-popups/:popupId", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { popupId } = req.params;

      // Check if popup exists first
      const existingPopup = await storage.getPromotionalPopupById(popupId);
      if (!existingPopup) {
        return res.status(404).json({ message: "Promotional popup not found" });
      }

      await storage.deletePromotionalPopup(popupId);

      await logAuditAction(
        req.admin!.id,
        "DELETE_PROMOTIONAL_POPUP",
        "promotional_popup",
        popupId,
        null,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "Promotional popup deleted successfully" });
    } catch (error) {
      console.error("Promotional popup delete error:", error);
      res.status(500).json({ message: "Failed to delete promotional popup" });
    }
  });

  // Featured Products Management Routes
  
  // Get featured products panel settings and current featured products
  app.get("/api/admin/featured-products", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const settings = await storage.getFeaturedProductsPanelSettings();
      const featuredProducts = await storage.getFeaturedProductsOrdered();
      
      res.json({
        settings,
        products: featuredProducts
      });
    } catch (error) {
      console.error("Featured products fetch error:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Update featured products panel settings
  app.put("/api/admin/featured-products", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { settings } = req.body;

      if (!settings) {
        return res.status(400).json({ message: "Settings are required" });
      }

      // Validate settings using Zod schema
      const validationResult = featuredProductsPanelSettingsSchema.safeParse(settings);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid settings format", 
          errors: validationResult.error.issues 
        });
      }

      // Verify that all product IDs in the order array exist and are featured
      if (settings.order && settings.order.length > 0) {
        const featuredProducts = await storage.getProducts({ featured: true });
        const featuredProductIds = new Set(featuredProducts.map(p => p.id));
        
        const invalidIds = settings.order.filter(id => !featuredProductIds.has(id));
        if (invalidIds.length > 0) {
          return res.status(400).json({
            message: "Some product IDs in order are not featured products",
            invalidIds
          });
        }
      }

      const savedSettings = await storage.saveFeaturedProductsPanelSettings(validationResult.data);
      
      await logAuditAction(
        req.admin!.id,
        "UPDATE_FEATURED_PRODUCTS_SETTINGS",
        "featured_products",
        "panel_settings",
        validationResult.data,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ 
        settings: savedSettings,
        message: "Featured products settings updated successfully" 
      });
    } catch (error) {
      console.error("Featured products settings update error:", error);
      res.status(500).json({ message: "Failed to update featured products settings" });
    }
  });

  // Categories management
  app.get("/api/admin/categories", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const result = await storage.listCategoriesAdmin({
        search: search as string,
        limit: Number(limit),
        offset
      });
      
      res.json(result);
    } catch (error) {
      console.error("Categories fetch error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create category
  app.post("/api/admin/categories", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      // Validate request body with Zod
      const validationResult = insertCategorySchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error);
        return res.status(400).json({ 
          message: "Invalid category data",
          details: errorMessage.toString() 
        });
      }

      const categoryData = validationResult.data;
      
      // Sanitize name to prevent XSS and generate slug
      const sanitizedName = categoryData.name.trim().replace(/[<>\"&]/g, '');
      if (!sanitizedName) {
        return res.status(400).json({ message: "Category name cannot be empty after sanitization" });
      }

      const slug = sanitizedName.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Sanitize description if present
      const sanitizedDescription = categoryData.description?.trim().replace(/[<>]/g, '') || null;

      const newCategory = await storage.createCategory({
        ...categoryData,
        name: sanitizedName,
        description: sanitizedDescription,
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

  // Update category
  app.patch("/api/admin/categories/:id", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { id } = req.params;

      // Validate request body with Zod
      const validationResult = updateCategorySchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error);
        return res.status(400).json({ 
          message: "Invalid category update data",
          details: errorMessage.toString() 
        });
      }

      const updateData = validationResult.data;

      // Check if category exists
      const existingCategory = await storage.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Sanitize and validate name if being updated
      if (updateData.name !== undefined) {
        const sanitizedName = updateData.name.trim().replace(/[<>\"&]/g, '');
        if (!sanitizedName) {
          return res.status(400).json({ message: "Category name cannot be empty after sanitization" });
        }
        updateData.name = sanitizedName;

        // Generate slug if name is being updated
        if (sanitizedName !== existingCategory.name) {
          updateData.slug = sanitizedName.toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        }
      }

      // Sanitize description if being updated
      if (updateData.description !== undefined) {
        updateData.description = updateData.description?.trim().replace(/[<>]/g, '') || null;
      }

      const updatedCategory = await storage.updateCategory(id, updateData);

      await logAuditAction(
        req.admin!.id,
        "UPDATE_CATEGORY",
        "category",
        id,
        { before: existingCategory, after: updateData },
        req.ip,
        req.headers["user-agent"]
      );

      res.json(updatedCategory);
    } catch (error) {
      console.error("Category update error:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Toggle category visibility
  app.patch("/api/admin/categories/:id/visibility", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { id } = req.params;

      // Create schema for visibility validation
      const visibilitySchema = z.object({
        isActive: z.boolean({ required_error: "isActive is required" })
      }).strict(); // Strict mode to reject extra fields

      // Validate request body with Zod
      const validationResult = visibilitySchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error);
        return res.status(400).json({ 
          message: "Invalid visibility data",
          details: errorMessage.toString() 
        });
      }

      const { isActive } = validationResult.data;

      // Check if category exists
      const existingCategory = await storage.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const updatedCategory = await storage.setCategoryVisibility(id, isActive);

      await logAuditAction(
        req.admin!.id,
        "TOGGLE_CATEGORY_VISIBILITY",
        "category",
        id,
        { isActive: isActive, previousState: existingCategory.isActive },
        req.ip,
        req.headers["user-agent"]
      );

      res.json(updatedCategory);
    } catch (error) {
      console.error("Category visibility toggle error:", error);
      res.status(500).json({ message: "Failed to toggle category visibility" });
    }
  });

  // Delete category
  app.delete("/api/admin/categories/:id", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { id } = req.params;

      // Check if category exists
      const existingCategory = await storage.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check for product dependencies
      const productCount = await storage.checkCategoryProductDependency(id);
      if (productCount > 0) {
        return res.status(409).json({ 
          message: `Cannot delete category. It has ${productCount} active products. Please reassign or remove these products first.`,
          productCount
        });
      }

      await storage.deleteCategory(id);

      await logAuditAction(
        req.admin!.id,
        "DELETE_CATEGORY",
        "category",
        id,
        existingCategory,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Category delete error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Brands management
  app.get("/api/admin/brands", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { categoryId } = req.query;
      const brands = await storage.getBrands({ 
        categoryId: categoryId as string 
      });
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

  // Payment verification endpoints
  app.put("/api/admin/orders/:orderId/verify-payment", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { orderId } = req.params;
      const adminId = req.admin!.id;

      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: "payment_verified",
          paymentStatus: "verified",
          paymentVerifiedBy: adminId,
          paymentVerifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      await logAuditAction(
        adminId,
        "VERIFY_PAYMENT",
        "order",
        orderId,
        { status: "payment_verified", paymentStatus: "verified" },
        req.ip,
        req.headers["user-agent"]
      );

      res.json(updatedOrder);
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  app.put("/api/admin/orders/:orderId/reject-payment", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { orderId } = req.params;
      const adminId = req.admin!.id;

      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: "payment_failed",
          paymentStatus: "failed",
          paymentVerifiedBy: adminId,
          paymentVerifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      await logAuditAction(
        adminId,
        "REJECT_PAYMENT",
        "order",
        orderId,
        { status: "payment_failed", paymentStatus: "failed" },
        req.ip,
        req.headers["user-agent"]
      );

      res.json(updatedOrder);
    } catch (error) {
      console.error("Payment rejection error:", error);
      res.status(500).json({ message: "Failed to reject payment" });
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

  // Admin download order slip PDF (GET /api/admin/orders/:id/pdf)
  app.get("/api/admin/orders/:id/pdf", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Get user data for the PDF
      const user = order.userId ? await storage.getUser(order.userId) : undefined;
      const orderWithUser = { ...order, user };

      // Generate actual PDF using PDFService (admin version)
      const { PDFService } = await import('./pdf-service');
      const pdfBuffer = await PDFService.generateOrderPDF(orderWithUser, true);

      // Set headers for PDF download
      const orderId = order.id.slice(0, 8).toUpperCase();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ReWeara-Admin-Order-${orderId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating admin order PDF:', error);
      res.status(500).json({ message: 'Failed to generate order PDF' });
    }
  });

  // Admin edit order (PATCH /api/admin/orders/:id)
  app.patch("/api/admin/orders/:id", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const { id } = req.params;
      const adminId = req.admin!.id;
      const { status, shippingAddress, notes, paymentStatus, trackingNumber, estimatedDelivery } = req.body;

      // Validate allowed order updates
      const allowedUpdates = ['status', 'shippingAddress', 'notes', 'paymentStatus', 'trackingNumber', 'estimatedDelivery'];
      const updates: any = {};
      
      // Only include provided fields that are allowed to be updated
      if (status !== undefined) updates.status = status;
      if (shippingAddress !== undefined) updates.shippingAddress = shippingAddress;
      if (notes !== undefined) updates.notes = notes;
      if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
      if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;
      if (estimatedDelivery !== undefined) updates.estimatedDelivery = estimatedDelivery;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid updates provided" });
      }

      // Use the new transactional storage method with audit logging
      const adminNotes = `Admin ${req.admin?.email || adminId} updated: ${Object.keys(updates).join(', ')}`;
      const updatedOrder = await storage.updateOrderWithAudit(id, updates, adminId, adminNotes);

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get complete order with items for response
      const orderWithItems = await storage.getOrderById(id);

      res.json({
        message: "Order updated successfully",
        order: orderWithItems || updatedOrder
      });
    } catch (error: any) {
      console.error("Order edit error:", error);
      
      if (error.message && error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to edit order" });
    }
  });

  // API Settings Management Routes

  // Payment Settings Routes
  app.get("/api/admin/payment-settings", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      
      if (!settings) {
        return res.json({
          upiId: null,
          qrCodeUrl: null,
          bankDetails: null,
          stripeSecretKeySet: false,
          stripePublishableKey: null,
          stripeWebhookSecretSet: false,
          stripeEnabled: false,
          upiEnabled: true,
          codEnabled: true,
          lastTestStatus: null,
          lastTestAt: null,
        });
      }

      // Mask sensitive data
      res.json({
        ...settings,
        stripeSecretKey: undefined,
        stripeWebhookSecret: undefined,
        stripeSecretKeySet: !!settings.stripeSecretKey,
        stripeWebhookSecretSet: !!settings.stripeWebhookSecret,
      });
    } catch (error) {
      console.error("Payment settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch payment settings" });
    }
  });

  app.put("/api/admin/payment-settings", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const adminId = req.admin!.id;
      const settingsData = req.body;
      
      // Remove masked fields that shouldn't be updated
      delete settingsData.stripeSecretKeySet;
      delete settingsData.stripeWebhookSecretSet;
      
      const updatedSettings = await storage.upsertPaymentSettings(settingsData);
      
      // Log audit action
      await logAuditAction(
        adminId,
        "UPDATE_PAYMENT_SETTINGS",
        "payment_settings",
        updatedSettings.id,
        { updated: Object.keys(settingsData) },
        req.ip,
        req.headers["user-agent"]
      );

      // Return masked response
      res.json({
        ...updatedSettings,
        stripeSecretKey: undefined,
        stripeWebhookSecret: undefined,
        stripeSecretKeySet: !!updatedSettings.stripeSecretKey,
        stripeWebhookSecretSet: !!updatedSettings.stripeWebhookSecret,
      });
    } catch (error) {
      console.error("Payment settings update error:", error);
      res.status(500).json({ message: "Failed to update payment settings" });
    }
  });

  // Payment Settings Test Endpoints
  app.post("/api/admin/payment-settings/test-stripe", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      if (!settings?.stripeSecretKey) {
        return res.status(400).json({ message: "Stripe secret key not configured" });
      }

      // Test Stripe connection by retrieving balance
      const stripe = require('stripe')(settings.stripeSecretKey);
      const balance = await stripe.balance.retrieve();
      
      // Update test status
      await storage.upsertPaymentSettings({
        lastTestStatus: 'success',
        lastTestAt: new Date()
      });

      await logAuditAction(
        req.admin!.id,
        "TEST_STRIPE_CONNECTION",
        "payment_settings",
        settings.id,
        { status: 'success', balance: balance.available?.[0]?.amount || 'N/A' },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ 
        success: true, 
        message: "Stripe connection successful",
        balance: balance.available?.[0]?.amount || 'N/A'
      });
    } catch (error: any) {
      console.error("Stripe test error:", error);
      
      // Update test status
      const settings = await storage.getPaymentSettings();
      if (settings) {
        await storage.upsertPaymentSettings({
          lastTestStatus: 'failed',
          lastTestAt: new Date()
        });
      }

      await logAuditAction(
        req.admin!.id,
        "TEST_STRIPE_CONNECTION",
        "payment_settings",
        settings?.id || 'unknown',
        { status: 'failed', error: error.message },
        req.ip,
        req.headers["user-agent"]
      );

      res.status(400).json({ 
        success: false, 
        message: "Stripe connection failed: " + error.message 
      });
    }
  });

  app.post("/api/admin/payment-settings/test-upi", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      if (!settings?.upiId) {
        return res.status(400).json({ message: "UPI ID not configured" });
      }

      // Validate UPI ID format
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      const isValid = upiRegex.test(settings.upiId);
      
      // Update test status
      await storage.upsertPaymentSettings({
        lastTestStatus: isValid ? 'success' : 'failed',
        lastTestAt: new Date()
      });

      await logAuditAction(
        req.admin!.id,
        "TEST_UPI_VALIDATION",
        "payment_settings",
        settings.id,
        { status: isValid ? 'success' : 'failed', upiId: settings.upiId },
        req.ip,
        req.headers["user-agent"]
      );

      if (isValid) {
        res.json({ 
          success: true, 
          message: "UPI ID format is valid" 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Invalid UPI ID format" 
        });
      }
    } catch (error: any) {
      console.error("UPI test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "UPI validation failed: " + error.message 
      });
    }
  });

  // Analytics Settings Routes
  app.get("/api/admin/analytics-settings", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const settings = await storage.getAnalyticsSettings();
      
      if (!settings) {
        return res.json({
          googleAnalyticsId: null,
          facebookPixelId: null,
          googleTagManagerId: null,
          hotjarId: null,
          mixpanelTokenSet: false,
          amplitudeApiKeySet: false,
          googleAnalyticsEnabled: false,
          facebookPixelEnabled: false,
          googleTagManagerEnabled: false,
          hotjarEnabled: false,
          mixpanelEnabled: false,
          amplitudeEnabled: false,
          lastTestStatus: null,
          lastTestAt: null,
        });
      }

      // Mask sensitive data
      res.json({
        ...settings,
        mixpanelToken: undefined,
        amplitudeApiKey: undefined,
        mixpanelTokenSet: !!settings.mixpanelToken,
        amplitudeApiKeySet: !!settings.amplitudeApiKey,
      });
    } catch (error) {
      console.error("Analytics settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch analytics settings" });
    }
  });

  app.put("/api/admin/analytics-settings", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const adminId = req.admin!.id;
      const settingsData = req.body;
      
      // Remove masked fields
      delete settingsData.mixpanelTokenSet;
      delete settingsData.amplitudeApiKeySet;
      
      const updatedSettings = await storage.upsertAnalyticsSettings(settingsData);
      
      await logAuditAction(
        adminId,
        "UPDATE_ANALYTICS_SETTINGS",
        "analytics_settings",
        updatedSettings.id,
        { updated: Object.keys(settingsData) },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        ...updatedSettings,
        mixpanelToken: undefined,
        amplitudeApiKey: undefined,
        mixpanelTokenSet: !!updatedSettings.mixpanelToken,
        amplitudeApiKeySet: !!updatedSettings.amplitudeApiKey,
      });
    } catch (error) {
      console.error("Analytics settings update error:", error);
      res.status(500).json({ message: "Failed to update analytics settings" });
    }
  });

  // Integration Settings Routes
  app.get("/api/admin/integration-settings", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      
      if (!settings) {
        return res.json({
          sendgridApiKeySet: false,
          sendgridFromEmail: null,
          openaiApiKeySet: false,
          geminiApiKeySet: false,
          twilioAccountSid: null,
          twilioAuthTokenSet: false,
          twilioFromNumber: null,
          razorpayKeyId: null,
          razorpayKeySecretSet: false,
          sendgridEnabled: false,
          openaiEnabled: false,
          geminiEnabled: false,
          twilioEnabled: false,
          razorpayEnabled: false,
          lastTestStatus: null,
          lastTestAt: null,
        });
      }

      // Mask sensitive data
      res.json({
        ...settings,
        sendgridApiKey: undefined,
        openaiApiKey: undefined,
        geminiApiKey: undefined,
        twilioAuthToken: undefined,
        razorpayKeySecret: undefined,
        sendgridApiKeySet: !!settings.sendgridApiKey,
        openaiApiKeySet: !!settings.openaiApiKey,
        geminiApiKeySet: !!settings.geminiApiKey,
        twilioAuthTokenSet: !!settings.twilioAuthToken,
        razorpayKeySecretSet: !!settings.razorpayKeySecret,
      });
    } catch (error) {
      console.error("Integration settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch integration settings" });
    }
  });

  app.put("/api/admin/integration-settings", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const adminId = req.admin!.id;
      const settingsData = req.body;
      
      // Remove masked fields
      delete settingsData.sendgridApiKeySet;
      delete settingsData.openaiApiKeySet;
      delete settingsData.geminiApiKeySet;
      delete settingsData.twilioAuthTokenSet;
      delete settingsData.razorpayKeySecretSet;
      
      const updatedSettings = await storage.upsertIntegrationSettings(settingsData);
      
      await logAuditAction(
        adminId,
        "UPDATE_INTEGRATION_SETTINGS",
        "integration_settings",
        updatedSettings.id,
        { updated: Object.keys(settingsData) },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        ...updatedSettings,
        sendgridApiKey: undefined,
        openaiApiKey: undefined,
        geminiApiKey: undefined,
        twilioAuthToken: undefined,
        razorpayKeySecret: undefined,
        sendgridApiKeySet: !!updatedSettings.sendgridApiKey,
        openaiApiKeySet: !!updatedSettings.openaiApiKey,
        geminiApiKeySet: !!updatedSettings.geminiApiKey,
        twilioAuthTokenSet: !!updatedSettings.twilioAuthToken,
        razorpayKeySecretSet: !!updatedSettings.razorpayKeySecret,
      });
    } catch (error) {
      console.error("Integration settings update error:", error);
      res.status(500).json({ message: "Failed to update integration settings" });
    }
  });

  // Integration Settings Test Endpoints
  app.post("/api/admin/integration-settings/test-sendgrid", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      if (!settings?.sendgridApiKey) {
        return res.status(400).json({ message: "SendGrid API key not configured" });
      }

      // Test SendGrid by getting user profile
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(settings.sendgridApiKey);
      
      // Use SendGrid API to verify the key
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          'Authorization': `Bearer ${settings.sendgridApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SendGrid API returned ${response.status}`);
      }

      const profile = await response.json();
      
      await storage.upsertIntegrationSettings({
        lastTestStatus: 'success',
        lastTestAt: new Date()
      });

      await logAuditAction(
        req.admin!.id,
        "TEST_SENDGRID_CONNECTION",
        "integration_settings",
        settings.id,
        { status: 'success', email: profile.email },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ 
        success: true, 
        message: "SendGrid connection successful",
        email: profile.email
      });
    } catch (error: any) {
      console.error("SendGrid test error:", error);
      
      const settings = await storage.getIntegrationSettings();
      if (settings) {
        await storage.upsertIntegrationSettings({
          lastTestStatus: 'failed',
          lastTestAt: new Date()
        });
      }

      await logAuditAction(
        req.admin!.id,
        "TEST_SENDGRID_CONNECTION",
        "integration_settings",
        settings?.id || 'unknown',
        { status: 'failed', error: error.message },
        req.ip,
        req.headers["user-agent"]
      );

      res.status(400).json({ 
        success: false, 
        message: "SendGrid connection failed: " + error.message 
      });
    }
  });

  app.post("/api/admin/integration-settings/test-openai", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      if (!settings?.openaiApiKey) {
        return res.status(400).json({ message: "OpenAI API key not configured" });
      }

      // Test OpenAI by listing models
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${settings.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned ${response.status}`);
      }

      const data = await response.json();
      
      await storage.upsertIntegrationSettings({
        lastTestStatus: 'success',
        lastTestAt: new Date()
      });

      await logAuditAction(
        req.admin!.id,
        "TEST_OPENAI_CONNECTION",
        "integration_settings",
        settings.id,
        { status: 'success', modelCount: data.data?.length || 0 },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ 
        success: true, 
        message: "OpenAI connection successful",
        modelCount: data.data?.length || 0
      });
    } catch (error: any) {
      console.error("OpenAI test error:", error);
      
      const settings = await storage.getIntegrationSettings();
      if (settings) {
        await storage.upsertIntegrationSettings({
          lastTestStatus: 'failed',
          lastTestAt: new Date()
        });
      }

      await logAuditAction(
        req.admin!.id,
        "TEST_OPENAI_CONNECTION",
        "integration_settings",
        settings?.id || 'unknown',
        { status: 'failed', error: error.message },
        req.ip,
        req.headers["user-agent"]
      );

      res.status(400).json({ 
        success: false, 
        message: "OpenAI connection failed: " + error.message 
      });
    }
  });

  app.post("/api/admin/integration-settings/test-gemini", isAdminAuthenticated, async (req: AdminRequest, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      if (!settings?.geminiApiKey) {
        return res.status(400).json({ message: "Gemini API key not configured" });
      }

      // Test Gemini by making a simple API call
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Simple test prompt
      const result = await model.generateContent("Test connection");
      
      await storage.upsertIntegrationSettings({
        lastTestStatus: 'success',
        lastTestAt: new Date()
      });

      await logAuditAction(
        req.admin!.id,
        "TEST_GEMINI_CONNECTION",
        "integration_settings",
        settings.id,
        { status: 'success' },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({ 
        success: true, 
        message: "Gemini connection successful"
      });
    } catch (error: any) {
      console.error("Gemini test error:", error);
      
      const settings = await storage.getIntegrationSettings();
      if (settings) {
        await storage.upsertIntegrationSettings({
          lastTestStatus: 'failed',
          lastTestAt: new Date()
        });
      }

      await logAuditAction(
        req.admin!.id,
        "TEST_GEMINI_CONNECTION",
        "integration_settings",
        settings?.id || 'unknown',
        { status: 'failed', error: error.message },
        req.ip,
        req.headers["user-agent"]
      );

      res.status(400).json({ 
        success: false, 
        message: "Gemini connection failed: " + error.message 
      });
    }
  });
}