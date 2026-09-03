import nodemailer from 'nodemailer';

export interface SendOtpParams {
  toEmail: string;
  otpCode: string;
}

export async function sendOtpEmail({ toEmail, otpCode }: SendOtpParams): Promise<boolean> {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASSWORD || '';
  const fromEmail = process.env.SENDER_EMAIL || 'zipdrinks77@gmail.com';

  // If SMTP credentials missing, log OTP to console for dev fallback
  if (!user || !pass) {
    console.log(`[EmailService] SMTP credentials missing. Dev OTP for ${toEmail}: ${otpCode}`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // TLS via port 587
      auth: {
        user,
        pass,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px 20px; }
          .card { max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.08); }
          .badge { display: inline-block; background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px; }
          .logo { font-size: 22px; font-weight: 900; color: #047857; margin-top: 12px; margin-bottom: 20px; letter-spacing: -0.5px; }
          .otp-box { background-color: #059669; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 12px; margin: 24px 0; font-family: monospace; }
          .footer { font-size: 12px; color: #64748b; margin-top: 28px; text-align: center; border-t: 1px solid #f1f5f9; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">Workflow Attention Layer</span>
          <div class="logo">SPYROBO</div>
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 10px 0; color: #0f172a;">Your Authentication Verification Code</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0;">Use the 6-digit OTP verification code below to complete your login to SPYROBO. This code will expire in 10 minutes.</p>
          
          <div class="otp-box">${otpCode}</div>
          
          <p style="font-size: 13px; color: #64748b; margin: 0;">If you did not request this code, please ignore this email.</p>
          <div class="footer">
            &copy; 2026 SPYROBO • Unified Workflow Visibility & Attention System
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"SPYROBO Verification" <${fromEmail}>`,
      to: toEmail,
      subject: `[SPYROBO] ${otpCode} is your verification code`,
      html: htmlContent,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[EmailService] OTP email sent to ${toEmail}`);
    }
    return true;
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[EmailService] SMTP error:`, err.message);
      console.log(`[EmailService Dev Fallback] OTP for ${toEmail} is: ${otpCode}`);
    }
    return false;
  }
}
