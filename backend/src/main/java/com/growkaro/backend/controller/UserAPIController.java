package com.growkaro.backend.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.growkaro.backend.DRO.EnrollingUser;
import com.growkaro.backend.DRO.NewNominee;
import com.growkaro.backend.DRO.RaiseIssue;
import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.DRO.WithdrawAmount;
import com.growkaro.backend.DTO.NomineeResponse;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserProfile;
import com.growkaro.backend.enums.Remark;
import com.growkaro.backend.service.ApiService;
import com.growkaro.backend.service.EmailService;
import com.growkaro.backend.service.RedisService;
import com.growkaro.backend.common.NotificationBroadcaster;
import com.growkaro.backend.entity.Notification.ReceiverType;
import com.growkaro.backend.entity.Reply;
import com.growkaro.backend.entity.SupportIssue.Status;

import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.growkaro.backend.service.RemitterAPIService;
import com.growkaro.backend.service.UserAPIService;

@RestController
@RequestMapping("/api/user")
public class UserAPIController {

    private static final Logger log = LoggerFactory.getLogger(UserAPIController.class);

    private final UserAPIService userAPIService;
    private final EmailService emailService;
    private final RedisService redisService;
    private final RemitterAPIService remitterAPIService;
    private final General general;
    private final ApiService apiService;
    private final NotificationBroadcaster notificationBroadcaster;

    public UserAPIController(UserAPIService userAPIService, EmailService emailService, RedisService redisService,
            RemitterAPIService remitterAPIService, General general, ApiService apiService,
            NotificationBroadcaster notificationBroadcaster) {
        this.userAPIService = userAPIService;
        this.emailService = emailService;
        this.redisService = redisService;
        this.remitterAPIService = remitterAPIService;
        this.general = general;
        this.apiService = apiService;
        this.notificationBroadcaster = notificationBroadcaster;
    }

    @GetMapping("/test")
    public Object test() {

        return userAPIService.testApis();
        // return null;
    }

    @PostMapping("/getEmailOtp/{email}")
    public ResponseEntity<Map<String, Object>> sendEmailOTP(@PathVariable String email) {
        log.debug("OTP requested for email: {}", email);

        if (!general.validateEmail(email)) {
            return ResponseEntity.badRequest()
                    .body(general.response("invalid", "Enter a valid email address.", null));
        }
        // check if user or remitter with same email exists
        if (userAPIService.isUserExists(email) || remitterAPIService.isRemitterExists(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(general.response("info", "Email already registered..", null));
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
            log.warn("Invalid credentials for email: {}", email);
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
            if (enrollingUser.schemeId().isBlank() || enrollingUser.userId().isBlank()
                    || enrollingUser.nomineeId().isBlank() || enrollingUser.amount() == null) {
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data", null));
            }
            return ResponseEntity.ok(userAPIService.enrollInScheme(enrollingUser.schemeId(), enrollingUser.userId(),
                    enrollingUser.amount(), enrollingUser.nomineeId()));

        } catch (Exception e) {
            log.error("Error enrolling scheme {} for user {} with amount {}", enrollingUser.schemeId(),
                    enrollingUser.userId(), enrollingUser.amount(), e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
    }

    @PostMapping("/myscheme/{userId}")
    public ResponseEntity<Map<String, Object>> getMySchemesIds(@PathVariable String userId) {
        try {
            if (userId.isBlank()) {
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data", null));
            }
            return ResponseEntity.ok(userAPIService.getMyScheme(userId));
        } catch (Exception e) {
            log.error("Error getting user schemes ids for user {}", userId, e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
    }

    @GetMapping("/scheme/user/{userId}")
    public ResponseEntity<Map<String, Object>> showUserPortfolio(@PathVariable String userId) {
        try {
            if (userId.isBlank() || !general.isValidId(userId)) {
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data", null));
            }
            return ResponseEntity.ok(userAPIService.getUserPortfolio(userId));

        } catch (Exception e) {
            log.error("Error showing user portfolio for user {}", userId, e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
    }

    @PutMapping("/scheme/withdraw/{userSchemeId}/{userId}")
    public ResponseEntity<Map<String, Object>> userSchemeRemove(@PathVariable String userSchemeId,
            @PathVariable String userId) {
        try {
            if (userSchemeId.isBlank() || userId.isBlank() || !general.isValidId(userId)
                    || !general.isValidId(userSchemeId)) {
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

    @GetMapping("/{userId}/nominees")
    public ResponseEntity<Map<String, Object>> fetchNominees(@PathVariable String userId) {
        List<NomineeResponse> nominees = userAPIService.getNominees(userId);
        return nominees == null
                ? ResponseEntity.badRequest().body(general.response("error", "Invalid data...", null))
                : ResponseEntity.ok(general.response("success", "Nominees fetched", nominees));
    }

    @PostMapping("/addNominee")
    public ResponseEntity<Map<String, Object>> addNominee(@RequestBody NewNominee nominee) {
        try {
            if (nominee.userId().isBlank() || nominee.name().isBlank() || nominee.relation().isBlank()
                    || nominee.aadhaarNo().isBlank() || nominee.phone().isBlank()) {
                log.error("Invalid data for user {}", nominee.userId());
                return ResponseEntity.badRequest().body(general.response("error", "Invalid data...", null));
            }
            NomineeResponse newNominee = userAPIService.addNominee(nominee);
            return newNominee == null
                    ? ResponseEntity.badRequest().body(general.response("error", "Failed to add nominee", null))
                    : ResponseEntity.ok(general.response("success", "Nominee added successfully", newNominee));
        } catch (Exception e) {
            log.error("Error adding nominee for user {}", nominee.userId(), e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
    }

    @DeleteMapping("/{userId}/nominees/{nomineeId}")
    public ResponseEntity<Map<String, Object>> deleteNominee(
            @PathVariable String userId, @PathVariable String nomineeId) {
        Map<String, Object> response = userAPIService.deleteNominee(userId, nomineeId);
        return "success".equals(response.get("status"))
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @PutMapping("/{userId}/nominees/{nomineeId}")
    public ResponseEntity<Map<String, Object>> updateNominee(
            @PathVariable String userId, @PathVariable String nomineeId,
            @RequestBody NewNominee nominee) {
        Map<String, Object> response = userAPIService.updateNominee(userId, nomineeId, nominee);
        return "success".equals(response.get("status"))
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/{userId}/issues")
    public Map<String, Object> fetchUserIssues(@PathVariable String userId,
            @RequestParam(required = false, defaultValue = "unresolved") String status,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        if (!general.isValidId(userId)) {
            log.error("Invalid data for user {}", userId);
            return general.response("error", "Invalid data...", null);
        }
        int validPage = Math.max(1, page) - 1;
        int validSize = Math.min(Math.max(1, limit), 10);
        try {
            // The API accepts 1-based page numbers; Spring Data uses a 0-based index.
            Pageable pageable = PageRequest.of(validPage, validSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            if (status == null || status.isBlank()) {
                return general.response("error", "Invalid status.", null);
            }
            Status askedStatus = null;
            switch (status.toLowerCase()) {
                case "unresolved":
                    askedStatus = Status.OPEN;
                    break;
                case "in_progress":
                    askedStatus = Status.IN_PROGRESS;
                    break;
                case "resolved":
                    askedStatus = Status.CLOSED;
                    break;
                default:
                    return general.response("error", "Invalid status.", null);
            }
            var result = userAPIService.issues(userId, askedStatus, pageable);
            if (result == null) {
                return general.response("error", "Failed to fetch issues", null);
            }
            return general.response("success", "Issues fetched successfully", result);
        } catch (Exception e) {
            log.error("Error while fetching issues: " + e.getMessage());
            return general.response("error",
                    "something went wrong..", null);
        }
    }

    @PostMapping("/issue/comment")
    public ResponseEntity<Map<String, Object>> userComment(@RequestBody Map<String, String> payload) {
        try {
            return ResponseEntity.ok(userAPIService.addComment(
                    general.stringValue(payload.get("issueId")),
                    general.stringValue(payload.get("reply"))));
        } catch (Exception e) {
            log.error("Error adding comment for issue {}", payload.get("issueId"), e);
            return ResponseEntity.internalServerError().body(general.response("error", "Internal Server error", null));
        }
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
    public ResponseEntity<Map<String, Object>> userNotifications(
            @PathVariable String userId,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "unread") String tab) {
        if (!general.isValidId(userId) || page <= 0 || page > 100) {
            return ResponseEntity.badRequest().body(general.response("error", "Invalid user ID or page number", null));
        }
        return ResponseEntity.ok(userAPIService.userNotifications(userId, tab, page));
    }

    @PostMapping("/{userId}/notifications/read")
    public ResponseEntity<Map<String, Object>> markNotificationsAsRead(
            @PathVariable String userId,
            @RequestBody(required = false) List<String> notificationIds) {
        return ResponseEntity.ok(userAPIService.markNotificationsAsRead(userId, notificationIds));
    }

    @GetMapping(value = "/{userId}/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamUserNotifications(@PathVariable String userId) {
        return notificationBroadcaster.subscribe(ReceiverType.User, userId);
    }

    @PostMapping("/{userId}/raiseIssue")
    public ResponseEntity<Map<String, Object>> raiseIssue(@PathVariable String userId, @RequestBody RaiseIssue issue) {
        if (issue == null || issue.title() == null || issue.title().isBlank() || issue.description() == null
                || issue.description().isBlank() || userId == null || userId.isBlank()

        ) {
            return ResponseEntity.badRequest().body(general.response("error", "Invalid request...", null));
        }
        return ResponseEntity.ok(userAPIService.submitIssue(userId, issue));
    }

    // pending
    @PutMapping("/{userId}/notifications/settings")
    public ResponseEntity<Map<String, Object>> updateNotificationSettings(
            @PathVariable String userId,
            @RequestBody Map<String, Boolean> settings) {
        return ResponseEntity.ok(userAPIService.updateNotificationSettings(userId, settings));
    }
}