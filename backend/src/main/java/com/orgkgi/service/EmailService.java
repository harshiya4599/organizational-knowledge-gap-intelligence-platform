package com.orgkgi.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.from:${spring.mail.username:}}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String to, String token) {
        if (fromAddress == null || fromAddress.isBlank()) {
            throw new IllegalStateException("Email sender address is not configured. Set spring.mail.from or spring.mail.username in application.properties.");
        }

        String resetUrl = String.format("%s/reset-password?token=%s", frontendUrl.replaceAll("/+$", ""), token);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(fromAddress);
        message.setSubject("KnowledgeGap Password Reset");
        message.setText("You requested a password reset for your KnowledgeGap account.\n\n" +
                "Click the link below to reset your password:\n" +
                resetUrl + "\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "This link expires in 1 hour.");

        try {
            mailSender.send(message);
        } catch (MailException ex) {
            throw new RuntimeException("Failed to send password reset email: " + ex.getMessage(), ex);
        }
    }
}
