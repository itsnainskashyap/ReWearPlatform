import { db } from "./db";
import { categories, brands, products } from "@shared/schema";
import { eq } from "drizzle-orm";

// Seed data for production deployment
export async function seedDatabase() {
  console.log('[SEED] Starting database seeding...');
  
  try {
    // Insert categories first and get their IDs
    console.log('[SEED] Seeding categories...');
    const categoryData = [
      {
        id: "originals",
        name: "Originals",
        slug: "originals",
        description: "Premium thrift fashion from top brands",
        isActive: true,
        sortOrder: 1
      },
      {
        id: "sustainable-dresses",
        name: "Sustainable Dresses",
        slug: "sustainable-dresses", 
        description: "Eco-friendly and sustainable dress collection",
        isActive: true,
        sortOrder: 2
      }
    ];

    // Ensure categories are inserted with explicit transaction
    for (const category of categoryData) {
      const result = await db.insert(categories)
        .values(category)
        .onConflictDoUpdate({
          target: categories.id,
          set: {
            name: category.name,
            slug: category.slug,
            description: category.description,
            isActive: category.isActive,
            sortOrder: category.sortOrder,
            updatedAt: new Date()
          }
        })
        .returning({ id: categories.id });
      
      console.log(`[SEED] Category "${category.name}" seeded with ID: ${category.id}`);
    }
    
    // Verify categories exist before proceeding
    const existingCategories = await db.select({ id: categories.id, name: categories.name }).from(categories);
    console.log(`[SEED] Verified ${existingCategories.length} categories exist:`, existingCategories.map((c: any) => c.id))

    // Insert brands with proper conflict handling
    console.log('[SEED] Seeding brands...');
    const brandData = [
      {
        id: "26c9c365-c9c0-4e02-ac6c-536aad01483f",
        name: "ZARA",
        slug: "zara",
        description: "International fashion retailer",
        isActive: true,
        isFeatured: true,
        sortOrder: 1
      },
      {
        id: "b2a94f56-8e3c-4d1f-a6b7-9c8e7f6d5a43",
        name: "H&M",
        slug: "h-and-m",
        description: "Swedish multinational clothing retailer",
        isActive: true,
        isFeatured: true,
        sortOrder: 2
      },
      {
        id: "d4c8e7f9-2b1a-4e6d-8c9f-5a7b3e2d1c90",
        name: "DIOR",
        slug: "dior",
        description: "French luxury fashion house",
        isActive: true,
        isFeatured: true,
        sortOrder: 3
      },
      {
        id: "f8e2d7c9-4a6b-1d3e-9c8f-7b5a4e2d1c90",
        name: "Calvin Klein",
        slug: "calvin-klein",
        description: "American fashion brand",
        isActive: true,
        isFeatured: true,
        sortOrder: 4
      },
      {
        id: "a7b6c5d4-9e8f-2c1d-6b5a-4e3d2c1b9a80",
        name: "Louis Vuitton",
        slug: "louis-vuitton",
        description: "French luxury fashion house",
        isActive: true,
        isFeatured: true,
        sortOrder: 5
      }
    ];

    for (const brand of brandData) {
      await db.insert(brands)
        .values(brand)
        .onConflictDoUpdate({
          target: brands.id,
          set: {
            name: brand.name,
            slug: brand.slug,
            description: brand.description,
            isActive: brand.isActive,
            isFeatured: brand.isFeatured,
            sortOrder: brand.sortOrder,
            updatedAt: new Date()
          }
        });
      
      console.log(`[SEED] Brand "${brand.name}" seeded with ID: ${brand.id}`);
    }
    
    // Verify brands exist before proceeding
    const existingBrands = await db.select({ id: brands.id, name: brands.name }).from(brands);
    console.log(`[SEED] Verified ${existingBrands.length} brands exist:`, existingBrands.map((b: any) => `${b.name} (${b.id})`).slice(0, 3))

    // Insert products
    console.log('[SEED] Seeding products...');
    const productData = [
      {
        id: "795fda59-d5ae-4725-9115-4448d10c6e69",
        name: "ZARA Striped Cotton Blouse",
        slug: "zara-striped-cotton-blouse",
        description: "Elegant striped cotton blouse perfect for casual and formal occasions",
        categoryId: "originals",
        brandId: "26c9c365-c9c0-4e02-ac6c-536aad01483f",
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
        id: "c0eaf0cc-8530-4e46-817a-a2cf2d6e39fc",
        name: "ZARA Floral Mini Dress",
        slug: "zara-floral-mini-dress",
        description: "Beautiful floral mini dress from ZARA sustainable collection",
        categoryId: "sustainable-dresses",
        brandId: "26c9c365-c9c0-4e02-ac6c-536aad01483f",
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
        id: "fcfad722-f34c-4990-af76-cec6fad49816",
        name: "ZARA Leather Biker Jacket",
        slug: "zara-leather-biker-jacket",
        description: "Premium leather biker jacket in excellent condition",
        categoryId: "originals",
        brandId: "26c9c365-c9c0-4e02-ac6c-536aad01483f",
        price: "7999.00",
        originalPrice: "12999.00",
        condition: "Good",
        size: "L",
        color: "Black",
        material: "Leather",
        images: ["/api/placeholder/400/500"],
        isActive: true,
        isThrift: true,
        stock: 1
      },
      {
        id: "ee0ca258-5181-4d7b-9e22-3a9ed6db21bf",
        name: "H&M Organic Cotton T-Shirt",
        slug: "h-m-organic-cotton-t-shirt",
        description: "Comfortable organic cotton t-shirt from H&M",
        categoryId: "originals",
        brandId: "b2a94f56-8e3c-4d1f-a6b7-9c8e7f6d5a43",
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
      },
      {
        id: "f30a1efa-d16a-42f2-9703-a78dcf150f3d",
        name: "H&M High-Waisted Mom Jeans",
        slug: "h-m-high-waisted-mom-jeans",
        description: "Trendy high-waisted mom jeans in great condition",
        categoryId: "originals",
        brandId: "b2a94f56-8e3c-4d1f-a6b7-9c8e7f6d5a43",
        price: "2299.00",
        originalPrice: "2999.00",
        condition: "Good",
        size: "28",
        color: "Blue",
        material: "Denim",
        images: ["/api/placeholder/400/500"],
        isActive: true,
        isThrift: true,
        stock: 1
      },
      {
        id: "b2f06ee4-db5a-420c-8446-5794c99e385a",
        name: "Organic Cotton Midi Dress - Forest Green",
        slug: "organic-cotton-midi-dress-forest-green",
        description: "Sustainable organic cotton midi dress in beautiful forest green",
        categoryId: "sustainable-dresses",
        brandId: null,
        price: "2499.00",
        condition: "New",
        size: "M",
        color: "Forest Green",
        material: "Organic Cotton",
        images: ["/api/placeholder/400/500"],
        isActive: true,
        isFeatured: true,
        isOriginal: true,
        stock: 1
      },
      {
        id: "33a6e24d-c048-4786-83e2-6091c79fba4c",
        name: "H&M Knitted Cardigan",
        slug: "h-m-knitted-cardigan",
        description: "Cozy knitted cardigan perfect for layering",
        categoryId: "originals",
        brandId: "b2a94f56-8e3c-4d1f-a6b7-9c8e7f6d5a43",
        price: "1899.00",
        condition: "Like New",
        size: "L",
        color: "Beige",
        material: "Wool Blend",
        images: ["/api/placeholder/400/500"],
        isActive: true,
        isThrift: true,
        stock: 1
      },
      {
        id: "b87c0fb3-7fbf-47a6-bcc9-c5c73cb2cf76",
        name: "DIOR Oblique Silk Scarf",
        slug: "dior-oblique-silk-scarf",
        description: "Luxury DIOR oblique pattern silk scarf",
        categoryId: "originals",
        brandId: "d4c8e7f9-2b1a-4e6d-8c9f-5a7b3e2d1c90",
        price: "45000.00",
        condition: "Excellent",
        color: "Navy/Gold",
        material: "Silk",
        images: ["/api/placeholder/400/500"],
        isActive: true,
        isFeatured: true,
        stock: 1
      },
      {
        id: "f4e95c46-0a1e-4d2c-a4ec-67afb8836192",
        name: "DIOR Bar Jacket",
        slug: "dior-bar-jacket",
        description: "Iconic DIOR Bar jacket from the New Look collection",
        categoryId: "originals",
        brandId: "d4c8e7f9-2b1a-4e6d-8c9f-5a7b3e2d1c90",
        price: "320000.00",
        condition: "Excellent",
        size: "38",
        color: "Navy",
        material: "Wool",
        images: ["/api/placeholder/400/500"],
        isActive: true,
        isFeatured: true,
        stock: 1
      },
      {
        id: "f4107bb2-dee4-4a20-aa05-4ccf62e65778",
        name: "DIOR Miss Dior Dress",
        slug: "dior-miss-dior-dress",
        description: "Elegant Miss Dior dress from sustainable collection",
        categoryId: "sustainable-dresses",
        brandId: "d4c8e7f9-2b1a-4e6d-8c9f-5a7b3e2d1c90",
        price: "185000.00",
        condition: "New",
        size: "36",
        color: "Pink",
        material: "Silk",
        images: ["/api/placeholder/400/500"],
        isActive: true,
        isFeatured: true,
        isOriginal: true,
        stock: 1
      },
      {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        name: "Louis Vuitton Silk Twill Dress",
        slug: "louis-vuitton-silk-twill-dress",
        description: "Luxurious silk twill dress from Louis Vuitton sustainable line",
        categoryId: "sustainable-dresses",
        brandId: "a7b6c5d4-9e8f-2c1d-6b5a-4e3d2c1b9a80",
        price: "290000.00",
        condition: "New",
        size: "38",
        color: "Black",
        material: "Silk Twill",
        images: ["/api/placeholder/400/500"],
        isActive: true,
        isFeatured: true,
        isOriginal: true,
        stock: 1
      }
    ];

    for (const product of productData) {
      await db.insert(products)
        .values(product)
        .onConflictDoNothing();
    }

    console.log('[SEED] Database seeding completed successfully!');
    console.log(`[SEED] Seeded ${categoryData.length} categories, ${brandData.length} brands, and ${productData.length} products`);
    
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('[SEED] Seeding script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[SEED] Seeding script failed:', error);
      process.exit(1);
    });
}