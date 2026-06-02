package com.psb.auth.utils;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class EncryptionUtil {
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public String hashPassword(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    public boolean verifyPassword(String rawPassword, String hashedPassword) {
        return encoder.matches(rawPassword, hashedPassword);
    }

    public String hashMpin(String rawMpin) {
        return encoder.encode(rawMpin);
    }

    public boolean verifyMpin(String rawMpin, String hashedMpin) {
        return encoder.matches(rawMpin, hashedMpin);
    }
}
