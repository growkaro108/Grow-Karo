package com.growkaro.backend.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;

import com.growkaro.backend.DTO.CustomerIdCodec;

class GeneralUserIdTest {
    private static final DateTimeFormatter USER_ID_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Test
    void generatedIdsRemainValidAndUniqueWhenCreatedInTheSameSecond() {
        General general = new General();
        Set<String> generatedIds = new HashSet<>();

        for (int i = 0; i < 100; i++) {
            String userId = general.generateUserId();

            assertTrue(generatedIds.add(userId));
            assertEquals(14, userId.substring("GKUID".length()).length());
            LocalDateTime.parse(userId.substring("GKUID".length()), USER_ID_FORMAT);
        }
    }

    @Test
    void malformedLegacyTimestampDoesNotPreventCustomerReportMapping() {
        assertNull(new General().getCustomerId("GKUID20261005183173"));
    }

    @Test
    void validUserIdsKeepTheirCustomerIdRoundTrip() {
        String userId = "GKUID20261005183159";

        assertEquals(userId, CustomerIdCodec.toUserId(CustomerIdCodec.toCustomerId(userId)));
    }
}
