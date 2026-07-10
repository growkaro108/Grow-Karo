package com.growkaro.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.growkaro.backend.common.General;

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
        System.out.println("Email sent successfully to " + to);
    }

    public boolean sendOtp(String email, String remark) {
        String otp = general.generate6DigitOTP(); // Your generated OTP string
        String subject = "Your Verification Code";
        String body = "Your " + remark + " OTP code is: " + otp + ". It will expire in 5 minutes.";
        sendSimpleEmail(email, subject, body);
        redisService.saveOtp(remark, email, otp);
        System.out.println("otp sent to " + email + " remark: " + remark);
        return true;
    }

}