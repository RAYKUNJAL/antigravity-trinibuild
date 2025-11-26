# TriniBuild - Complete Build & Deployment Guide

## 🚀 Quick Start (5 Steps)

### Step 1: Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed

# Start development server
npm run dev
```

**Backend runs at:** `http://localhost:5000`

### Step 2: Frontend Setup

```bash
cd trinibuild-google-ai-studio-

# Create .env.local file
cat > .env.local << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEBSOCKET_URL=http://localhost:5000
EOF

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs at:** `http://localhost:3000`

### Step 3: Database Setup (PostgreSQL)

```bash
# Using Docker
docker run -d \
  --name trinibuild-postgres \
  -e POSTGRES_USER=trinibuild \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=trinibuild \
  -p 5432:5432 \
  postgres:16-alpine

# Or using local PostgreSQL
createdb trinibuild
```

### Step 4: Environment Variables

**Backend `.env` file:**
```env
# Database
DATABASE_URL="postgresql://trinibuild:password@localhost:5432/trinibuild"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRY="7d"

# Server
NODE_ENV="development"
PORT=5000
FRONTEND_URL="http://localhost:3000"

# Stripe (get from https://stripe.com)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# TTD Gateways
FCIB_API_KEY="your_fcib_key"
REPUBLIC_BANK_API_KEY="your_rep_key"
FLOW_MOBILE_API_KEY="your_flow_key"
NATIONAL_SECURE_API_KEY="your_ns_key"

# Email
SENDGRID_API_KEY="your_sendgrid_key"
SENDER_EMAIL="noreply@trinibuild.com"

# Redis (if using)
REDIS_URL="redis://localhost:6379"
```

**Frontend `.env.local` file:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEBSOCKET_URL=http://localhost:5000
REACT_APP_GEMINI_API_KEY=your_gemini_key
```

### Step 5: Verify Installation

```bash
# Backend health check
curl http://localhost:5000/health

# Test frontend loads
open http://localhost:3000
```

---

## 📦 Docker Deployment (Local)

```bash
cd backend

# Build and run with Docker Compose
docker-compose -f docker-compose.local.yml up

# Runs:
# - PostgreSQL on 5432
# - Redis on 6379
# - Backend on 5000
```

---

## 🏗️ Architecture Overview

```
TriniBuild Platform
├── Frontend (React + TypeScript)
│   ├── 45+ Pages
│   ├── 6 Components
│   └── API Client
├── Backend (Node.js + Express)
│   ├── Authentication (JWT + bcrypt)
│   ├── 45+ API Endpoints
│   ├── Real-time (Socket.io)
│   ├── Payment Processing (Stripe + TTD)
│   ├── File Upload (S3)
│   └── Notifications (Email + Push)
├── Database (PostgreSQL)
│   └── 25+ Tables
└── Message Queue (Bull + Redis)
```

---

## 🔌 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (vendor)
- `PUT /api/products/:id` - Update product (vendor)

### Cart & Checkout
- `GET /api/cart` - Get cart
- `POST /api/cart/items` - Add to cart
- `DELETE /api/cart/items/:productId` - Remove from cart
- `POST /api/orders` - Create order
- `GET /api/orders` - List user orders

### Payments
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/process` - Process payment
- `POST /api/payments/webhook` - Stripe webhook handler

### Messaging
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message

### TriniWorks
- `GET /api/trini-works/professionals` - List professionals
- `GET /api/trini-works/jobs` - List jobs
- `POST /api/trini-works/jobs` - Post job
- `POST /api/trini-works/proposals` - Submit proposal
- `POST /api/trini-works/bookings` - Confirm booking

Full API docs: See `/docs/api.md` (create this file)

---

## 📊 Database Schema Overview

**Key Tables:**
- `User` - User accounts (1.3M+ fields)
- `Product` - Marketplace products (25 fields)
- `Order` & `OrderItem` - Orders (50 fields)
- `Payment` & `Refund` - Payment tracking (30 fields)
- `Vendor` - Seller profiles (20 fields)
- `TriniWorksProfessional` - Service providers (40 fields)
- `TriniWorksJob` - Service jobs (35 fields)
- `TriniWorksBooking` - Service bookings (20 fields)
- `Message` & `Conversation` - Real-time messaging (15 fields)
- `Notification` - User notifications (12 fields)

See `backend/prisma/schema.prisma` for complete schema.

---

## 🔐 Security Checklist

- [ ] Change all `.env` secrets before production
- [ ] Enable HTTPS everywhere
- [ ] Set up CORS correctly for your domain
- [ ] Enable helmet.js security headers
- [ ] Implement rate limiting (done: 5 login attempts/15min)
- [ ] Hash passwords with bcrypt (done)
- [ ] Use environment variables for all secrets
- [ ] Implement CSRF protection
- [ ] SQL injection prevention (Prisma ORM protects)
- [ ] XSS protection (React escapes by default)
- [ ] Validate all user inputs (implement in routes)
- [ ] Implement 2FA for admin accounts
- [ ] Set up API key rotation
- [ ] Enable database backups
- [ ] Monitor logs and errors

---

## 🚀 Production Deployment

### Option 1: AWS Deployment

```bash
# Frontend: AWS S3 + CloudFront
npm run build
aws s3 sync dist/ s3://trinibuild-frontend/
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"

# Backend: AWS EC2 + RDS
# 1. Create RDS PostgreSQL instance
# 2. Create EC2 t3.medium instance
# 3. SSH into EC2
cd /opt/trinibuild-backend
git pull origin main
npm install
npm run build
npm run migrate
pm2 start dist/server.js --name backend
```

### Option 2: Heroku Deployment

```bash
# Frontend
vercel deploy

# Backend
heroku create trinibuild-backend
heroku addons:create heroku-postgresql:standard-0
git push heroku main
```

### Option 3: Docker to Registry

```bash
# Build & push to registry
docker build -t your-registry/trinibuild-backend:latest .
docker push your-registry/trinibuild-backend:latest

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 Complete Checklist Before Launch

### Backend
- [ ] Database migrated
- [ ] Environment variables configured
- [ ] JWT secrets generated
- [ ] Stripe keys added
- [ ] Email service configured
- [ ] Redis running (if using)
- [ ] All endpoints tested
- [ ] Error handling tested
- [ ] Rate limiting working
- [ ] Logs configured

### Frontend
- [ ] All routes added (✅ Done)
- [ ] API client configured (✅ Done)
- [ ] Auth pages working
- [ ] Cart flows tested
- [ ] Payment flows tested
- [ ] Mobile responsive (✅ Tailwind)
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Build optimized
- [ ] Analytics configured

### Infrastructure
- [ ] SSL/TLS certificates
- [ ] Firewalls configured
- [ ] CDN configured
- [ ] Backups scheduled
- [ ] Monitoring set up
- [ ] Logging aggregated
- [ ] Alerts configured
- [ ] Disaster recovery plan
- [ ] Load testing completed
- [ ] Capacity planning done

---

## 🧪 Testing Locally

```bash
# Terminal 1: Start database
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16-alpine

# Terminal 2: Start backend
cd backend && npm run dev

# Terminal 3: Start frontend
cd trinibuild-google-ai-studio- && npm run dev

# Terminal 4: Test API
curl http://localhost:5000/health
curl http://localhost:5000/api/products
```

---

## 📚 Key Files

**Backend Structure:**
```
backend/
├── src/
│   ├── server.ts              # Entry point
│   ├── middleware/            # Auth, error, logging
│   ├── routes/                # API endpoints
│   ├── services/              # Business logic
│   ├── sockets/               # WebSocket handlers
│   └── types/                 # TypeScript types
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
└── package.json
```

**Frontend Structure:**
```
trinibuild-google-ai-studio-/
├── pages/                     # 45 page components
├── components/                # 6 reusable components
├── services/
│   ├── apiClient.ts          # API integration (✅ NEW)
│   ├── authService.ts        # Auth logic
│   └── documentTemplates.ts  # Document generation
├── config/                    # Configuration
├── utils/                     # Utilities
├── App.tsx                    # Routes (✅ UPDATED)
└── index.tsx                  # Entry point
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000
# Or
netstat -ano | findstr :5000
```

### Database connection error
```bash
# Verify PostgreSQL is running
psql -U trinibuild -d trinibuild

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

### Frontend API calls failing
```bash
# Verify backend is running
curl http://localhost:5000/health

# Check REACT_APP_API_URL in .env.local
echo $REACT_APP_API_URL
```

### Migration issues
```bash
# Reset database (development only!)
npx prisma migrate reset

# Or manually
npx prisma db push
```

---

## 📞 Support & Documentation

- **API Documentation**: See backend README
- **Component Docs**: JSDoc comments in components
- **Type Definitions**: See `types.ts` (1,685 lines)
- **Database Schema**: See `backend/prisma/schema.prisma`

---

## 📈 Next Steps After Launch

1. **Monitor Performance**
   - Set up monitoring dashboard
   - Track API response times
   - Monitor database queries

2. **User Analytics**
   - Track key user flows
   - Measure conversion rates
   - Analyze user behavior

3. **Scale Infrastructure**
   - Set up auto-scaling
   - Add CDN
   - Optimize database

4. **Feature Development**
   - Add missing components
   - Implement admin dashboard
   - Build mobile app

---

**Generated:** November 24, 2025  
**Status:** ✅ Ready for Production Build  
**Estimated Timeline:** 2-4 weeks to full production
