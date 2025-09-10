import { db } from "./db";
import { categories, brands, products } from "@shared/schema";
import fs from "fs";
import path from "path";

// Export current database state to snapshot.json for seeding deployments
async function exportSnapshot() {
  console.log('[EXPORT] Starting database snapshot export...');
  
  try {
    // Export categories
    console.log('[EXPORT] Exporting categories...');
    const categoriesData = await db.select({
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      isActive: categories.isActive,
      sortOrder: categories.sortOrder
    }).from(categories).orderBy(categories.sortOrder);
    
    // Export brands
    console.log('[EXPORT] Exporting brands...');
    const brandsData = await db.select({
      slug: brands.slug,
      name: brands.name,
      description: brands.description,
      isActive: brands.isActive,
      isFeatured: brands.isFeatured,
      sortOrder: brands.sortOrder
    }).from(brands).orderBy(brands.sortOrder);
    
    // Export products with category and brand slugs for FK resolution
    console.log('[EXPORT] Exporting products...');
    const productsQuery = `
      SELECT 
        p.slug,
        p.name,
        p.description,
        p.price,
        p.original_price as "originalPrice",
        p.condition,
        p.size,
        p.color,
        p.material,
        p.images,
        p.is_active as "isActive",
        p.is_featured as "isFeatured",
        p.is_hot_selling as "isHotSelling",
        p.is_original as "isOriginal",
        p.is_thrift as "isThrift",
        p.stock,
        c.slug as "categorySlug",
        b.slug as "brandSlug"
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      ORDER BY p.name
    `;
    
    const productsData = await db.execute(productsQuery);
    
    // Create snapshot object
    const snapshot = {
      categories: categoriesData,
      brands: brandsData,
      products: productsData.rows,
      exported_at: new Date().toISOString(),
      counts: {
        categories: categoriesData.length,
        brands: brandsData.length,
        products: productsData.rows.length
      }
    };
    
    // Write to snapshot.json
    const snapshotPath = path.resolve(import.meta.dirname, 'snapshot.json');
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    
    console.log('[EXPORT] Snapshot exported successfully!');
    console.log(`[EXPORT] Exported ${snapshot.counts.categories} categories, ${snapshot.counts.brands} brands, ${snapshot.counts.products} products`);
    console.log(`[EXPORT] Snapshot saved to: ${snapshotPath}`);
    
  } catch (error) {
    console.error('[EXPORT ERROR] Failed to export snapshot:', error);
    throw error;
  }
}

// Run export if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportSnapshot()
    .then(() => {
      console.log('[EXPORT] Export completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[EXPORT] Export failed:', error);
      process.exit(1);
    });
}

export { exportSnapshot };