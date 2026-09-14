package com.growkaro.backend.DTO;

import java.time.Instant;

import org.springframework.data.history.Revision;
import org.springframework.data.history.RevisionMetadata.RevisionType;
import com.growkaro.backend.entity.Scheme;

public record SchemeUpdateHistory(
        SchemeResponse scheme,
        Integer revNumber,
        String type,
        String revisedBy,
        Instant changeDate) {

    public static SchemeUpdateHistory fromEntity(Revision<Integer, Scheme> revision) {
        Scheme s = revision.getEntity();

        Integer revisionNumber = revision.getRequiredRevisionNumber();
        Instant changesDate = revision.getRevisionInstant().orElse(null);
        RevisionType revisionType = revision.getMetadata().getRevisionType();

        return new SchemeUpdateHistory(
                SchemeResponse.fromEntity(s, false),
                revisionNumber,
                mapRevisionType(revisionType),
                s.getUpdatedBy(), // <-- straight off the entity snapshot
                changesDate);
    }

    private static String mapRevisionType(RevisionType revisionType) {
        return switch (revisionType) {
            case INSERT -> "ADD";
            case UPDATE -> "MOD";
            case DELETE -> "DEL";
            default -> "UNKNOWN";
        };
    }
}