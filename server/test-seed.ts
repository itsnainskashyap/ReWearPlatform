import { seedDatabase } from "./seed";

async function testSeed() {
  try {
    console.log('Testing snapshot-based seeding...');
    await seedDatabase();
    console.log('SUCCESS: Snapshot-based seeding completed');
  } catch (error) {
    console.error('ERROR: Seeding failed:', error);
  }
}

testSeed();