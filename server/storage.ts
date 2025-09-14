import {
  users,
  categories,
  brands,
  products,
  carts,
  cartItems,
  wishlists,
  orders,
  orderItems,
  banners,
  promotionalPopups,
  adminLogs,
  orderTracking,
  storeSettings,
  paymentSettings,
  analyticsSettings,
  integrationSettings,
  type User,
  type UpsertUser,
  type Category,
  type Brand,
  type Product,
  type Cart,
  type CartItem,
  type Wishlist,
  type Order,
  type OrderItem,
  type PromotionalPopup,
  type AdminLog,
  type InsertCategory,
  type UpdateCategory,
  type InsertBrand,
  type InsertProduct,
  type InsertCart,
  type InsertCartItem,
  type InsertWishlist,
  type InsertOrder,
  type InsertOrderItem,
  type InsertBanner,
  type InsertPromotionalPopup,
  type InsertAdminLog,
  type InsertOrderTracking,
  type FeaturedProductsPanelSettings,
  featuredProductsPanelSettingsSchema,
  type PaymentSettings,
  type InsertPaymentSettings,
  type AnalyticsSettings,
  type InsertAnalyticsSettings,
  type IntegrationSettings,
  type InsertIntegrationSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, like, inArray, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;
  setCategoryVisibility(id: string, isActive: boolean): Promise<Category | undefined>;
  listCategoriesAdmin(options?: { search?: string; limit?: number; offset?: number; }): Promise<{ categories: Category[]; total: number; }>;
  getCategoryById(id: string): Promise<Category | undefined>;
  checkCategoryProductDependency(id: string): Promise<number>;
  
  // Brand operations
  getBrands(options?: { categoryId?: string; }): Promise<Brand[]>;
  getFeaturedBrands(options?: { categoryId?: string; }): Promise<Brand[]>;
  getBrandBySlug(slug: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  
  // Product operations
  getProducts(options?: {
    categoryId?: string;
    brandId?: string;
    limit?: number;
    offset?: number;
    featured?: boolean;
    hotSelling?: boolean;
    isThrift?: boolean;
    isOriginal?: boolean;
    search?: string;
  }): Promise<any[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  incrementProductViewCount(id: string): Promise<void>;
  
  // Cart operations
  getOrCreateCart(userId?: string, sessionId?: string): Promise<Cart>;
  getCartWithItems(cartId: string): Promise<(Cart & { items: (CartItem & { product: Product })[] }) | undefined>;
  addToCart(cartId: string, productId: string, quantity?: number): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  
  // Wishlist operations
  getWishlist(userId: string): Promise<(Wishlist & { product: Product })[]>;
  addToWishlist(userId: string, productId: string): Promise<Wishlist>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderWithItems(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order & { items: (OrderItem & { product: Product })[] }>;
  getOrders(userId?: string): Promise<Order[]>;
  getAllOrders(options?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<(Order & { user?: User })[]>;
  getOrderById(id: string): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updatePaymentStatusWithTracking(orderId: string, paymentStatus: string, trackingData?: InsertOrderTracking): Promise<Order | undefined>;
  updateOrderWithAudit(orderId: string, updates: Partial<InsertOrder>, adminId: string, notes?: string): Promise<Order | undefined>;
  
  // Banner operations
  getBanners(options?: { active?: boolean }): Promise<Banner[]>;
  getBannerById(id: string): Promise<Banner | undefined>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: string, updates: Partial<InsertBanner>): Promise<Banner | undefined>;
  deleteBanner(id: string): Promise<void>;
  
  // Promotional popup operations
  getPromotionalPopups(options?: { active?: boolean }): Promise<PromotionalPopup[]>;
  getPromotionalPopupById(id: string): Promise<PromotionalPopup | undefined>;
  createPromotionalPopup(popup: InsertPromotionalPopup): Promise<PromotionalPopup>;
  updatePromotionalPopup(id: string, updates: Partial<InsertPromotionalPopup>): Promise<PromotionalPopup | undefined>;
  deletePromotionalPopup(id: string): Promise<void>;
  
  // Featured products panel operations
  getFeaturedProductsPanelSettings(): Promise<FeaturedProductsPanelSettings>;
  saveFeaturedProductsPanelSettings(settings: FeaturedProductsPanelSettings): Promise<FeaturedProductsPanelSettings>;
  getFeaturedProductsOrdered(): Promise<Product[]>;
  
  // API Settings operations
  getPaymentSettings(): Promise<PaymentSettings | undefined>;
  upsertPaymentSettings(settings: Partial<InsertPaymentSettings>): Promise<PaymentSettings>;
  getAnalyticsSettings(): Promise<AnalyticsSettings | undefined>;
  upsertAnalyticsSettings(settings: Partial<InsertAnalyticsSettings>): Promise<AnalyticsSettings>;
  getIntegrationSettings(): Promise<IntegrationSettings | undefined>;
  upsertIntegrationSettings(settings: Partial<InsertIntegrationSettings>): Promise<IntegrationSettings>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser & { id?: string }): Promise<User> {
    if (userData.id) {
      // Try to update existing user
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userData.id));
      
      if (existingUser) {
        const [updatedUser] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
        return updatedUser;
      }
    }
    
    // Create new user
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder, categories.name);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, slug), eq(categories.isActive, true)));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async setCategoryVisibility(id: string, isActive: boolean): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async listCategoriesAdmin(options: { 
    search?: string; 
    limit?: number; 
    offset?: number; 
  } = {}): Promise<{ categories: Category[]; total: number; }> {
    const conditions = [];

    if (options.search) {
      conditions.push(
        like(categories.name, `%${options.search}%`)
      );
    }

    // Get total count
    let totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(categories);
    
    if (conditions.length > 0) {
      totalQuery = totalQuery.where(and(...conditions));
    }

    const [{ count }] = await totalQuery;

    // Get categories with product count using proper Drizzle left join
    let query = db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        imageUrl: categories.imageUrl,
        isActive: categories.isActive,
        sortOrder: categories.sortOrder,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productCount: sql<number>`count(${products.id})::int`
      })
      .from(categories)
      .leftJoin(
        products, 
        and(
          eq(products.categoryId, categories.id),
          eq(products.isActive, true)
        )
      )
      .groupBy(
        categories.id,
        categories.name,
        categories.slug,
        categories.description,
        categories.imageUrl,
        categories.isActive,
        categories.sortOrder,
        categories.createdAt,
        categories.updatedAt
      )
      .orderBy(categories.sortOrder, categories.name);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    const categoryResults = await query;

    return {
      categories: categoryResults,
      total: count
    };
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async checkCategoryProductDependency(id: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.categoryId, id), eq(products.isActive, true)));
    return result?.count || 0;
  }

  // Brand operations
  async getBrands(options: { categoryId?: string; } = {}): Promise<Brand[]> {
    if (options.categoryId) {
      // Get brands that have active products in the specified category
      return await db
        .select({
          id: brands.id,
          name: brands.name,
          slug: brands.slug,
          description: brands.description,
          logoUrl: brands.logoUrl,
          isActive: brands.isActive,
          isFeatured: brands.isFeatured,
          sortOrder: brands.sortOrder,
          createdAt: brands.createdAt,
          updatedAt: brands.updatedAt,
        })
        .from(brands)
        .innerJoin(products, eq(brands.id, products.brandId))
        .where(
          and(
            eq(brands.isActive, true),
            eq(products.isActive, true),
            eq(products.categoryId, options.categoryId)
          )
        )
        .groupBy(brands.id, brands.name, brands.slug, brands.description, brands.logoUrl, brands.isActive, brands.isFeatured, brands.sortOrder, brands.createdAt, brands.updatedAt)
        .orderBy(brands.sortOrder, brands.name);
    }

    return await db
      .select()
      .from(brands)
      .where(eq(brands.isActive, true))
      .orderBy(brands.sortOrder, brands.name);
  }

  async getFeaturedBrands(options: { categoryId?: string; } = {}): Promise<Brand[]> {
    if (options.categoryId) {
      // Get featured brands that have active products in the specified category
      return await db
        .select({
          id: brands.id,
          name: brands.name,
          slug: brands.slug,
          description: brands.description,
          logoUrl: brands.logoUrl,
          isActive: brands.isActive,
          isFeatured: brands.isFeatured,
          sortOrder: brands.sortOrder,
          createdAt: brands.createdAt,
          updatedAt: brands.updatedAt,
        })
        .from(brands)
        .innerJoin(products, eq(brands.id, products.brandId))
        .where(
          and(
            eq(brands.isActive, true),
            eq(brands.isFeatured, true),
            eq(products.isActive, true),
            eq(products.categoryId, options.categoryId)
          )
        )
        .groupBy(brands.id, brands.name, brands.slug, brands.description, brands.logoUrl, brands.isActive, brands.isFeatured, brands.sortOrder, brands.createdAt, brands.updatedAt)
        .orderBy(brands.sortOrder, brands.name);
    }

    return await db
      .select()
      .from(brands)
      .where(and(eq(brands.isActive, true), eq(brands.isFeatured, true)))
      .orderBy(brands.sortOrder, brands.name);
  }

  async getBrandBySlug(slug: string): Promise<Brand | undefined> {
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.slug, slug), eq(brands.isActive, true)));
    return brand;
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db.insert(brands).values(brand).returning();
    return newBrand;
  }

  // Product operations
  async getProducts(options: {
    categoryId?: string;
    brandId?: string;
    limit?: number;
    offset?: number;
    featured?: boolean;
    hotSelling?: boolean;
    isThrift?: boolean;
    isOriginal?: boolean;
    search?: string;
  } = {}): Promise<any[]> {
    const conditions = [eq(products.isActive, true)];

    if (options.categoryId) {
      conditions.push(eq(products.categoryId, options.categoryId));
    }

    if (options.brandId) {
      conditions.push(eq(products.brandId, options.brandId));
    }

    if (options.featured) {
      conditions.push(eq(products.isFeatured, true));
    }

    if (options.hotSelling) {
      conditions.push(eq(products.isHotSelling, true));
    }

    if (options.isThrift) {
      conditions.push(eq(products.isThrift, true));
    }

    if (options.isOriginal) {
      conditions.push(eq(products.isOriginal, true));
    }

    if (options.search) {
      conditions.push(
        sql`${products.name} ILIKE ${`%${options.search}%`} OR ${products.description} ILIKE ${`%${options.search}%`}`
      );
    }

    let query = db
      .select({
        ...products,
        brandName: brands.name,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(products.createdAt));

    if (options.limit) {
      query = query.limit(options.limit) as any;
    }

    if (options.offset) {
      query = query.offset(options.offset) as any;
    }

    return await query;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.isActive, true)));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isActive, true)));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Handle timestamp coercion for discountExpiry
    const productData = {
      ...product,
      discountExpiry: product.discountExpiry ? new Date(product.discountExpiry as any) : null,
    };
    
    const [newProduct] = await db.insert(products).values(productData).returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    // Handle timestamp coercion for discountExpiry
    const updateData = {
      ...updates,
      discountExpiry: updates.discountExpiry ? new Date(updates.discountExpiry as any) : updates.discountExpiry,
      updatedAt: new Date()
    };
    
    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async incrementProductViewCount(id: string): Promise<void> {
    await db
      .update(products)
      .set({ viewCount: sql`${products.viewCount} + 1` })
      .where(eq(products.id, id));
  }

  // Cart operations
  async getOrCreateCart(userId?: string, sessionId?: string): Promise<Cart> {
    let whereCondition;
    
    if (userId) {
      whereCondition = eq(carts.userId, userId);
    } else if (sessionId) {
      whereCondition = eq(carts.sessionId, sessionId);
    } else {
      throw new Error("Either userId or sessionId must be provided");
    }

    const [existingCart] = await db.select().from(carts).where(whereCondition);

    if (existingCart) {
      return existingCart;
    }

    const [newCart] = await db
      .insert(carts)
      .values({ userId, sessionId })
      .returning();
    
    return newCart;
  }

  async getCartWithItems(cartId: string): Promise<(Cart & { items: (CartItem & { product: Product })[] }) | undefined> {
    const [cart] = await db.select().from(carts).where(eq(carts.id, cartId));
    
    if (!cart) {
      return undefined;
    }

    const items = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cartId));

    return { ...cart, items };
  }

  async addToCart(cartId: string, productId: string, quantity: number = 1): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));

    if (existingItem) {
      // Update existing item quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ 
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const [newItem] = await db
        .insert(cartItems)
        .values({ cartId, productId, quantity })
        .returning();
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    if (quantity <= 0) {
      await this.removeFromCart(id);
      return undefined;
    }

    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    
    return updatedItem;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(cartId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  // Wishlist operations
  async getWishlist(userId: string): Promise<(Wishlist & { product: Product })[]> {
    return await db
      .select({
        id: wishlists.id,
        userId: wishlists.userId,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        product: products,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));
  }

  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    // Check if already in wishlist
    const [existing] = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));

    if (existing) {
      return existing;
    }

    const [newWishlistItem] = await db
      .insert(wishlists)
      .values({ userId, productId })
      .returning();
    
    return newWishlistItem;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    if (!userId) {
      return await db.select().from(orders).orderBy(desc(orders.createdAt));
    }

    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(options: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<(Order & { user?: User })[]> {
    const conditions = [];
    
    if (options.status) {
      conditions.push(eq(orders.status, options.status));
    }
    
    if (options.search) {
      conditions.push(
        or(
          like(orders.id, `%${options.search}%`),
          like(orders.guestEmail, `%${options.search}%`)
        )
      );
    }

    let query = db
      .select({
        order: orders,
        user: users
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(orders.createdAt)) as any;

    if (options.limit) {
      query = query.limit(options.limit) as any;
    }

    if (options.offset) {
      query = query.offset(options.offset) as any;
    }

    const results = await query;
    
    return results.map(({ order, user }: { order: any; user: any }) => ({
      ...order,
      user: user || undefined
    }));
  }

  async getOrderById(id: string): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) {
      return undefined;
    }

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        createdAt: orderItems.createdAt,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return { ...order, items };
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder;
  }

  async createOrderWithItems(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order & { items: (OrderItem & { product: Product })[] }> {
    return await db.transaction(async (tx) => {
      // First, validate and lock stock for all products
      const productIds = items.map(item => item.productId);
      const productsForUpdate = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds))
        .for("update"); // SELECT FOR UPDATE lock

      // Verify stock availability and calculate total
      let calculatedSubtotal = 0;
      const stockUpdates: { id: string; newStock: number }[] = [];

      for (const item of items) {
        const product = productsForUpdate.find(p => p.id === item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (!product.isActive) {
          throw new Error(`Product ${product.name} is not available`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        // Calculate pricing (use current product price, not passed price for security)
        const itemPrice = parseFloat(product.price.toString());
        calculatedSubtotal += itemPrice * item.quantity;
        
        // Prepare stock update
        stockUpdates.push({
          id: product.id,
          newStock: product.stock - item.quantity
        });
      }

      // Recompute order totals to ensure accuracy
      const recomputedOrder = {
        ...orderData,
        subtotal: calculatedSubtotal.toString(),
        totalAmount: (calculatedSubtotal + 
          parseFloat((orderData.taxAmount || "0").toString()) + 
          parseFloat((orderData.shippingAmount || "0").toString()) - 
          parseFloat((orderData.discountAmount || "0").toString())).toString()
      };

      // Create the order
      const [newOrder] = await tx
        .insert(orders)
        .values(recomputedOrder)
        .returning();

      // Create order items with correct pricing
      const orderItemsToInsert = items.map(item => {
        const product = productsForUpdate.find(p => p.id === item.productId)!;
        return {
          ...item,
          orderId: newOrder.id,
          price: product.price.toString() // Use current product price
        };
      });

      const newOrderItems = await tx
        .insert(orderItems)
        .values(orderItemsToInsert)
        .returning();

      // Update product stock
      for (const stockUpdate of stockUpdates) {
        await tx
          .update(products)
          .set({ stock: stockUpdate.newStock })
          .where(eq(products.id, stockUpdate.id));
      }

      // Clear the user's cart if userId is provided
      if (orderData.userId) {
        const [userCart] = await tx
          .select()
          .from(carts)
          .where(eq(carts.userId, orderData.userId));
        
        if (userCart) {
          await tx.delete(cartItems).where(eq(cartItems.cartId, userCart.id));
        }
      }

      // Fetch the complete order with items and product details
      const completeOrderItems = await tx
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          createdAt: orderItems.createdAt,
          product: products,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, newOrder.id));

      return { ...newOrder, items: completeOrderItems };
    });
  }

  async updatePaymentStatusWithTracking(orderId: string, paymentStatus: string, trackingData?: InsertOrderTracking): Promise<Order | undefined> {
    return await db.transaction(async (tx) => {
      // Update payment status
      const [updatedOrder] = await tx
        .update(orders)
        .set({ 
          paymentStatus, 
          paymentVerifiedAt: paymentStatus === 'verified' ? new Date() : undefined,
          status: paymentStatus === 'verified' ? 'confirmed' : undefined,
          updatedAt: new Date() 
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Add tracking information if provided
      if (trackingData) {
        await tx
          .insert(orderTracking)
          .values({ ...trackingData, orderId });
      }

      return updatedOrder;
    });
  }

  async updateOrderWithAudit(orderId: string, updates: Partial<InsertOrder>, adminId: string, notes?: string): Promise<Order | undefined> {
    return await db.transaction(async (tx) => {
      // Get the current order state
      const [currentOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!currentOrder) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Update the order
      const [updatedOrder] = await tx
        .update(orders)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();

      // Create audit log entry
      const changes = {
        before: currentOrder,
        after: updatedOrder,
        fields_changed: Object.keys(updates)
      };

      await tx
        .insert(adminLogs)
        .values({
          orderId,
          actorId: adminId,
          action: 'order_update',
          changes,
          notes: notes || `Admin updated order fields: ${Object.keys(updates).join(', ')}`
        });

      return updatedOrder;
    });
  }

  // Promotional popup operations
  async getPromotionalPopups(options?: { active?: boolean }): Promise<PromotionalPopup[]> {
    if (options?.active) {
      const now = new Date();
      return await db
        .select()
        .from(promotionalPopups)
        .where(
          and(
            eq(promotionalPopups.isActive, true),
            or(
              sql`${promotionalPopups.startDate} IS NULL`,
              sql`${promotionalPopups.startDate} <= ${now}`
            ),
            or(
              sql`${promotionalPopups.endDate} IS NULL`,
              sql`${promotionalPopups.endDate} >= ${now}`
            )
          )
        )
        .orderBy(desc(promotionalPopups.priority), desc(promotionalPopups.createdAt));
    }
    
    return await db
      .select()
      .from(promotionalPopups)
      .orderBy(desc(promotionalPopups.priority), desc(promotionalPopups.createdAt));
  }

  async getPromotionalPopupById(id: string): Promise<PromotionalPopup | undefined> {
    const [popup] = await db
      .select()
      .from(promotionalPopups)
      .where(eq(promotionalPopups.id, id));
    return popup;
  }

  async createPromotionalPopup(popup: InsertPromotionalPopup): Promise<PromotionalPopup> {
    const [newPopup] = await db
      .insert(promotionalPopups)
      .values(popup)
      .returning();
    return newPopup;
  }

  async updatePromotionalPopup(id: string, updates: Partial<InsertPromotionalPopup>): Promise<PromotionalPopup | undefined> {
    const [updatedPopup] = await db
      .update(promotionalPopups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(promotionalPopups.id, id))
      .returning();
    return updatedPopup;
  }

  async deletePromotionalPopup(id: string): Promise<void> {
    await db
      .delete(promotionalPopups)
      .where(eq(promotionalPopups.id, id));
  }

  // Banner operations
  async getBanners(options?: { active?: boolean }): Promise<Banner[]> {
    if (options?.active) {
      const now = new Date();
      return await db
        .select()
        .from(banners)
        .where(
          and(
            eq(banners.isActive, true),
            or(
              sql`${banners.startDate} IS NULL`,
              sql`${banners.startDate} <= ${now}`
            ),
            or(
              sql`${banners.endDate} IS NULL`,
              sql`${banners.endDate} >= ${now}`
            )
          )
        )
        .orderBy(desc(banners.sortOrder), desc(banners.createdAt));
    }
    
    return await db
      .select()
      .from(banners)
      .orderBy(desc(banners.sortOrder), desc(banners.createdAt));
  }

  async getBannerById(id: string): Promise<Banner | undefined> {
    const [banner] = await db
      .select()
      .from(banners)
      .where(eq(banners.id, id));
    return banner;
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const [newBanner] = await db
      .insert(banners)
      .values(banner)
      .returning();
    return newBanner;
  }

  async updateBanner(id: string, updates: Partial<InsertBanner>): Promise<Banner | undefined> {
    const [updatedBanner] = await db
      .update(banners)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(banners.id, id))
      .returning();
    return updatedBanner;
  }

  async deleteBanner(id: string): Promise<void> {
    await db
      .delete(banners)
      .where(eq(banners.id, id));
  }

  // Featured products panel operations
  async getFeaturedProductsPanelSettings(): Promise<FeaturedProductsPanelSettings> {
    const [setting] = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.key, 'featured_products_panel'));

    if (!setting || !setting.value) {
      // Return default settings
      return {
        order: [],
        maxItems: 8,
        autoScrollMs: 3000
      };
    }

    const parsed = featuredProductsPanelSettingsSchema.safeParse(setting.value);
    if (!parsed.success) {
      // Return default settings if parsing fails
      return {
        order: [],
        maxItems: 8,
        autoScrollMs: 3000
      };
    }

    return parsed.data;
  }

  async saveFeaturedProductsPanelSettings(settings: FeaturedProductsPanelSettings): Promise<FeaturedProductsPanelSettings> {
    // Validate settings
    const validatedSettings = featuredProductsPanelSettingsSchema.parse(settings);

    const [existing] = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.key, 'featured_products_panel'));

    if (existing) {
      await db
        .update(storeSettings)
        .set({
          value: validatedSettings,
          updatedAt: new Date()
        })
        .where(eq(storeSettings.key, 'featured_products_panel'));
    } else {
      await db
        .insert(storeSettings)
        .values({
          key: 'featured_products_panel',
          value: validatedSettings,
          description: 'Featured products panel display settings including order, max items, and auto-scroll timing'
        });
    }

    return validatedSettings;
  }

  async getFeaturedProductsOrdered(): Promise<Product[]> {
    const settings = await this.getFeaturedProductsPanelSettings();
    
    // Get all featured products
    const featuredProducts = await db
      .select()
      .from(products)
      .where(and(
        eq(products.isFeatured, true),
        eq(products.isActive, true)
      ));

    // If no custom order is set, return featured products by creation date
    if (!settings.order.length) {
      return featuredProducts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, settings.maxItems);
    }

    // Sort products according to the custom order
    const orderedProducts: Product[] = [];
    const productMap = new Map(featuredProducts.map(p => [p.id, p]));

    // First, add products in the specified order
    for (const productId of settings.order) {
      const product = productMap.get(productId);
      if (product) {
        orderedProducts.push(product);
        productMap.delete(productId);
      }
    }

    // Then add any remaining featured products
    const remainingProducts = Array.from(productMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    orderedProducts.push(...remainingProducts);

    return orderedProducts.slice(0, settings.maxItems);
  }

  // API Settings operations
  async getPaymentSettings(): Promise<PaymentSettings | undefined> {
    const [settings] = await db
      .select()
      .from(paymentSettings)
      .where(eq(paymentSettings.isActive, true))
      .limit(1);
    return settings;
  }

  async upsertPaymentSettings(settings: Partial<InsertPaymentSettings>): Promise<PaymentSettings> {
    const [existing] = await db
      .select()
      .from(paymentSettings)
      .where(eq(paymentSettings.isActive, true))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(paymentSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(paymentSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(paymentSettings)
        .values({
          ...settings,
          isActive: true
        })
        .returning();
      return created;
    }
  }

  async getAnalyticsSettings(): Promise<AnalyticsSettings | undefined> {
    const [settings] = await db
      .select()
      .from(analyticsSettings)
      .where(eq(analyticsSettings.isActive, true))
      .limit(1);
    return settings;
  }

  async upsertAnalyticsSettings(settings: Partial<InsertAnalyticsSettings>): Promise<AnalyticsSettings> {
    const [existing] = await db
      .select()
      .from(analyticsSettings)
      .where(eq(analyticsSettings.isActive, true))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(analyticsSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(analyticsSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(analyticsSettings)
        .values({
          ...settings,
          isActive: true
        })
        .returning();
      return created;
    }
  }

  async getIntegrationSettings(): Promise<IntegrationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(integrationSettings)
      .where(eq(integrationSettings.isActive, true))
      .limit(1);
    return settings;
  }

  async upsertIntegrationSettings(settings: Partial<InsertIntegrationSettings>): Promise<IntegrationSettings> {
    const [existing] = await db
      .select()
      .from(integrationSettings)
      .where(eq(integrationSettings.isActive, true))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(integrationSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(integrationSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(integrationSettings)
        .values({
          ...settings,
          isActive: true
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
