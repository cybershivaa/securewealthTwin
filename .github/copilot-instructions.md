# PSB Digital - Punjab & Sind Bank App

## Project Setup Instructions

This document provides comprehensive setup instructions for the PSB Digital banking application development.

## Development Environment Setup

### 1. Prerequisites
- Node.js >= 16.0.0
- npm or yarn package manager
- React Native CLI
- Android SDK (for Android development)
- Xcode (for iOS development on macOS)
- Git version control

### 2. Installation Steps

```bash
# Clone the repository
git clone <repository-url>
cd panjab-sind-bank-app

# Install dependencies
npm install
# or
yarn install

# For iOS (macOS only)
cd ios
pod install
cd ..
```

### 3. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update `.env` with your configuration:
- API endpoints
- API keys and tokens
- Debug settings
- Feature flags

### 4. Running the Application

**Start Development Server:**
```bash
npm start
# or
yarn start
```

**Android:**
```bash
npm run android
# or
yarn android
```

**iOS:**
```bash
npm run ios
# or
yarn ios
```

## Project Structure Overview

```
panjab-sind-bank-app/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable UI components
│   ├── services/         # API and external services
│   ├── redux/           # State management
│   ├── utils/           # Utility functions
│   ├── assets/          # Colors, fonts, images
│   ├── navigation/      # Navigation setup
│   └── context/         # React context
├── backend/             # Backend documentation
├── App.js              # Root component
├── package.json        # Dependencies
├── README.md           # Project documentation
└── .env.example        # Environment variables template
```

## Key Features Implemented

### ✅ Frontend (React Native)
- [x] Welcome screen with branding
- [x] Multi-step registration flow (8 steps)
  - [x] Step 1: Mobile verification
  - [x] Step 2: Email registration
  - [x] Step 3: Personal information
  - [x] Step 4: Bank account linking
  - [x] Step 5: Credentials setup
  - [x] Step 6: Face ID registration
  - [x] Step 7: Device biometric
  - [x] Step 8: Success confirmation
- [x] Multiple login methods
  - [x] Username + Password
  - [x] Mobile + OTP
  - [x] MPIN login
  - [x] Biometric login
- [x] Modern UI with dark theme
- [x] Form validation
- [x] Security utilities
- [x] State management with Redux
- [x] API integration with Axios

### 🔒 Security Features
- [x] Input validation
- [x] AES encryption utilities
- [x] Secure token storage
- [x] Device detection
- [x] Password hashing
- [x] OTP management
- [x] JWT token handling

### 📱 Components
- [x] Custom Button component
- [x] Input field component
- [x] OTP input component
- [x] Progress indicator
- [x] Navigation stacks

### 🔧 Backend Integration
- [x] API client setup
- [x] Authentication service
- [x] Redux actions and reducers
- [x] Error handling
- [x] Token refresh logic

## Development Guidelines

### Code Style
- Use ES6+ syntax
- Follow React best practices
- Use functional components with hooks
- Proper error handling
- Clear variable naming

### File Naming
- Components: PascalCase (e.g., `LoginScreen.js`)
- Utilities: camelCase (e.g., `validators.js`)
- Constants: UPPER_SNAKE_CASE
- Files in `src/` directory

### Commits
- Use descriptive commit messages
- Commit frequently
- Reference issue numbers when applicable

### Testing
```bash
npm test              # Run tests
npm run lint         # Run linter
npm run lint:fix     # Fix linting issues
```

## Common Tasks

### Adding a New Screen
1. Create file in `src/screens/ScreenName/ScreenName.js`
2. Create styles with StyleSheet
3. Add navigation route in navigation file
4. Import and export in index files

### Adding API Endpoint
1. Add function in `src/services/authService.js`
2. Create Redux action in `src/redux/actions/`
3. Create/update reducer in `src/redux/reducers/`
4. Dispatch action from screen

### Adding a Component
1. Create file in `src/components/ComponentName.js`
2. Export as default and named export
3. Include proper PropTypes or TypeScript types
4. Add to `src/components/index.js`

### Updating Colors/Branding
- Modify `src/assets/colors/Colors.js`
- All color constants are centralized
- Typography and spacing also defined there

## API Integration

### Base URL Configuration
- Development: `http://api.psb.local:8080/api`
- Production: `https://api.psb.com/api`

Update in `src/services/apiClient.js`

### Request Flow
1. Component dispatches Redux action
2. Action calls API service
3. API service uses axios client
4. Interceptors handle tokens and errors
5. Response updates Redux store
6. Component re-renders with new state

## Security Best Practices

1. **Never commit sensitive data** - Use `.env` files
2. **Store tokens securely** - Use react-native-secure-storage
3. **Validate all inputs** - Use validators utility
4. **Encrypt sensitive data** - Use securityUtils
5. **Handle errors gracefully** - Show user-friendly messages
6. **Check device security** - Use deviceDetection utilities

## Debugging

### React Native Debugger
```bash
# Start debugger
react-native-debugger

# In app: CMD+M (Android) or CMD+D (iOS)
# Select "Debug with Chrome"
```

### Redux DevTools
- Integrated with Redux store
- Track actions and state changes
- Time-travel debugging

### Logging
```javascript
import { LOG_LEVELS } from './utils/constants';

console.log('Info:', message);
console.warn('Warning:', message);
console.error('Error:', message);
```

## Deployment

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Security checks completed
- [ ] Performance optimized
- [ ] Version bumped

### Build APK (Android)
```bash
cd android
./gradlew assembleRelease
```

### Build IPA (iOS)
```bash
cd ios
xcodebuild -workspace PSBDigital.xcworkspace -scheme PSBDigital -configuration Release
```

## Troubleshooting

### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Build Issues
```bash
cd ios
rm -rf Pods
pod install
cd ..
npm run ios
```

### Dependency Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Performance Tips

1. Use React.memo for expensive components
2. Implement FlatList for long lists
3. Lazy load images and screens
4. Minimize re-renders with Redux selectors
5. Use useCallback for function props
6. Optimize bundle size

## Resources

- [React Native Documentation](https://reactnative.dev)
- [Redux Documentation](https://redux.js.org)
- [React Navigation Guide](https://reactnavigation.org)
- [Axios Documentation](https://axios-http.com)
- [PSB Official Website](https://www.psbindia.com)

## Support & Contribution

- Report bugs via GitHub Issues
- Create pull requests for new features
- Follow code of conduct
- Request features via discussions

## Important Notes

- Backend implementation is required for full functionality
- API endpoints need to be configured
- SMS and Email services need to be integrated
- Biometric authentication requires native modules
- SSL pinning implementation required for production

## Version History

- **v0.0.1** (May 2026) - Initial setup and core features

---

**Last Updated**: May 2026
**Maintained By**: PSB Tech Team
**Status**: In Development
