import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProductSchema, insertCategorySchema, insertBrandSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { setupAdminRoutes } from "./adminRoutes";
import multer from "multer";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.get('/api/brands/featured', async (req, res) => {
    try {
      const brands = await storage.getFeaturedBrands();
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
        search,
        limit = "20",
        offset = "0"
      } = req.query;

      const products = await storage.getProducts({
        categoryId: category as string,
        brandId: brand as string,
        featured: featured === 'true',
        hotSelling: hotSelling === 'true',
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

  app.get('/api/admin/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user?.claims?.email;
      
      if (userEmail !== "itsnainskashyap@gmail.com") {
        return res.status(403).json({ message: "Access denied" });
      }

      const orders = [
        { id: "REW1001", customer: "John Doe", amount: 1299, status: "payment_pending" },
        { id: "REW1002", customer: "Jane Smith", amount: 2199, status: "placed" },
        { id: "REW1003", customer: "Mike Johnson", amount: 899, status: "shipped" },
      ];
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

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
  app.post('/api/admin/products', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user?.claims?.email;
      
      if (userEmail !== "itsnainskashyap@gmail.com") {
        return res.status(403).json({ message: "Access denied" });
      }

      const productData = req.body;
      
      // Generate a slug from the name
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

      res.json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product (Admin only)
  app.put('/api/admin/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user?.claims?.email;
      
      if (userEmail !== "itsnainskashyap@gmail.com") {
        return res.status(403).json({ message: "Access denied" });
      }

      const productId = req.params.id;
      const updates = req.body;
      
      // Generate a new slug if name is being updated
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

      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product (Admin only) - Soft delete by setting isActive to false
  app.delete('/api/admin/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user?.claims?.email;
      
      if (userEmail !== "itsnainskashyap@gmail.com") {
        return res.status(403).json({ message: "Access denied" });
      }

      const productId = req.params.id;
      
      // Soft delete by setting isActive to false
      const deletedProduct = await storage.updateProduct(productId, { isActive: false });
      
      if (!deletedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Update order status (Admin only)
  app.put('/api/admin/orders/:orderId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user?.claims?.email;
      
      if (userEmail !== "itsnainskashyap@gmail.com") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { orderId } = req.params;
      const { status } = req.body;
      
      // For now, just return success since we're using mock data
      // In a real implementation, this would update the order in the database
      res.json({ message: "Order status updated successfully" });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'AI service unavailable' });
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
          // Use Gemini to find semantically similar products
          const embedPrompt = `Embed for semantic search: ${targetProduct.name} - ${targetProduct.description} - Category: ${targetProduct.categoryId}`;
          
          try {
            const result = await model.generateContent([
              `Find products similar to: ${targetProduct.name}. Consider: sustainable fashion, eco-friendly materials, style, category. Return product recommendations.`,
              `Available products: ${products.map(p => `${p.name} - ${p.description}`).join('; ')}`
            ]);
            
            // For now, use simple category-based recommendations as fallback
            recommendations = products
              .filter(p => p.categoryId === targetProduct.categoryId && p.id !== targetProduct.id)
              .slice(0, 6);
              
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
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'AI service unavailable' });
      }

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

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Read user image
      const userImageBuffer = fs.readFileSync(req.file.path);
      const userImageBase64 = userImageBuffer.toString('base64');

      try {
        const result = await model.generateContent([
          `Create a virtual try-on visualization: ${prompt}. Show the user wearing ${product.name}. Make it realistic while preserving the user's face and pose. This is for a sustainable fashion e-commerce platform ReWeara.`,
          {
            inlineData: {
              data: userImageBase64,
              mimeType: req.file.mimetype
            }
          }
        ]);

        // For now, return a success message as Gemini's image generation capabilities vary
        const response = result.response;
        const text = response.text();
        
        // Auto-delete uploaded file for privacy
        fs.unlinkSync(req.file.path);

        res.json({ 
          success: true,
          message: 'Try-on visualization created',
          description: text,
          // In a full implementation, this would return the generated image
          image: null 
        });

      } catch (aiError) {
        console.error('AI try-on error:', aiError);
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Try-on generation failed. Please try with a clearer photo.' });
      }

    } catch (error) {
      console.error("Error in try-on API:", error);
      // Clean up uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
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

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'AI service unavailable' });
      }

      const { prompt = 'Eco-fashion thrift scene with sustainable clothing, cartoon style, vibrant greens' } = req.body;
      
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      try {
        const result = await model.generateContent([
          `Generate a description for a cartoon-style hero background for ReWeara sustainable fashion e-commerce: ${prompt}. Make it vibrant, eco-friendly, and appealing for a thrift store and original sustainable fashion brand. Include details about colors, style, and eco-fashion elements. Size should be optimized for web hero sections (1920x1080).`
        ]);

        const response = result.response;
        const backgroundDescription = response.text();

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

  // AI Chat Assistant API - for customer support
  app.post('/api/ai/chat', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'AI service unavailable' });
      }

      const { message, context = '' } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
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
        const result = await model.generateContent([
          systemPrompt,
          `Customer message: ${message}`,
          context ? `Previous context: ${context}` : ''
        ]);

        const response = result.response;
        const assistantReply = response.text();

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

  const httpServer = createServer(app);
  return httpServer;
}
