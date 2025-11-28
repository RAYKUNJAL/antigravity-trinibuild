# TriniBuild Backend

Backend API for the multi-vendor marketplace platform serving Trinidad & Tobago.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run migrations
npm run migrate

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

## Architecture

- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Real-time:** Socket.io
- **Authentication:** JWT + bcrypt
- **Payments:** Stripe + TTD Gateways
- **Storage:** AWS S3
- **Queue:** Bull (Redis)

## Environment Variables

See `.env.example` for all required variables.

## API Documentation

All endpoints are documented in `/docs/api.md`

## Project Structure

```
src/
  ├── server.ts           # Entry point
  ├── config/             # Configuration
  ├── controllers/        # Route handlers
  ├── services/           # Business logic
  ├── models/             # Database models
  ├── middleware/         # Express middleware
  ├── routes/             # API routes
  ├── utils/              # Utilities
  ├── types/              # TypeScript types
  └── sockets/            # Socket.io handlers
```

## Contributing

1. Create feature branch: `git checkout -b feature/xyz`
2. Commit changes: `git commit -am 'Add feature xyz'`
3. Push to branch: `git push origin feature/xyz`
4. Create Pull Request

## License

MIT
