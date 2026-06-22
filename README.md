# VELORA — Wear Your Identity

Premium clothing e-commerce platform built with modern web technologies.

## Architecture

```
velora/
├── apps/
│   ├── api/          # Fastify REST API
│   ├── web/          # Next.js Web App
│   └── mobile/       # React Native Mobile App
├── packages/
│   ├── config/       # Shared configs (eslint, tsconfig, tailwind)
│   ├── types/        # Shared TypeScript types
│   └── shared/       # Shared utilities and constants
├── docker/           # Docker Compose setup
└── ...
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, Framer Motion, Zustand, TanStack Query
- **Backend**: Fastify, Prisma ORM, PostgreSQL
- **Mobile**: React Native, Expo, NativeWind
- **Auth**: Supabase Auth
- **Media**: Cloudinary
- **Payments**: Stripe
- **Realtime**: Supabase Realtime
- **Monorepo**: pnpm, Turborepo

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL
- Supabase account
- Cloudinary account
- Stripe account

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd velora

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed the database
pnpm db:seed

# Start development servers
pnpm dev
```

### Environment Variables

#### API (`apps/api/.env`)

```
DATABASE_URL="postgresql://user:password@localhost:5432/velora"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
JWT_SECRET="your-jwt-secret-min-32-chars"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
FRONTEND_URL="http://localhost:3000"
PORT=4000
NODE_ENV=development
```

#### Web (`apps/web/.env`)

```
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Docker

```bash
docker compose -f docker/docker-compose.yml up
```

## Development

```bash
# Start all apps
pnpm dev

# Start specific app
pnpm --filter @velora/api dev
pnpm --filter @velora/web dev

# Run database commands
pnpm db:migrate
pnpm db:seed
pnpm db:studio

# Build all apps
pnpm build

# Lint
pnpm lint
```

## API Endpoints

### Products
- `GET /api/products` — List products
- `GET /api/products/featured` — Featured products
- `GET /api/products/:id` — Product detail
- `GET /api/products/category/:category` — Products by category

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user

### Cart (authenticated)
- `GET /api/cart` — Get cart
- `POST /api/cart` — Add item
- `PUT /api/cart/:id` — Update quantity
- `DELETE /api/cart/:id` — Remove item

### Orders (authenticated)
- `GET /api/orders` — User orders
- `POST /api/orders` — Create order
- `GET /api/orders/:id` — Order detail

### Admin (admin only)
- `GET /api/admin/products` — List all products
- `POST /api/admin/products` — Create product
- `PUT /api/admin/products/:id` — Update product
- `DELETE /api/admin/products/:id` — Delete product
- `GET /api/admin/orders` — List all orders
- `PUT /api/admin/orders/:id/status` — Update order status

## Deployment

### Web (Vercel)

```bash
vercel deploy --prod
```

### API (Render)

Connect GitHub repository and set build command to `pnpm build` and start command to `pnpm --filter @velora/api start`.

## License

MIT
