package com.edurent.crc.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * Send password reset email with token link
     */
    public void sendPasswordResetEmail(String toEmail, String token, String userName) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + token;
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromName + " <" + fromEmail + ">");
            message.setTo(toEmail);
            message.setSubject("Password Reset Request - EduRent");
            message.setText(buildEmailContent(userName, resetLink));

            mailSender.send(message);
            
            System.out.println("✅ Password reset email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Failed to send password reset email: " + e.getMessage());
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }

    /**
     * Build the email content
     */
    private String buildEmailContent(String userName, String resetLink) {
        return String.format(
            "Hello %s,\n\n" +
            "We received a request to reset your password for your EduRent account.\n\n" +
            "Click the link below to reset your password:\n" +
            "%s\n\n" +
            "This link will expire in 30 minutes.\n\n" +
            "If you didn't request a password reset, please ignore this email. Your password will remain unchanged.\n\n" +
            "Best regards,\n" +
            "The EduRent Team\n\n" +
            "---\n" +
            "This is an automated message, please do not reply to this email.",
            userName,
            resetLink
        );
    }

    /**
     * Send a generic email (for future use)
     */
    @Async
    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromName + " <" + fromEmail + ">");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            
            System.out.println("✅ Email sent to: " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send email: " + e.getMessage());
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }
}
