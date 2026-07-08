// package com.growkaro.backend.service;

// import java.util.Random;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.mail.SimpleMailMessage;
// import org.springframework.mail.javamail.JavaMailSender;
// import org.springframework.stereotype.Service;

// @Service
// public class EmailService {

// @Autowired
// private JavaMailSender mailSender;

// /**
// * Sends a simple plain-text email.
// */
// public void sendSimpleEmail(String to, String subject, String body) {
// SimpleMailMessage message = new SimpleMailMessage();
// message.setFrom("growkaroanand@gmail.com"); // Must match your configured
// username
// message.setTo(to);
// message.setSubject(subject);
// message.setText(body);

// mailSender.send(message);
// System.out.println("Email sent successfully to " + to);
// }

// public void sendOtp(String email, String remark) {
// String otp = generateOTP(); // Your generated OTP string
// String subject = "Your Verification Code";
// String body = "Your " + remark + " OTP code is: " + otp + ". It will expire
// in 5 minutes.";
// sendSimpleEmail(email, subject, body);
// System.out.println("otp sent to " + email + " remark: " + remark);

// }

// public String generateOTP() {
// Random rand = new Random();
// return String.valueOf(rand.nextInt(1000000));
// }
// }