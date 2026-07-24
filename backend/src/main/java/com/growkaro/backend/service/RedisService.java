package com.growkaro.backend.service;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisService {

    private static final Logger log = LoggerFactory.getLogger(RedisService.class);
    private static final Duration DEFAULT_OTP_TTL = Duration.ofMinutes(5);

    private final RedisTemplate<String, Object> redisTemplate;

    public RedisService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean saveOtp(String remark, String email, String otp) {
        try {
            String redisKey = buildOtpKey(remark, email);
            redisTemplate.opsForValue().set(redisKey, otp, DEFAULT_OTP_TTL);
            return true;
        } catch (Exception e) {
            log.error("Failed to save OTP for key otp:{}:{}", remark, email, e);
            return false;
        }
    }

    public boolean verifyOtp(String remark, String email, String submittedOtp) {
        String redisKey = buildOtpKey(remark, email);

        try {
            Object stored = redisTemplate.opsForValue().get(redisKey);
            if (stored == null) {
                log.debug("No OTP found (expired or never set) for key {}", redisKey);
                return false;
            }

            boolean matches = String.valueOf(stored).equals(submittedOtp);
            if (matches) {
                redisTemplate.delete(redisKey); // one-time use
            }
            return matches;
        } catch (Exception e) {
            log.error("Failed to verify OTP for key {}", redisKey, e);
            return false;
        }
    }

    /** Returns remaining TTL in seconds for a pending OTP, or -1 if none exists. */
    public long getOtpTtlSeconds(String remark, String email) {
        String redisKey = buildOtpKey(remark, email);
        Long ttl = redisTemplate.getExpire(redisKey, TimeUnit.SECONDS);
        return ttl != null ? ttl : -1;
    }

    private String buildOtpKey(String remark, String email) {
        return "otp:" + remark + ":" + email;
    }

    // ---------- Generic key/value helpers ----------

    public boolean setValue(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
            return true;
        } catch (Exception e) {
            log.error("Failed to set value for key {}", key, e);
            return false;
        }
    }

    public boolean setValue(String key, Object value, Duration timeout) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout);
            return true;
        } catch (Exception e) {
            log.error("Failed to set value with TTL for key {}", key, e);
            return false;
        }
    }

    public Object getValue(String key) {
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.error("Failed to get value for key {}", key, e);
            return null;
        }
    }

    public boolean delete(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.delete(key));
        } catch (Exception e) {
            log.error("Failed to delete key {}", key, e);
            return false;
        }
    }

    public long delete(List<String> keys) {
        try {
            Long count = redisTemplate.delete(keys);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("Failed to delete keys {}", keys, e);
            return 0;
        }
    }

    public long delete(Set<String> keys) {
        try {
            Long count = redisTemplate.delete(keys);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("Failed to delete keys {}", keys, e);
            return 0;
        }
    }
}