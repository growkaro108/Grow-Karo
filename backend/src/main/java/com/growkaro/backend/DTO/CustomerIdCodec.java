package com.growkaro.backend.DTO;

import java.math.BigInteger;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class CustomerIdCodec {

    private static final String PREFIX = "GKUID";
    private static final LocalDateTime EPOCH = LocalDateTime.of(2020, 1, 1, 0, 0, 0);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private static final long N = 2_176_782_336L; // 36^6 = 6^12 = 2^12 * 3^12
    private static final long MULT = 1_000_000_007L; // must not be divisible by 2 or 3
    private static final long ADD = 123_456_789L; // any number
    private static final long INV = BigInteger.valueOf(MULT)
            .modInverse(BigInteger.valueOf(N)).longValue();

    /** GKUID20260925170319 -> 6-char code */
    public static String toCustomerId(String userId) {
        String digits = userId.trim().toUpperCase().replace(PREFIX, "");
        LocalDateTime time = LocalDateTime.parse(digits, FMT);

        long seconds = Duration.between(EPOCH, time).getSeconds();
        if (seconds < 0 || seconds >= N) {
            throw new IllegalArgumentException("Timestamp out of range: " + userId);
        }

        long scrambled = (seconds * MULT + ADD) % N; // fits in long: max ~2.2e18
        String code = Long.toString(scrambled, 36).toUpperCase();
        return "0".repeat(6 - code.length()) + code;
    }

    /** 6-char code -> GKUID20260925170319 */
    public static String toUserId(String customerId) {
        String code = customerId == null ? "" : customerId.trim().toUpperCase();
        if (!code.matches("[0-9A-Z]{6}")) {
            throw new IllegalArgumentException("Invalid customer ID: " + customerId);
        }

        long scrambled = Long.parseLong(code, 36);
        long seconds = (((scrambled - ADD) % N + N) % N) * INV % N;

        return PREFIX + EPOCH.plusSeconds(seconds).format(FMT);
    }
}
