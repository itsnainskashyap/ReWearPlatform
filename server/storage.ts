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
  type InsertCategory,
  type InsertBrand,
  type InsertProduct,
  type InsertCart,
  type InsertCartItem,
  type InsertWishlist,
  type InsertOrder,
  type InsertOrderItem,
  type PromotionalPopup,
  type InsertPromotionalPopup,
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
  
  // Brand operations
  getBrands(): Promise<Brand[]>;
  getFeaturedBrands(): Promise<Brand[]>;
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
    search?: string;
  }): Promise<Product[]>;
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
  getOrders(userId?: string): Promise<Order[]>;
  getAllOrders(options?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<(Order & { user?: User })[]>;
  getOrderById(id: string): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Promotional popup operations
  getPromotionalPopups(options?: { active?: boolean }): Promise<PromotionalPopup[]>;
  getPromotionalPopupById(id: string): Promise<PromotionalPopup | undefined>;
  createPromotionalPopup(popup: InsertPromotionalPopup): Promise<PromotionalPopup>;
  updatePromotionalPopup(id: string, updates: Partial<InsertPromotionalPopup>): Promise<PromotionalPopup | undefined>;
  deletePromotionalPopup(id: string): Promise<void>;
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

  // Brand operations
  async getBrands(): Promise<Brand[]> {
    return await db
      .select()
      .from(brands)
      .where(eq(brands.isActive, true))
      .orderBy(brands.sortOrder, brands.name);
  }

  async getFeaturedBrands(): Promise<Brand[]> {
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
    search?: string;
  } = {}): Promise<Product[]> {
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

    if (options.search) {
      conditions.push(
        sql`${products.name} ILIKE ${`%${options.search}%`} OR ${products.description} ILIKE ${`%${options.search}%`}`
      );
    }

    let query = db
      .select()
      .from(products)
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
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
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
    
    return results.map(({ order, user }) => ({
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

  // Promotional popup operations
  async getPromotionalPopups(options?: { active?: boolean }): Promise<PromotionalPopup[]> {
    let query = db.select().from(promotionalPopups);
    
    if (options?.active) {
      const now = new Date();
      query = query.where(
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
      );
    }
    
    return await query.orderBy(desc(promotionalPopups.priority), desc(promotionalPopups.createdAt));
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
}

export const storage = new DatabaseStorage();
