import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  varchar,
  timestamp,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table (Thrift Store, ReWeara Originals, etc.)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Brands table
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tax rates table
export const taxRates = pgTable("tax_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // Tax percentage
  country: varchar("country"),
  state: varchar("state"),
  city: varchar("city"),
  zipCode: varchar("zip_code"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // For multiple tax rules
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product images table for multiple images/videos
export const productMedia = pgTable("product_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // image, video
  url: varchar("url").notNull(),
  alt: text("alt"),
  sortOrder: integer("sort_order").default(0),
  isMain: boolean("is_main").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  brandId: varchar("brand_id").references(() => brands.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  condition: varchar("condition"), // "New", "Like New", "Good", "Fair", etc.
  size: varchar("size"),
  color: varchar("color"),
  material: varchar("material"),
  images: text("images").array().default([]),
  videos: text("videos").array().default([]),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  isHotSelling: boolean("is_hot_selling").default(false),
  isOriginal: boolean("is_original").default(false), // For ReWeara Originals
  isThrift: boolean("is_thrift").default(false), // For Thrift Store items
  stock: integer("stock").default(1),
  stockAlert: integer("stock_alert").default(5), // Alert threshold
  viewCount: integer("view_count").default(0),
  sizes: text("sizes").array().default([]), // Available sizes
  fabric: text("fabric"), // Fabric details
  measurements: jsonb("measurements"), // Measurements JSON
  washCare: text("wash_care"), // Wash care instructions
  ecoBadges: text("eco_badges").array().default([]), // Eco-friendly badges
  discount: decimal("discount", { precision: 5, scale: 2 }).default(sql`0`), // Discount percentage
  discountType: varchar("discount_type"), // percentage or fixed
  discountExpiry: timestamp("discount_expiry"), // Discount expiry date
  relatedProducts: text("related_products").array().default([]), // Related product IDs
  tags: text("tags").array().default([]), // Tags for search
  aiTryOnPrompt: text("ai_try_on_prompt"), // AI prompt for virtual try-on
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart table
export const carts = pgTable("carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"), // For guest users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: varchar("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wishlist table
export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Order tracking table
export const orderTracking = pgTable("order_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: varchar("status").notNull(), // pending, confirmed, shipped, delivered
  message: text("message"),
  location: varchar("location"),
  trackingNumber: varchar("tracking_number"),
  carrier: varchar("carrier"),
  estimatedDelivery: timestamp("estimated_delivery"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  guestEmail: varchar("guest_email"),
  status: varchar("status").notNull().default("pending"), // pending, payment_verified, confirmed, shipped, delivered, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default(sql`0`),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default(sql`0`),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default(sql`0`),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  couponCode: varchar("coupon_code"),
  trackingNumber: varchar("tracking_number"),
  estimatedDelivery: timestamp("estimated_delivery"),
  paymentMethod: varchar("payment_method"), // UPI, COD, etc.
  paymentStatus: varchar("payment_status").default("pending"), // pending, verified, paid, failed
  paymentProof: varchar("payment_proof"), // Screenshot upload URL
  paymentVerifiedBy: varchar("payment_verified_by"), // Admin ID who verified
  paymentVerifiedAt: timestamp("payment_verified_at"),
  shippingAddress: jsonb("shipping_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const categoryRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const brandRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const taxRateRelations = relations(taxRates, ({ }) => ({
  // Tax rates don't have direct relations
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, {
    fields: [productMedia.productId],
    references: [products.id],
  }),
}));

export const productRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  cartItems: many(cartItems),
  wishlistItems: many(wishlists),
  orderItems: many(orderItems),
  media: many(productMedia),
}));

export const userRelations = relations(users, ({ many }) => ({
  carts: many(carts),
  wishlists: many(wishlists),
  orders: many(orders),
}));

export const cartRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const wishlistRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  tracking: many(orderTracking),
}));

export const orderTrackingRelations = relations(orderTracking, ({ one }) => ({
  order: one(orders, {
    fields: [orderTracking.orderId],
    references: [orders.id],
  }),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

// Coupons table
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  description: text("description"),
  discountType: varchar("discount_type").notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minPurchaseAmount: decimal("min_purchase_amount", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin users table (for separate admin authentication)
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  totpSecret: varchar("totp_secret"), // For 2FA
  totpEnabled: boolean("totp_enabled").default(false),
  role: varchar("role").default("admin"),
  lastLogin: timestamp("last_login"),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => adminUsers.id),
  action: varchar("action").notNull(), // CREATE, UPDATE, DELETE, etc
  entityType: varchar("entity_type").notNull(), // product, order, user, etc
  entityId: varchar("entity_id"),
  changes: jsonb("changes"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type"), // order, promotion, system, etc
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Banner/Hero slides table
export const banners = pgTable("banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title"),
  subtitle: text("subtitle"),
  imageUrl: varchar("image_url").notNull(),
  linkUrl: varchar("link_url"),
  buttonText: varchar("button_text"),
  position: varchar("position").default("hero"), // hero, sidebar, footer, etc
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content pages table (for About, FAQs, etc)
export const contentPages = pgTable("content_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").notNull().unique(),
  title: varchar("title").notNull(),
  content: text("content"),
  metaDescription: text("meta_description"),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Configuration table
export const aiConfig = pgTable("ai_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feature: varchar("feature").notNull().unique(), // recommendations, try-on, background-gen, etc
  isEnabled: boolean("is_enabled").default(true),
  apiKey: varchar("api_key"),
  prompt: text("prompt"),
  thresholds: jsonb("thresholds"),
  usage: jsonb("usage"), // track API calls, costs, etc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Store settings table
export const storeSettings = pgTable("store_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: jsonb("value"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment settings table
export const paymentSettings = pgTable("payment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  upiId: varchar("upi_id"),
  qrCodeUrl: varchar("qr_code_url"),
  bankDetails: jsonb("bank_details"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Promotional popups table
export const promotionalPopups = pgTable("promotional_popups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  buttonText: varchar("button_text"),
  buttonUrl: varchar("button_url"),
  backgroundColor: varchar("background_color").default("#ffffff"),
  textColor: varchar("text_color").default("#000000"),
  buttonColor: varchar("button_color").default("#10b981"),
  position: varchar("position").default("center"), // center, bottom, top
  size: varchar("size").default("medium"), // small, medium, large
  trigger: varchar("trigger").default("page_load"), // page_load, exit_intent, time_delay
  triggerValue: integer("trigger_value").default(0), // seconds for time_delay
  showFrequency: varchar("show_frequency").default("once"), // once, daily, weekly, always
  targetPages: text("target_pages").array().default([]), // which pages to show on
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin logs table (specific for order audit logging)
export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  actorId: varchar("actor_id").notNull(), // Admin user ID who performed action
  action: varchar("action").notNull(), // status_change, payment_verification, manual_edit, etc.
  changes: jsonb("changes").notNull(), // What was changed (before/after values)
  notes: text("notes"), // Optional admin notes
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertTaxRateSchema = createInsertSchema(taxRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductMediaSchema = createInsertSchema(productMedia).omit({
  id: true,
  createdAt: true,
});

export const insertOrderTrackingSchema = createInsertSchema(orderTracking).omit({
  id: true,
  createdAt: true,
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentPageSchema = createInsertSchema(contentPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiConfigSchema = createInsertSchema(aiConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStoreSettingSchema = createInsertSchema(storeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromotionalPopupSchema = createInsertSchema(promotionalPopups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TaxRate = typeof taxRates.$inferSelect;
export type ProductMedia = typeof productMedia.$inferSelect;
export type OrderTracking = typeof orderTracking.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Wishlist = typeof wishlists.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type ContentPage = typeof contentPages.$inferSelect;
export type AiConfig = typeof aiConfig.$inferSelect;
export type StoreSetting = typeof storeSettings.$inferSelect;
export type PromotionalPopup = typeof promotionalPopups.$inferSelect;
export type AdminLog = typeof adminLogs.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertTaxRate = z.infer<typeof insertTaxRateSchema>;
export type InsertProductMedia = z.infer<typeof insertProductMediaSchema>;
export type InsertOrderTracking = z.infer<typeof insertOrderTrackingSchema>;
export type InsertPromotionalPopup = z.infer<typeof insertPromotionalPopupSchema>;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type PaymentSettings = typeof paymentSettings.$inferSelect;
