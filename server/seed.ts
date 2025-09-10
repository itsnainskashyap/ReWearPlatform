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

// Seed data for production deployment
export async function seedDatabase() {
  console.log('[SEED] Starting database seeding...');
  
  // Load snapshot data for consistent deployment seeding
  let snapshot;
  try {
    snapshot = loadSnapshot();
    console.log(`[SEED] Loaded snapshot with ${snapshot.counts.categories} categories, ${snapshot.counts.brands} brands, ${snapshot.counts.products} products`);
  } catch (error) {
    console.error('[SEED ERROR] Failed to load snapshot, falling back to basic seed data:', error);
    // Fallback to basic seed data if snapshot is not available
    snapshot = {
      categories: [
        {
          slug: "originals",
          name: "Originals",
          description: "Premium thrift fashion from top brands",
          isActive: true,
          sortOrder: 1
        },
        {
          slug: "sustainable-dresses", 
          name: "Sustainable Dresses",
          description: "Eco-friendly and sustainable dress collection",
          isActive: true,
          sortOrder: 2
        }
      ],
      brands: [
        {
          slug: "zara",
          name: "ZARA",
          description: "International fashion retailer",
          isActive: true,
          isFeatured: true,
          sortOrder: 1
        }
      ],
      products: []
    };
  }
  
  // Wrap entire seeding in a transaction for robustness
  return await db.transaction(async (tx: any) => {
    try {
      // Seed categories from snapshot
      console.log('[SEED] Seeding categories...');
      const categoryData = snapshot.categories;

      // Map to store slug -> id mappings for FK resolution
      const categoryMap = new Map<string, string>();
      
      for (const category of categoryData) {
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
        console.log(`[SEED] Category "${category.name}" ready with slug: ${category.slug}, ID: ${insertedCategory.id}`);
      }
      
      console.log(`[SEED] ${categoryMap.size} categories mapped for FK resolution`)

      // Seed brands from snapshot
      console.log('[SEED] Seeding brands...');
      const brandData = snapshot.brands;

      // Map to store brand slug -> id mappings for FK resolution
      const brandMap = new Map<string, string>();
      
      for (const brand of brandData) {
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
        console.log(`[SEED] Brand "${brand.name}" ready with slug: ${brand.slug}, ID: ${insertedBrand.id}`);
      }
      
      console.log(`[SEED] ${brandMap.size} brands mapped for FK resolution`)

      // Seed products from snapshot
      console.log('[SEED] Seeding products...');
      const productData = snapshot.products;

      let insertedProducts = 0;
      let skippedProducts = 0;

      for (const product of productData) {
        // Validate FK references exist
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

        // Prepare product with resolved FK IDs
        const { categorySlug, brandSlug, ...productWithoutSlugs } = product;
        const productToInsert = {
          ...productWithoutSlugs,
          categoryId,
          brandId,
        };

        try {
          await tx.insert(products)
            .values(productToInsert)
            .onConflictDoUpdate({
              target: products.slug,
              set: {
                name: productToInsert.name,
                description: productToInsert.description,
                categoryId: productToInsert.categoryId,
                brandId: productToInsert.brandId,
                price: productToInsert.price,
                originalPrice: productToInsert.originalPrice,
                condition: productToInsert.condition,
                size: productToInsert.size,
                color: productToInsert.color,
                material: productToInsert.material,
                images: productToInsert.images,
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
        }
      }

      console.log('[SEED] Database seeding completed successfully!');
      console.log(`[SEED] Final counts: ${categoryMap.size} categories, ${brandMap.size} brands, ${insertedProducts} products inserted, ${skippedProducts} products skipped`);
      
    } catch (error) {
      console.error('[SEED ERROR] Transaction failed, rolling back:', error);
      throw error;
    }
  });
}

