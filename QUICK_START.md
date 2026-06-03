# Quick Reference - PSB Digital Banking App

## 🚀 Start Everything in 3 Commands

```bash
# 1. Start backend (Postgres + Redis + Spring Boot)
docker-compose up --build

# 2. Install deps & start frontend dev server
npm install expo-local-authentication expo-device @reduxjs/toolkit react-redux yup react-hook-form
npx react-native start

# 3. Run on Android/iOS (in another terminal)
npx react-native run-android
# or
npx react-native run-ios
```

---

## 📱 Frontend Key Files

| File | Purpose |
|------|---------|
| `src/screens/Auth/LoginScreen.tsx` | Credentials login |
| `src/screens/Auth/MobileVerificationScreen.tsx` | OTP entry |
| `src/screens/Registration/SecuritySetupScreen.tsx` | Password setup |
| `src/redux/slices/authSlice.ts` | Auth state (login, tokens) |
| `src/services/authService.ts` | API wrappers |
| `src/utils/validationSchemas.ts` | Yup validation rules |
| `src/navigation/AuthStack.tsx` | Screen navigation |

## 🔐 Backend Key Files

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/psb/auth/controller/AuthController.java` | REST endpoints |
| `backend/src/main/java/com/psb/auth/service/AuthService.java` | Business logic |
| `backend/src/main/java/com/psb/auth/utils/JwtUtil.java` | JWT generation |
| `backend/src/main/resources/application.yml` | Config (JWT, DB, Redis) |
| `backend/pom.xml` | Dependencies |
| `docker-compose.yml` | Container setup |

---

## 📡 API Endpoints

### Send OTP
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210","otp":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"SecurePass123!"}'
```

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "mobile":"9876543210",
    "username":"johndoe",
    "password":"SecurePass123!",
    "mpin":"1234",
    "email":"john@example.com",
    "fullName":"John Doe"
  }'
```

---

## 🔍 Get Generated OTP for Testing

### Option 1: Docker Logs
```bash
docker logs psb-digital-app-auth-service-1 | grep "OTP for"
```

### Option 2: Check Console
When you trigger send-otp, backend prints OTP to stdout like:
```
OTP for 9876543210: 123456
```

---

## 📋 Frontend Validation Rules

| Field | Rules |
|-------|-------|
| Mobile | Exactly 10 digits |
| OTP | Exactly 6 digits |
| Password | Min 8 chars, uppercase, lowercase, number, special char |
| MPIN | 4-6 digits |
| PAN | Format: ABCDE1234F |
| Email | Valid email format |

---

## 🎯 Registration Flow (10 Steps)

1. **Welcome Screen** → Tap "Register"
2. **Mobile Verification** → Enter 10-digit number
3. **OTP Verification** → Enter 6-digit OTP (from logs)
4. **Personal Details** → Name, DOB, Gender, PAN
5. **Bank Linking** → Account number, CIF, Card last 6
6. **Security Setup** → Username, password, MPIN
7. **Device Registration** → Security checks
8. **Biometric Setup** → Optional fingerprint/face
9. **Success Screen** → Registration complete
10. **Go to Login** → Use credentials to login

---

## 🔑 Login Methods

### Method 1: Username + Password
- Screens: Login → Enter username & password

### Method 2: Mobile OTP
- Screens: Login → Mobile Verification → OTP Verification

### Method 3: MPIN
- Screens: Login → (not yet fully wired, available in backend)

---

## 🛠️ Common Commands

### Backend
```bash
# Docker
docker-compose up --build
docker-compose down
docker logs psb-digital-app-auth-service-1

# Maven (local)
cd backend
mvn clean install
mvn spring-boot:run
mvn test
```

### Frontend
```bash
# Dependencies
npm install

# Start dev server
npx react-native start

# Run
npx react-native run-android
npx react-native run-ios

# Clean cache
npx react-native start --reset-cache

# Rebuild native modules
cd android && ./gradlew clean && cd ..
```

---

## 🚨 Troubleshooting

### "Cannot reach http://localhost:8080"
→ Use your computer's IP for Android: `10.0.2.2:8080` (emulator) or `192.168.x.x` (physical device)

### "OTP doesn't work"
→ Check Docker logs: `docker logs ... | grep "OTP for"`

### "Port 8080 already in use"
```bash
lsof -i :8080
kill -9 <PID>
```

### "Database connection refused"
```bash
# Make sure containers are running
docker ps

# Check PostgreSQL logs
docker logs psb-digital-app-postgres-1
```

### "React Native build fails"
```bash
npx react-native start --reset-cache
npx react-native run-android
```

---

## 📚 Documentation

- **Full Setup** → [README.md](./README.md)
- **Backend Details** → [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **Implementation Summary** → [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)

---

## 💡 Configuration

### Frontend API Base URL
Edit `src/services/apiClient.ts`:
```typescript
const API_BASE = 'http://10.0.2.2:8080/api'; // Android emulator
// or
const API_BASE = 'http://192.168.1.100:8080/api'; // Your computer's IP
```

### Backend JWT Secret
Edit `backend/src/main/resources/application.yml`:
```yaml
jwt:
  secret: "your-super-secret-key-minimum-32-characters"
  expiration: 900000
```

### Database Credentials
```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/psb
    username: postgres
    password: postgres
```

---

## 🔐 Security Notes

✅ Passwords are BCrypt hashed (never stored plain)
✅ OTPs expire after 5 minutes
✅ Access tokens expire after 15 minutes
✅ Refresh tokens valid for 30 days
✅ All sensitive endpoints require authentication

⚠️ **Production TODOs:**
- Set strong JWT secret (min 32 chars)
- Configure real SMS provider (Twilio)
- Enable HTTPS/SSL
- Implement rate limiting
- Add CAPTCHA after failed attempts

---

## 📞 Support

If you hit issues:

1. Check [README.md](./README.md) → "Common Issues & Solutions"
2. Check [BACKEND_SETUP.md](./BACKEND_SETUP.md) → "Troubleshooting"
3. Review docker logs: `docker logs <container_id>`
4. Check the actual error message in app or console

---

**Version**: 1.0.0-beta  
**Last Updated**: June 2026  
**Status**: Ready to test and deploy 🚀
