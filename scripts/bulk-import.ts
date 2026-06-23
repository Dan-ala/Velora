import { readFileSync } from 'fs';

const API_URL = process.env.API_URL || 'https://velora-api-w930.onrender.com/api';
const token = process.argv[2];
const filePath = process.argv[3] || 'scripts/products.json';

if (!token) {
  console.error('Usage: API_URL=<url> npx tsx scripts/bulk-import.ts <your-token> [products.json]');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
};

interface ProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
}

async function main() {
  const raw = readFileSync(filePath, 'utf-8');
  const products: ProductInput[] = JSON.parse(raw);

  let created = 0;
  let errors = 0;

  for (const product of products) {
    try {
      const res = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(product),
      });

      const json = await res.json() as any;

      if (!res.ok) {
        console.error(`FAILED "${product.name}": ${json.error || res.status}`);
        errors++;
        continue;
      }

      console.log(`CREATED "${product.name}" (${json.data.id})`);
      created++;
    } catch (err: any) {
      console.error(`ERROR "${product.name}": ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone. ${created} created, ${errors} failed.`);
}

main().catch(console.error);
