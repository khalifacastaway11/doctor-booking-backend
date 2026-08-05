# MediBook API Documentation

Complete REST API reference for the MediBook doctor appointment booking platform.

**Base URL**: `http://localhost:5000/api` (development)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Doctors](#doctors)
3. [Slots](#slots)
4. [Appointments](#appointments)
5. [Reviews](#reviews)
6. [Error Handling](#error-handling)

---

## Authentication

### Register User

Create a new user account (Patient or Doctor).

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Ahmed Mohamed",
  "email": "ahmed@example.com",
  "password": "securePassword123",
  "role": "PATIENT"  // or "DOCTOR"
}
```

**Response** (201 Created)
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "name": "Ahmed Mohamed",
    "email": "ahmed@example.com",
    "role": "PATIENT",
    "createdAt": "2024-07-08T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**
- `400 Bad Request` - Missing required fields
- `400 Bad Request` - Email already in use

---

### Login

Authenticate user and receive JWT token.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK)
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "name": "Ahmed Mohamed",
    "email": "ahmed@example.com",
    "role": "PATIENT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**
- `400 Bad Request` - Email or password missing
- `401 Unauthorized` - Invalid email or password
- `429 Too Many Requests` - Rate limited (max 10 attempts per 15 min)

---

### Get Current User

Retrieve authenticated user's profile.

```http
GET /auth/me
Authorization: Bearer {token}
```

**Response** (200 OK)
```json
{
  "user": {
    "id": "uuid-here",
    "name": "Ahmed Mohamed",
    "email": "ahmed@example.com",
    "role": "PATIENT",
    "createdAt": "2024-07-08T10:30:00Z"
  }
}
```

**Error Responses**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found

---

## Doctors

### List Doctors (with Filters)

Get all doctors with optional search, location, and price filtering.

```http
GET /doctors?search=cardiologist&city=Cairo&minPrice=500&maxPrice=1000&sort=price_asc
```

**Query Parameters**
| Parameter | Type | Description | Example |
|-----------|------|-------------|----------|
| `search` | string | Search by name or specialty | `cardiologist` |
| `city` | string | Filter by city (exact match) | `Cairo` |
| `minPrice` | number | Minimum consultation price (EGP) | `500` |
| `maxPrice` | number | Maximum consultation price (EGP) | `1000` |
| `sort` | string | Sort by `price_asc`, `price_desc`, or default (name) | `price_asc` |

**Response** (200 OK)
```json
{
  "doctors": [
    {
      "id": "doctor-uuid",
      "speciality": "Cardiologist",
      "city": "Cairo",
      "price": 750,
      "bio": "Experienced cardiologist with 10+ years...",
      "clinicAddress": "123 Medical Street, Cairo",
      "user": {
        "id": "user-uuid",
        "name": "Dr. Ali Hassan",
        "email": "dr.ali@example.com"
      }
    }
  ]
}
```

**Caching**: Results cached for 5 minutes in Redis

---

### Get Doctor Details

Retrieve detailed doctor profile including available slots and reviews.

```http
GET /doctors/:id
```

**Response** (200 OK)
```json
{
  "doctor": {
    "id": "doctor-uuid",
    "speciality": "Cardiologist",
    "city": "Cairo",
    "price": 750,
    "bio": "Experienced cardiologist with 10+ years of experience in treating heart conditions.",
    "clinicAddress": "123 Medical Street, Cairo",
    "user": {
      "id": "user-uuid",
      "name": "Dr. Ali Hassan",
      "email": "dr.ali@example.com"
    },
    "slots": [
      {
        "id": "slot-uuid-1",
        "startTime": "2024-07-10T10:00:00Z",
        "endTime": "2024-07-10T10:30:00Z",
        "isBooked": false
      },
      {
        "id": "slot-uuid-2",
        "startTime": "2024-07-10T10:30:00Z",
        "endTime": "2024-07-10T11:00:00Z",
        "isBooked": false
      }
    ]
  }
}
```

**Notes**
- Only shows slots where `isBooked = false` and `endTime > now()`
- Sorted by start time ascending

**Error Responses**
- `400 Bad Request` - Invalid doctor ID
- `404 Not Found` - Doctor not found

---

### Get Cities

Get list of all cities with doctors.

```http
GET /doctors/cities
```

**Response** (200 OK)
```json
{
  "cities": [
    "Cairo",
    "Alexandria",
    "Giza",
    "Ismailia"
  ]
}
```

---

### Create Doctor Profile

Create a doctor profile (Doctor role only).

```http
POST /doctors
Authorization: Bearer {token}
Content-Type: application/json

{
  "speciality": "Cardiologist",
  "city": "Cairo",
  "clinicAddress": "123 Medical Street, Cairo",
  "price": 750,
  "bio": "Experienced cardiologist with 10+ years of experience"
}
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `speciality` | string | ✅ | Doctor's specialty |
| `city` | string | ✅ | Clinic location |
| `clinicAddress` | string | ✅ | Full clinic address |
| `price` | number | ✅ | Consultation fee (EGP) |
| `bio` | string | ❌ | Professional biography |

**Response** (201 Created)
```json
{
  "message": "Doctor profile created successfully",
  "doctorProfile": {
    "id": "doctor-uuid",
    "userId": "user-uuid",
    "speciality": "Cardiologist",
    "city": "Cairo",
    "clinicAddress": "123 Medical Street, Cairo",
    "price": 750,
    "bio": "Experienced cardiologist...",
    "user": {
      "id": "user-uuid",
      "name": "Dr. Ali Hassan",
      "email": "dr.ali@example.com",
      "role": "DOCTOR"
    }
  }
}
```

**Error Responses**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not a DOCTOR
- `400 Bad Request` - Missing required fields
- `409 Conflict` - Doctor profile already exists

---

## Slots

### Create Slot

Create an available time slot (Doctor only).

```http
POST /slots
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2024-07-10",
  "startTime": "10:00",
  "endTime": "10:30"
}
```

**Request Body**
| Field | Type | Format | Description |
|-------|------|--------|-------------|
| `date` | string | YYYY-MM-DD | Appointment date |
| `startTime` | string | HH:mm | Start time (24-hour) |
| `endTime` | string | HH:mm | End time (24-hour) |

**Response** (201 Created)
```json
{
  "message": "Slot is created successfully",
  "slot": {
    "id": "slot-uuid",
    "doctorId": "doctor-uuid",
    "startTime": "2024-07-10T10:00:00Z",
    "endTime": "2024-07-10T10:30:00Z",
    "isBooked": false,
    "createdAt": "2024-07-08T10:30:00Z"
  }
}
```

**Error Responses**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not a DOCTOR
- `400 Bad Request` - Start time must be before end time
- `404 Not Found` - Doctor profile not found

---

### Get Doctor's Slots

Get all available slots for a specific doctor.

```http
GET /slots/doctor/:doctorId
```

**Response** (200 OK)
```json
{
  "slots": [
    {
      "id": "slot-uuid-1",
      "doctorId": "doctor-uuid",
      "startTime": "2024-07-10T10:00:00Z",
      "endTime": "2024-07-10T10:30:00Z",
      "isBooked": false
    }
  ]
}
```

---

### Get My Slots

Get all slots created by the authenticated doctor.

```http
GET /slots/my
Authorization: Bearer {token}
```

**Response** (200 OK)
```json
{
  "slots": [
    {
      "id": "slot-uuid",
      "doctorId": "doctor-uuid",
      "startTime": "2024-07-10T10:00:00Z",
      "endTime": "2024-07-10T10:30:00Z",
      "isBooked": false
    }
  ]
}
```

**Error Responses**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not a DOCTOR

---

## Appointments

### Book Appointment

Book an available appointment slot (Patient only).

```http
POST /appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "slotId": "slot-uuid",
  "notes": "Follow-up for hypertension check"
}
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slotId` | string (UUID) | ✅ | Available slot ID |
| `notes` | string | ❌ | Additional appointment notes |

**Response** (201 Created)
```json
{
  "message": "Appointment booked successfully",
  "appointment": {
    "id": "appointment-uuid",
    "patientId": "patient-user-uuid",
    "doctorId": "doctor-user-uuid",
    "slotId": "slot-uuid",
    "status": "BOOKED",
    "notes": "Follow-up for hypertension check",
    "patient": {
      "id": "patient-uuid",
      "name": "Ahmed Mohamed",
      "email": "ahmed@example.com"
    },
    "doctor": {
      "id": "doctor-uuid",
      "name": "Dr. Ali Hassan",
      "email": "dr.ali@example.com"
    },
    "slot": {
      "id": "slot-uuid",
      "startTime": "2024-07-10T10:00:00Z",
      "endTime": "2024-07-10T10:30:00Z"
    },
    "createdAt": "2024-07-08T10:30:00Z"
  }
}
```

**Error Responses**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not a PATIENT
- `400 Bad Request` - slotId is required
- `404 Not Found` - Slot not found
- `409 Conflict` - Slot already booked

---

### Get My Appointments

Retrieve all appointments for the authenticated patient.

```http
GET /appointments/my
Authorization: Bearer {token}
```

**Response** (200 OK)
```json
{
  "appointments": [
    {
      "id": "appointment-uuid",
      "patientId": "patient-user-uuid",
      "doctorId": "doctor-user-uuid",
      "slotId": "slot-uuid",
      "status": "BOOKED",
      "notes": "Follow-up for hypertension check",
      "doctor": {
        "id": "doctor-uuid",
        "name": "Dr. Ali Hassan",
        "email": "dr.ali@example.com"
      },
      "slot": {
        "id": "slot-uuid",
        "startTime": "2024-07-10T10:00:00Z",
        "endTime": "2024-07-10T10:30:00Z"
      },
      "createdAt": "2024-07-08T10:30:00Z"
    }
  ]
}
```

**Error Responses**
- `401 Unauthorized` - Not authenticated

---

### Cancel Appointment

Cancel a booked appointment (Patient only, must own appointment).

```http
PATCH /appointments/:id/cancel
Authorization: Bearer {token}
```

**Response** (200 OK)
```json
{
  "message": "Appointment cancelled successfully"
}
```

**Error Responses**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not a PATIENT or doesn't own appointment
- `400 Bad Request` - Invalid appointment ID
- `404 Not Found` - Appointment not found

---

### Mark Appointment as Completed

**Internal use only** - Mark appointment as completed (allows patient to leave review).

```http
PATCH /appointments/:id/complete
Authorization: Bearer {token}
```

**Response** (200 OK)
```json
{
  "message": "Appointment completed",
  "appointment": {
    "id": "appointment-uuid",
    "status": "COMPLETED",
    "...": "..."
  }
}
```

---

## Reviews

### Submit Review

Leave a review and rating for a doctor (Patient only, requires completed appointment).

```http
POST /reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "doctorId": "doctor-uuid",
  "rating": 5,
  "comment": "Excellent service, very professional and caring doctor!"
}
```

**Request Body**
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `doctorId` | string (UUID) | ✅ | Must exist | Doctor profile ID |
| `rating` | number | ✅ | 1-5 | Star rating |
| `comment` | string | ❌ | Max 500 chars | Review text |

**Response** (201 Created)
```json
{
  "message": "Review submitted successfully",
  "review": {
    "id": "review-uuid",
    "rating": 5,
    "comment": "Excellent service!",
    "patientId": "patient-user-uuid",
    "doctorId": "doctor-uuid",
    "createdat": "2024-07-08T10:30:00Z",
    "patient": {
      "name": "Ahmed Mohamed",
      "email": "ahmed@example.com"
    }
  }
}
```

**Error Responses**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User is not a PATIENT or hasn't completed an appointment with this doctor
- `400 Bad Request` - Rating must be 1-5
- `404 Not Found` - Doctor not found

---

### Get Doctor Reviews

Retrieve all reviews for a specific doctor.

```http
GET /reviews/doctor/:doctorId
```

**Response** (200 OK)
```json
{
  "reviews": [
    {
      "id": "review-uuid",
      "rating": 5,
      "comment": "Excellent service!",
      "createdat": "2024-07-08T10:30:00Z",
      "patient": {
        "name": "Ahmed Mohamed"
      }
    }
  ],
  "averageRating": 4.5,
  "totalReviews": 2
}
```

---

### Get My Review for Doctor

Get the authenticated patient's review for a specific doctor.

```http
GET /reviews/my/:doctorId
Authorization: Bearer {token}
```

**Response** (200 OK)
```json
{
  "review": {
    "id": "review-uuid",
    "rating": 5,
    "comment": "Great experience!",
    "createdat": "2024-07-08T10:30:00Z"
  }
}
```

**Note**: Returns `null` if patient hasn't reviewed this doctor.

---

## Error Handling

### Standard Error Response

```json
{
  "message": "Error description here"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|----------|
| `200` | OK | Successful GET/PATCH request |
| `201` | Created | Successful POST request |
| `400` | Bad Request | Missing/invalid fields |
| `401` | Unauthorized | Missing/invalid JWT token |
| `403` | Forbidden | User lacks permission (wrong role) |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource already exists or slot booked |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Server Error | Internal server error |

### Rate Limiting

- **Global**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 10 attempts per 15 minutes per IP

Header: `RateLimit-Limit: 100`
Header: `RateLimit-Remaining: 95`

---

## Authentication Header

All protected endpoints require:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Structure

JWT token includes:
- `userId` - User's unique ID
- `email` - User's email
- `role` - User role (PATIENT, DOCTOR, ADMIN)
- `iat` - Token issued at timestamp
- `exp` - Token expiration (typically 30 days)

---

## Examples

### Complete User Journey - Patient

**1. Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed",
    "email": "ahmed@example.com",
    "password": "pass123",
    "role": "PATIENT"
  }'
```

**2. Search Doctors**
```bash
curl http://localhost:5000/api/doctors?city=Cairo&search=cardiologist
```

**3. Get Doctor Details**
```bash
curl http://localhost:5000/api/doctors/{doctorId}
```

**4. Book Appointment**
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"slotId": "{slotId}", "notes": "Check-up"}'
```

**5. Leave Review**
```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"doctorId": "{doctorId}", "rating": 5, "comment": "Great!"}'
```

---

## API Changelog

### v1.0.0 (Current)
- Initial API release
- Auth, Doctors, Slots, Appointments, Reviews endpoints
- JWT authentication
- Rate limiting
- Redis caching

---

**Last Updated**: 2024-07-08

**Support**: For issues or questions, open an issue on GitHub.
