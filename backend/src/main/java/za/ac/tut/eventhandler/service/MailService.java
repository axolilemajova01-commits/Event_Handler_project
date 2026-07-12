package za.ac.tut.eventhandler.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    private final JavaMailSender mailSender;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String to, String fullName, String resetToken) {
        String resetUrl = "http://localhost:5173/reset-password?token=" + resetToken;
        String subject = "TUT Event Handler - Password Reset";
        String html = String.format("""
            <!DOCTYPE html>
            <html><body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 20px;">
                <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #005daa, #1f77c9); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                        <span style="color: white; font-size: 24px; font-weight: bold;">T</span>
                    </div>
                    <h2 style="margin: 0 0 8px; color: #15161a; font-size: 20px;">Password Reset</h2>
                    <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px;">
                        Hi <strong>%s</strong>, we received a request to reset your TUT Event Handler password.
                        Click the button below to set a new password. This link expires in 1 hour.
                    </p>
                    <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #005daa, #1f77c9); color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px;">Reset Password</a>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                        If you didn't request a password reset, please ignore this email.<br>
                        TUT Event Handler &bull; Tshwane University of Technology
                    </p>
                </div>
            </body></html>
            """, fullName, resetUrl);
        sendHtml(to, subject, html);
    }

    public void sendEventReminder(String to, String fullName, String eventTitle, String eventDate, String eventTime, String venue) {
        String subject = "📅 Event Reminder - " + eventTitle;
        String html = String.format("""
            <!DOCTYPE html>
            <html><body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 20px;">
                <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #1d8a64, #2ba178); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                        <span style="color: white; font-size: 24px;">&#x1F4C5;</span>
                    </div>
                    <h2 style="margin: 0 0 8px; color: #15161a; font-size: 20px;">Event Reminder</h2>
                    <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px;">
                        Hi <strong>%s</strong>, this is a reminder for an upcoming event you registered for:
                    </p>
                    <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                        <p style="margin: 0 0 4px; font-weight: bold; color: #15161a; font-size: 16px;">%s</p>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">%s at %s</p>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Venue: %s</p>
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                        TUT Event Handler &bull; Tshwane University of Technology
                    </p>
                </div>
            </body></html>
            """, fullName, eventTitle, eventDate, eventTime, venue);
        sendHtml(to, subject, html);
    }

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }
}