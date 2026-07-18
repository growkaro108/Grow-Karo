package com.growkaro.backend.entity;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Centralizes copywriting for crucial-action emails.
 * Swap the body-building for a Thymeleaf/Freemarker template later if you
 * want richer HTML - the rest of the pipeline (sending + persistence)
 * doesn't need to change.
 */
@Component
public class NotificationContentBuilder {
    public enum EssentialActionType {
        FUND_TRANSFER_INITIATED,
        FUND_TRANSFER_COMPLETED,
        WITHDRAWAL_REQUESTED,
        WITHDRAWAL_APPROVED,
        KYC_UPDATED,
        INVESTMENT_CONFIRMED,
        PAYMENT_FAILED
    }

    public String buildSubject(EssentialActionType action) {
        return switch (action) {
            case FUND_TRANSFER_INITIATED -> "Fund Transfer Initiated";
            case FUND_TRANSFER_COMPLETED -> "Fund Transfer Completed";
            case WITHDRAWAL_REQUESTED -> "Withdrawal Request Received";
            case WITHDRAWAL_APPROVED -> "Withdrawal Approved";
            case KYC_UPDATED -> "KYC Details Updated";
            case INVESTMENT_CONFIRMED -> "Investment Confirmed";
            case PAYMENT_FAILED -> "Payment Failed - Action Required";
        };
    }

    /** Plain text version - used for the in-app Notification.message column. */
    public String buildPlainMessage(EssentialActionType action, String recipientName, Map<String, Object> params) {
        String amount = valueOf(params, "amount");
        String txnId = valueOf(params, "txnId");
        String actionLabel = action.name().toLowerCase().replace('_', ' ');

        return "Hi %s, %s (Txn: %s, Amount: %s).".formatted(
                recipientName == null ? "there" : recipientName, actionLabel, txnId, amount);
    }

    /** HTML version - used for the actual email body. */
    public String buildHtmlBody(EssentialActionType action, String recipientName, Map<String, Object> params) {
        String amount = valueOf(params, "amount");
        String txnId = valueOf(params, "txnId");
        String actionLabel = action.name().toLowerCase().replace('_', ' ');

        return """
                <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">
                    <p>Hi %s,</p>
                    <p>This is a confirmation regarding: <b>%s</b></p>
                    <table cellpadding="6" style="border-collapse:collapse;">
                        <tr><td><b>Transaction ID</b></td><td>%s</td></tr>
                        <tr><td><b>Amount</b></td><td>%s</td></tr>
                    </table>
                    <p style="margin-top:16px;color:#666;font-size:12px;">
                        This is an automated message from GrowKaro. Please do not reply to this email.
                    </p>
                </div>
                """.formatted(recipientName == null ? "there" : recipientName, actionLabel, txnId, amount);
    }

    private String valueOf(Map<String, Object> params, String key) {
        return params != null && params.containsKey(key) ? String.valueOf(params.get(key)) : "-";
    }

    /**
     * Maps a business action to the severity/category shown in your
     * Notification.Type UI badge.
     */
    public com.growkaro.backend.entity.Notification.Type toNotificationType(EssentialActionType action) {
        return switch (action) {
            case FUND_TRANSFER_INITIATED, WITHDRAWAL_REQUESTED, KYC_UPDATED ->
                com.growkaro.backend.entity.Notification.Type.INFO;
            case FUND_TRANSFER_COMPLETED, WITHDRAWAL_APPROVED, INVESTMENT_CONFIRMED ->
                com.growkaro.backend.entity.Notification.Type.SUCCESS;
            case PAYMENT_FAILED -> com.growkaro.backend.entity.Notification.Type.WARNING;
        };
    }
}
