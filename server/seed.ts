import { db } from "./db";
import { categories, brands, products } from "@shared/schema";
import { eq } from "drizzle-orm";

// Seed data for production deployment
export async function seedDatabase() {
  console.log('[SEED] Starting database seeding...');
  
  // Wrap entire seeding in a transaction for robustness
  return await db.transaction(async (tx: any) => {
    try {
      // Define category data with slug-based identification
      console.log('[SEED] Seeding categories...');
      const categoryData = [
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
      ];

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

      // Insert brands with slug-based identification
      console.log('[SEED] Seeding brands...');
      const brandData = [
        {
          slug: "zara",
          name: "ZARA",
          description: "International fashion retailer",
          isActive: true,
          isFeatured: true,
          sortOrder: 1
        },
        {
          slug: "h-and-m",
          name: "H&M", 
          description: "Swedish multinational clothing retailer",
          isActive: true,
          isFeatured: true,
          sortOrder: 2
        },
        {
          slug: "dior",
          name: "DIOR",
          description: "French luxury fashion house",
          isActive: true,
          isFeatured: true,
          sortOrder: 3
        },
        {
          slug: "calvin-klein",
          name: "Calvin Klein",
          description: "American fashion brand",
          isActive: true,
          isFeatured: true,
          sortOrder: 4
        },
        {
          slug: "louis-vuitton",
          name: "Louis Vuitton",
          description: "French luxury fashion house",
          isActive: true,
          isFeatured: true,
          sortOrder: 5
        }
      ];

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

      // Insert products with FK validation
      console.log('[SEED] Seeding products...');
      const productData = [
        {
          slug: "zara-striped-cotton-blouse",
          name: "ZARA Striped Cotton Blouse", 
          description: "Elegant striped cotton blouse perfect for casual and formal occasions",
          categorySlug: "originals",
          brandSlug: "zara",
          price: "2999.00",
          originalPrice: "3999.00",
          condition: "Like New",
          size: "M",
          color: "Blue/White",
          material: "Cotton",
          images: ["/api/placeholder/400/500"],
          isActive: true,
          isFeatured: true,
          isHotSelling: true,
          isThrift: true,
          stock: 1
        },
        {
          slug: "zara-floral-mini-dress",
          name: "ZARA Floral Mini Dress",
          description: "Beautiful floral mini dress from ZARA sustainable collection",
          categorySlug: "sustainable-dresses",
          brandSlug: "zara",
          price: "3999.00",
          condition: "New",
          size: "S",
          color: "Floral",
          material: "Organic Cotton",
          images: ["/api/placeholder/400/500"],
          isActive: true,
          isFeatured: true,
          isOriginal: true,
          stock: 1
        },
        {
          slug: "h-m-organic-cotton-t-shirt",
          name: "H&M Organic Cotton T-Shirt",
          description: "Comfortable organic cotton t-shirt from H&M",
          categorySlug: "originals",
          brandSlug: "h-and-m",
          price: "1299.00",
          condition: "Like New",
          size: "M",
          color: "White",
          material: "Organic Cotton",
          images: ["/api/placeholder/400/500"],
          isActive: true,
          isHotSelling: true,
          isThrift: true,
          stock: 1
        }
      ];

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

