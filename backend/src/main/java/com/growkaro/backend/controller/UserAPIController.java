package com.growkaro.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.service.UserAPIService;

@RestController
@RequestMapping("/api/user")
public class UserAPIController {

    private final UserAPIService userAPIService;
    // private final EmailService emailService;

    // Senior Practice: Use constructor injection instead of field @Autowired
    public UserAPIController(UserAPIService userAPIService) {
        this.userAPIService = userAPIService;
        // this.emailService = emailService;
    }

    // @PostMapping("/getEmailOtp")
    // public ResponseEntity<Boolean> sendEmailOTP(String email) {
    // // 1. Validate email using regex
    // String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";

    // // Quick null check to prevent NullPointerException
    // if (email == null || !email.matches(emailRegex)) {
    // return ResponseEntity.badRequest().body(false);
    // }

    // emailService.sendOtp(email, "signup");

    // return ResponseEntity.ok(true);
    // }
    // //verify email otp
    // @GetMapping("/verifyEmailOtp")
    // public ResponseEntity<Boolean> verifyEmailOTP(String email, String otp) {
    // if (email == null || otp == null) {
    // return ResponseEntity.badRequest().body(false);
    // }

    // boolean status = emailService.verifyOtp(email, otp);

    // return status ? ResponseEntity.ok(true) :
    // ResponseEntity.badRequest().body(false);
    // }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signUp(@RequestBody Map<String, Object> payload) {
        UserRegister user = toUserRegister(payload);

        if (user.name() == null || user.email() == null || user.phone() == null || user.passwordHash() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Name, email, phone and password are required"));
        }

        String result = userAPIService.userSignup(user);
        if (result.contains("success")) {
            return ResponseEntity.ok(Map.of(
                    "status", "ok",
                    "message", "Account created successfully"));
        }
        return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", result));
    }

    private UserRegister toUserRegister(Map<String, Object> payload) {
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

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> credentials) {
        return ResponseEntity.ok(userAPIService.login(credentials));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> userProfile(@PathVariable String userId) {
        return ResponseEntity.ok(userAPIService.userProfile(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable String userId,
            @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(userAPIService.updateUser(userId, updates));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable String userId) {
        return ResponseEntity.ok(userAPIService.deleteUser(userId));
    }

    @GetMapping("/{userId}/transactions")
    public ResponseEntity<Map<String, Object>> userTransactions(
            @PathVariable String userId,
            @RequestParam(required = false, defaultValue = "1") String page) {
        return ResponseEntity.ok(userAPIService.userTransactions(userId, page));
    }

    @GetMapping("/{userId}/recipients")
    public ResponseEntity<Map<String, Object>> userRecipients(
            @PathVariable String userId,
            @RequestParam(required = false, defaultValue = "1") String page) {
        return ResponseEntity.ok(userAPIService.userRecipients(userId, page));
    }

    @GetMapping("/{userId}/notifications")
    public ResponseEntity<Map<String, Object>> userNotifications(@PathVariable String userId) {
        return ResponseEntity.ok(userAPIService.userNotifications(userId));
    }

    /*
     * ==========================================
     * SENIOR ADDITIONS: New Frontend Endpoint Mappings
     * ==========================================
     */

    @PutMapping("/{userId}/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @PathVariable String userId,
            @RequestBody Map<String, String> passwordPayload) {
        String oldPassword = passwordPayload.get("oldPassword");
        String newPassword = passwordPayload.get("newPassword");
        return ResponseEntity.ok(userAPIService.changePassword(userId, oldPassword, newPassword));
    }

    @PatchMapping("/{userId}/avatar")
    public ResponseEntity<Map<String, Object>> updateProfilePicture(
            @PathVariable String userId,
            @RequestBody Map<String, String> payload) {
        // Using PATCH for a partial resource updates like avatar URLs
        return ResponseEntity.ok(userAPIService.updateProfilePicture(userId, payload.get("avatarUrl")));
    }

    @PostMapping("/{userId}/notifications/read")
    public ResponseEntity<Map<String, Object>> markNotificationsAsRead(
            @PathVariable String userId,
            @RequestBody List<String> notificationIds) {
        return ResponseEntity.ok(userAPIService.markNotificationsAsRead(userId, notificationIds));
    }

    @PutMapping("/{userId}/notifications/settings")
    public ResponseEntity<Map<String, Object>> updateNotificationSettings(
            @PathVariable String userId,
            @RequestBody Map<String, Boolean> settings) {
        return ResponseEntity.ok(userAPIService.updateNotificationSettings(userId, settings));
    }

    // get all data of users dashboard overview section
    // @GetMapping("/{userId}/dashboard/overview")
    // public ResponseEntity<Map<String, Object>> userDashboard(
    // @PathVariable String userId,
    // @RequestParam(required = false, defaultValue = "1") String page) {
    // return ResponseEntity.ok(userAPIService.userDashboard(userId, page));
    // }

}
