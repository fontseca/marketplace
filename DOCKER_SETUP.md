# Docker Database Setup

This project uses Docker Compose to run a PostgreSQL database locally.

## Quick Start

1. **Start the database:**
   ```bash
   npm run db:up
   ```
   Or manually:
   ```bash
   docker-compose up -d
   ```

2. **Configure your `.env.local` file:**
   ```env
   DATABASE_URL=postgresql://postgres:123@localhost:5432/marketplace
   ```

3. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

4. **Generate Prisma Client (if needed):**
   ```bash
   npm run prisma:generate
   ```

## Database Credentials

- **User:** postgres
- **Password:** 123
- **Database:** marketplace
- **Port:** 5432

## Useful Commands

- **Start database:** `npm run db:up` or `docker-compose up -d`
- **Stop database:** `npm run db:down` or `docker-compose down`
- **View logs:** `npm run db:logs` or `docker-compose logs -f postgres`
- **Reset database (removes all data):** `npm run db:reset` or `docker-compose down -v && docker-compose up -d`

## Accessing the Database

You can connect to the database using any PostgreSQL client:
- **Host:** localhost
- **Port:** 5432
- **User:** postgres
- **Password:** 123
- **Database:** marketplace

Or use Prisma Studio:
```bash
npm run prisma:studio
```

