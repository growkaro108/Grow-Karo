package com.growkaro.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.common.General;
import com.growkaro.backend.service.EmailService;
import com.growkaro.backend.service.RedisService;
import com.growkaro.backend.service.UserAPIService;

@RestController
@RequestMapping("/api/user")
public class UserAPIController {

    private final UserAPIService userAPIService;
    private final EmailService emailService;
    private final RedisService redisService;
    private final General general;

    private enum Remark {
        SIGNUP("signup"),
        LOGIN("login"),
        FORGOT_PASSWORD("forgotPassword"),
        RESET_PASSWORD("resetPassword");

        private final String value;

        Remark(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }

    // Senior Practice: Use constructor injection instead of field @Autowired
    public UserAPIController(UserAPIService userAPIService, EmailService emailService, RedisService redisService,
            General general) {
        this.userAPIService = userAPIService;
        this.emailService = emailService;
        this.redisService = redisService;
        this.general = general;
    }

    @GetMapping("/test")
    public boolean test() {
        boolean status = false;
        return status;
    }

    @PostMapping("/getEmailOtp/{email}")
    public ResponseEntity<Boolean> sendEmailOTP(@PathVariable String email) {
        System.out.println(email + "\n -------------");
        if (email == null || !general.validateEmail(email)) {
            return ResponseEntity.badRequest().body(false);
        }
        boolean response = emailService.sendOtp(email, Remark.SIGNUP.getValue());
        return ResponseEntity.ok(response);
    }

    // verify email otp
    @PostMapping("/validateEmailOtp")
    public ResponseEntity<Boolean> verifyEmailOTP(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        System.out.println(email + "\n" + otp + "\n--------");
        if (email == null || !general.validateEmail(email) || otp == null || otp.length() != 6) {
            return ResponseEntity.badRequest().body(false);
        }
        boolean status = redisService.verifyOtp(Remark.SIGNUP.getValue(), email, otp);
        System.out.println("verify status:" + status);
        return status ? ResponseEntity.ok(true) : ResponseEntity.badRequest().body(false);
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signUp(@RequestBody Map<String, Object> payload) {
        UserRegister user = general.toUserRegister(payload);

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

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> credentials) {
        String email = general.stringValue(credentials.get("email"));
        String password = general.stringValue(credentials.get("password"));

        if (email == null || !general.validateEmail(email) || password == null || !general.validatePassword(password)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Invalid cedential..."));
        }
        return ResponseEntity.ok(userAPIService.login(email, password));
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
