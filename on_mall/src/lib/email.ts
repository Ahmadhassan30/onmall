import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailData) {
  try {
    // If no HTML provided, create a simple HTML version from text
    const htmlContent = html || `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .button { 
              display: inline-block; 
              background: #007bff; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>OnMall</h2>
            </div>
            <div class="content">
              ${text?.replace(/\n/g, '<br>') || ''}
            </div>
            <div class="footer">
              <p>This email was sent from OnMall. If you didn't request this, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'OnMall <onboarding@resend.dev>',
      to,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

// Email templates
export const createVerificationEmail = (url: string, userName?: string) => {
  return {
    subject: 'Verify your OnMall account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify your email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: white; padding: 30px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
            }
            .button:hover { opacity: 0.9; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛍️ OnMall</div>
              <h1 style="margin: 0;">Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi${userName ? ` ${userName}` : ''},</p>
              <p>Thanks for joining OnMall! To complete your registration and start shopping, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${url}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #007bff;">${url}</p>
              
              <p><strong>This link will expire in 24 hours for security reasons.</strong></p>
              
              <p>If you didn't create an account with OnMall, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 OnMall. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};

export const createPasswordResetEmail = (url: string, userName?: string) => {
  return {
    subject: 'Reset your OnMall password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset your password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: white; padding: 30px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
            }
            .button:hover { opacity: 0.9; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛍️ OnMall</div>
              <h1 style="margin: 0;">Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hi${userName ? ` ${userName}` : ''},</p>
              <p>We received a request to reset your OnMall account password. If you made this request, click the button below to set a new password:</p>
              
              <div style="text-align: center;">
                <a href="${url}" class="button">Reset Password</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #007bff;">${url}</p>
              
              <div class="warning">
                <p><strong>⚠️ Important:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour for security reasons</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password won't change until you click the link above</li>
                </ul>
              </div>
              
              <p>If you're having trouble or didn't request this reset, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2025 OnMall. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};
