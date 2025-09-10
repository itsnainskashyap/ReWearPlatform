// Seed famous brands for ReWeara  
import { db } from './storage.js';
import { brands } from '../shared/schema.js';

const famousBrands = [
  {
    name: "ZARA",
    slug: "zara",
    description: "Spanish multinational clothing retailer known for fast fashion",
    logoUrl: "https://logos-world.net/wp-content/uploads/2020/04/Zara-Logo.png",
    isActive: true,
    isFeatured: true,
    sortOrder: 1
  },
  {
    name: "H&M",
    slug: "hm",
    description: "Swedish multinational retail-clothing company known for fast-fashion",
    logoUrl: "https://logos-world.net/wp-content/uploads/2020/04/HM-Logo.png",
    isActive: true,
    isFeatured: true,
    sortOrder: 2
  },
  {
    name: "DIOR", 
    slug: "dior",
    description: "French luxury fashion house controlled by LVMH",
    logoUrl: "https://logos-world.net/wp-content/uploads/2020/04/Dior-Logo.png",
    isActive: true,
    isFeatured: true,
    sortOrder: 3
  },
  {
    name: "Calvin Klein",
    slug: "calvin-klein", 
    description: "American fashion house and luxury goods company",
    logoUrl: "https://logos-world.net/wp-content/uploads/2020/04/Calvin-Klein-Logo.png",
    isActive: true,
    isFeatured: true,
    sortOrder: 4
  },
  {
    name: "Louis Vuitton",
    slug: "louis-vuitton",
    description: "French luxury fashion house and company",
    logoUrl: "https://logos-world.net/wp-content/uploads/2020/04/Louis-Vuitton-Logo.png", 
    isActive: true,
    isFeatured: true,
    sortOrder: 5
  }
];

async function seedBrands() {
  try {
    console.log('Starting to seed famous brands...');
    
    for (const brand of famousBrands) {
      await db.insert(brands).values(brand).onConflictDoNothing();
      console.log(`Added brand: ${brand.name}`);
    }
    
    console.log('Successfully seeded all famous brands!');
  } catch (error) {
    console.error('Error seeding brands:', error);
  }
}

// Run the seed function
seedBrands();