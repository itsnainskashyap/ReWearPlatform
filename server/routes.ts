import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertProductSchema, 
  insertCategorySchema, 
  insertBrandSchema, 
  insertTaxRateSchema,
  insertProductMediaSchema,
  insertOrderTrackingSchema,
  insertPromotionalPopupSchema,
  insertOrderSchema,
  coupons, 
  banners,
  taxRates,
  products,
  brands,
  categories,
  productMedia,
  orders,
  orderTracking,
  orderItems,
  cartItems,
  users
} from "@shared/schema";
import { geminiService } from "./geminiService";
import { z } from "zod";
import { setupAdminRoutes } from "./adminRoutes";
import { db } from "./db";
import { sendEmail, getOrderConfirmationEmail, getStatusUpdateEmail } from "./email-service";
import { eq, and, or, gte, isNull, asc, desc, sql } from "drizzle-orm";
import multer from "multer";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment monitoring
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connectivity with direct database query
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`SELECT 1 as health_check`);
      res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected'
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({ 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Setup admin routes
  setupAdminRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/categories/:slug', async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Brand routes
  app.get('/api/brands', async (req, res) => {
    try {
      const { categoryId } = req.query;
      const brands = await storage.getBrands({ 
        categoryId: categoryId as string 
      });
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.get('/api/brands/featured', async (req, res) => {
    try {
      const { categoryId } = req.query;
      const brands = await storage.getFeaturedBrands({ 
        categoryId: categoryId as string 
      });
      res.json(brands);
    } catch (error) {
      console.error("Error fetching featured brands:", error);
      res.status(500).json({ message: "Failed to fetch featured brands" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const {
        category,
        brand,
        featured,
        hotSelling,
        isThrift,
        isOriginal,
        search,
        limit = "20",
        offset = "0"
      } = req.query;

      const products = await storage.getProducts({
        categoryId: category as string,
        brandId: brand as string,
        featured: featured === 'true',
        hotSelling: hotSelling === 'true',
        isThrift: isThrift === 'true',
        isOriginal: isOriginal === 'true',
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Increment view count
      await storage.incrementProductViewCount(req.params.id);

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Featured products route (public)
  app.get('/api/featured-products', async (req, res) => {
    try {
      const featuredProducts = await storage.getFeaturedProductsOrdered();
      const settings = await storage.getFeaturedProductsPanelSettings();
      
      res.json({
        products: featuredProducts,
        settings: {
          autoScrollMs: settings.autoScrollMs,
          maxItems: settings.maxItems
        }
      });
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Banner routes (public)
  app.get('/api/banners', async (req, res) => {
    try {
      const banners = await storage.getBanners({ active: true });
      res.json(banners);
    } catch (error) {
      console.error("Error fetching active banners:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });

  // Cart routes
  app.get('/api/cart', async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessionId = req.sessionID;

      const cart = await storage.getOrCreateCart(userId, sessionId);
      const cartWithItems = await storage.getCartWithItems(cart.id);

      res.json(cartWithItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart/items', async (req: any, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = req.user?.claims?.sub;
      const sessionId = req.sessionID;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      const cart = await storage.getOrCreateCart(userId, sessionId);
      const cartItem = await storage.addToCart(cart.id, productId, quantity);

      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put('/api/cart/items/:id', async (req, res) => {
    try {
      const { quantity } = req.body;
      const itemId = req.params.id;

      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const cartItem = await storage.updateCartItem(itemId, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/items/:id', async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Wishlist routes
  app.get('/api/wishlist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wishlist = await storage.getWishlist(userId);
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post('/api/wishlist', isAuthenticated, async (req: any, res) => {
    try {
      const { productId } = req.body;
      const userId = req.user.claims.sub;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      const wishlistItem = await storage.addToWishlist(userId, productId);
      res.json(wishlistItem);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete('/api/wishlist/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = req.params.productId;

      await storage.removeFromWishlist(userId, productId);
      res.json({ message: "Item removed from wishlist" });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }

      console.log("Contact form submission:", { name, email, message });
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Admin API endpoints
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const userEmail = req.user?.claims?.email;
      
      // Check if user is admin
      if (userEmail !== "itsnainskashyap@gmail.com") {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = {
        totalRevenue: 124589,
        totalOrders: 1234,
        activeProducts: 456,
        totalUsers: 2890
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin orders endpoint moved to adminRoutes.ts to avoid conflicts

  app.get('/api/admin/products', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user?.claims?.email;
      
      if (userEmail !== "itsnainskashyap@gmail.com") {
        return res.status(403).json({ message: "Access denied" });
      }

      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Add new product (Admin only)
  // Admin product creation moved to adminRoutes.ts

  // Update product (Admin only)
  // Admin product update moved to adminRoutes.ts

  // Get active coupons for checkout
  app.get('/api/coupons/active', async (req, res) => {
    try {
      const now = new Date();
      const activeCoupons = await db
        .select()
        .from(coupons)
        .where(
          and(
            eq(coupons.isActive, true),
            or(
              isNull(coupons.endDate),
              gte(coupons.endDate, now)
            )
          )
        );
      
      res.json(activeCoupons);
    } catch (error) {
      console.error("Error fetching active coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  // Validate coupon code
  app.post('/api/coupons/validate', async (req, res) => {
    try {
      const { code, total } = req.body;
      const now = new Date();
      
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(
          and(
            eq(coupons.code, code.toUpperCase()),
            eq(coupons.isActive, true),
            or(
              isNull(coupons.endDate),
              gte(coupons.endDate, now)
            )
          )
        );
      
      if (!coupon) {
        return res.status(404).json({ message: "Invalid or expired coupon code" });
      }
      
      if (coupon.minPurchaseAmount && Number(total) < Number(coupon.minPurchaseAmount)) {
        return res.status(400).json({ 
          message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required` 
        });
      }
      
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (Number(total) * Number(coupon.discountValue)) / 100;
        if (coupon.maxDiscountAmount) {
          discount = Math.min(discount, Number(coupon.maxDiscountAmount));
        }
      } else {
        discount = Number(coupon.discountValue);
      }
      
      res.json({
        valid: true,
        coupon,
        discount: discount.toFixed(2)
      });
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ message: "Failed to validate coupon" });
    }
  });

  // Get active banners for frontend
  app.get('/api/banners/active', async (req, res) => {
    try {
      const activeBanners = await db
        .select()
        .from(banners)
        .where(eq(banners.isActive, true))
        .orderBy(asc(banners.position));
      
      res.json(activeBanners);
    } catch (error) {
      console.error("Error fetching banners:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });

  // Delete product (Admin only) - Soft delete by setting isActive to false
  // Admin product delete moved to adminRoutes.ts

  // Admin order status update moved to adminRoutes.ts to avoid conflicts

  // Payment settings for checkout (public endpoint)
  app.get('/api/payment-settings', async (req, res) => {
    try {
      const { paymentSettings } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [settings] = await db
        .select()
        .from(paymentSettings)
        .where(eq(paymentSettings.isActive, true))
        .limit(1);

      res.json(settings || {
        upiId: "",
        qrCodeUrl: "",
        isActive: false
      });
    } catch (error) {
      console.error("Payment settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch payment settings" });
    }
  });

  // Initialize Gemini AI

  // Configure multer for file uploads
  const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG and PNG files are allowed'));
      }
    }
  });

  // AI Recommendations API - using Gemini embeddings for semantic search
  app.get('/api/ai/recommendations/:productId?', async (req, res) => {
    try {
      const products = await storage.getProducts();
      
      if (!products || products.length === 0) {
        return res.json([]);
      }

      // Get user's browsing history from session or use featured products
      let recommendations = products
        .filter(p => p.isFeatured === true)
        .slice(0, 6);

      // If we have a specific product ID, find similar products
      if (req.params.productId) {
        const targetProduct = products.find(p => p.id === req.params.productId);
        if (targetProduct) {
          try {
            const availableProducts = products
              .filter(p => p.id !== targetProduct.id)
              .map(p => `${p.name} - ${p.description}`);
            
            const aiResponse = await geminiService.generateRecommendations(
              targetProduct.name,
              targetProduct.description || '',
              availableProducts
            );
            
            // Parse AI response to get recommended product names
            const recommendedNames = aiResponse.split(',').map(name => name.trim());
            recommendations = products.filter(p => 
              recommendedNames.some(name => 
                p.name.toLowerCase().includes(name.toLowerCase()) || 
                name.toLowerCase().includes(p.name.toLowerCase())
              )
            ).slice(0, 6);
            
            // Fallback to category-based if no AI matches
            if (recommendations.length === 0) {
              recommendations = products
                .filter(p => p.categoryId === targetProduct.categoryId && p.id !== targetProduct.id)
                .slice(0, 6);
            }
              
          } catch (aiError) {
            console.log('AI recommendation fallback triggered');
            // Fallback to category-based recommendations
            recommendations = products
              .filter(p => p.categoryId === targetProduct.categoryId && p.id !== targetProduct.id)
              .slice(0, 6);
          }
        }
      }

      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      // Fallback to featured products
      const products = await storage.getProducts();
      const fallback = products?.filter(p => p.isFeatured === true).slice(0, 6) || [];
      res.json(fallback);
    }
  });

  // Virtual Try-On API - using Gemini image generation
  app.post('/api/ai/tryon', upload.single('userImage'), async (req, res) => {
    try {


      if (!req.file) {
        return res.status(400).json({ error: 'User image is required' });
      }

      const { productId, prompt = 'Overlay product realistically on user' } = req.body;
      
      // Get product details
      const products = await storage.getProducts();
      const product = products?.find(p => p.id === productId);
      if (!product) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Product not found' });
      }

      try {
        // Convert uploaded image to base64
        const imageBuffer = fs.readFileSync(req.file.path);
        const userImageBase64 = imageBuffer.toString('base64');
        
        // Use the stored AI prompt or generate one
        const tryOnPrompt = product.aiTryOnPrompt || geminiService.generateTryOnPrompt(product.name);
        const finalPrompt = prompt || tryOnPrompt;
        
        // Generate try-on image using Gemini image generation
        const generatedImageResult = await geminiService.generateTryOnImage(product.name, userImageBase64, finalPrompt);
        
        // Auto-delete uploaded file for privacy using async method
        await fs.promises.unlink(req.file.path);

        res.json({ 
          success: true,
          message: 'Try-on image generated successfully',
          image: {
            data: generatedImageResult.data,
            mimeType: generatedImageResult.mimeType
          },
          description: `Virtual try-on of ${product.name} generated using AI`
        });

      } catch (aiError) {
        console.error('AI try-on error:', aiError);
        // Clean up uploaded file
        try {
          await fs.promises.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
        res.status(500).json({ error: 'Try-on generation failed. Please try with a clearer photo.' });
      }

    } catch (error) {
      console.error("Error in try-on API:", error);
      // Clean up uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
      res.status(500).json({ error: 'Try-on service unavailable' });
    }
  });

  // AI Background Generation API - for hero section
  app.post('/api/ai/background', isAuthenticated, async (req, res) => {
    try {
      const userEmail = req.user && typeof req.user === 'object' && 'claims' in req.user 
        ? (req.user as any).claims?.email 
        : null;
      
      // Only admin can generate backgrounds
      if (userEmail !== "itsnainskashyap@gmail.com") {
        return res.status(403).json({ message: "Access denied" });
      }



      const { prompt = 'Eco-fashion thrift scene with sustainable clothing, cartoon style, vibrant greens' } = req.body;
      
      try {
        const backgroundPrompt = `Generate a description for a cartoon-style hero background for ReWeara sustainable fashion e-commerce: ${prompt}. Make it vibrant, eco-friendly, and appealing for a thrift store and original sustainable fashion brand. Include details about colors, style, and eco-fashion elements. Size should be optimized for web hero sections (1920x1080).`;
        
        const backgroundDescription = await geminiService.generateContent(backgroundPrompt);

        res.json({ 
          success: true,
          description: backgroundDescription,
          prompt: prompt,
          // In a full implementation, this would return the generated image URL
          imageUrl: null,
          message: 'Background concept generated successfully'
        });

      } catch (aiError) {
        console.error('AI background generation error:', aiError);
        res.status(500).json({ error: 'Background generation failed. Please try a different prompt.' });
      }

    } catch (error) {
      console.error("Error in background generation API:", error);
      res.status(500).json({ error: 'Background generation service unavailable' });
    }
  });

  // ========================
  // TAX MANAGEMENT ROUTES
  // ========================
  
  // Get all tax rates
  app.get('/api/admin/tax-rates', isAuthenticated, async (req, res) => {
    try {
      const rates = await db.select().from(taxRates).orderBy(asc(taxRates.priority));
      res.json(rates);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      res.status(500).json({ message: 'Failed to fetch tax rates' });
    }
  });

  // Create tax rate
  app.post('/api/admin/tax-rates', isAuthenticated, async (req, res) => {
    try {
      const validated = insertTaxRateSchema.parse(req.body);
      const [rate] = await db.insert(taxRates).values(validated).returning();
      res.json(rate);
    } catch (error) {
      console.error('Error creating tax rate:', error);
      res.status(500).json({ message: 'Failed to create tax rate' });
    }
  });

  // Update tax rate
  app.put('/api/admin/tax-rates/:id', isAuthenticated, async (req, res) => {
    try {
      const [rate] = await db
        .update(taxRates)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(taxRates.id, req.params.id))
        .returning();
      res.json(rate);
    } catch (error) {
      console.error('Error updating tax rate:', error);
      res.status(500).json({ message: 'Failed to update tax rate' });
    }
  });

  // Delete tax rate
  app.delete('/api/admin/tax-rates/:id', isAuthenticated, async (req, res) => {
    try {
      await db.delete(taxRates).where(eq(taxRates.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting tax rate:', error);
      res.status(500).json({ message: 'Failed to delete tax rate' });
    }
  });

  // Calculate tax for checkout
  app.post('/api/calculate-tax', async (req, res) => {
    try {
      const { subtotal, country, state, city, zipCode } = req.body;
      
      // Get applicable tax rates
      const applicableRates = await db
        .select()
        .from(taxRates)
        .where(
          and(
            eq(taxRates.isActive, true),
            or(
              eq(taxRates.country, country),
              isNull(taxRates.country)
            )
          )
        )
        .orderBy(desc(taxRates.priority));

      let totalTaxRate = 0;
      for (const rate of applicableRates) {
        if (!rate.state || rate.state === state) {
          if (!rate.city || rate.city === city) {
            if (!rate.zipCode || rate.zipCode === zipCode) {
              totalTaxRate += parseFloat(rate.rate);
            }
          }
        }
      }

      const taxAmount = (subtotal * totalTaxRate) / 100;
      res.json({ 
        taxRate: totalTaxRate,
        taxAmount,
        total: subtotal + taxAmount 
      });
    } catch (error) {
      console.error('Error calculating tax:', error);
      res.status(500).json({ message: 'Failed to calculate tax' });
    }
  });

  // ========================
  // BRAND MANAGEMENT ROUTES
  // ========================
  
  // Admin: Create brand
  app.post('/api/admin/brands', isAuthenticated, async (req, res) => {
    try {
      const validated = insertBrandSchema.parse(req.body);
      const [brand] = await db.insert(brands).values(validated).returning();
      res.json(brand);
    } catch (error) {
      console.error('Error creating brand:', error);
      res.status(500).json({ message: 'Failed to create brand' });
    }
  });

  // Admin: Update brand
  app.put('/api/admin/brands/:id', isAuthenticated, async (req, res) => {
    try {
      const [brand] = await db
        .update(brands)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(brands.id, req.params.id))
        .returning();
      res.json(brand);
    } catch (error) {
      console.error('Error updating brand:', error);
      res.status(500).json({ message: 'Failed to update brand' });
    }
  });

  // Admin: Delete brand
  app.delete('/api/admin/brands/:id', isAuthenticated, async (req, res) => {
    try {
      // First, set brandId to null for all products using this brand
      await db
        .update(products)
        .set({ brandId: null })
        .where(eq(products.brandId, req.params.id));
      
      // Then delete the brand
      await db.delete(brands).where(eq(brands.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting brand:', error);
      res.status(500).json({ message: 'Failed to delete brand' });
    }
  });

  // Admin: Toggle featured brand
  app.patch('/api/admin/brands/:id/featured', isAuthenticated, async (req, res) => {
    try {
      const { isFeatured } = req.body;
      const [brand] = await db
        .update(brands)
        .set({ isFeatured, updatedAt: new Date() })
        .where(eq(brands.id, req.params.id))
        .returning();
      res.json(brand);
    } catch (error) {
      console.error('Error toggling featured brand:', error);
      res.status(500).json({ message: 'Failed to update brand' });
    }
  });

  // ========================
  // ENHANCED PRODUCT MANAGEMENT
  // ========================
  // Note: Admin product CRUD is handled in adminRoutes.ts to avoid conflicts

  // Note: Admin product featured toggle moved to adminRoutes.ts

  // Get product with media
  app.get('/api/products/:id/media', async (req, res) => {
    try {
      const media = await db
        .select()
        .from(productMedia)
        .where(eq(productMedia.productId, req.params.id))
        .orderBy(asc(productMedia.sortOrder));
      res.json(media);
    } catch (error) {
      console.error('Error fetching product media:', error);
      res.status(500).json({ message: 'Failed to fetch product media' });
    }
  });

  // ========================
  // ORDER WORKFLOW MANAGEMENT
  // ========================
  
  // Admin: Update order status with tracking
  app.put('/api/admin/orders/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status, trackingNumber, carrier, estimatedDelivery, message } = req.body;
      
      // Update order
      const [order] = await db
        .update(orders)
        .set({ 
          status,
          trackingNumber,
          estimatedDelivery,
          updatedAt: new Date() 
        })
        .where(eq(orders.id, req.params.id))
        .returning();
      
      // Add tracking entry
      await db.insert(orderTracking).values({
        orderId: req.params.id,
        status,
        message,
        trackingNumber,
        carrier,
        estimatedDelivery
      });
      
      // Send status update email
      try {
        const orderWithUser = await db
          .select({
            order: orders,
            user: users
          })
          .from(orders)
          .leftJoin(users, eq(orders.userId, users.id))
          .where(eq(orders.id, req.params.id));
        
        if (orderWithUser.length > 0) {
          const { order: orderData, user } = orderWithUser[0];
          const userEmail = user?.email || orderData.guestEmail;
          
          if (userEmail) {
            const emailData = getStatusUpdateEmail(orderData, userEmail, status);
            await sendEmail(emailData);
          }
        }
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
        // Don't fail the status update if email fails
      }
      
      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  // Create order (POST /api/orders)
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      // Validate request body using Zod schema
      const validatedOrderData = insertOrderSchema.parse({
        ...req.body,
        userId,
        status: 'pending',
        paymentStatus: 'pending',
      });

      // Get user's cart and items before creating order (handle both authenticated and guest users)
      const sessionId = req.sessionID;
      const cart = await storage.getOrCreateCart(userId, sessionId);
      const userCart = await storage.getCartWithItems(cart.id);
      
      if (!userCart || !userCart.items || userCart.items.length === 0) {
        return res.status(400).json({ 
          message: 'Cannot create order with empty cart' 
        });
      }

      // Prepare order items from cart items
      const orderItemsData = userCart.items.map(cartItem => ({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
      }));

      // Use the new transactional method
      const orderWithItems = await storage.createOrderWithItems(validatedOrderData, orderItemsData);

      // Send order confirmation email
      try {
        const user = req.user?.claims;
        const userEmail = user?.email || validatedOrderData.guestEmail;
        
        if (userEmail) {
          const emailData = getOrderConfirmationEmail(orderWithItems, userEmail);
          await sendEmail(emailData);
        }
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError);
        // Don't fail the order creation if email fails
      }

      // Return complete order with items for immediate display
      res.status(201).json(orderWithItems);
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Handle insufficient stock errors with proper status code
      if (error.message && error.message.includes('Insufficient stock')) {
        return res.status(409).json({ 
          message: error.message 
        });
      }
      
      // Handle validation errors
      if (error.message && error.message.includes('not found')) {
        return res.status(400).json({ 
          message: error.message 
        });
      }
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid order data',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  // Payment webhook endpoint (POST /api/payments/webhook)
  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const { orderId, paymentStatus, trackingNumber, trackingMessage, carrier } = req.body;

      if (!orderId || !paymentStatus) {
        return res.status(400).json({ 
          message: 'orderId and paymentStatus are required' 
        });
      }

      // Validate payment status
      const validPaymentStatuses = ['pending', 'verified', 'paid', 'failed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ 
          message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}` 
        });
      }

      // Prepare tracking data if provided
      let trackingData = undefined;
      if (trackingNumber || trackingMessage || carrier) {
        trackingData = {
          status: paymentStatus === 'verified' ? 'confirmed' : paymentStatus,
          message: trackingMessage || `Payment status updated to ${paymentStatus}`,
          trackingNumber,
          carrier
        };
      }

      // Update payment status with tracking (transactional)
      const updatedOrder = await storage.updatePaymentStatusWithTracking(orderId, paymentStatus, trackingData);

      if (!updatedOrder) {
        return res.status(404).json({ 
          message: 'Order not found' 
        });
      }

      // Send status update email
      try {
        const orderWithUser = await db
          .select({
            order: orders,
            user: users
          })
          .from(orders)
          .leftJoin(users, eq(orders.userId, users.id))
          .where(eq(orders.id, orderId));
        
        if (orderWithUser.length > 0) {
          const { order: orderData, user } = orderWithUser[0];
          const userEmail = user?.email || orderData.guestEmail;
          
          if (userEmail && paymentStatus === 'verified') {
            const emailData = getStatusUpdateEmail(orderData, userEmail, 'confirmed');
            await sendEmail(emailData);
          }
        }
      } catch (emailError) {
        console.error('Error sending payment status update email:', emailError);
        // Don't fail the webhook if email fails
      }

      res.json({ 
        message: 'Payment status updated successfully', 
        order: updatedOrder 
      });
    } catch (error: any) {
      console.error('Error processing payment webhook:', error);
      
      if (error.message && error.message.includes('not found')) {
        return res.status(404).json({ 
          message: error.message 
        });
      }
      
      res.status(500).json({ message: 'Failed to process payment webhook' });
    }
  });

  // Get user orders (GET /api/orders)
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // Get specific order with items (GET /api/orders/:id)
  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const order = await storage.getOrderById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check if order belongs to the user (security check)
      if (order.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  });

  // Get order tracking history
  app.get('/api/orders/:id/tracking', isAuthenticated, async (req, res) => {
    try {
      const tracking = await db
        .select()
        .from(orderTracking)
        .where(eq(orderTracking.orderId, req.params.id))
        .orderBy(desc(orderTracking.createdAt));
      res.json(tracking);
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      res.status(500).json({ message: 'Failed to fetch order tracking' });
    }
  });

  // Download order slip PDF (GET /api/orders/:id/pdf)
  app.get('/api/orders/:id/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const order = await storage.getOrderById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check if order belongs to the user (security check)
      if (order.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get user data for the PDF
      const user = order.userId ? await storage.getUser(order.userId) : undefined;
      const orderWithUser = { ...order, user };

      // Generate actual PDF using PDFService
      const { PDFService } = await import('./pdf-service');
      const pdfBuffer = await PDFService.generateOrderPDF(orderWithUser, false);

      // Set headers for PDF download
      const orderId = order.id.slice(0, 8).toUpperCase();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ReWeara-Order-${orderId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating order PDF:', error);
      res.status(500).json({ message: 'Failed to generate order PDF' });
    }
  });

  // Admin orders endpoint consolidated in adminRoutes.ts

  // ========================
  // PRODUCT SHARING
  // ========================
  
  // Generate shareable link
  app.get('/api/products/:id/share', async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const baseUrl = `https://${req.get('host')}`;
      const shareUrl = `${baseUrl}/product/${product.id}`;
      const shareText = `Check out ${product.name} on ReWeara - Sustainable Fashion!`;
      
      res.json({
        url: shareUrl,
        text: shareText,
        socials: {
          whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`,
        }
      });
    } catch (error) {
      console.error('Error generating share links:', error);
      res.status(500).json({ message: 'Failed to generate share links' });
    }
  });

  // AI Chat Assistant API - for customer support
  app.post('/api/ai/chat', async (req, res) => {
    try {


      const { message, context = '' } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      
      const systemPrompt = `You are ReWeara's AI shopping assistant. ReWeara is a sustainable fashion e-commerce platform that sells both curated thrift finds and original eco-friendly designs. 

Key information:
- We focus on sustainability and reducing fashion waste
- We offer both pre-loved thrift items and new sustainable originals
- Free shipping on orders above ₹500
- 1-2 business days express shipping available
- Cash on delivery available for orders under ₹5000
- We ship across India
- 30-day return policy for original items, 15-day for thrift items

Please help customers with:
- Product recommendations based on their style preferences
- Information about sustainability and eco-fashion
- Shipping and return policies
- Size guidance
- Care instructions for thrift and sustainable items

Keep responses helpful, friendly, and focused on sustainable fashion. If asked about specific products, recommend checking our shop section.`;

      try {
        const assistantReply = await geminiService.generateChatResponse(message, context);

        res.json({ 
          success: true,
          reply: assistantReply,
          timestamp: new Date().toISOString()
        });

      } catch (aiError) {
        console.error('AI chat error:', aiError);
        res.status(500).json({ 
          error: 'AI assistant temporarily unavailable',
          fallback: 'Thank you for your message! For immediate assistance, please check our FAQs section or contact our support team.'
        });
      }

    } catch (error) {
      console.error("Error in chat API:", error);
      res.status(500).json({ error: 'Chat service unavailable' });
    }
  });

  // Promotional popup routes
  app.get('/api/promotional-popups/active', async (req, res) => {
    try {
      const popups = await storage.getPromotionalPopups({ active: true });
      res.json(popups);
    } catch (error) {
      console.error('Error fetching active promotional popups:', error);
      res.status(500).json({ message: 'Failed to fetch promotional popups' });
    }
  });

  app.get('/api/promotional-popups', isAuthenticated, async (req, res) => {
    try {
      const popups = await storage.getPromotionalPopups();
      res.json(popups);
    } catch (error) {
      console.error('Error fetching promotional popups:', error);
      res.status(500).json({ message: 'Failed to fetch promotional popups' });
    }
  });

  app.get('/api/promotional-popups/:id', isAuthenticated, async (req, res) => {
    try {
      const popup = await storage.getPromotionalPopupById(req.params.id);
      if (!popup) {
        return res.status(404).json({ message: 'Promotional popup not found' });
      }
      res.json(popup);
    } catch (error) {
      console.error('Error fetching promotional popup:', error);
      res.status(500).json({ message: 'Failed to fetch promotional popup' });
    }
  });

  app.post('/api/promotional-popups', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPromotionalPopupSchema.parse(req.body);
      const popup = await storage.createPromotionalPopup(validatedData);
      res.status(201).json(popup);
    } catch (error: any) {
      console.error('Error creating promotional popup:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create promotional popup' });
    }
  });

  app.put('/api/promotional-popups/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPromotionalPopupSchema.partial().parse(req.body);
      const popup = await storage.updatePromotionalPopup(req.params.id, validatedData);
      if (!popup) {
        return res.status(404).json({ message: 'Promotional popup not found' });
      }
      res.json(popup);
    } catch (error: any) {
      console.error('Error updating promotional popup:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update promotional popup' });
    }
  });

  app.delete('/api/promotional-popups/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deletePromotionalPopup(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting promotional popup:', error);
      res.status(500).json({ message: 'Failed to delete promotional popup' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
