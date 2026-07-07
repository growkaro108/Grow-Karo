package com.growkaro.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.growkaro.backend.DRO.UserRegister;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.service.UserAPIService;

@RestController
@RequestMapping("/api/users")
public class UserAPIController {

    private final UserAPIService userAPIService;

    // Senior Practice: Use constructor injection instead of field @Autowired
    public UserAPIController(UserAPIService userAPIService) {
        this.userAPIService = userAPIService;
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signUp(@RequestBody UserRegister user) {
        System.out.println("request from frontend" + user);

        if (user == null) {
            return ResponseEntity.badRequest().body("Invalid data");
        }
        String result = userAPIService.userSignup(user);
        if (result.contains("success")) {
            return ResponseEntity.ok("Account created Successfully");
        } else {
            return ResponseEntity.badRequest().body(result);
        }
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
}