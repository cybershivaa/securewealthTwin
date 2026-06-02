# PSB Digital Backend Architecture & Implementation Guide

## 🏗️ Architecture Overview

```
┌─────────────────┐
│  React Native   │
│  Mobile App     │
└────────┬────────┘
         │ (HTTPS + SSL Pinning)
         │
┌────────▼─────────────────┐
│   API Gateway            │
│   (Rate Limiting)        │
└────────┬─────────────────┘
         │
┌────────▼──────────────────────────────────┐
│        Spring Boot Services                │
├──────────────────────────────────────────┤
│ ├─ Authentication Service                 │
│ ├─ User Service                          │
│ ├─ Account Service                       │
│ ├─ Device Service                        │
│ ├─ OTP Service                           │
│ ├─ Notification Service                  │
│ ├─ Audit Service                         │
│ └─ Security Service                      │
└────────┬──────────────────────────────────┘
         │
    ┌────┴────┬──────────┐
    │          │          │
┌───▼──┐ ┌───▼───┐ ┌───▼───┐
│      │ │       │ │       │
│  DB  │ │ Redis │ │ Queue │
│ PSQL │ │       │ │       │
└──────┘ └───────┘ └───────┘
```

## 📊 Technology Stack

### Backend Framework
- **Spring Boot 3.1+** - Modern Java framework
- **Spring Security** - Authentication & Authorization
- **Spring Data JPA** - ORM & Database access
- **Spring Cloud** - Microservices ready

### Database
- **PostgreSQL 14+** - Primary relational database
- **Redis 7+** - Caching, session store, rate limiting
- **Elasticsearch** (Optional) - Audit logs, analytics

### Additional Libraries
- **JWT (Java-JWT)** - Token generation and validation
- **BCrypt** - Password hashing
- **OkHttp** - HTTP client with SSL pinning
- **Lombok** - Reduce boilerplate
- **Validation** - Bean validation
- **MapStruct** - DTO mapping

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    pan VARCHAR(10) UNIQUE NOT NULL,
    aadhaar_encrypted BYTEA NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mpin_hash VARCHAR(255) NOT NULL,
    gender VARCHAR(10),
    account_status VARCHAR(20) DEFAULT 'ACTIVE',
    kyc_status VARCHAR(20) DEFAULT 'INCOMPLETE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    CONSTRAINT check_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CONSTRAINT check_kyc_status CHECK (kyc_status IN ('INCOMPLETE', 'PENDING', 'VERIFIED', 'REJECTED'))
);

CREATE INDEX idx_users_mobile ON users(mobile_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### Bank Accounts Table
```sql
CREATE TABLE bank_accounts (
    account_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    account_number VARCHAR(20) NOT NULL UNIQUE,
    cif_number VARCHAR(20) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL,
    account_status VARCHAR(20) DEFAULT 'ACTIVE',
    debit_card_last6 VARCHAR(6),
    ifsc_code VARCHAR(11) NOT NULL,
    branch_code VARCHAR(10),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_account_type CHECK (account_type IN ('SAVINGS', 'CURRENT', 'SALARY')),
    CONSTRAINT check_account_status CHECK (account_status IN ('ACTIVE', 'INACTIVE', 'CLOSED'))
);

CREATE INDEX idx_accounts_user ON bank_accounts(user_id);
CREATE INDEX idx_accounts_number ON bank_accounts(account_number);
```

### OTP Table
```sql
CREATE TABLE otp_logs (
    otp_id BIGSERIAL PRIMARY KEY,
    mobile_number VARCHAR(15) NOT NULL,
    otp_value VARCHAR(6) NOT NULL,
    otp_type VARCHAR(20) NOT NULL,
    attempt_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET NOT NULL,
    user_agent TEXT,
    CONSTRAINT check_otp_type CHECK (otp_type IN ('REGISTRATION', 'LOGIN', 'VERIFICATION', 'PASSWORD_RESET')),
    CONSTRAINT check_attempts CHECK (attempt_count <= 5)
);

CREATE INDEX idx_otp_mobile_type ON otp_logs(mobile_number, otp_type);
CREATE INDEX idx_otp_expires ON otp_logs(expires_at);
```

### Devices Table
```sql
CREATE TABLE devices (
    device_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    device_fingerprint VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(255),
    device_model VARCHAR(255),
    os_type VARCHAR(20) NOT NULL,
    os_version VARCHAR(50),
    app_version VARCHAR(20),
    is_trusted BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_os_type CHECK (os_type IN ('ANDROID', 'IOS', 'WEB'))
);

CREATE INDEX idx_devices_user ON devices(user_id);
CREATE INDEX idx_devices_fingerprint ON devices(device_fingerprint);
```

### Sessions Table
```sql
CREATE TABLE sessions (
    session_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    device_id BIGINT NOT NULL REFERENCES devices(device_id),
    access_token_hash VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    logout_time TIMESTAMP,
    CONSTRAINT check_logout CHECK (logout_time IS NULL OR logout_time >= login_time)
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_device ON sessions(device_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET NOT NULL,
    user_agent TEXT,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_status CHECK (status IN ('SUCCESS', 'FAILURE', 'PENDING'))
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action_type);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

### Biometric Data Table
```sql
CREATE TABLE biometric_data (
    biometric_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    device_id BIGINT NOT NULL REFERENCES devices(device_id),
    biometric_type VARCHAR(20) NOT NULL,
    biometric_token_encrypted BYTEA NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_biometric_type CHECK (biometric_type IN ('FINGERPRINT', 'FACE', 'IRIS'))
);

CREATE INDEX idx_biometric_user ON biometric_data(user_id);
CREATE INDEX idx_biometric_device ON biometric_data(device_id);
```

## 🔌 API Endpoints

### Authentication Endpoints

#### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobileNumber": "9142399020",
  "otpType": "REGISTRATION"
}

Response: 200 OK
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 600
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobileNumber": "9142399020",
  "otp": "123456"
}

Response: 200 OK
{
  "success": true,
  "message": "OTP verified",
  "sessionToken": "temp_token_xyz"
}
```

#### Register User
```
POST /api/auth/register
Content-Type: application/json
Authorization: Bearer temp_token_xyz

{
  "mobileNumber": "9142399020",
  "email": "user@example.com",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "pan": "ABCDE1234F",
  "aadhaar": "123456789012",
  "username": "johndoe",
  "password": "SecurePass123!",
  "mpin": "1234",
  "accountNumber": "1234567890",
  "cifNumber": "12345",
  "debitCardLast6": "123456",
  "deviceInfo": { ... }
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "userId": 123,
  "upiId": "@psb"
}
```

#### Login with Credentials
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!",
  "deviceId": "device_fingerprint"
}

Response: 200 OK
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 900,
  "user": {
    "userId": 123,
    "username": "johndoe",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

#### Login with OTP
```
POST /api/auth/login-otp
Content-Type: application/json

{
  "mobileNumber": "9142399020",
  "otp": "123456"
}

Response: 200 OK
{ ... similar to credentials login ... }
```

#### Login with MPIN
```
POST /api/auth/login-mpin
Content-Type: application/json

{
  "mobileNumber": "9142399020",
  "mpin": "1234"
}

Response: 200 OK
{ ... similar to credentials login ... }
```

#### Login with Biometric
```
POST /api/auth/login-biometric
Content-Type: application/json

{
  "mobileNumber": "9142399020",
  "biometricToken": "encrypted_biometric_token",
  "deviceId": "device_fingerprint"
}

Response: 200 OK
{ ... similar to credentials login ... }
```

#### Refresh Token
```
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}

Response: 200 OK
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 900
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer eyJhbGci...

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 🔐 Security Implementation

### Password Hashing
```java
@Component
public class PasswordEncoder {
    private static final int BCRYPT_STRENGTH = 12;
    
    public String encodePassword(String rawPassword) {
        return BCrypt.hashpw(rawPassword, BCrypt.gensalt(BCRYPT_STRENGTH));
    }
    
    public boolean validatePassword(String rawPassword, String encodedPassword) {
        return BCrypt.checkpw(rawPassword, encodedPassword);
    }
}
```

### JWT Token Generation
```java
@Component
public class JwtTokenProvider {
    @Value("${jwt.secret-key}")
    private String secretKey;
    
    @Value("${jwt.access-token-expiry:900000}") // 15 minutes
    private long accessTokenExpiry;
    
    @Value("${jwt.refresh-token-expiry:2592000000}") // 30 days
    private long refreshTokenExpiry;
    
    public String generateAccessToken(User user) {
        return Jwts.builder()
                .setSubject(String.valueOf(user.getUserId()))
                .claim("username", user.getUsername())
                .claim("email", user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpiry))
                .signWith(SignatureAlgorithm.HS512, secretKey)
                .compact();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

### OTP Generation
```java
@Component
public class OTPService {
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;
    
    @Autowired
    private OtpLogRepository otpLogRepository;
    
    public String generateOTP() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
    
    public void saveOTP(String mobileNumber, String otp, String otpType) {
        OtpLog otpLog = new OtpLog();
        otpLog.setMobileNumber(mobileNumber);
        otpLog.setOtpValue(otp);
        otpLog.setOtpType(otpType);
        otpLog.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpLogRepository.save(otpLog);
    }
    
    public boolean verifyOTP(String mobileNumber, String otp, String otpType) {
        OtpLog otpLog = otpLogRepository.findLatest(mobileNumber, otpType);
        
        if (otpLog == null) return false;
        if (LocalDateTime.now().isAfter(otpLog.getExpiresAt())) return false;
        if (otpLog.getAttemptCount() >= 5) return false;
        if (!otpLog.getOtpValue().equals(otp)) {
            otpLog.incrementAttempts();
            otpLogRepository.save(otpLog);
            return false;
        }
        
        otpLog.setVerified(true);
        otpLogRepository.save(otpLog);
        return true;
    }
}
```

### Device Fingerprinting
```java
@Service
public class DeviceService {
    @Autowired
    private DeviceRepository deviceRepository;
    
    public Device registerDevice(DeviceDTO deviceDTO) {
        String fingerprint = generateFingerprint(deviceDTO);
        
        Device device = new Device();
        device.setDeviceFingerprint(fingerprint);
        device.setDeviceName(deviceDTO.getDeviceName());
        device.setDeviceModel(deviceDTO.getDeviceModel());
        device.setOsType(deviceDTO.getOsType());
        device.setOsVersion(deviceDTO.getOsVersion());
        
        return deviceRepository.save(device);
    }
    
    private String generateFingerprint(DeviceDTO deviceDTO) {
        String input = deviceDTO.getDeviceId() + 
                      deviceDTO.getDeviceModel() + 
                      deviceDTO.getOsVersion() + 
                      deviceDTO.getAppVersion();
        return SHA256.digest(input);
    }
}
```

### Rate Limiting
```java
@Component
public class RateLimitingInterceptor implements HandlerInterceptor {
    @Autowired
    private RedisTemplate<String, Long> redisTemplate;
    
    private static final int MAX_REQUESTS = 100;
    private static final long WINDOW_SIZE_SECONDS = 60;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIp(request);
        String key = "rate_limit:" + clientIp;
        
        Long requestCount = redisTemplate.opsForValue().get(key);
        
        if (requestCount == null) {
            redisTemplate.opsForValue().set(key, 1L, Duration.ofSeconds(WINDOW_SIZE_SECONDS));
        } else if (requestCount < MAX_REQUESTS) {
            redisTemplate.opsForValue().increment(key);
        } else {
            response.setStatus(HttpServletResponse.SC_TOO_MANY_REQUESTS);
            return false;
        }
        
        return true;
    }
}
```

## 📧 Notification Service

### Email Notifications
```java
@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;
    
    public void sendOTPEmail(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Your PSB Digital OTP");
        message.setText("Your OTP is: " + otp + "\nValid for 10 minutes");
        mailSender.send(message);
    }
    
    public void sendWelcomeEmail(User user) {
        // Send welcome email to new user
    }
}
```

### SMS Notifications
```java
@Service
public class SMSService {
    @Value("${sms.api.key}")
    private String apiKey;
    
    @Value("${sms.api.url}")
    private String apiUrl;
    
    public void sendOTPSMS(String mobileNumber, String otp) {
        // Integrate with Twilio/AWS SNS/Custom SMS provider
        String message = "Your PSB Digital OTP is: " + otp + ". Valid for 10 minutes.";
        // Send SMS
    }
}
```

## 🧪 Testing

### Unit Tests
```java
@SpringBootTest
public class AuthServiceTest {
    @Autowired
    private AuthService authService;
    
    @Test
    public void testOTPGeneration() {
        String otp = authService.generateOTP();
        assertTrue(otp.matches("^\\d{6}$"));
    }
    
    @Test
    public void testPasswordHashing() {
        String rawPassword = "SecurePass123!";
        String hash = authService.hashPassword(rawPassword);
        assertTrue(authService.verifyPassword(rawPassword, hash));
    }
}
```

## 🚀 Deployment

### Environment Variables
```
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/psb_digital
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ACCESS_TOKEN_EXPIRY=900000
JWT_REFRESH_TOKEN_EXPIRY=2592000000

# Redis
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# SMS
SMS_API_KEY=your-api-key
SMS_API_URL=https://api.sms-provider.com
```

### Docker Setup
```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/psb-digital-backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## 📈 Monitoring & Logging

### Logging Configuration
```yaml
logging:
  level:
    com.psb.digital: DEBUG
    org.springframework.security: DEBUG
    org.hibernate.SQL: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/application.log
    max-size: 10MB
    max-history: 10
```

### Health Checks
```
GET /actuator/health

{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "redis": {"status": "UP"},
    "mail": {"status": "UP"}
  }
}
```

---

**Version**: 1.0
**Last Updated**: May 2026
**Maintained By**: PSB Tech Team
