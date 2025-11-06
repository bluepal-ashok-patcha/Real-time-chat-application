package com.chatapp.authservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(JavaMailSender mailSender, @Value("${spring.mail.username:}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    public void sendInviteEmail(String toEmail, String inviterUsername) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("%s invited you to join ChatApp".formatted(inviterUsername != null ? inviterUsername : "A friend"));

            // Use the configured email as From address (required by Gmail)
            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail, "ChatApp Invites");
            } else {
                helper.setFrom("noreply@chatapp.local", "ChatApp Invites");
            }

            String html = ("""
                <table role='presentation' width='100%%' cellspacing='0' cellpadding='0' border='0' style='background:#f5f7fb;padding:24px;'>
                  <tr>
                    <td align='center'>
                      <table role='presentation' width='600' cellspacing='0' cellpadding='0' border='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.08);font-family:Inter,Arial,sans-serif;'>
                        <tr>
                          <td style='background:#075e54;padding:24px 28px;color:#fff;'>
                            <table width='100%%'>
                              <tr>
                                <td style='font-size:20px;font-weight:700;'>ChatApp</td>
                                <td align='right' style='font-size:13px;opacity:.9;'>Secure. Fast. Simple.</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style='padding:28px;'>
                            <div style='font-size:18px;font-weight:600;margin-bottom:8px;color:#111'>You're invited!</div>
                            <div style='font-size:14px;color:#444;line-height:1.6;margin-bottom:20px;'>
                              <strong>%s</strong> invited you to join <strong>ChatApp</strong> so you can start chatting, sharing files, and stay in sync across devices.
                            </div>
                            <div style='margin:24px 0;'>
                              <a href='http://localhost:5173/register' style='display:inline-block;background:#25d366;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;'>Create your account</a>
                            </div>
                            <table role='presentation' width='100%%' cellspacing='0' cellpadding='0' border='0' style='margin-top:12px;'>
                              <tr>
                                <td width='48' valign='top'>
                                  <div style='width:40px;height:40px;border-radius:8px;background:#e9f8ef;display:inline-block;text-align:center;line-height:40px;color:#25d366;font-weight:700;'>💬</div>
                                </td>
                                <td style='font-size:13px;color:#555;line-height:1.5;'>
                                  Real-time messaging with delivery and read receipts, group chats, and rich media.
                                </td>
                              </tr>
                              <tr><td style='height:10px'></td><td></td></tr>
                              <tr>
                                <td width='48' valign='top'>
                                  <div style='width:40px;height:40px;border-radius:8px;background:#eef5ff;display:inline-block;text-align:center;line-height:40px;color:#1a73e8;font-weight:700;'>🔒</div>
                                </td>
                                <td style='font-size:13px;color:#555;line-height:1.5;'>
                                  Secure by default with modern authentication and transport security.
                                </td>
                              </tr>
                            </table>

                            <div style='font-size:12px;color:#888;margin-top:28px;'>
                              If you did not expect this invite, you can safely ignore this email.
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style='background:#f3f5f7;color:#667085;font-size:12px;padding:16px 28px;'>
                            © %s ChatApp — All rights reserved
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
            """).formatted(inviterUsername != null ? inviterUsername : "A friend", java.time.Year.now());

            helper.setText(html, true);
            logger.info("Attempting to send invite email to: {}", toEmail);
            mailSender.send(message);
            logger.info("Invite email sent successfully to: {}", toEmail);
        } catch (AuthenticationFailedException e) {
            logger.error("SMTP Authentication failed. Please check your email credentials in application.yml. " +
                    "For Gmail, ensure you're using an App Password (not your regular password) if 2FA is enabled.", e);
            throw new RuntimeException("Email authentication failed. Please check your SMTP credentials. " +
                    "For Gmail with 2FA enabled, use an App Password. Error: " + e.getMessage(), e);
        } catch (MessagingException e) {
            logger.error("Failed to send invite email to: {}. Error: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send invite email: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error sending invite email to: {}. Error: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send invite email: " + e.getMessage(), e);
        }
    }
}


