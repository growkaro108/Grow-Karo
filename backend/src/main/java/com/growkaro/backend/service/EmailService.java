package com.growkaro.backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.growkaro.backend.DRO.RemitterCredentials;
import com.growkaro.backend.common.General;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.UserScheme;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EmailService {

    @Lazy
    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private General general;

    @Autowired
    private RedisService redisService;

    /**
     * Sends a simple plain-text email.
     */
    @Async
    public void sendSimpleEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("growkaroanand@gmail.com"); // Must match your configured username
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
        // System.out.println("Email sent successfully to " + to);
    }

    @Async
    public void sendOtp(String email, String remark) {
        String otp = general.generate6DigitOTP(); // Your generated OTP string
        String subject = "Your Verification Code";
        String body = "Your " + remark + " OTP code is: " + otp + ". It will expire in 5 minutes.";
        sendSimpleEmail(email, subject, body);
        redisService.saveOtp(remark, email, otp);
        // System.out.println("otp sent to " + email + " remark: " + remark);
    }

    public void sendHtml(String toEmail, String subject, String htmlBody) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Skipping email '{}' - recipient email is empty", subject);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(mimeMessage);

            log.info("Email sent to {} - subject: {}", toEmail, subject);
        } catch (Exception ex) {
            // Never let an email failure roll back or block the business transaction.
            log.error("Failed to send email to {} - subject: {} - {}", toEmail, subject, ex.getMessage(), ex);
        }
    }

    @Async
    public void sendResetLink(String email, String userId) {
        try {
            String resetLink = general.generateResetLink(email, userId);
            String subject = "Reset Password - GrowKaro";
            String body = "<div style='font-family: Arial, sans-serif; margin: 0; padding: 0;'>" +
                    "<div style='background-color: #f0f8ff; padding: 20px;'>" +
                    "<h1 style='color: #004d40;'>GrowKaro</h1>" +
                    "</div>" +
                    "<div style='padding: 20px;'>" +
                    "<p>Dear User,</p>" +
                    "<p>You requested to reset your password. Click the link below to proceed:</p>" +
                    "<a href='" + resetLink
                    + "' style='display: inline-block; background-color: #006633; color: white; padding: 10px 20px; margin: 15px 0; text-decoration: none; border-radius: 5px;'>"
                    +
                    "Reset Password" +
                    "</a>" +
                    "<p>This link will expire in 15 minutes.</p>" +
                    "<p>If you did not request this, please ignore this email.</p>" +
                    "<p>Best regards,<br/>GrowKaro Team</p>" +
                    "</div>" +
                    "</div>";
            sendHtml(email, subject, body);

        } catch (Exception e) {
            log.error("Failed to send reset link to user {}", email, e);

        }
    }

    @Async
    public void sendCrendentialsToRemitter(RemitterCredentials remitterCredentials) {
        // System.out.println(remitterCredentials);
        try {
            String subject = "Your Remitter Credentials from Groww_Karo";

            String body = "<div style='font-family: Arial, sans-serif; margin: 0; padding: 0;'>" +
                    "<div style='background-color: #f0f8ff; padding: 20px;'>" +
                    "<h1 style='color: #004d40;'>GrowKaro</h1>" +
                    "</div>" +
                    "<div style='padding: 20px;'>" +
                    "<p>Dear Remitter,</p>" +
                    "<p>Your credentials for accessing GrowKaro platform are as follows:</p>" +
                    "<p><strong>Login ID:</strong> " + remitterCredentials.getRemitterId() + "</p>" +
                    "<p><strong>EMAIL:</strong> " + remitterCredentials.getEmail() + "</p>" +
                    "<p><strong>Password:</strong> " + remitterCredentials.getPassword() + "</p>" +
                    "<p>This is your initial password. You will be prompted to change it upon your first login.</p>" +
                    "<a href='" + general.loginUrl()
                    + "' style='display: inline-block; background-color: #006633; color: white; padding: 10px 20px; margin: 15px 0; text-decoration: none; border-radius: 5px;'>"
                    +
                    "Login to Platform" +
                    "</a>" +
                    "<p>Please keep your credentials secure and do not share them with anyone.</p>" +
                    "<p>If you did not request this, please contact our support team immediately.</p>" +
                    "<p>Best regards,<br/>GrowwKaro Team</p>" +
                    "</div>" +
                    "</div>";

            sendHtml(remitterCredentials.getEmail(), subject, body);

        } catch (Exception e) {
            log.error("Failed to send credential to remitter {}", remitterCredentials.getEmail(), e);

        }
    }

    @Async
    public void sendResetLinkToRemitter(String email, String remitterId) {
        try {
            String resetLink = general.generateResetLinkForRemitter(email, remitterId);
            String subject = "Reset Password - GrowKaro";
            String body = "<div style='font-family: Arial, sans-serif; margin: 0; padding: 0;'>" +
                    "<div style='background-color: #f0f8ff; padding: 20px;'>" +
                    "<h1 style='color: #004d40;'>GrowKaro</h1>" +
                    "</div>" +
                    "<div style='padding: 20px;'>" +
                    "<p>Dear User,</p>" +
                    "<p>You requested to reset your password. Click the link below to proceed:</p>" +
                    "<a href='" + resetLink
                    + "' style='display: inline-block; background-color: #006633; color: white; padding: 10px 20px; margin: 15px 0; text-decoration: none; border-radius: 5px;'>"
                    +
                    "Reset Password" +
                    "</a>" +
                    "<p>This link will expire in 15 minutes.</p>" +
                    "<p>If you did not request this, please ignore this email.</p>" +
                    "<p>Best regards,<br/>GrowKaro Team</p>" +
                    "</div>" +
                    "</div>";
            sendHtml(email, subject, body);

        } catch (Exception e) {
            log.error("Failed to send reset link to user {}", email, e);

        }
    }

    @Async
    public void sendSchemeMaturityEmailtoUser(UserScheme userScheme) {
        // send email: scheme will mature in 10-15 days; if user wants to redeem,
        // they must add a withdrawal request, otherwise it'll be auto-reinvested in the
        // same scheme
        try {
            String subject = "Scheme Maturity Reminder";
            BigDecimal totalAmount = userScheme.getProfit().add(userScheme.getPaidAmount())
                    .subtract(userScheme.getProfitReedemed());
            String body = "<div style='font-family: Arial, sans-serif; margin: 0; padding: 0;'>" +
                    "<div style='background-color: #f0f8ff; padding: 20px;'>" +
                    "<h1 style='color: #004d40;'>GrowKaro</h1>" +
                    "</div>" +
                    "<div style='padding: 20px;'>" +
                    "<p>Dear " + userScheme.getUser().getName() + ",</p>" +
                    "<p>Your scheme " + userScheme.getScheme().getSchemeName() +
                    " is set to mature in the next 10-15 days.</p>" +
                    "<p><strong>Maturity Date:</strong> " + userScheme.getMaturityDate() + "</p>" +
                    "<p><strong>Amount Invested:</strong> " + userScheme.getPaidAmount() + "</p>" +
                    "<p><strong>Total Profit:</strong> " + userScheme.getProfit() + "</p>" +
                    "<p><strong>Amount Reedeemed So Far:</strong> " + userScheme.getProfitReedemed() + "</p>" +
                    "<p><strong>Amount To Be Credited at Maturity:</strong> " + totalAmount + "</p>" +
                    "<p>If you wish to redeem this amount, please add a withdrawal request before the maturity date. " +
                    "If no request is made, the amount will be <strong>automatically reinvested</strong> in the same scheme.</p>"
                    +
                    "<a href='" + general.loginUrl() +
                    "' style='display: inline-block; background-color: #006633; color: white; padding: 10px 20px; margin: 15px 0; text-decoration: none; border-radius: 5px;'>"
                    +
                    "Login to Platform" +
                    "</a>" +
                    "<p>Best regards,<br/>GrowwKaro Team</p>" +
                    "</div>" +
                    "</div>";
            sendHtml(userScheme.getUser().getEmail(), subject, body);
        } catch (Exception e) {
            log.error("Failed to send scheme maturity email to user {}", userScheme.getUser().getEmail(), e);
        }
    }

    @Async
    public void sendSchemeMaturityEmailtoAdmin(UserScheme userScheme, String adminEmail) {
        try {
            String subject = "Upcoming Scheme Maturity for User " + userScheme.getUser().getName();
            BigDecimal totalAmount = (userScheme.getProfit().add(userScheme.getPaidAmount()))
                    .subtract(userScheme.getProfitReedemed());
            String body = "<div style='font-family: Arial, sans-serif; margin: 0; padding: 0;'>" +
                    "<div style='background-color: #f0f8ff; padding: 20px;'>" +
                    "<h1 style='color: #004d40;'>GrowKaro</h1>" +
                    "</div>" +
                    "<div style='padding: 20px;'>" +
                    "<p>Dear Admin,</p>" +
                    "<p>Scheme " + userScheme.getScheme().getSchemeName() + " for user "
                    + userScheme.getUser().getName() + " is set to mature in the next 10-15 days.</p>" +
                    "<p><strong>Amount Invested:</strong> " + userScheme.getPaidAmount() + "</p>" +
                    "<p><strong>Total Profit:</strong> " + userScheme.getProfit() + "</p>" +
                    "<p><strong>Amount Reedeemed So Far:</strong> " + userScheme.getProfitReedemed() + "</p>" +
                    "<p><strong>Amount To Be Paid at Maturity:</strong> " + totalAmount + "</p>" +
                    "<p><strong>Maturity Date:</strong> " + userScheme.getMaturityDate() + "</p>" +
                    "<a href='" + general.loginUrl() +
                    "' style='display: inline-block; background-color: #006633; color: white; padding: 10px 20px; margin: 15px 0; text-decoration: none; border-radius: 5px;'>"
                    +
                    "Login to Platform" +
                    "</a>" +
                    "<p>Best regards,<br/>GrowwKaro Team</p>" +
                    "</div>" +
                    "</div>";
            sendHtml(adminEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send scheme maturity email to admin {}", adminEmail, e);
        }
    }

    @Async
    public void notifyAllUsers(List<String> userEmails, Scheme scheme) {
        try {
            for (String email : userEmails) {

                String subject = "New Scheme Launched - " + scheme.getSchemeName();
                String body = "<div style='font-family: Arial, sans-serif; margin: 0; padding: 0;'>" +
                        "<div style='background-color: #f0f8ff; padding: 20px;'>" +
                        "<h1 style='color: #004d40;'>GrowKaro</h1>" +
                        "</div>" +
                        "<div style='padding: 20px;'>" +
                        "<p>Dear Investor,</p>" +
                        "<p>A new scheme has been launched on GrowKaro platform.</p>" +
                        "<p><strong>Scheme Name:</strong> " + scheme.getSchemeName() + "</p>" +
                        "<p><strong>Minimum Investment:</strong> " + scheme.getMinimumAmount() + "</p>" +
                        "<p><strong>Profit Percentage:</strong> " + scheme.getProfitPercentage() + "</p>" +
                        "<p><strong>Tenure:</strong> " + scheme.getTenure() + "</p>" +
                        "<p>You can view the scheme details and invest in it by logging into your account.</p>" +
                        "<a href='" + general.loginUrl() +
                        "' style='display: inline-block; background-color: #006633; color: white; padding: 10px 20px; margin: 15px 0; text-decoration: none; border-radius: 5px;'>"
                        +
                        "Login to Platform" +
                        "</a>" +
                        "<p>Best regards,<br/>GrowwKaro Team</p>" +
                        "</div>" +
                        "</div>";
                sendHtml(email, subject, body);
            }
        } catch (Exception e) {
            log.error("Failed to send scheme launch email to users", e);
        }
    }

}