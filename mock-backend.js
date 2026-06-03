const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = 8080;
const otps = new Map();
const users = new Map();

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function genToken() {
  return 'tok_' + Math.random().toString(36).substring(2, 12);
}

app.post('/api/auth/send-otp', (req, res) => {
  const { mobile } = req.body || {};
  if (!mobile) return res.status(400).json({ message: 'Mobile required' });
  const otp = genOtp();
  otps.set(mobile, otp);
  // expire in 5 minutes
  setTimeout(() => otps.delete(mobile), 5 * 60 * 1000);
  console.log(`Mock OTP for ${mobile}: ${otp}`);
  return res.json({ message: 'OTP sent (mock)', otp });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { mobile, otp } = req.body || {};
  if (!mobile || !otp) return res.status(400).json({ message: 'mobile & otp required' });
  const correct = otps.get(mobile);
  if (!correct || correct !== otp) return res.status(400).json({ message: 'Invalid or expired OTP' });
  otps.delete(mobile);
  // create or find user
  let user = Array.from(users.values()).find(u => u.mobile === mobile);
  if (!user) {
    user = { id: 'u_' + Date.now(), mobile, username: null };
    users.set(user.id, user);
  }
  const token = genToken();
  const refreshToken = genToken();
  return res.json({ token, refreshToken, user });
});

app.post('/api/auth/register', (req, res) => {
  const body = req.body || {};
  if (!body.mobile || !body.username || !body.password) return res.status(400).json({ message: 'mobile, username, password required' });

  const userByMobile = Array.from(users.values()).find(u => u.mobile === body.mobile);
  const userByUsername = Array.from(users.values()).find(u => u.username === body.username);
  const userByEmail = body.email ? Array.from(users.values()).find(u => u.email === body.email) : null;

  if (userByUsername && userByUsername.mobile !== body.mobile) {
    return res.status(400).json({ message: 'Username already taken' });
  }
  if (userByEmail && userByEmail.mobile !== body.mobile) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  if (userByMobile && userByMobile.username && userByMobile.username !== body.username) {
    return res.status(400).json({ message: 'Mobile already registered' });
  }

  if (userByMobile) {
    // Complete registration for a previously OTP-verified user.
    userByMobile.username = body.username;
    userByMobile.email = body.email;
    userByMobile.password = body.password;
    userByMobile.mpin = body.mpin;
    userByMobile.fullName = body.fullName;
    userByMobile.dob = body.dob;
    userByMobile.gender = body.gender;
    userByMobile.pan = body.pan;
    userByMobile.aadhaar = body.aadhaar;
    userByMobile.accountNumber = body.accountNumber;
    userByMobile.cifNumber = body.cifNumber;
    console.log('Mock register update:', userByMobile);
    return res.status(200).json({ message: 'Registered', user: userByMobile });
  }

  const id = 'u_' + Date.now();
  const user = {
    id,
    mobile: body.mobile,
    username: body.username,
    email: body.email,
    fullName: body.fullName,
    password: body.password,
    mpin: body.mpin,
    dob: body.dob,
    gender: body.gender,
    pan: body.pan,
    aadhaar: body.aadhaar,
    accountNumber: body.accountNumber,
    cifNumber: body.cifNumber
  };
  users.set(id, user);
  console.log('Mock register:', user);
  return res.status(201).json({ message: 'Registered', user });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'username & password required' });
  // In mock, any password accepted if username exists
  const user = Array.from(users.values()).find(u => u.username === username);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const token = genToken();
  const refreshToken = genToken();
  return res.json({ token, refreshToken, user });
});

app.post('/api/auth/login-mpin', (req, res) => {
  const { mobile, mpin } = req.body || {};
  if (!mobile || !mpin) return res.status(400).json({ message: 'mobile & mpin required' });
  const user = Array.from(users.values()).find(u => u.mobile === mobile);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const token = genToken();
  const refreshToken = genToken();
  return res.json({ token, refreshToken, user });
});

app.listen(PORT, () => {
  console.log(`Mock backend listening on http://localhost:${PORT}`);
});
