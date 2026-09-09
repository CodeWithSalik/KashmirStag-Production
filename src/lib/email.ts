import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'noreply@kashmirstag.com';

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[Email] SMTP not configured. Skipping email to', to);
    return;
  }
  
  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    });
    console.log('[Email] Sent successfully to', to);
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
  }
}

export async function sendOrderConfirmation(email: string, order: { orderId: string, items: any[], total: number }) {
  const html = `
    <h1>Order Confirmation</h1>
    <p>Thank you for your order, ${order.orderId}!</p>
    <p>Total amount: ₹${(order.total / 100).toFixed(2)}</p>
    <p>We will notify you once your order is shipped.</p>
  `;
  return sendEmail(email, `Order Confirmation - ${order.orderId}`, html);
}

export async function sendPasswordReset(email: string, resetUrl: string) {
  const html = `
    <h1>Password Reset</h1>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  return sendEmail(email, 'Password Reset Request', html);
}

export async function sendWelcome(email: string, name: string) {
  const html = `
    <h1>Welcome to KashmirStag!</h1>
    <p>Hi ${name},</p>
    <p>We're thrilled to have you with us. Explore our authentic quality products from Kashmir!</p>
  `;
  return sendEmail(email, 'Welcome to KashmirStag', html);
}
