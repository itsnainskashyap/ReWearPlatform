const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert categories
    const thriftCategory = await client.query(`
      INSERT INTO categories (name, slug, description, is_active, sort_order)
      VALUES ('Thrift Store', 'thrift-store', 'Pre-loved fashion finds with character and history', true, 1)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id;
    `);

    const originalsCategory = await client.query(`
      INSERT INTO categories (name, slug, description, is_active, sort_order) 
      VALUES ('ReWeara Originals', 'reweara-originals', 'Eco-friendly sustainable fashion designs', true, 2)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id;
    `);

    // Insert brands
    const brands = [
      { name: 'Levis', slug: 'levis', featured: true },
      { name: 'Zara', slug: 'zara', featured: true },
      { name: 'H&M', slug: 'hm', featured: false },
      { name: 'Nike', slug: 'nike', featured: true },
      { name: 'Adidas', slug: 'adidas', featured: true }
    ];

    for (const brand of brands) {
      await client.query(`
        INSERT INTO brands (name, slug, is_featured, is_active, sort_order)
        VALUES ($1, $2, $3, true, 1)
        ON CONFLICT (slug) DO NOTHING
      `, [brand.name, brand.slug, brand.featured]);
    }

    const brandIds = await client.query('SELECT id, slug FROM brands');
    const categoryIds = await client.query('SELECT id, slug FROM categories');

    const thriftCategoryId = categoryIds.rows.find(c => c.slug === 'thrift-store')?.id;
    const originalsCategoryId = categoryIds.rows.find(c => c.slug === 'reweara-originals')?.id;
    const levisId = brandIds.rows.find(b => b.slug === 'levis')?.id;
    const zaraId = brandIds.rows.find(b => b.slug === 'zara')?.id;

    // Insert sample products
    const products = [
      {
        name: 'Vintage Denim Jacket',
        slug: 'vintage-denim-jacket-001',
        description: 'Classic vintage denim jacket in excellent condition',
        short_description: 'Timeless denim piece',
        category_id: thriftCategoryId,
        brand_id: levisId,
        price: '2499.00',
        original_price: '4999.00',
        condition: 'Very Good',
        size: 'L',
        color: 'Blue',
        material: 'Cotton Denim',
        images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400'],
        is_featured: true,
        is_hot_selling: true,
        stock: 1
      },
      {
        name: 'Eco-Friendly Cotton Tee',
        slug: 'eco-cotton-tee-001',
        description: 'Organic cotton t-shirt made from sustainable materials',
        short_description: 'Sustainable comfort wear',
        category_id: originalsCategoryId,
        brand_id: null,
        price: '899.00',
        original_price: null,
        condition: 'New',
        size: 'M',
        color: 'White',
        material: 'Organic Cotton',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400'],
        is_featured: false,
        is_hot_selling: true,
        stock: 5
      },
      {
        name: 'Recycled Wool Sweater',
        slug: 'recycled-wool-sweater-001',
        description: 'Cozy sweater made from recycled wool fibers',
        short_description: 'Warm and sustainable',
        category_id: originalsCategoryId,
        brand_id: null,
        price: '1899.00',
        original_price: null,
        condition: 'New',
        size: 'S',
        color: 'Green',
        material: 'Recycled Wool',
        images: ['https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400'],
        is_featured: true,
        is_hot_selling: false,
        stock: 3
      },
      {
        name: 'Thrift Store Blazer',
        slug: 'thrift-blazer-001',
        description: 'Professional blazer in great condition',
        short_description: 'Professional style',
        category_id: thriftCategoryId,
        brand_id: zaraId,
        price: '1799.00',
        original_price: '3999.00',
        condition: 'Good',
        size: 'M',
        color: 'Black',
        material: 'Polyester Blend',
        images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400'],
        is_featured: false,
        is_hot_selling: true,
        stock: 1
      }
    ];

    for (const product of products) {
      await client.query(`
        INSERT INTO products (
          name, slug, description, short_description, category_id, brand_id,
          price, original_price, condition, size, color, material, images,
          is_featured, is_hot_selling, stock, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true
        ) ON CONFLICT (slug) DO NOTHING
      `, [
        product.name, product.slug, product.description, product.short_description,
        product.category_id, product.brand_id, product.price, product.original_price,
        product.condition, product.size, product.color, product.material,
        product.images, product.is_featured, product.is_hot_selling, product.stock
      ]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed data inserted successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedData().catch(console.error);
