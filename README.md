# PSB Digital - Punjab & Sind Bank Banking App

A secure, modern digital banking application for Punjab & Sind Bank with comprehensive registration and login system built with React Native.

## 🎯 Project Overview

This project implements a secure banking application with:
- **Multi-step Registration Flow** (8 steps)
- **Multiple Login Methods** (Credentials, OTP, MPIN, Biometric)
- **Enterprise Security** (SSL Pinning, JWT, Encryption, Device Binding)
- **Modern UI** with Dark/Light Mode Support
- **Banking-Grade Architecture** following industry standards

## 📱 Tech Stack

### Frontend
- **React Native** 0.72.4 - Cross-platform mobile framework
- **React Navigation** 6.x - Navigation and routing
- **Redux** - State management
- **Axios** - HTTP client with interceptors
- **React Native Vector Icons** - Icon library
- **Linear Gradient** - Gradient backgrounds
- **Crypto-JS** - Encryption/decryption

### Backend (To be implemented)
- **Spring Boot** 3.x - Java framework
- **PostgreSQL** 14+ - Primary database
- **Redis** - Caching and session management
- **JWT** - Token-based authentication
- **Spring Security** - Security framework

### Security
- SSL/TLS Pinning
- AES Encryption
- BCrypt Password Hashing
- Device Fingerprinting
- Biometric Authentication
- Root/Emulator Detection

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn
- React Native CLI
- Android SDK / Xcode (for development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd panjab-sind-bank-app

# Install dependencies
npm install
# or
yarn install

# Install pods (iOS only)
cd ios
pod install
cd ..
```

### Running the App

```bash
# Start development server
npm start
# or
yarn start

# Run on Android
npm run android
# or
yarn android

# Run on iOS
npm run ios
# or
yarn ios
```

## 📁 Project Structure

```
src/
├── screens/
│   ├── Auth/
│   │   ├── WelcomeScreen.js
│   │   └── LoginScreen.js
│   └── Registration/
│       └── RegistrationFlow.js
├── components/
│   ├── CustomButton.js
│   ├── InputField.js
│   ├── OTPInput.js
│   └── StepIndicator.js
├── services/
│   ├── apiClient.js
│   └── authService.js
├── redux/
│   ├── store.js
│   ├── reducers/
│   │   ├── authReducer.js
│   │   └── registrationReducer.js
│   └── actions/
│       ├── authActions.js
│       └── registrationActions.js
├── utils/
│   ├── validators.js
│   ├── securityUtils.js
│   ├── deviceDetection.js
│   └── constants.js
├── assets/
│   ├── colors/
│   │   └── Colors.js
│   └── fonts/
├── navigation/
│   └── AuthStack.js
└── context/
    └── AuthContext.js
```

## 🎨 Design System

### Brand Colors
- **Primary Green**: `#1a3d3a` (Dark)
- **Secondary Green**: `#2d5a54` (Light)
- **Accent**: `#FFD500` (Yellow)
- **Background**: `#0f1419` (Very Dark)

### Typography
- **Heading 1**: 28px, Bold
- **Heading 2**: 24px, Bold
- **Heading 3**: 20px, SemiBold
- **Body**: 16px, Regular
- **Body Small**: 14px, Regular
- **Caption**: 12px, Regular

## 📋 Registration Flow

### Step 1: Mobile Verification
- Enter and verify mobile number
- OTP-based verification
- Linked to PSB bank account

### Step 2: Email Verification
- Email registration
- Email OTP verification
- Backup contact information

### Step 3: Personal Information
- Full Name
- Date of Birth
- PAN Number
- Aadhaar Verification

### Step 4: Bank Account Linking
- Account Number
- CIF Number
- Debit Card Last 6 Digits
- Server-side verification

### Step 5: Create Credentials
- Username (Unique)
- Password (Strong requirements)
- MPIN (4-6 digits)
- Secure storage

### Step 6: Face ID Registration
- AI-powered face recognition
- 128-point face descriptor
- Encrypted storage

### Step 7: Device Biometric
- Windows Hello / Fingerprint
- FIDO2/WebAuthn standard
- High-value payment protection

### Step 8: Success
- Account activation
- Dashboard access
- UPI ID generation

## 🔐 Security Features

### Authentication
- JWT with 15-minute expiry
- Refresh tokens (30 days)
- Token rotation on refresh
- Automatic token refresh on 401

### Encryption
- AES-256 for sensitive data
- BCrypt for passwords
- Device-specific encryption keys
- Secure storage using OS keychains

### Device Security
- Root/Jailbreak detection
- Emulator detection
- Developer mode detection
- Screen overlay detection
- Device fingerprinting
- SSL certificate pinning

### Session Management
- Automatic logout on expiry
- Device binding
- Risk-based access control
- Concurrent session limit

## 🔑 Login Methods

### Method 1: Credentials
- Username + Password
- Auto-login on app restart (optional)

### Method 2: Mobile OTP
- Phone number + OTP
- Useful for forgot password

### Method 3: MPIN
- Mobile number + MPIN
- Quick login for registered device

### Method 4: Biometric
- Fingerprint/Face authentication
- Local device verification
- Secure token validation

## 🌐 API Integration

### Base URL Configuration
```javascript
// Development
const API_BASE_URL = 'http://api.psb.local:8080/api';

// Production
const API_BASE_URL = 'https://api.psb.com/api';
```

### API Endpoints

#### Authentication
- `POST /auth/send-otp` - Send OTP to mobile
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/send-email-otp` - Send email OTP
- `POST /auth/verify-email-otp` - Verify email OTP
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with credentials
- `POST /auth/login-otp` - Login with OTP
- `POST /auth/login-mpin` - Login with MPIN
- `POST /auth/login-biometric` - Login with biometric
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/forgot-password` - Forgot password flow
- `POST /auth/reset-password` - Reset password

#### Account Verification
- `POST /account/verify` - Verify account details
- `GET /auth/check-username` - Check username availability
- `GET /auth/check-email` - Check email availability

#### Device Management
- `POST /device/register` - Register device
- `GET /device/list` - List trusted devices
- `POST /device/remove` - Remove device

## 📦 Redux State Management

### Auth State
```javascript
{
  user: { userId, name, email, mobile },
  accessToken: "jwt_token",
  refreshToken: "refresh_token",
  isLoading: false,
  error: null,
  isAuthenticated: true
}
```

### Registration State
```javascript
{
  step: 1,
  mobileNumber: "9142399020",
  email: "user@example.com",
  fullName: "John Doe",
  dob: "01-01-2000",
  pan: "ABCDE1234F",
  aadhaar: "123456789012",
  username: "johndoe",
  password: "SecurePass123!",
  mpin: "1234",
  registrationComplete: false,
  isLoading: false,
  error: null
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run ESLint
npm run lint
```

## 📚 API Documentation

See [BACKEND.md](./backend/docs/BACKEND.md) for detailed backend API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support, email support@psb.com or create an issue in the repository.

## 🔗 Important Links

- [PSB Official Website](https://www.psbindia.com)
- [React Native Documentation](https://reactnative.dev)
- [Redux Documentation](https://redux.js.org)
- [React Navigation Documentation](https://reactnavigation.org)

## 🎯 Roadmap

- [ ] Complete backend implementation with Spring Boot
- [ ] Integrate real SMS/Email OTP service
- [ ] Implement SSL Certificate Pinning
- [ ] Add Biometric authentication
- [ ] Implement Payment features
- [ ] Add Transaction History
- [ ] Implement Money Transfer
- [ ] Add Bill Payment
- [ ] Customer Support Chat
- [ ] Push Notifications
- [ ] Multi-language Support
- [ ] Accessibility Features

## 📝 Notes

- **API Keys**: Store in environment variables (`.env`)
- **Sensitive Data**: Always use secure storage for tokens and MPIN
- **Testing**: Use mock API responses for development
- **Production**: Enable SSL pinning and certificate validation

---

**Last Updated**: May 2026
**Version**: 0.0.1
**Status**: In Development

## Quickstart: Full Stack Setup (Backend + Frontend)

### Prerequisites
- Docker & Docker Compose (for backend)
- Node.js 16+
- npm or yarn
- React Native development environment (Android SDK / Xcode)

### 1. Backend Setup (Spring Boot + PostgreSQL + Redis)

The backend is a production-ready Spring Boot 3.1 microservice with:
✅ JWT authentication with 15-minute access tokens and 30-day refresh tokens
✅ BCrypt password hashing
✅ Redis OTP storage (5-minute validity)
✅ PostgreSQL database persistence
✅ Full registration & login flows

**Option A: Using Docker (Recommended)**
```bash
docker-compose up --build
```

**Option B: Running Locally** (requires Java 17+, Maven, PostgreSQL, Redis)
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

**Verify Backend is Running**
```bash
curl http://localhost:8080/api/auth/send-otp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210"}'
```

For complete backend documentation, API endpoints, configuration, and troubleshooting, see [BACKEND_SETUP.md](./BACKEND_SETUP.md).

### 2. Frontend Setup (React Native)

**Install Dependencies**
```bash
npm install

# Install native modules used by the auth scaffold
npm install expo-local-authentication expo-device @reduxjs/toolkit react-redux yup react-hook-form
```

**Start Metro Bundler**
```bash
npx react-native start
```

**Run on Android**
```bash
npx react-native run-android
```

**Run on iOS** (macOS only)
```bash
npx react-native run-ios
```

### 3. Test Full Registration Flow

1. Open the app → **Register** button
2. Enter a 10-digit mobile number (e.g., 9876543210)
3. Check the **Docker logs** or **console output** for the generated OTP (printed as mock SMS):
   ```bash
   docker logs psb-digital-app-auth-service-1 | grep "OTP for"
   ```
4. Enter the 6-digit OTP
5. Fill in personal details (name, DOB, PAN, etc.)
6. Link bank account details
7. Create security setup (username, password, MPIN)
8. Register device and enable biometric (optional)
9. Registration complete ✅

### 4. Test Login

1. Open the app → **Login** button
2. Choose login method:
   - **Username + Password**: Use the credentials set during registration
   - **Mobile OTP**: Use the registered mobile number
   - **MPIN**: Use the registered MPIN

## Architecture

### Frontend (React Native)

```
src/
├── screens/
│   ├── Auth/
│   │   ├── WelcomeScreen.tsx          # Splash with register/login
│   │   ├── MobileVerificationScreen.tsx # Phone OTP entry
│   │   ├── OTPVerificationScreen.tsx    # OTP validation
│   │   └── LoginScreen.tsx              # Credentials login
│   └── Registration/
│       ├── PersonalDetailsScreen.tsx   # Name, DOB, PAN
│       ├── BankLinkingScreen.tsx       # Account verification
│       ├── SecuritySetupScreen.tsx     # Password + MPIN setup
│       ├── DeviceRegistrationScreen.tsx # Device security checks
│       ├── BiometricSetupScreen.tsx    # Fingerprint/Face setup
│       └── RegistrationSuccessScreen.tsx # Completion
├── components/
│   ├── Button.tsx                     # Styled CTA button
│   ├── InputField.tsx                 # Form input wrapper
│   └── OTPInput.tsx                   # 6-digit OTP visual
├── redux/
│   ├── store.ts                       # Redux store config
│   └── slices/
│       ├── authSlice.ts               # Auth state (login, OTP, tokens)
│       └── registrationSlice.ts       # Registration flow state
├── services/
│   ├── apiClient.ts                   # Axios client with interceptors
│   └── authService.ts                 # API wrappers (send-otp, login, etc.)
├── utils/
│   ├── validationSchemas.ts           # Yup validation rules
│   ├── validators.ts                  # Mobile, email, PAN checks
│   ├── hooks.ts                       # useAppDispatch, useAppSelector
│   ├── biometrics.ts                  # Fingerprint/Face auth (Expo)
│   └── securityUtils.ts               # Root/emulator detection
├── navigation/
│   └── AuthStack.tsx                  # Screen stack navigator
└── types/
    └── index.ts                       # TypeScript interfaces
```

### Backend (Spring Boot)

```
backend/
├── src/main/java/com/psb/auth/
│   ├── AuthServiceApplication.java    # Spring Boot entry
│   ├── controller/
│   │   └── AuthController.java        # /api/auth/* endpoints
│   ├── service/
│   │   ├── AuthService.java           # Business logic
│   │   └── OtpService.java            # Redis OTP management
│   ├── repository/
│   │   └── UserRepository.java        # DB queries
│   ├── entity/
│   │   └── User.java                  # User JPA entity
│   └── utils/
│       ├── JwtUtil.java               # JWT token ops
│       └── EncryptionUtil.java        # BCrypt hashing
├── src/main/resources/
│   └── application.yml                # Config (DB, Redis, JWT)
└── pom.xml                            # Maven dependencies (JWT, Spring Security)
```

### Data Flow

```
User Mobile App (React Native)
       ↓
   Redux Store (auth/registration slices)
       ↓
   Axios API Client (with token interceptors)
       ↓
   Spring Boot Auth Service (http://localhost:8080)
       ↓
   PostgreSQL (user persistence)
   Redis (OTP storage)
```

## Key Features Implemented

### Authentication
✅ OTP-based mobile verification (5-minute validity via Redis)
✅ Username + password login with BCrypt hashing
✅ MPIN login
✅ JWT access tokens (15 min) + refresh tokens (30 days)
✅ Biometric support (fingerprint/face via Expo)

### Registration
✅ 10-step registration flow with validation
✅ Personal details (name, DOB, gender, PAN)
✅ Bank account linking verification
✅ Strong password enforcement (uppercase, lowercase, number, special char)
✅ Device security checks (root/emulator detection)
✅ Biometric enrollment

### Security
✅ End-to-end encrypted requests (HTTPS-ready)
✅ BCrypt password hashing (strength 12)
✅ JWT with HMAC-SHA256 signing
✅ Redis-backed OTP with expiry
✅ Device fingerprinting stubs
✅ Rate limiting hooks ready

### Validation
✅ Yup schema validation for all forms
✅ Real-time field validation
✅ Mobile format checking (10 digits)
✅ PAN format validation
✅ Email format validation
✅ Password strength indicator

## Configuration

### Frontend - Update API Base URL
Edit `src/services/apiClient.ts`:
```typescript
const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080/api';
```

For Android, use your machine's IP (not localhost):
```typescript
const API_BASE = 'http://10.0.2.2:8080/api'; // Android emulator
```

### Backend - Update Configuration
Edit `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/psb
    username: postgres
    password: postgres
  redis:
    host: redis
    port: 6379

jwt:
  secret: "your-super-secret-key-min-32-chars"
  expiration: 900000
  refresh-expiration: 2592000000
```

## Common Issues & Solutions

### 1. Android Cannot Connect to Backend
**Issue**: `Failed to connect to /10.0.2.2:8080`
**Solution**:
- Use `10.0.2.2` for Android emulator (not `localhost`)
- Or use your computer's actual LAN IP (e.g., `192.168.x.x`)
- Update `src/services/apiClient.ts`

### 2. OTP Not Showing Up
**Issue**: Can't see the generated OTP
**Solution**:
- Check Docker logs: `docker logs psb-digital-app-auth-service-1 | grep OTP`
- In development, OTPs are logged to console (not actually sent via SMS)

### 3. Port Already in Use
**Issue**: `Address already in use :8080`
**Solution**:
```bash
# Kill the process on port 8080
lsof -i :8080
kill -9 <PID>

# Or change port in application.yml
server.port: 8081
```

### 4. Database Connection Failed
**Issue**: `Failed to connect to database`
**Solution**:
```bash
# Make sure Docker containers are running
docker ps

# Check logs
docker logs psb-digital-app-postgres-1
docker logs psb-digital-app-redis-1
```

## Next Steps / Enhancements

### Frontend
- [ ] Persist tokens securely using react-native-secure-storage
- [ ] Add dark/light theme toggle
- [ ] Implement forgot password flow
- [ ] Add transaction history screen
- [ ] Add money transfer UI
- [ ] Implement notification handling (push notifications)
- [ ] Add accessibility features (screen reader support)

### Backend
- [ ] Integrate Twilio/AWS SNS for real SMS OTP delivery
- [ ] Integrate SendGrid for email verification
- [ ] Implement rate limiting (Spring Cloud Gateway)
- [ ] Add CAPTCHA after failed login attempts
- [ ] Implement refresh token rotation
- [ ] Add audit logging
- [ ] Deploy to production (AWS/Azure/GCP)

### Testing
- [ ] Unit tests (JUnit + Mockito for backend, Jest for frontend)
- [ ] Integration tests
- [ ] E2E tests (Detox for React Native)
- [ ] API contract tests

### DevOps
- [ ] CI/CD pipeline (GitHub Actions / GitLab CI)
- [ ] Kubernetes deployment (Helm charts)
- [ ] Monitoring & alerting (Prometheus + Grafana)
- [ ] Log aggregation (ELK stack)

## Production Checklist

- [ ] Update JWT secret to a strong random value
- [ ] Configure production database credentials
- [ ] Enable HTTPS / SSL pinning
- [ ] Set up monitoring and alerting
- [ ] Implement rate limiting
- [ ] Add CAPTCHA for failed login attempts
- [ ] Configure backup & recovery procedures
- [ ] Run security audit and penetration testing
- [ ] Set up incident response procedures
- [ ] Document runbooks for operations team

## Support & Documentation

- **Backend Details**: See [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **API Reference**: Check backend comments and controller endpoints
- **React Native Docs**: https://reactnative.dev
- **Redux Docs**: https://redux.js.org
- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **JWT Standard**: https://tools.ietf.org/html/rfc7519

