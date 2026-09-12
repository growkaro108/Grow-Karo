package com.growkaro.backend.DTO;

public record SchemeAuditProjection(String schemeId, String schemeName,
        String schemeCategory, Byte riskLevel, Boolean status, Long countOfRevisions) {

    public static SchemeAuditProjection toDto(Object[] row) {
        return new SchemeAuditProjection(
                (String) row[0],
                (String) row[1],
                (String) row[2],
                (Byte) row[3],
                (Boolean) row[4],
                ((Number) row[5]).longValue());
    }

}