package com.growkaro.backend.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.UserScheme.UserSchemeStatus;
import com.growkaro.backend.service.ApiService;
import com.growkaro.backend.service.EmailService;
import com.growkaro.backend.service.RedisService;
import com.growkaro.backend.service.UserAPIService;

@RestController
@RequestMapping("/api/user")
public class UserAPIController {

    private static final Logger log = LoggerFactory.getLogger(UserAPIController.class);

    private final UserAPIService userAPIService;
    private final EmailService emailService;
    private final RedisService redisService;
    private final General general;
    private final ApiService apiService;

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

    public UserAPIController(UserAPIService userAPIService, EmailService emailService, RedisService redisService,
            ApiService apiService, General general) {
        this.userAPIService = userAPIService;
        this.emailService = emailService;
        this.redisService = redisService;
        this.apiService = apiService;
        this.general = general;
    }

    @GetMapping("/test")
    public Boolean test() {
        return userAPIService.testApi();
    }

    @PostMapping("/getEmailOtp/{email}")
    public ResponseEntity<Map<String, Object>> sendEmailOTP(@PathVariable String email) {
        log.debug("OTP requested for email: {}", email);

        if (!general.validateEmail(email)) {
            return ResponseEntity.badRequest()
                    .body(general.response("invalid", "Enter a valid email address.", null));
        }
        if (userAPIService.isUserExists(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(general.response("present", "Email already exists", null));
        }

        boolean sent = emailService.sendOtp(email, Remark.SIGNUP.getValue());
        return sent
                ? ResponseEntity.ok(general.response("success", "Otp sent successfully", null))
                : ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
    }

    @PostMapping("/validateEmailOtp")
    public ResponseEntity<Map<String, Object>> verifyEmailOTP(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        if (email == null || !general.validateEmail(email) || otp == null || otp.length() != 6) {
            return ResponseEntity.badRequest()
                    .body(general.response("error", "Invalid email or OTP", null));
        }

        boolean verified = redisService.verifyOtp(Remark.SIGNUP.getValue(), email, otp);
        log.debug("OTP verification result for {}: {}", email, verified);

        return verified
                ? ResponseEntity.ok(general.response("ok", "Email verified successfully", null))
                : ResponseEntity.badRequest().body(general.response("error", "Invalid email or OTP", null));
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signUp(@RequestBody Map<String, Object> payload) {
        try {
            UserRegister user = general.toUserRegister(payload);

            if (user.name() == null || user.email() == null || !general.validateEmail(user.email())
                    || user.phone() == null
                    || user.passwordHash() == null || !general.validatePassword(user.passwordHash())) {
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data", null));
            }

            boolean result = userAPIService.userSignup(user);
            return result
                    ? ResponseEntity.ok(general.response("ok", "Account created successfully", null))
                    : ResponseEntity.internalServerError()
                            .body(general.response("error", "Internal Server error", null));
        } catch (Exception e) {
            log.error("Error during signup", e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> credentials) {
        String email = general.stringValue(credentials.get("email"));
        String password = general.stringValue(credentials.get("password"));

        if (email == null || !general.validateEmail(email) || password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(general.response("error", "Invalid credentials", null));
        }
        return ResponseEntity.ok(userAPIService.login(email, password));
    }

    @PostMapping("/logout/{userId}/{userName}")
    public ResponseEntity<Map<String, Object>> logout(@PathVariable String userId, @PathVariable String userName) {
        return ResponseEntity.ok(userAPIService.logout(userId, userName));
    }

    @PostMapping("/scheme/enroll/{schemeId}/{userId}")
    public ResponseEntity<Map<String, Object>> enrollScheme(@PathVariable String schemeId,
            @PathVariable String userId) {
        try {
            if (schemeId.isBlank() || userId.isBlank()) {
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data", null));
            }
            return ResponseEntity.ok(userAPIService.enrollScheme(schemeId, userId));
        } catch (Exception e) {
            log.error("Error enrolling scheme {} for user {}", schemeId, userId, e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
    }

    @PostMapping("/myscheme/{userId}")
    public ResponseEntity<Map<String, Object>> getMySchemesIds(@PathVariable String userId) {
        return ResponseEntity.ok(userAPIService.getMyScheme(userId));
    }

    @GetMapping("/scheme/user/{userId}")
    public ResponseEntity<Map<String, Object>> userScheme(@PathVariable String userId) {
        return ResponseEntity.ok(userAPIService.getUserPortfolio(userId));
    }

    @PutMapping("/scheme/withdraw/{userSchemeId}/{userId}")
    public ResponseEntity<Map<String, Object>> userSchemeWithdraw(@PathVariable String userSchemeId,
            @PathVariable String userId) {
        try {
            if (userSchemeId.isBlank() || userId.isBlank()) {
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data", null));
            }
            return ResponseEntity.ok(apiService.userSchemeStatusUpdate(userSchemeId, userId,
                    UserSchemeStatus.WITHDRAWN, UserSchemeStatus.PENDING, null));
        } catch (Exception e) {
            log.error("Error withdrawing userScheme {} for user {}", userSchemeId, userId, e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
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

    // @GetMapping("/{userId}/transactions")
    // public ResponseEntity<Map<String, Object>> userTransactions(
    // @PathVariable String userId,
    // @RequestParam(required = false, defaultValue = "1") int page) {
    // return ResponseEntity.ok(userAPIService.userTransactions(userId, page));
    // }

    @GetMapping("/{userId}/notifications")
    public ResponseEntity<Map<String, Object>> userNotifications(@PathVariable String userId) {
        return ResponseEntity.ok(userAPIService.userNotifications(userId));
    }

    @PutMapping("/{userId}/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @PathVariable String userId,
            @RequestBody Map<String, String> passwordPayload) {
        String oldPassword = passwordPayload.get("oldPassword");
        String newPassword = passwordPayload.get("newPassword");

        if (oldPassword == null || newPassword == null || !general.validatePassword(newPassword)) {
            return ResponseEntity.badRequest().body(general.response("error", "Invalid password data", null));
        }
        return ResponseEntity.ok(userAPIService.changePassword(userId, oldPassword, newPassword));
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
}