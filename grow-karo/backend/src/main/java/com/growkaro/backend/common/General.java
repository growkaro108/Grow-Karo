package com.growkaro.backend.common;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Random;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import com.growkaro.backend.DRO.UserRegister;

@Component
public class General {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    public boolean validateEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    // generate exactly 6 digit otp
    public String generate6DigitOTP() {
        Random rand = new Random();
        int number = 100000 + rand.nextInt(900000);
        return String.valueOf(number);
    }

    public UserRegister toUserRegister(Map<String, Object> payload) {
        String name = stringValue(payload.get("name"));
        if (name == null) {
            String firstName = stringValue(payload.get("firstName"));
            String lastName = stringValue(payload.get("lastName"));
            name = String.join(" ", firstName == null ? "" : firstName, lastName == null ? "" : lastName).trim();
            if (name.isBlank()) {
                name = null;
            }
        }

        String passwordHash = stringValue(payload.get("passwordHash"));
        if (passwordHash == null) {
            passwordHash = stringValue(payload.get("password"));
        }

        return new UserRegister(
                name,
                stringValue(payload.get("email")),
                stringValue(payload.get("phone")),
                passwordHash,
                stringValue(payload.get("bankName")),
                stringValue(payload.get("accountHolderName")),
                stringValue(payload.get("accountNumber")),
                stringValue(payload.get("ifscCode")));
    }

    public String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    public boolean validatePassword(String password) {
        Pattern PASSWORD_PATTERN = Pattern
                .compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>])(?=\\S+$).{8,64}$");
        return password != null && PASSWORD_PATTERN.matcher(password).matches();
    }

    public Map<String, Object> response(String status, String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", status);
        response.put("message", message);
        response.put("data", data != null ? data : Map.of());
        return response;
    }
}
