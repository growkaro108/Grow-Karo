package com.growkaro.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.growkaro.backend.common.General;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private General general;

    @Autowired
    private RedisService redisService;

    /**
     * Sends a simple plain-text email.
     */
    public void sendSimpleEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("growkaroanand@gmail.com"); // Must match your configured username
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
        // System.out.println("Email sent successfully to " + to);
    }

    public boolean sendOtp(String email, String remark) {
        String otp = general.generate6DigitOTP(); // Your generated OTP string
        String subject = "Your Verification Code";
        String body = "Your " + remark + " OTP code is: " + otp + ". It will expire in 5 minutes.";
        sendSimpleEmail(email, subject, body);
        redisService.saveOtp(remark, email, otp);
        // System.out.println("otp sent to " + email + " remark: " + remark);
        return true;
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

}