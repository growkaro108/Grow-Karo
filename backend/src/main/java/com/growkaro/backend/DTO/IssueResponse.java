package com.growkaro.backend.DTO;

import java.time.format.DateTimeFormatter;
import java.util.List;

import com.growkaro.backend.entity.Reply;
import com.growkaro.backend.entity.SupportIssue;

public record IssueResponse(String id,
        String title,
        String description,
        String status,
        String priority,
        String createdAt,
        String resolvedAt,
        List<ReplyResponse> replies) {

    public static IssueResponse fromEntity(SupportIssue issue) {
        return new IssueResponse(
                issue.getId(),
                issue.getTitle(),
                issue.getDescription(),
                issue.getStatus().toString().toLowerCase(),
                issue.getPriority().toString().toLowerCase(),
                issue.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM, yyyy")),
                issue.getResolvedAt() != null
                        ? issue.getResolvedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        : "Not Resolved",
                issue.getReplies().stream()
                        .map(ReplyResponse::fromEntity)
                        .toList());
    }

    // Nested record — lives inside IssueResponse.java
    public record ReplyResponse(Long replyId, String text, String senderType, String createdAt) {

        private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd MMM, yyyy 'at' hh:mm a");

        public static ReplyResponse fromEntity(Reply reply) {
            return new ReplyResponse(
                    reply.getReplyId(),
                    reply.getText(),
                    reply.getSenderType().toString().toLowerCase(),
                    reply.getCreatedAt().format(FORMATTER));
        }
    }
}