import { readFileSync } from 'fs';

const API_URL = process.env.API_URL || 'https://velora-api-w930.onrender.com/api';
const token = process.argv[2];

if (!token) {
  console.error('Usage: API_URL=<url> npx tsx scripts/migrate-categories.ts <your-token>');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
};

const OLD_TO_NEW: Record<string, string> = {
  shirts: 'camisetas',
  hoodies: 'buzos',
  shoes: 'zapatos',
  pants: 'pantalones',
  accessories: 'accesorios',
  outerwear: 'abrigos',
};

async function main() {
  const res = await fetch(`${API_URL}/admin/products?limit=100`, { headers });
  const json = await res.json() as any;
  const products = json.data || [];

  let updated = 0;
  for (const p of products) {
    const newCat = OLD_TO_NEW[p.category];
    if (!newCat) continue;

    console.log(`Migrating "${p.name}": ${p.category} → ${newCat}`);
    await fetch(`${API_URL}/admin/products/${p.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ category: newCat }),
    });
    updated++;
  }

  console.log(`Done. ${updated} product(s) migrated.`);
}

main().catch(console.error);
