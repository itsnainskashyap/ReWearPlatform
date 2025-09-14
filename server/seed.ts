import { db } from "./db";
import { categories, brands, products } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Load snapshot data for consistent seeding
function loadSnapshot() {
  // Try multiple locations for snapshot.json
  const possiblePaths = [
    path.resolve(import.meta.dirname, 'snapshot.json'), // Same directory as built bundle
    path.resolve(process.cwd(), 'server', 'snapshot.json'), // Original server directory  
    path.resolve(process.cwd(), 'snapshot.json'), // Root directory
  ];
  
  for (const snapshotPath of possiblePaths) {
    if (fs.existsSync(snapshotPath)) {
      console.log(`[SEED] Using snapshot from: ${snapshotPath}`);
      return JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    }
  }
  
  throw new Error(`Snapshot file not found in any of these locations: ${possiblePaths.join(', ')}`);
}

// Atomic seeding function with proper transaction handling - fixes race conditions
export async function seedDatabaseAtomic() {
  console.log('[SEED] Starting atomic database seeding with transaction...');
  
  // Define comprehensive test data that ensures proper QA testing
  const testData = {
    categories: [
      {
        slug: "thrift-store",
        name: "Thrift Store",
        description: "Pre-loved fashion finds with character and history",
        isActive: true,
        sortOrder: 1
      },
      {
        slug: "reweara-originals",
        name: "ReWeara Originals", 
        description: "Eco-friendly sustainable fashion designs",
        isActive: true,
        sortOrder: 2
      },
      {
        slug: "sustainable-dresses",
        name: "Sustainable Dresses",
        description: "Eco-friendly and sustainable dress collection",
        isActive: true,
        sortOrder: 3
      }
    ],
    brands: [
      {
        slug: "zara",
        name: "ZARA",
        description: "Spanish multinational clothing retailer",
        isActive: true,
        isFeatured: true,
        sortOrder: 1
      },
      {
        slug: "hm",
        name: "H&M", 
        description: "Swedish multinational retail-clothing company",
        isActive: true,
        isFeatured: true,
        sortOrder: 2
      },
      {
        slug: "levis",
        name: "Levi's",
        description: "American clothing company known for denim",
        isActive: true,
        isFeatured: true,
        sortOrder: 3
      },
      {
        slug: "nike",
        name: "Nike",
        description: "American multinational corporation engaged in footwear and apparel",
        isActive: true,
        isFeatured: false,
        sortOrder: 4
      }
    ]
  };
  
  // Wrap entire seeding in atomic transaction to prevent race conditions
  return await db.transaction(async (tx) => {
    try {
      console.log('[SEED] Starting transaction...');
      
      // Step 1: Seed categories with proper awaiting 
      console.log('[SEED] Seeding categories...');
      const categoryMap = new Map<string, string>();
      
      // Use for...of instead of forEach to ensure proper async handling
      for (const category of testData.categories) {
        const result = await tx.insert(categories)
          .values(category)
          .onConflictDoUpdate({
            target: categories.slug,
            set: {
              name: category.name,
              description: category.description,
              isActive: category.isActive,
              sortOrder: category.sortOrder,
              updatedAt: new Date()
            }
          })
          .returning({ id: categories.id, slug: categories.slug });
        
        const insertedCategory = result[0];
        categoryMap.set(insertedCategory.slug, insertedCategory.id);
        console.log(`[SEED] Category "${category.name}" upserted with ID: ${insertedCategory.id}`);
      }
      
      console.log(`[SEED] ${categoryMap.size} categories processed`);

      // Step 2: Seed brands with proper awaiting
      console.log('[SEED] Seeding brands...');
      const brandMap = new Map<string, string>();
      
      // Use for...of instead of forEach to ensure proper async handling
      for (const brand of testData.brands) {
        const result = await tx.insert(brands)
          .values(brand)
          .onConflictDoUpdate({
            target: brands.slug,
            set: {
              name: brand.name,
              description: brand.description,
              isActive: brand.isActive,
              isFeatured: brand.isFeatured,
              sortOrder: brand.sortOrder,
              updatedAt: new Date()
            }
          })
          .returning({ id: brands.id, slug: brands.slug });
        
        const insertedBrand = result[0];
        brandMap.set(insertedBrand.slug, insertedBrand.id);
        console.log(`[SEED] Brand "${brand.name}" upserted with ID: ${insertedBrand.id}`);
      }
      
      console.log(`[SEED] ${brandMap.size} brands processed`);

      // Step 3: Create comprehensive test products
      console.log('[SEED] Seeding test products...');
      const testProducts = [
        {
          slug: "vintage-denim-jacket-001",
          name: "Vintage Denim Jacket",
          description: "Classic vintage denim jacket in excellent condition. Perfect for casual wear with a timeless style that never goes out of fashion.",
          shortDescription: "Timeless denim piece",
          categorySlug: "thrift-store",
          brandSlug: "levis",
          price: "2499.00",
          originalPrice: "4999.00",
          condition: "Very Good",
          size: "L",
          color: "Blue",
          material: "Cotton Denim",
          images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"],
          isActive: true,
          isFeatured: true,
          isHotSelling: true,
          isOriginal: false,
          isThrift: true,
          stock: 5,
          sizes: ["M", "L", "XL"]
        },
        {
          slug: "eco-cotton-tee-001",
          name: "Eco-Friendly Cotton Tee",
          description: "Organic cotton t-shirt made from sustainable materials. Soft, comfortable, and environmentally conscious.",
          shortDescription: "Sustainable comfort wear",
          categorySlug: "reweara-originals",
          brandSlug: "hm",
          price: "899.00",
          originalPrice: null,
          condition: "New",
          size: "M",
          color: "White",
          material: "Organic Cotton",
          images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"],
          isActive: true,
          isFeatured: false,
          isHotSelling: true,
          isOriginal: true,
          isThrift: false,
          stock: 10,
          sizes: ["S", "M", "L"]
        },
        {
          slug: "sustainable-maxi-dress-001",
          name: "Sustainable Maxi Dress",
          description: "Beautiful flowing maxi dress made from sustainable bamboo fiber. Perfect for summer occasions with elegant styling.",
          shortDescription: "Elegant sustainable dress",
          categorySlug: "sustainable-dresses",
          brandSlug: "zara",
          price: "3499.00",
          originalPrice: "4999.00",
          condition: "New",
          size: "M",
          color: "Forest Green",
          material: "Bamboo Fiber",
          images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"],
          isActive: true,
          isFeatured: true,
          isHotSelling: false,
          isOriginal: true,
          isThrift: false,
          stock: 8,
          sizes: ["S", "M", "L", "XL"]
        },
        {
          slug: "thrift-blazer-professional-001",
          name: "Professional Blazer",
          description: "Professional blazer in excellent condition. Perfect for business meetings and formal occasions.",
          shortDescription: "Professional style",
          categorySlug: "thrift-store",
          brandSlug: "zara",
          price: "1799.00",
          originalPrice: "3999.00",
          condition: "Good",
          size: "M",
          color: "Black",
          material: "Polyester Blend",
          images: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"],
          isActive: true,
          isFeatured: false,
          isHotSelling: true,
          isOriginal: false,
          isThrift: true,
          stock: 3,
          sizes: ["S", "M", "L"]
        },
        {
          slug: "nike-athletic-shorts-001",
          name: "Athletic Performance Shorts",
          description: "High-performance athletic shorts designed for comfort and mobility during workouts and sports activities.",
          shortDescription: "Performance activewear",
          categorySlug: "thrift-store",
          brandSlug: "nike",
          price: "1299.00",
          originalPrice: "2499.00",
          condition: "Like New",
          size: "L",
          color: "Navy Blue",
          material: "Polyester Blend",
          images: ["https://images.unsplash.com/photo-1506629905117-b6479d1ba26f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"],
          isActive: true,
          isFeatured: false,
          isHotSelling: false,
          isOriginal: false,
          isThrift: true,
          stock: 6,
          sizes: ["M", "L", "XL"]
        }
      ];

      let insertedProducts = 0;
      let skippedProducts = 0;

      // Use for...of instead of forEach for proper async handling
      for (const product of testProducts) {
        // Resolve FK references with proper validation
        const categoryId = categoryMap.get(product.categorySlug);
        const brandId = brandMap.get(product.brandSlug);

        if (!categoryId) {
          console.error(`[SEED ERROR] Category slug "${product.categorySlug}" not found for product "${product.name}"`);
          skippedProducts++;
          continue;
        }

        if (!brandId) {
          console.error(`[SEED ERROR] Brand slug "${product.brandSlug}" not found for product "${product.name}"`);
          skippedProducts++;
          continue;
        }

        // Prepare product with resolved FK IDs - remove slug references
        const { categorySlug, brandSlug, ...productData } = product;
        const productToInsert = {
          ...productData,
          categoryId,
          brandId,
          // Ensure numeric values are properly typed
          price: productData.price,
          originalPrice: productData.originalPrice,
          stock: productData.stock,
          viewCount: 0
        };

        try {
          await tx.insert(products)
            .values(productToInsert)
            .onConflictDoUpdate({
              target: products.slug,
              set: {
                name: productToInsert.name,
                description: productToInsert.description,
                shortDescription: productToInsert.shortDescription,
                categoryId: productToInsert.categoryId,
                brandId: productToInsert.brandId,
                price: productToInsert.price,
                originalPrice: productToInsert.originalPrice,
                condition: productToInsert.condition,
                size: productToInsert.size,
                color: productToInsert.color,
                material: productToInsert.material,
                images: productToInsert.images,
                sizes: productToInsert.sizes,
                isActive: productToInsert.isActive,
                isFeatured: productToInsert.isFeatured,
                isHotSelling: productToInsert.isHotSelling,
                isOriginal: productToInsert.isOriginal,
                isThrift: productToInsert.isThrift,
                stock: productToInsert.stock,
                updatedAt: new Date()
              }
            });

          insertedProducts++;
          console.log(`[SEED] Product "${product.name}" processed successfully`);

        } catch (productError) {
          console.error(`[SEED ERROR] Failed to insert product "${product.name}":`, productError);
          skippedProducts++;
          throw productError; // Re-throw to fail transaction
        }
      }

      // Return actual counts for verification
      const result = {
        categories: categoryMap.size,
        brands: brandMap.size,
        products: insertedProducts,
        skipped: skippedProducts
      };

      console.log('[SEED] Atomic seeding transaction completed successfully!');
      console.log(`[SEED] Final counts:`, result);
      
      return result;
      
    } catch (error) {
      console.error('[SEED ERROR] Atomic transaction failed, rolling back:', error);
      throw error; // This will trigger transaction rollback
    }
  });
}

// Legacy function for production startup - now delegates to atomic version
export async function seedDatabase() {
  return await seedDatabaseAtomic();
}

