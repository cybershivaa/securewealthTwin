package com.psb.auth.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
public class OtpService {
    private final RedisTemplate<String, String> redisTemplate;
    private final static String OTP_PREFIX = "otp:";
    private final static int OTP_EXPIRY_MINUTES = 5;
    private final static int MAX_ATTEMPTS = 5;

    public OtpService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String generateOtp(String key) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        String redisKey = OTP_PREFIX + key;
        redisTemplate.opsForValue().set(redisKey, otp, OTP_EXPIRY_MINUTES, TimeUnit.MINUTES);
        return otp;
    }

    public boolean verifyOtp(String key, String otp) {
        String redisKey = OTP_PREFIX + key;
        String storedOtp = redisTemplate.opsForValue().get(redisKey);
        
        if (storedOtp == null) {
            return false;
        }

        if (storedOtp.equals(otp)) {
            redisTemplate.delete(redisKey);
            return true;
        }

        return false;
    }

    public void deleteOtp(String key) {
        redisTemplate.delete(OTP_PREFIX + key);
    }
}
