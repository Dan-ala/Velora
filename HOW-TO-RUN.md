# VELORA - How to Run

## Prerequisites

- Node.js >= 20
- pnpm >= 9

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Set Up Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## 3. Start Servers

### Linux / macOS
```bash
./start-servers.sh
```

### Windows
Double-click `start-servers.bat` or run:
```cmd
start-servers.bat
```

### Manually (any OS)

Open two terminals:

**Terminal 1 — API (port 4000):**
```bash
cd apps/api
npx tsx src/index.ts
```

**Terminal 2 — Web (port 3000):**
```bash
cd apps/web
npx next start -p 3000
```

## 4. Open in Browser

- **Storefront:** http://localhost:3000
- **API Health:** http://localhost:4000/health

## 5. Admin Access

Login at `/auth/login` with the seeded admin account:
- Email: `admin@velora.com`
- Password: set up via Supabase Auth

After login, visit `/admin` to manage products and orders.
