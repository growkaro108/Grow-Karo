package com.growkaro.backend.DTO;

import java.math.BigInteger;
import java.time.DateTimeException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.Locale;

public final class CustomerIdCodec {
    private CustomerIdCodec() {
        /* This utility class should not be instantiated */
    }

    private static final String PREFIX = "GKUID";
    private static final LocalDateTime EPOCH = LocalDateTime.of(2020, 1, 1, 0, 0, 0);

    // "uuuu" + STRICT: rejects impossible dates (e.g. Feb 30) instead of silently clamping them
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("uuuuMMddHHmmss").withResolverStyle(ResolverStyle.STRICT);

    private static final long N = 2_176_782_336L; // 36^6 = 2^12 * 3^12
    private static final long MULT = 1_000_000_007L; // must not be divisible by 2 or 3
    private static final long ADD = 123_456_789L; // any number
    private static final long INV = BigInteger.valueOf(MULT)
            .modInverse(BigInteger.valueOf(N)).longValue();

    /** GKUID20260925170319 -> 6-char code */
    public static String toCustomerId(String userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is null");
        }
        // Locale.ROOT: default-locale case mapping breaks letters like 'i' (e.g. Turkish locale)
        String id = userId.trim().toUpperCase(Locale.ROOT);

        if (!id.startsWith(PREFIX)) {
            throw new IllegalArgumentException("User ID must start with " + PREFIX + ": " + userId);
        }
        String digits = id.substring(PREFIX.length());
        if (!digits.matches("\\d{14}")) {
            throw new IllegalArgumentException(
                    "User ID must be " + PREFIX + " + 14 digits (yyyyMMddHHmmss): " + userId);
        }

        LocalDateTime time;
        try {
            time = LocalDateTime.parse(digits, FMT);
        } catch (DateTimeException e) {
            throw new IllegalArgumentException("User ID has an invalid date/time: " + userId, e);
        }

        long seconds = Duration.between(EPOCH, time).getSeconds();
        if (seconds < 0 || seconds >= N) {
            throw new IllegalArgumentException(
                    "Timestamp out of supported range (2020-01-01 .. ~2089): " + userId);
        }

        long scrambled = (seconds * MULT + ADD) % N; // max ~2.2e18, fits in long
        String code = Long.toString(scrambled, 36).toUpperCase(Locale.ROOT);
        return "0".repeat(6 - code.length()) + code;
    }

    /** 6-char code -> GKUID20260925170319 */
    public static String toUserId(String customerId) {
        String code = customerId == null ? "" : customerId.trim().toUpperCase(Locale.ROOT);
        if (!code.matches("[0-9A-Z]{6}")) {
            throw new IllegalArgumentException("Invalid customer ID: " + customerId);
        }

        long scrambled = Long.parseLong(code, 36);
        long seconds = (((scrambled - ADD) % N + N) % N) * INV % N;

        return PREFIX + EPOCH.plusSeconds(seconds).format(FMT);
    }
}