package com.growkaro.backend.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.growkaro.backend.DRO.EnrollingUser;
import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.DRO.WithdrawAmount;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserProfile;
import com.growkaro.backend.enums.Remark;
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

    public UserAPIController(UserAPIService userAPIService, EmailService emailService, RedisService redisService,
            ApiService apiService, General general) {
        this.userAPIService = userAPIService;
        this.emailService = emailService;
        this.redisService = redisService;
        this.apiService = apiService;
        this.general = general;
    }

    @GetMapping("/test")
    public boolean test() {
        System.out.println(general.getCurrentDateTime());
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

        emailService.sendOtp(email, Remark.SIGNUP.getValue());
        return ResponseEntity.ok(general.response("success", "Otp sent successfully", null));
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

    @PutMapping("/scheme/enroll")
    public ResponseEntity<Map<String, Object>> enrollScheme(@RequestBody EnrollingUser enrollingUser) {
        try {
            if (enrollingUser.schemeId().isBlank() || enrollingUser.userId().isBlank()) {
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data", null));
            }
            return ResponseEntity.ok(userAPIService.enrollInScheme(enrollingUser.schemeId(), enrollingUser.userId(),
                    enrollingUser.amount()));
        } catch (Exception e) {
            log.error("Error enrolling scheme {} for user {} with amount {}", enrollingUser.schemeId(),
                    enrollingUser.userId(), enrollingUser.amount(), e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
    }

    @PostMapping("/myscheme/{userId}")
    public ResponseEntity<Map<String, Object>> getMySchemesIds(@PathVariable String userId) {
        return ResponseEntity.ok(userAPIService.getMyScheme(userId));
    }

    @GetMapping("/scheme/user/{userId}")
    public ResponseEntity<Map<String, Object>> showUserPortfolio(@PathVariable String userId) {
        return ResponseEntity.ok(userAPIService.getUserPortfolio(userId));
    }

    @PutMapping("/scheme/withdraw/{userSchemeId}/{userId}")
    public ResponseEntity<Map<String, Object>> userSchemeWithdraw(@PathVariable String userSchemeId,
            @PathVariable String userId) {
        try {
            if (userSchemeId.isBlank() || userId.isBlank()) {
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data", null));
            }
            return ResponseEntity.ok(userAPIService.schemeWithdrawal(userSchemeId, userId));
        } catch (Exception e) {
            log.error("Error withdrawing userScheme {} for user {}", userSchemeId, userId, e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
    }

    @PostMapping("/forgot-password/{email}")
    public ResponseEntity<Map<String, Object>> forgotPassword(@PathVariable String email) {
        if (email == null || email.isBlank() || !general.validateEmail(email)) {
            return ResponseEntity.badRequest().body(general.response("error", "Invalid data", null));
        }
        User user = userAPIService.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.badRequest().body(general.response("error", "User not found", null));
        }
        try {
            emailService.sendResetLink(email, user.getId());
            return ResponseEntity.ok().body(general.response("success", "Reset password link sent successfully", null));
        } catch (Exception e) {
            log.error("Error sending reset password link to user {}", email, e);
            return ResponseEntity.internalServerError()
                    .body(general.response("error", "Failed to send reset password link. Please try again.", null));
        }
    }

    @PatchMapping("/reset_password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, Object> payload) {
        String userId = general.stringValue(payload.get("userId"));
        String password = general.stringValue(payload.get("password"));
        try {
            if (userId.isBlank() || password.isBlank() || !general.isValidId(userId)
                    || !general.validatePassword(password)) {
                log.error("Invalid data for user {}", userId);
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data", null));
            }
            return ResponseEntity.ok(userAPIService.changePassword(userId, password));
        } catch (Exception e) {
            log.error("Error updating password for user {}", userId, e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
    }

    @PutMapping("/change_password")
    public ResponseEntity<Map<String, Object>> updateUser(
            @RequestBody UserProfile userProfile) {
        return ResponseEntity.ok(userAPIService.updateUser(userProfile));
    }

    @PostMapping("/redeemProfit")
    public ResponseEntity<Map<String, Object>> redeem(@RequestBody WithdrawAmount wa) {
        try {
            if (wa.userId().isBlank() || wa.schemeId().isBlank() || wa.amount().compareTo(BigDecimal.ZERO) <= 0
                    || !general.isValidId(wa.userId())) {
                log.error("Invalid data for user {} schemeId {} amount {} isAggressive {} isValidId {}", wa.userId(),
                        wa.schemeId(),
                        wa.amount(), wa.isAggressive(), general.isValidId(wa.userId()));
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data...", null));
            }
            return ResponseEntity.ok(userAPIService.redeemAmount(wa));
        } catch (Exception e) {
            log.error("Error redeeming from scheme {} for user {} with amount {}",
                    wa.schemeId(), wa.userId(),
                    wa.amount(), e);
            return ResponseEntity.internalServerError().body(general.response("error",
                    "Internal Server error", null));
        }
    }

    @GetMapping("/{userId}/transactions")
    public ResponseEntity<Map<String, Object>> userTransactions(
            @PathVariable String userId) {
        return ResponseEntity.ok(userAPIService.getTransactionsofUser(userId));
    }

    /// pending
    // @DeleteMapping("/{userId}")
    // public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable String
    // userId) {
    // return ResponseEntity.ok(userAPIService.deleteUser(userId));
    // }

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