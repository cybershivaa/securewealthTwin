# Backend Setup Guide - PSB Digital Auth Service

## Overview

The backend is a Spring Boot 3.1 microservice that provides:
- OTP-based mobile verification
- User registration with credentials
- Login via username/password or MPIN
- JWT access token + refresh token generation
- PostgreSQL database persistence
- Redis for OTP storage and caching

## Prerequisites

- Docker & Docker Compose (recommended)
- Java 17+ (if running without Docker)
- Maven 3.8+
- PostgreSQL 14+ (if not using Docker)
- Redis 6+ (if not using Docker)

## Quick Start (Docker)

```bash
cd /path/to/psb-digital-app
docker-compose up --build
```

Services will be available:
- **Auth Service**: http://localhost:8080/api/auth
- **PostgreSQL**: localhost:5432 (user: postgres, pass: postgres, db: psb)
- **Redis**: localhost:6379

## Quick Start (Local - no Docker)

### 1. Start PostgreSQL
```bash
# Install PostgreSQL 14+
# Create database
createdb psb
psql -U postgres -d psb -c "CREATE USER psb WITH PASSWORD 'psb123';"
psql -U postgres -d psb -c "GRANT ALL PRIVILEGES ON DATABASE psb TO psb;"
```

### 2. Start Redis
```bash
# Install Redis
redis-server
```

### 3. Build & Run Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

## API Endpoints

### Authentication

#### 1. Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile": "9876543210"
}

Response:
{
  "success": true,
  "message": "OTP sent"
}
```

#### 2. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### 3. Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "mobile": "9876543210",
  "username": "johndoe",
  "password": "SecurePass123!",
  "mpin": "1234",
  "email": "john@example.com",
  "fullName": "John Doe",
  "dob": "1990-01-01",
  "pan": "ABCDE1234F"
}

Response:
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Registration successful"
  }
}
```

#### 4. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### 5. Login with MPIN
```http
POST /api/auth/login-mpin
Content-Type: application/json

{
  "mobile": "9876543210",
  "mpin": "1234"
}

Response:
{
  "success": true,
  "data": {
    "token": "...",
    "refreshToken": "...",
    "userId": "..."
  }
}
```

#### 6. Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "success": true,
  "data": {
    "token": "new-access-token"
  }
}
```

#### 7. Check Username Availability
```http
GET /api/auth/check-username?username=johndoe

Response:
{
  "available": true
}
```

#### 8. Check Email Availability
```http
GET /api/auth/check-email?email=john@example.com

Response:
{
  "available": true
}
```

## Configuration

Edit `backend/src/main/resources/application.yml`:

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/psb
    username: postgres
    password: postgres
  redis:
    host: redis
    port: 6379

jwt:
  secret: "your-super-secret-key-minimum-32-characters"
  expiration: 900000          # 15 minutes in ms
  refresh-expiration: 2592000000  # 30 days in ms
```

## Project Structure

```
backend/
├── src/main/java/com/psb/auth/
│   ├── AuthServiceApplication.java    # Entry point
│   ├── controller/
│   │   └── AuthController.java        # HTTP endpoints
│   ├── service/
│   │   ├── AuthService.java           # Business logic
│   │   └── OtpService.java            # OTP management
│   ├── repository/
│   │   └── UserRepository.java        # Database access
│   ├── entity/
│   │   └── User.java                  # User model
│   └── utils/
│       ├── JwtUtil.java               # JWT generation/validation
│       └── EncryptionUtil.java        # BCrypt hashing
├── src/main/resources/
│   └── application.yml                # Configuration
├── pom.xml                            # Dependencies
├── Dockerfile                         # Container config
└── docker-compose.yml                 # Multi-container setup
```

## Security Features Implemented

✅ **JWT Authentication**
- 15-minute access token expiry
- 30-day refresh token validity
- HMAC-SHA256 signing with secret key

✅ **Password Security**
- BCrypt hashing (strength 12)
- Password validation rules enforced
- MPIN separately hashed

✅ **OTP Management**
- 5-minute OTP validity
- Redis-backed storage
- 6-digit numeric OTPs

✅ **Database Security**
- User entity with proper constraints
- Password/MPIN hashed at rest
- UUID-based user IDs

## Next Steps / Production TODOs

### Security Enhancements
- [ ] Implement rate limiting (e.g., Spring Cloud Gateway)
- [ ] Add CAPTCHA after N failed login attempts
- [ ] Implement refresh token rotation
- [ ] Add SSL/TLS certificate pinning
- [ ] Implement AES encryption for sensitive fields

### SMS/Email Integration
- [ ] Integrate Twilio or AWS SNS for SMS OTP delivery
- [ ] Integrate SendGrid or AWS SES for email verification
- [ ] Add email OTP endpoints

### Database & Persistence
- [ ] Add Liquibase/Flyway for schema versioning
- [ ] Implement audit logging
- [ ] Add database constraints and indexes
- [ ] Implement soft delete for users

### Monitoring & Observability
- [ ] Add Micrometer metrics
- [ ] Implement structured logging (ELK stack)
- [ ] Add health checks and probes
- [ ] Implement distributed tracing (Jaeger)

### Testing
- [ ] Add unit tests (JUnit 5 + Mockito)
- [ ] Add integration tests
- [ ] Add API contract tests
- [ ] Add load/stress testing

### Deployment
- [ ] Create CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Set up staging environment
- [ ] Implement blue-green deployment
- [ ] Add health checks and auto-scaling

## Troubleshooting

### Port already in use
```bash
# Kill process on port 8080
lsof -i :8080
kill -9 <PID>
```

### Database connection failed
```bash
# Check PostgreSQL is running
psql -U postgres -d psb -c "SELECT 1"

# Check credentials in application.yml
```

### Redis connection failed
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### JWT secret too short
```bash
# Must be minimum 32 characters for HS256
# Update jwt.secret in application.yml
```

## Development Commands

```bash
# Build
mvn clean install

# Run locally
mvn spring-boot:run

# Run tests
mvn test

# Format code
mvn spotless:apply

# Create Docker image
docker build -f backend/Dockerfile -t psb-auth:latest backend/

# Push to registry
docker tag psb-auth:latest registry.example.com/psb-auth:latest
docker push registry.example.com/psb-auth:latest
```

## Environment Variables (for production)

```bash
export DB_URL=jdbc:postgresql://db.prod:5432/psb
export DB_USER=psb_user
export DB_PASSWORD=secure_password
export REDIS_HOST=redis.prod
export JWT_SECRET=your-production-secret-key-32-chars-min
export JWT_EXPIRATION=900000
```

## Testing the API

### Using cURL
```bash
# Send OTP
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210"}'

# Verify OTP (check console logs for actual OTP value)
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210","otp":"123456"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"SecurePass123!"}'
```

### Using Postman
Import the provided `PSB-Auth-API.postman_collection.json` (to be created)

## Support

For issues or questions:
- Check logs: `docker logs psb-digital-app-auth-service-1`
- Review `backend/` source code
- Refer to [Spring Boot Docs](https://spring.io/projects/spring-boot)
- Refer to [JWT Handbook](https://tools.ietf.org/html/rfc7519)

---

**Version**: 0.0.1  
**Last Updated**: June 2026  
**Status**: Development (not production-ready)
