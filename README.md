# MediBook - Doctor Appointment Booking Platform

A full-stack healthcare appointment booking system that connects patients with doctors. Patients can discover doctors, check real-time availability, and book appointments online. Doctors can manage their profiles, publish time slots, and track appointments.

**Live Demo**: [Coming Soon - Deploy to Vercel + Railway]

---

## 🎯 Features

### For Patients
- 🔐 **User Authentication** - Secure registration and login with JWT tokens
- 🔍 **Doctor Discovery** - Search and filter doctors by specialty, location, and price
- 📅 **Real-time Booking** - View available slots and book appointments instantly
- 📋 **Appointment Management** - View, cancel, or reschedule appointments
- ⭐ **Reviews & Ratings** - Leave feedback after completed appointments
- 🔔 **Appointment History** - Track past, upcoming, and cancelled appointments

### For Doctors
- 👤 **Profile Management** - Create and update professional profiles
- 📍 **Clinic Information** - Add specialty, location, consultation price, and bio
- ⏰ **Slot Management** - Create and manage available time slots
- 📊 **Appointment Dashboard** - View all bookings and patient details
- ⭐ **Patient Reviews** - See ratings and feedback from patients

### Technical Features
- 🚀 **Optimized Performance** - Redis caching for doctor listings
- 🔒 **Security** - JWT authentication, password hashing (bcrypt), rate limiting
- 💾 **Database** - PostgreSQL with Prisma ORM for type-safe queries
- 🎨 **Modern UI** - Framer Motion animations, Tailwind CSS responsive design
- 📱 **Mobile-Friendly** - Fully responsive across all devices

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Express.js, TypeScript, Prisma ORM, PostgreSQL |
| **Authentication** | JWT (jsonwebtoken), bcrypt |
| **Caching** | Redis (IORedis) |
| **Logging** | Winston |
| **HTTP Client** | Axios with interceptors |

### Project Structure

```
Doctor-Booking-Platform/
├── doctor-booking-frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/                      # Next.js App Router pages
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── login/                # Patient/Doctor login
│   │   │   ├── register/             # User registration (dual role)
│   │   │   ├── doctors/              # Doctor directory & search
│   │   │   │   └── [id]/             # Doctor detail & booking
│   │   │   ├── doctor/               # Doctor-only routes
│   │   │   │   ├── create-profile/   # Setup profile
│   │   │   │   └── dashboard/        # Appointment management
│   │   │   └── my-appointments/      # Patient appointment history
│   │   ├── components/               # Reusable React components
│   │   │   ├── auth/                 # Auth forms & layout
│   │   │   └── layout/               # Navbar & navigation
│   │   └── lib/
│   │       └── api.ts                # Axios instance & interceptors
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
└── doctor-booking-backend/           # Express backend API
    ├── src/
    │   ├── server.ts                 # Entry point
    │   ├── app.ts                    # Express app config (middleware, routes)
    │   ├── routes/                   # API route definitions
    │   │   ├── auth.routes.ts        # Authentication endpoints
    │   │   ├── doctor.routes.ts      # Doctor CRUD & search
    │   │   ├── slot.routes.ts        # Slot management
    │   │   ├── appointment.routes.ts # Booking & cancellation
    │   │   └── review.routes.ts      # Reviews & ratings
    │   ├── controllers/              # Request handlers & business logic
    │   ├── middleware/               # Auth, role authorization, error handling
    │   ├── lib/                      # Utilities (Prisma, Redis, logger)
    │   └── config/                   # Environment configuration
    ├── prisma/
    │   └── schema.prisma             # Database schema & models
    ├── package.json
    └── tsconfig.json
```

### Data Flow

```
User Request (Frontend)
        ↓
   Axios Instance (adds JWT token)
        ↓
   Express Middleware (auth, rate-limiting, logging)
        ↓
   Route Handler → Controller (business logic)
        ↓
   Prisma ORM → PostgreSQL Database
        ↓
   Response + Status Code
        ↓
   Frontend State Update
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Redis server (optional, for caching)

### Backend Setup

```bash
cd doctor-booking-backend

# 1. Install dependencies
npm install

# 2. Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/doctor_booking"
JWT_SECRET="your_super_secret_jwt_key_change_this"
PORT=5000
CORS_ORIGIN="http://localhost:3000"
REDIS_URL="redis://localhost:6379"
EOF

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run database migrations
npm run prisma:migrate

# 5. Start development server
npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd doctor-booking-frontend

# 1. Install dependencies
npm install

# 2. Create .env.local file (optional)
cat > .env.local << EOF
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
EOF

# 3. Start development server
npm run dev
# App runs on http://localhost:3000
```

### Database Setup (PostgreSQL)

```bash
# Create database
createcreatedb doctor_booking

# Run migrations (already done with npm run prisma:migrate)

# Seed test data (optional)
# npx prisma db seed  # if seed.ts exists
```

---

🗄️ Entity‑Relationship Diagram (Text Description)
┌─────────────────────────────────────────────────────────────┐
│                          User                              │
├─────────────────────────────────────────────────────────────┤
│ id (PK)         UUID                                      │
│ name             String                                   │
│ email            String (unique)                          │
│ password         String                                   │
│ role             Role (PATIENT / DOCTOR / ADMIN)          │
│ createdAt        DateTime                                 │
│ updatedAt        DateTime                                 │
│ timezone         String? (NEW) default="UTC"              │
│                                                           │
│ + hasOne DoctorProfile                                    │
│ + hasMany PatientAppointments (as patient)                │
│ + hasMany DoctorAppointments (as doctor)                 │
│ + hasMany Reviews                                         │
└─────────────────────────────────────────────────────────────┘
         │1                    │1
         │                     │
         ▼                     ▼
┌─────────────────────┐ ┌─────────────────────────────────────┐
│   DoctorProfile     │ │          Appointment                │
├─────────────────────┤ ├─────────────────────────────────────┤
│ id (PK)   UUID      │ │ id (PK)          UUID              │
│ userId (FK) String  │ │ patientId (FK)   String            │
│ speciality String   │ │ doctorId (FK)    String            │
│ bio String?         │ │ slotId (FK)      String (unique)   │
│ clinicAddress String│ │ status           AppointmentStatus  │
│ city String         │ │ notes            String?            │
│ price Float         │ │ reminderSent     Boolean (NEW)     │
│ createdAt DateTime  │ │ reminderJobId    String? (NEW)     │
│ updatedAt DateTime  │ │ createdAt        DateTime          │
│                     │ │ updatedAt        DateTime          │
│ + belongsTo User    │ │                                   │
│ + hasMany Slots     │ │ + belongsTo Patient (User)        │
│ + hasMany Reviews   │ │ + belongsTo Doctor (User)         │
└─────────────────────┘ │ + belongsTo Slot                  │
         │1              └─────────────────────────────────────┘
         │1                         │1
         ▼                          │
┌─────────────────────┐             │
│       Slot          │             │
├─────────────────────┤             │
│ id (PK)   UUID      │             │
│ doctorId (FK) String│             │
│ startTime DateTime  │             │
│ endTime   DateTime  │             │
│ isBooked  Boolean   │             │
│ createdAt DateTime  │             │
│ updatedAt DateTime  │             │
│                     │             │
│ + belongsTo DoctorProfile        │
│ + hasOne Appointment             │
└─────────────────────┘             │
                                    │
┌─────────────────────┐             │
│      Review         │             │
├─────────────────────┤             │
│ id (PK)   UUID      │             │
│ rating    Int       │             │
│ comment   String?   │             │
│ patientId (FK)      │             │
│ doctorId (FK)       │             │
│ createdat DateTime  │             │
│                     │             │
│ + belongsTo Patient (User)       │
│ + belongsTo Doctor (DoctorProfile)│
└─────────────────────┘             │

## 📚 API Documentation

See [API.md](./API.md) for complete API endpoint documentation.

### Quick API Overview

```bash
# Authentication
POST   /api/auth/register        # Create new user account
POST   /api/auth/login           # Login with email & password
GET    /api/auth/me              # Get current user profile

# Doctors
GET    /api/doctors              # List all doctors (with filters)
GET    /api/doctors/:id          # Get doctor details & slots
GET    /api/doctors/cities       # Get list of cities with doctors
POST   /api/doctors              # Create doctor profile

# Slots (time availability)
GET    /api/slots/doctor/:id     # Get doctor's slots
GET    /api/slots/my             # Get my slots (doctor only)
POST   /api/slots                # Create new slot

# Appointments
GET    /api/appointments/my      # Get my appointments
POST   /api/appointments         # Book an appointment
PATCH  /api/appointments/:id/cancel    # Cancel appointment

# Reviews
GET    /api/reviews/doctor/:id   # Get doctor's reviews
GET    /api/reviews/my/:id       # Get my review for a doctor
POST   /api/reviews              # Submit a review
```

---

## 🔐 Authentication Flow

1. **Register** - User creates account with email, password, name, and role (PATIENT/DOCTOR)
2. **Password Hashing** - Bcrypt hashes password with salt factor 10
3. **JWT Token** - Backend signs token with user ID, email, and role
4. **Storage** - Frontend stores token in localStorage
5. **API Requests** - Axios interceptor automatically adds `Authorization: Bearer {token}` header
6. **Token Verification** - Backend middleware verifies token on protected routes
7. **Role Authorization** - Additional middleware checks user role for role-specific endpoints

---

## 📊 Database Schema

### Key Models

**User**
- id (UUID, primary key)
- name, email, password (hashed)
- role (PATIENT | DOCTOR | ADMIN)
- createdAt, updatedAt
- timezone
**DoctorProfile**
- id (UUID)
- userId (foreign key to User)
- speciality, bio, clinicAddress, city
- price (consultation fee)
- createdAt, updatedAt
- Indexes: city, speciality

**Slot**
- id (UUID)
- doctorId (foreign key)
- startTime, endTime
- isBooked (boolean)
- createdAt, updatedAt
- Indexes: doctorId, startTime, isBooked

**Appointment**
- id (UUID)
- patientId, doctorId (foreign keys)
- slotId (unique, one appointment per slot)
- status (BOOKED | CANCELLED | COMPLETED)
- reminderSent
- reminderJobId
- notes
- createdAt, updatedAt
- Indexes: patientId, doctorId, status

**Review**
- id (UUID)
- patientId, doctorId (foreign keys)
- rating (1-5)
- comment (optional)
- createdAt

---

## 🛡️ Security Features

✅ **Password Security** - Bcrypt hashing (salt rounds: 10)
✅ **JWT Authentication** - Secure token-based auth
✅ **Rate Limiting** - Global (100 req/15min) and auth-specific (10 attempts/15min)
✅ **CORS** - Configurable origin whitelist
✅ **Input Validation** - Schema validation on all endpoints
✅ **Error Messages** - Generic error messages (don't leak internal details)
✅ **SQL Injection Protection** - Prisma parameterized queries

---
🧩 External Services (Architecture Overview)
While the ERD covers the database, the following external services are now part of your system:

Service	Purpose	Interaction
Redis	Caching + BullMQ job storage	Connected via src/lib/redis.ts. Caches /doctors list; stores BullMQ jobs.
BullMQ	Job queue for reminders	Schedules and processes reminder jobs 24h before appointment.
Nodemailer + SMTP	Email delivery	Sends reminder emails via Gmail or SendGrid.
Winston	Structured logging	Logs all important events (job creation, email sent, errors).


## 🚀 Deployment

### Frontend (Vercel - Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Deploy to Vercel
# - Go to https://vercel.com
# - Import your GitHub repo
# - Set environment variables: NEXT_PUBLIC_API_URL
# - Click Deploy
```

### Backend (Railway, Render, or Heroku)

**Railway** (recommended):
```bash
# 1. Connect PostgreSQL database
# 2. Set environment variables (DATABASE_URL, JWT_SECRET, etc.)
# 3. Deploy from GitHub
```

---

## 📝 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/db_name

# JWT
JWT_SECRET=your_super_secret_key_here

# Server
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)
```env
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🧪 Testing

```bash
# Backend
cd doctor-booking-backend
npm run test              # Run all tests
npm run test:watch       # Watch mode

# Frontend
cd doctor-booking-frontend
npm run test              # Run all tests
npm run test:e2e          # End-to-end tests
```

---

## 🐛 Common Issues & Fixes

### "Cannot connect to database"
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running: `psql -U postgres`
- Run migrations: `npm run prisma:migrate`

### "JWT errors / Unauthorized"
- Verify JWT_SECRET is set and consistent
- Check token is stored in localStorage
- Ensure Authorization header is sent: `Authorization: Bearer {token}`

### "CORS errors"
- Verify CORS_ORIGIN matches your frontend URL
- Check credentials mode in Axios config

### "Slots not showing"
- Ensure endTime > current time (doctor.controller.ts filters past slots)
- Check isBooked is false

---

## 📈 Performance Optimizations

✅ **Redis Caching** - Doctor listings cached for faster searches
✅ **Database Indexes** - City, speciality, status, timestamp columns indexed
✅ **Lazy Loading** - Slots and reviews loaded on-demand
✅ **Pagination** - Large datasets paginated (if implemented)
✅ **Query Optimization** - Prisma select/include to fetch only needed fields
✅ **Frontend Optimization** - React Compiler enabled, Framer Motion GPU acceleration

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👨‍💻 Author

**Khalifa** - [GitHub Profile](https://github.com/khalifacastaway11)

---

## 📞 Support

For issues, questions, or suggestions:
- Open an Issue on GitHub
- Contact: [your email]

---

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/docs/)
- [JWT Authentication](https://jwt.io/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Made with ❤️ by [Khalifa]**
