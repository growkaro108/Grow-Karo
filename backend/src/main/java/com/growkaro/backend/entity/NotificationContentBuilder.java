package com.growkaro.backend.entity;

import org.springframework.stereotype.Component;

import com.growkaro.backend.entity.Notification.ActionType;
import com.growkaro.backend.entity.Notification.NotificationType;
import com.growkaro.backend.entity.Notification.ReceiverType;

import java.util.Map;

@Component
public class NotificationContentBuilder {

    public enum EssentialActionType {
        // Financial
        FUND_TRANSFER_INITIATED,
        FUND_TRANSFER_COMPLETED,
        PAYMENT_FAILED,
        WITHDRAWAL_REQUESTED,
        WITHDRAWAL_APPROVED,
        WITHDRAWAL_REJECTED,
        WITHDRAWAL_DISBURSED,

        // Scheme & Investment
        INVESTMENT_CONFIRMED,
        PROFIT_CREDITED,
        SCHEME_MATURITY_REMINDER,
        SCHEME_MATURED,

        // issue
        ISSUE_REPLIED,
        ISSUE_RESOLVED,

        // KYC & Profile
        KYC_SUBMITTED,
        KYC_APPROVED,
        KYC_REJECTED,
        KYC_UPDATED, // alias for KYC_SUBMITTED
        BANK_DETAILS_UPDATED,

        // Remitter
        REMITTER_ONBOARDED,
        LIMIT_UPDATED,
        LOW_ALLOCATION_BALANCE,
        SETTLEMENT_SUBMITTED,

        // Security
        LOGIN,
        PASSWORD_CHANGED
    }

    public String buildSubject(EssentialActionType action) {
        return buildSubject(action, ReceiverType.User);
    }

    public String buildSubject(EssentialActionType action, ReceiverType role) {
        if (role == null) {
            role = ReceiverType.User;
        }
        return switch (role) {
            case User -> switch (action) {
                case WITHDRAWAL_REQUESTED -> "Withdrawal Request Submitted";
                case WITHDRAWAL_APPROVED -> "Withdrawal Approved & Processing";
                case WITHDRAWAL_REJECTED -> "Withdrawal Request Rejected";
                case WITHDRAWAL_DISBURSED -> "Withdrawal Funds Credited";
                case FUND_TRANSFER_INITIATED -> "Deposit Initiated";
                case FUND_TRANSFER_COMPLETED -> "Funds Successfully Credited";
                case PAYMENT_FAILED -> "Payment Transaction Failed";
                case INVESTMENT_CONFIRMED -> "Investment Successfully Confirmed";
                case PROFIT_CREDITED -> "Monthly Return Credited";
                case SCHEME_MATURED -> "Investment Scheme Matured";
                case KYC_SUBMITTED, KYC_UPDATED -> "KYC Verification Under Review";
                case KYC_APPROVED -> "KYC Verification Approved";
                case KYC_REJECTED -> "KYC Verification Requires Action";
                case BANK_DETAILS_UPDATED -> "Bank / Nominee Details Updated";
                case LIMIT_UPDATED -> "Account Allocation Limit Updated";
                case LOGIN -> "New Login Activity Detected";
                case PASSWORD_CHANGED -> "Security Alert: Password Changed";
                case SCHEME_MATURITY_REMINDER -> "Scheme Matured in 10-15 Days";
                case ISSUE_REPLIED -> "Admin replied to your issue";
                case ISSUE_RESOLVED -> "Issue resolved";
                default -> "Account Notification";
            };
            case Admin -> switch (action) {
                case WITHDRAWAL_REQUESTED -> "Action Required: New Withdrawal Request";
                case WITHDRAWAL_APPROVED -> "Withdrawal Approved";
                case WITHDRAWAL_REJECTED -> "Withdrawal Rejected";
                case WITHDRAWAL_DISBURSED -> "Withdrawal Disbursed by Remitter";
                case FUND_TRANSFER_INITIATED -> "New Fund Transfer Pending Confirmation";
                case FUND_TRANSFER_COMPLETED -> "Fund Transfer Settled";
                case PAYMENT_FAILED -> "Alert: Payment Failure Detected";
                case INVESTMENT_CONFIRMED -> "New Scheme Investment Enrolled";
                case PROFIT_CREDITED -> "Profit Distribution Cycle Completed";
                case SCHEME_MATURITY_REMINDER -> "Scheme Maturity Cycle Reminder";
                case SCHEME_MATURED -> "Scheme Maturity Cycle Processed";
                case KYC_SUBMITTED, KYC_UPDATED -> "New KYC Documents Awaiting Review";
                case KYC_APPROVED -> "KYC Status Marked Approved";
                case KYC_REJECTED -> "KYC Status Marked Rejected";
                case BANK_DETAILS_UPDATED -> "User Bank / Nominee Details Modified";
                case REMITTER_ONBOARDED -> "New Corporate Remitter Onboarded";
                case LIMIT_UPDATED -> "Remitter Allocation Limit Adjusted";
                case LOW_ALLOCATION_BALANCE -> "Urgent: Remitter Low Balance Alert";
                case SETTLEMENT_SUBMITTED -> "Remitter Batch Settlement Uploaded";
                case LOGIN -> "Admin Console Access Logged";
                case PASSWORD_CHANGED -> "Admin Password Changed";
                case ISSUE_REPLIED -> "Reply added to the issue";
                case ISSUE_RESOLVED -> "Issue resolved";
            };
            case Remitter -> switch (action) {
                case WITHDRAWAL_REQUESTED -> "Payout Queue Updated";
                case WITHDRAWAL_APPROVED -> "Disbursement Instruction Ready";
                case WITHDRAWAL_DISBURSED -> "Disbursement Completed";
                case FUND_TRANSFER_INITIATED -> "Transfer Order Queued";
                case FUND_TRANSFER_COMPLETED -> "Settlement Completed";
                case PAYMENT_FAILED -> "Settlement Failed - Action Required";
                case REMITTER_ONBOARDED -> "Welcome to GrowKaro Remitter Portal";
                case LIMIT_UPDATED -> "Your Allocation Limit Has Been Updated";
                case LOW_ALLOCATION_BALANCE -> "Warning: Low Allocation Balance";
                case SETTLEMENT_SUBMITTED -> "Settlement Proof Uploaded";
                case LOGIN -> "Remitter Portal Login";
                case PASSWORD_CHANGED -> "Remitter Password Changed";
                case ISSUE_REPLIED -> "Admin replied to your issue";
                case ISSUE_RESOLVED -> "Issue resolved";
                default -> "Remitter Alert";
            };
        };
    }

    /** Plain text version - used for in-app Notification.message column. */
    public String buildPlainMessage(EssentialActionType action, String recipientName, Map<String, Object> params) {
        return buildPlainMessage(action, ReceiverType.User, recipientName, params);
    }

    public String buildPlainMessage(EssentialActionType action, ReceiverType role, String recipientName,
            Map<String, Object> params) {
        if (role == null) {
            role = ReceiverType.User;
        }
        String name = (recipientName == null || recipientName.isBlank()) ? "userName" : recipientName;
        String amount = valueOf(params, "amount");
        String txnId = valueOf(params, "txnId");
        String reason = valueOf(params, "reason");

        return switch (role) {
            case User -> switch (action) {
                case WITHDRAWAL_REQUESTED ->
                    "Hi %s, your withdrawal request of ₹%s (Txn: %s) has been submitted for review.".formatted(name,
                            amount, txnId);
                case WITHDRAWAL_APPROVED ->
                    "Hi %s, your withdrawal of ₹%s (Txn: %s) has been approved and is being disbursed.".formatted(name,
                            amount, txnId);
                case WITHDRAWAL_REJECTED ->
                    "Hi %s, your withdrawal of ₹%s (Txn: %s) was rejected. Reason: %s.".formatted(name, amount, txnId,
                            reason);
                case WITHDRAWAL_DISBURSED ->
                    "Hi %s, ₹%s has been successfully credited to your bank account (Txn: %s).".formatted(name, amount,
                            txnId);
                case FUND_TRANSFER_INITIATED ->
                    "Hi %s, deposit transfer of ₹%s (Txn: %s) initiated. Awaiting confirmation.".formatted(name, amount,
                            txnId);
                case FUND_TRANSFER_COMPLETED ->
                    "Hi %s, fund deposit of ₹%s (Txn: %s) completed successfully.".formatted(name, amount, txnId);
                case PAYMENT_FAILED ->
                    "Hi %s, payment of ₹%s (Txn: %s) failed. Please retry or contact support.".formatted(name, amount,
                            txnId);
                case INVESTMENT_CONFIRMED ->
                    "Hi %s, your investment of ₹%s (Txn: %s) in %s is confirmed.".formatted(name, amount, txnId,
                            valueOf(params, "schemeName"));
                case PROFIT_CREDITED ->
                    "Hi %s, your monthly return of ₹%s has been credited to your balance.".formatted(name, amount);
                case SCHEME_MATURED ->
                    "Hi %s, your investment scheme %s has matured successfully.".formatted(name,
                            valueOf(params, "schemeName"));
                case KYC_SUBMITTED, KYC_UPDATED ->
                    "Hi %s, your KYC documents have been submitted and are under verification.".formatted(name);
                case KYC_APPROVED ->
                    "Hi %s, congratulations! Your KYC verification has been approved.".formatted(name);
                case KYC_REJECTED ->
                    "Hi %s, your KYC submission was rejected. Reason: %s. Please re-upload.".formatted(name, reason);
                case BANK_DETAILS_UPDATED ->
                    "Hi %s, your bank / nominee account details were updated successfully.".formatted(name);
                case LIMIT_UPDATED ->
                    "Hi %s, your account limit has been updated.".formatted(name);
                case LOGIN ->
                    "Hi %s, new login detected from IP %s on %s.".formatted(name, valueOf(params, "ip"),
                            valueOf(params, "time"));
                case PASSWORD_CHANGED ->
                    "Hi %s, your account password was changed successfully. If you did not make this change, please contact support immediately."
                            .formatted(name);
                case SCHEME_MATURITY_REMINDER ->
                    "Hi %s, your investment scheme %s will mature on %s. Please login to your dashboard for more details."
                            .formatted(name,
                                    valueOf(params, "schemeName"), valueOf(params, "maturityDate"));
                default ->
                    "Hi %s, update regarding %s (Txn: %s, Amount: ₹%s).".formatted(name,
                            action.name().toLowerCase().replace('_', ' '), txnId, amount);
            };
            case Admin -> switch (action) {
                case WITHDRAWAL_REQUESTED ->
                    "User %s requested a withdrawal of ₹%s (Txn: %s). Requires verification.".formatted(name, amount,
                            txnId);
                case WITHDRAWAL_APPROVED ->
                    "Withdrawal of ₹%s (Txn: %s) for user %s was approved.".formatted(amount, txnId, name);
                case WITHDRAWAL_REJECTED ->
                    "Withdrawal of ₹%s for user %s was rejected (Reason: %s).".formatted(amount, name, reason);
                case WITHDRAWAL_DISBURSED ->
                    "Payout of ₹%s (Txn: %s) to user %s was settled.".formatted(amount, txnId, name);
                case FUND_TRANSFER_INITIATED ->
                    "Deposit of ₹%s (Txn: %s) initiated by %s.".formatted(amount, txnId, name);
                case FUND_TRANSFER_COMPLETED ->
                    "Deposit of ₹%s (Txn: %s) by %s settled successfully.".formatted(amount, txnId, name);
                case PAYMENT_FAILED ->
                    "Alert: Payment failed for user %s (Amount: ₹%s, Txn: %s).".formatted(name, amount, txnId);
                case INVESTMENT_CONFIRMED ->
                    "User %s enrolled ₹%s into %s.".formatted(name, amount, valueOf(params, "schemeName"));
                case KYC_SUBMITTED, KYC_UPDATED ->
                    "User %s submitted KYC documents for review.".formatted(name);
                case KYC_APPROVED ->
                    "KYC for user %s approved.".formatted(name);
                case KYC_REJECTED ->
                    "KYC for user %s rejected (Reason: %s).".formatted(name, reason);
                case BANK_DETAILS_UPDATED ->
                    "User %s modified their bank details.".formatted(name);
                case REMITTER_ONBOARDED ->
                    "New remitter organization %s onboarded with limit ₹%s.".formatted(name, valueOf(params, "limit"));
                case LIMIT_UPDATED ->
                    "Allocation limit for remitter %s adjusted from ₹%s to ₹%s.".formatted(name, valueOf(params, "old"),
                            valueOf(params, "new"));
                case LOW_ALLOCATION_BALANCE ->
                    "Critical: Remitter %s has low balance (Remaining: ₹%s).".formatted(name, amount);
                case SETTLEMENT_SUBMITTED ->
                    "Remitter %s uploaded settlement proof for ₹%s.".formatted(name, amount);
                case LOGIN ->
                    "Login event for %s (IP: %s).".formatted(name, valueOf(params, "ip"));
                default ->
                    "Essential action %s by %s (Amount: ₹%s, Txn: %s).".formatted(action.name(), name, amount, txnId);
            };
            case Remitter -> switch (action) {
                case WITHDRAWAL_APPROVED ->
                    "Payout ready: Disbursement of ₹%s (Txn: %s) assigned for payout.".formatted(amount, txnId);
                case WITHDRAWAL_DISBURSED ->
                    "Disbursement of ₹%s (Txn: %s) confirmed.".formatted(amount, txnId);
                case REMITTER_ONBOARDED ->
                    "Welcome %s! Your remitter account is active with an initial limit of ₹%s.".formatted(name,
                            valueOf(params, "limit"));
                case LIMIT_UPDATED ->
                    "Hi %s, your allocation limit has been updated from ₹%s to ₹%s.".formatted(name,
                            valueOf(params, "old"), valueOf(params, "new"));
                case LOW_ALLOCATION_BALANCE ->
                    "Alert %s: Your allocation balance is low (Remaining: ₹%s). Please top up.".formatted(name, amount);
                case SETTLEMENT_SUBMITTED ->
                    "Settlement submission for ₹%s (Batch: %s) received.".formatted(amount, txnId);
                case PAYMENT_FAILED ->
                    "Settlement payment failed for transaction %s (Amount: ₹%s).".formatted(txnId, amount);
                case PASSWORD_CHANGED ->
                    "Your remitter password was changed successfully.".formatted();
                default ->
                    "Remitter alert: %s (Amount: ₹%s, Txn: %s)."
                            .formatted(action.name().toLowerCase().replace('_', ' '), amount, txnId);
            };
        };
    }

    /** HTML version - used for email body. */
    public String buildHtmlBody(EssentialActionType action, String recipientName, Map<String, Object> params) {
        return buildHtmlBody(action, ReceiverType.User, recipientName, params);
    }

    public String buildHtmlBody(EssentialActionType action, ReceiverType role, String recipientName,
            Map<String, Object> params) {
        if (role == null) {
            role = ReceiverType.User;
        }
        String name = (recipientName == null || recipientName.isBlank()) ? "there" : recipientName;
        String subject = buildSubject(action, role);
        String message = buildPlainMessage(action, role, name, params);
        String amount = valueOf(params, "amount");
        String txnId = valueOf(params, "txnId");

        return """
                <div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                    <div style="background: linear-gradient(135deg, #0f766e, #0d9488); padding: 20px; color: white;">
                        <h2 style="margin: 0; font-size: 20px;">%s</h2>
                    </div>
                    <div style="padding: 24px;">
                        <p style="font-size: 15px; line-height: 1.5;">%s</p>
                        <table cellpadding="8" style="width:100%%;border-collapse:collapse;margin:16px 0;background-color:#f8fafc;border-radius:8px;">
                            <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;"><strong>Transaction / Ref ID</strong></td><td>%s</td></tr>
                            <tr style="border-bottom:1px solid #e2e8f0;"><td style="color:#64748b;"><strong>Amount</strong></td><td>₹%s</td></tr>
                            <tr><td style="color:#64748b;"><strong>Action Type</strong></td><td>%s</td></tr>
                        </table>
                        <p style="margin-top:20px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:12px;">
                            This is an automated notification from GrowKaro. Please do not reply to this email.
                        </p>
                    </div>
                </div>
                """
                .formatted(subject, message, txnId, amount, action.name());
    }

    private String valueOf(Map<String, Object> params, String key) {
        return params != null && params.containsKey(key) && params.get(key) != null ? String.valueOf(params.get(key))
                : "-";
    }

    public NotificationType toNotificationType(EssentialActionType action) {
        return switch (action) {
            case FUND_TRANSFER_INITIATED, WITHDRAWAL_REQUESTED, KYC_SUBMITTED, KYC_UPDATED, LOGIN,
                    SCHEME_MATURITY_REMINDER, ISSUE_REPLIED, ISSUE_RESOLVED ->
                NotificationType.INFO;
            case FUND_TRANSFER_COMPLETED, WITHDRAWAL_APPROVED, WITHDRAWAL_DISBURSED, INVESTMENT_CONFIRMED,
                    PROFIT_CREDITED, SCHEME_MATURED, KYC_APPROVED, REMITTER_ONBOARDED, PASSWORD_CHANGED ->
                NotificationType.SUCCESS;
            case PAYMENT_FAILED, WITHDRAWAL_REJECTED, KYC_REJECTED, LOW_ALLOCATION_BALANCE -> NotificationType.WARNING;
            case LIMIT_UPDATED, BANK_DETAILS_UPDATED, SETTLEMENT_SUBMITTED -> NotificationType.LIMIT_UPDATED;
        };
    }

    public ActionType toActionType(EssentialActionType action) {
        return switch (action) {
            case FUND_TRANSFER_INITIATED -> ActionType.FUND_TRANSFER_INITIATED;
            case FUND_TRANSFER_COMPLETED -> ActionType.FUND_TRANSFER_COMPLETED;
            case PAYMENT_FAILED -> ActionType.PAYMENT_FAILED;
            case WITHDRAWAL_REQUESTED -> ActionType.WITHDRAWAL_REQUESTED;
            case WITHDRAWAL_APPROVED -> ActionType.WITHDRAWAL_APPROVED;
            case WITHDRAWAL_REJECTED -> ActionType.WITHDRAWAL_REJECTED;
            case WITHDRAWAL_DISBURSED -> ActionType.WITHDRAWAL_DISBURSED;
            case INVESTMENT_CONFIRMED -> ActionType.INVESTMENT_CONFIRMED;
            case PROFIT_CREDITED -> ActionType.PROFIT_CREDITED;
            case SCHEME_MATURITY_REMINDER -> ActionType.SCHEME_MATURITY_REMINDER;
            case SCHEME_MATURED -> ActionType.SCHEME_MATURED;
            case KYC_SUBMITTED, KYC_UPDATED -> ActionType.KYC_SUBMITTED;
            case KYC_APPROVED -> ActionType.KYC_APPROVED;
            case KYC_REJECTED -> ActionType.KYC_REJECTED;
            case BANK_DETAILS_UPDATED -> ActionType.BANK_DETAILS_UPDATED;
            case REMITTER_ONBOARDED -> ActionType.REMITTER_ONBOARDED;
            case LIMIT_UPDATED -> ActionType.ALLOCATION_LIMIT_UPDATED;
            case LOW_ALLOCATION_BALANCE -> ActionType.LOW_ALLOCATION_BALANCE;
            case SETTLEMENT_SUBMITTED -> ActionType.SETTLEMENT_SUBMITTED;
            case LOGIN -> ActionType.LOGIN;
            case PASSWORD_CHANGED -> ActionType.PASSWORD_CHANGED;
            case ISSUE_REPLIED -> ActionType.ISSUE_REPLIED;
            case ISSUE_RESOLVED -> ActionType.ISSUE_RESOLVED;
        };
    }
}
