package com.growkaro.backend.DRO;

import java.time.format.DateTimeFormatter;

import com.growkaro.backend.entity.SupportIssue;

public record SupportIssueView(
        String id,
        String title,
        String description,
        String status,
        String priority,
        String createdAt,
        String resolvedAt,
        String resolutionNote) {
    public static SupportIssueView from(SupportIssue issue) {
        boolean isResolved = issue.getResolvedAt() != null;
        return new SupportIssueView(
                issue.getId(),
                issue.getTitle(),
                issue.getDescription(),
                issue.getStatus().name().toLowerCase(),
                issue.getPriority().name().toLowerCase(),
                issue.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                isResolved ? issue.getResolvedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "Not Resolved",
                isResolved ? issue.getResolutionNote() : "Not Resolved");
    }
}
