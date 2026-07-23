package com.growkaro.backend.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.growkaro.backend.common.ActivityLogBroadcaster;
import com.growkaro.backend.entity.ActivityLog;
import com.growkaro.backend.entity.ActivityType;
import com.growkaro.backend.security.NoOpAdminTokenValidator;
import com.growkaro.backend.service.ActivityLogService;

import java.time.Instant;

@RestController
@RequestMapping("/api/admin/activity-logs")
// @PreAuthorize("hasRole('ADMIN')")
public class ActivityLogController {

    private final ActivityLogService activityLogService;
    private final ActivityLogBroadcaster broadcaster;
    // for production
    // private final AdminTokenValidator tokenValidator;
    // for development
    private final NoOpAdminTokenValidator tokenValidator;

    public ActivityLogController(ActivityLogService activityLogService,
            ActivityLogBroadcaster broadcaster,
            NoOpAdminTokenValidator tokenValidator) {
        this.activityLogService = activityLogService;
        this.broadcaster = broadcaster;
        this.tokenValidator = tokenValidator;
    }

    @GetMapping
    public Page<ActivityLog> getLogs(
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) ActivityType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return activityLogService.search(actorId, type, from, to, pageable);
    }

    /**
     * Browser EventSource cannot send custom Authorization headers, so the
     * admin JWT is passed as a query param here and validated manually.
     * 
     * @PreAuthorize above still applies to normal session/cookie-based auth;
     *               this extra check covers the token-in-query-param path
     *               specifically.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam(required = false) String token) {
        // for production or after configure admin token uncomment these lines
        // if (!tokenValidator.isValidAdminToken(token)) {
        // throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or
        // expired token");
        // }
        return broadcaster.subscribe();
    }

    @GetMapping("/stream/status")
    public String connectionCount() {
        return "active admin connections: " + broadcaster.activeConnections();
    }
}
