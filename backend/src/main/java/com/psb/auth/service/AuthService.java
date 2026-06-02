package com.psb.auth.service;

import com.psb.auth.entity.User;
import com.psb.auth.repository.UserRepository;
import com.psb.auth.utils.EncryptionUtil;
import com.psb.auth.utils.JwtUtil;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final OtpService otpService;
    private final JwtUtil jwtUtil;
    private final EncryptionUtil encryptionUtil;

    public AuthService(UserRepository userRepository, OtpService otpService, JwtUtil jwtUtil, EncryptionUtil encryptionUtil) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.jwtUtil = jwtUtil;
        this.encryptionUtil = encryptionUtil;
    }

    public String sendMobileOtp(String mobile) {
        // In production, send via SMS provider (Twilio, AWS SNS, etc.)
        String otp = otpService.generateOtp(mobile);
        System.out.println("OTP for " + mobile + ": " + otp); // Mock SMS
        return "OTP sent";
    }

    public Map<String, Object> verifyMobileOtp(String mobile, String otp) throws Exception {
        if (!otpService.verifyOtp(mobile, otp)) {
            throw new Exception("Invalid OTP");
        }

        Optional<User> existing = userRepository.findByMobile(mobile);
        User user;
        
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            user = new User();
            user.setMobile(mobile);
            user = userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getId(), user.getMobile());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getMobile());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("refreshToken", refreshToken);
        response.put("userId", user.getId());
        return response;
    }

    public Map<String, Object> register(Map<String, Object> data) throws Exception {
        String username = (String) data.get("username");
        String password = (String) data.get("password");
        String mpin = (String) data.get("mpin");
        String mobile = (String) data.get("mobile");
        String email = (String) data.get("email");

        if (userRepository.existsByUsername(username)) {
            throw new Exception("Username already exists");
        }

        Optional<User> existing = userRepository.findByMobile(mobile);
        User user = existing.orElseThrow(() -> new Exception("Mobile not verified"));

        user.setUsername(username);
        user.setPasswordHash(encryptionUtil.hashPassword(password));
        user.setMpinHash(encryptionUtil.hashMpin(mpin));
        user.setEmail(email);
        user.setVerified(true);
        user = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getId());
        response.put("message", "Registration successful");
        return response;
    }

    public Map<String, Object> login(String username, String password) throws Exception {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new Exception("Invalid credentials"));

        if (!encryptionUtil.verifyPassword(password, user.getPasswordHash())) {
            throw new Exception("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("refreshToken", refreshToken);
        response.put("userId", user.getId());
        return response;
    }

    public Map<String, Object> loginWithMpin(String mobile, String mpin) throws Exception {
        User user = userRepository.findByMobile(mobile)
                .orElseThrow(() -> new Exception("User not found"));

        if (!encryptionUtil.verifyMpin(mpin, user.getMpinHash())) {
            throw new Exception("Invalid MPIN");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("refreshToken", refreshToken);
        response.put("userId", user.getId());
        return response;
    }

    public Map<String, Object> refreshAccessToken(String refreshToken) throws Exception {
        if (!jwtUtil.isTokenValid(refreshToken)) {
            throw new Exception("Invalid refresh token");
        }

        String userId = jwtUtil.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        String newToken = jwtUtil.generateToken(user.getId(), user.getUsername());
        Map<String, Object> response = new HashMap<>();
        response.put("token", newToken);
        return response;
    }
}
