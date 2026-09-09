import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { APP_NAME, APP_URL } from '@/config/constants';
import { developerConfig } from '@/config/navigation';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: 'resend' | 'next-mail' | 'mock';
  messageId?: string;
  error?: string;
}

// Provider Credential Resolution
function getMailConfig() {
  const mailUser = process.env.MAIL_USER || process.env.EMAIL_USER;
  const mailPass = process.env.MAIL_PASS || process.env.EMAIL_PASS;
  const mailFrom = process.env.MAIL_FROM || process.env.FROM_EMAIL || `"${APP_NAME}" <${mailUser || 'pirzadasalik116@gmail.com'}>`;
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM || process.env.FROM_EMAIL || `"${APP_NAME}" <onboarding@resend.dev>`;

  return {
    mailUser,
    mailPass,
    mailFrom,
    resendApiKey,
    resendFrom,
  };
}

// Transporter Cache for Next.js Direct TLS (Port 465 SSL, Fragments Architecture)
let cachedTransporter: nodemailer.Transporter | null = null;

function getDirectTransporter(user: string, pass: string) {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      port: 465,
      secure: true,
    });
  }
  return cachedTransporter;
}

/**
 * Core server-side email dispatcher supporting Next.js Mail (Direct TLS) and Resend API.
 * Guarantees failure isolation: never throws unhandled exceptions to caller.
 */
export async function sendEmail(
  toOrOptions: string | EmailOptions,
  subjectParam?: string,
  htmlParam?: string,
  extraOptions?: { replyTo?: string; text?: string }
): Promise<EmailSendResult> {
  let to: string;
  let subject: string;
  let html: string;
  let text: string | undefined;
  let replyTo: string | undefined;

  if (typeof toOrOptions === 'object') {
    to = toOrOptions.to;
    subject = toOrOptions.subject;
    html = toOrOptions.html;
    text = toOrOptions.text;
    replyTo = toOrOptions.replyTo;
  } else {
    to = toOrOptions;
    subject = subjectParam || '';
    html = htmlParam || '';
    text = extraOptions?.text;
    replyTo = extraOptions?.replyTo;
  }

  const { mailUser, mailPass, mailFrom, resendApiKey, resendFrom } = getMailConfig();

  // 1. Check Resend API Provider
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: resendFrom,
        to: [to],
        subject,
        html,
        text,
        replyTo: replyTo || undefined,
      });

      if (error) {
        console.error('[Email:Resend] Provider error:', error.message);
        return { success: false, provider: 'resend', error: error.message };
      }

      console.log(`[Email:Resend] Dispatched successfully to ${to} (ID: ${data?.id})`);
      return { success: true, provider: 'resend', messageId: data?.id };
    } catch (err: any) {
      console.error('[Email:Resend] Delivery exception:', err?.message || err);
      return { success: false, provider: 'resend', error: err?.message || String(err) };
    }
  }

  // 2. Check Next.js Mail Direct TLS Provider (Port 465 SSL, Fragments Architecture)
  if (mailUser && mailPass) {
    try {
      const transporter = getDirectTransporter(mailUser, mailPass);
      const info = await transporter.sendMail({
        from: mailFrom,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
        replyTo: replyTo || undefined,
      });

      console.log(`[Email:NextMail] Dispatched successfully to ${to} (MessageId: ${info.messageId})`);
      return { success: true, provider: 'next-mail', messageId: info.messageId };
    } catch (err: any) {
      console.error('[Email:NextMail] Delivery exception:', err?.message || err);
      return { success: false, provider: 'next-mail', error: err?.message || String(err) };
    }
  }

  // 3. Fallback / Dev Warning (No credentials configured)
  console.warn(`[Email] No mail provider configured (MAIL_USER/MAIL_PASS or RESEND_API_KEY missing). Simulated delivery to ${to}`);
  return { success: false, provider: 'mock', error: 'No email credentials configured' };
}

/* ========================================================================== */
/*                           RESPONSIVE EMAIL TEMPLATES                       */
/* ========================================================================== */

function getEmailLayout(content: string, preheader = ''): string {
  const currentYear = new Date().getFullYear();
  const safeAppUrl = APP_URL.replace(/\/$/, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #fafaf9; color: #1c1917; }
    .email-wrapper { max-width: 600px; margin: 24px auto; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; overflow: hidden; }
    .header { background: #1c1917; padding: 28px 24px; text-align: center; }
    .brand-title { color: #f59e0b; font-size: 24px; font-weight: 700; letter-spacing: 1.5px; margin: 0; text-transform: uppercase; }
    .brand-tagline { color: #d6d3d1; font-size: 13px; margin-top: 6px; letter-spacing: 0.5px; }
    .content { padding: 32px 24px; }
    .button { display: inline-block; background-color: #b45309; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 6px; margin-top: 16px; }
    .table-container { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table-container th { text-align: left; padding: 10px; background-color: #f5f5f4; font-size: 12px; color: #78716c; text-transform: uppercase; border-bottom: 1px solid #e7e5e4; }
    .table-container td { padding: 12px 10px; font-size: 14px; border-bottom: 1px solid #f5f5f4; }
    .summary-row td { padding: 6px 10px; font-size: 13px; }
    .total-row td { padding: 12px 10px; font-size: 16px; font-weight: 700; border-top: 2px solid #e7e5e4; color: #b45309; }
    .footer { background-color: #f5f5f4; padding: 24px; text-align: center; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; }
    .footer-links { margin-top: 10px; }
    .footer-links a { color: #b45309; text-decoration: none; margin: 0 8px; font-weight: 500; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 9999px; text-transform: uppercase; }
    .badge-confirmed { background-color: #dcfce7; color: #15803d; }
    .badge-processing { background-color: #e0f2fe; color: #0369a1; }
    .badge-shipped { background-color: #fef3c7; color: #b45309; }
    .badge-delivered { background-color: #dcfce7; color: #15803d; }
    .badge-cancelled { background-color: #fee2e2; color: #b91c1c; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="email-wrapper">
    <div class="header">
      <h1 class="brand-title">${APP_NAME}</h1>
      <div class="brand-tagline">Authentic Quality from Kashmir to Your Doorstep</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">&copy; ${currentYear} ${APP_NAME}. All rights reserved.</p>
      <p style="margin: 0 0 10px 0;">Srinagar, Jammu & Kashmir 190001</p>
      <p style="margin: 0 0 12px 0;">
        Built with passion by 
        <a href="${developerConfig.github}" target="_blank" rel="noopener noreferrer" style="color: #b45309; text-decoration: none; font-weight: 600;">${developerConfig.brand}</a> 
        • &copy; ${developerConfig.name}
      </p>
      <div class="footer-links">
        <a href="${safeAppUrl}/shop" target="_blank" rel="noopener noreferrer">Shop</a>
        <a href="${safeAppUrl}/account/orders" target="_blank" rel="noopener noreferrer">My Orders</a>
        <a href="${safeAppUrl}/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        <a href="${developerConfig.github}" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="${developerConfig.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function formatPaiseToInr(amountInPaise: number): string {
  return `₹${(Number(amountInPaise || 0) / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ========================================================================== */
/*                          TRANSACTIONAL EVENT METHODS                       */
/* ========================================================================== */

/**
 * Dispatches Order Confirmation email immediately upon successful payment capture.
 */
export async function sendOrderConfirmation(
  email: string,
  order: {
    orderId: string;
    items: Array<{ title: string; variant?: string; quantity: number; unitPrice?: number; lineTotal?: number }>;
    pricing?: { subtotal: number; discountAmount: number; shippingFee: number; total: number };
    total?: number;
    shippingAddress?: { name?: string; line1?: string; city?: string; state?: string; pincode?: string; phone?: string };
    createdAt?: Date;
  }
): Promise<EmailSendResult> {
  const safeAppUrl = APP_URL.replace(/\/$/, '');
  const customerName = order.shippingAddress?.name || 'Valued Customer';
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' });
  const totalAmount = order.pricing?.total ?? order.total ?? 0;
  const subtotalAmount = order.pricing?.subtotal ?? totalAmount;
  const discountAmount = order.pricing?.discountAmount ?? 0;
  const shippingFee = order.pricing?.shippingFee ?? 0;
  const orderUrl = `${safeAppUrl}/order-confirmation/${order.orderId}`;

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
    <tr>
      <td>
        <strong>${item.title}</strong>
        ${item.variant ? `<br/><span style="font-size: 12px; color: #78716c;">Variant: ${item.variant}</span>` : ''}
      </td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${item.lineTotal ? formatPaiseToInr(item.lineTotal) : (item.unitPrice ? formatPaiseToInr(item.unitPrice * item.quantity) : '')}</td>
    </tr>`
    )
    .join('');

  const addressHtml = order.shippingAddress?.line1
    ? `
    <div style="margin-top: 24px; padding: 16px; background-color: #f5f5f4; border-radius: 8px; font-size: 13px;">
      <strong style="font-size: 14px; color: #1c1917;">Shipping Destination:</strong><br/>
      ${order.shippingAddress.name ? `${order.shippingAddress.name}<br/>` : ''}
      ${order.shippingAddress.line1}<br/>
      ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.pincode || ''}<br/>
      ${order.shippingAddress.phone ? `Phone: ${order.shippingAddress.phone}` : ''}
    </div>`
    : '';

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-confirmed">Payment Confirmed</span>
      <h2 style="margin: 12px 0 6px 0; font-size: 22px; color: #1c1917;">Thank you for your purchase!</h2>
      <p style="margin: 0; color: #78716c; font-size: 14px;">Order #${order.orderId} placed on ${orderDate}</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
    <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
      We have received your payment and our artisan team in Kashmir is preparing your items. You will receive tracking details once your package is dispatched.
    </p>

    <table class="table-container">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr class="summary-row">
          <td colspan="2" style="text-align: right; color: #78716c;">Subtotal</td>
          <td style="text-align: right;">${formatPaiseToInr(subtotalAmount)}</td>
        </tr>
        ${discountAmount > 0 ? `
        <tr class="summary-row">
          <td colspan="2" style="text-align: right; color: #15803d;">Discount</td>
          <td style="text-align: right; color: #15803d;">-${formatPaiseToInr(discountAmount)}</td>
        </tr>` : ''}
        <tr class="summary-row">
          <td colspan="2" style="text-align: right; color: #78716c;">Shipping</td>
          <td style="text-align: right;">${shippingFee === 0 ? 'FREE' : formatPaiseToInr(shippingFee)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2" style="text-align: right;">Total Paid</td>
          <td style="text-align: right;">${formatPaiseToInr(totalAmount)}</td>
        </tr>
      </tbody>
    </table>

    ${addressHtml}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${orderUrl}" class="button" target="_blank" rel="noopener noreferrer">View Order Details</a>
    </div>
  `;

  return sendEmail(email, `Order Confirmed: #${order.orderId} - ${APP_NAME}`, getEmailLayout(content, `Order #${order.orderId} confirmed`));
}

/**
 * Dispatches Order Status Update (e.g. Processing).
 */
export async function sendOrderStatusUpdate(
  email: string,
  order: { orderId: string; shippingAddress?: { name?: string } },
  status: string,
  comment?: string
): Promise<EmailSendResult> {
  const safeAppUrl = APP_URL.replace(/\/$/, '');
  const customerName = order.shippingAddress?.name || 'Valued Customer';
  const orderUrl = `${safeAppUrl}/account/orders/${order.orderId}`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-processing">In Production</span>
      <h2 style="margin: 12px 0 6px 0; font-size: 22px; color: #1c1917;">Your order is being processed</h2>
      <p style="margin: 0; color: #78716c; font-size: 14px;">Order #${order.orderId}</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
    <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
      Great news! Your order is currently being handcrafted, packed, and prepared for dispatch by our team.
    </p>

    ${comment ? `<div style="margin: 16px 0; padding: 14px; background: #f5f5f4; border-left: 4px solid #0284c7; border-radius: 4px; font-size: 14px; color: #1c1917;"><strong>Note from team:</strong> ${comment}</div>` : ''}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${orderUrl}" class="button" target="_blank" rel="noopener noreferrer">Track Order Status</a>
    </div>
  `;

  return sendEmail(email, `Order #${order.orderId} is being processed - ${APP_NAME}`, getEmailLayout(content, `Order #${order.orderId} is now processing`));
}

/**
 * Dispatches Shipping Notification with tracking information.
 */
export async function sendShippingNotification(
  email: string,
  order: { orderId: string; shippingAddress?: { name?: string } },
  tracking: { carrier?: string; trackingNumber?: string; trackingUrl?: string }
): Promise<EmailSendResult> {
  const safeAppUrl = APP_URL.replace(/\/$/, '');
  const customerName = order.shippingAddress?.name || 'Valued Customer';
  const orderUrl = `${safeAppUrl}/account/orders/${order.orderId}`;

  const trackingBlock = tracking.trackingNumber
    ? `
    <div style="margin: 24px 0; padding: 18px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; text-align: center;">
      <span style="font-size: 12px; color: #854d0e; text-transform: uppercase; font-weight: 600;">Shipment Tracking</span>
      <p style="margin: 6px 0; font-size: 16px; font-weight: 700; color: #1c1917;">
        ${tracking.carrier ? `${tracking.carrier}: ` : ''}${tracking.trackingNumber}
      </p>
      ${tracking.trackingUrl ? `<a href="${tracking.trackingUrl}" target="_blank" rel="noopener noreferrer" style="color: #b45309; font-size: 13px; font-weight: 600; text-decoration: underline;">Track on Carrier Site &rarr;</a>` : ''}
    </div>`
    : '';

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-shipped">Shipped</span>
      <h2 style="margin: 12px 0 6px 0; font-size: 22px; color: #1c1917;">Your order is on the way!</h2>
      <p style="margin: 0; color: #78716c; font-size: 14px;">Order #${order.orderId}</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
    <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
      Your package has been dispatched from Srinagar and is on its journey to you.
    </p>

    ${trackingBlock}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${orderUrl}" class="button" target="_blank" rel="noopener noreferrer">View Delivery Timeline</a>
    </div>
  `;

  return sendEmail(email, `Your order #${order.orderId} has shipped! - ${APP_NAME}`, getEmailLayout(content, `Order #${order.orderId} is on the way`));
}

/**
 * Dispatches Delivery Notification.
 */
export async function sendDeliveryNotification(
  email: string,
  order: { orderId: string; shippingAddress?: { name?: string } }
): Promise<EmailSendResult> {
  const safeAppUrl = APP_URL.replace(/\/$/, '');
  const customerName = order.shippingAddress?.name || 'Valued Customer';
  const orderUrl = `${safeAppUrl}/account/orders/${order.orderId}`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-delivered">Delivered</span>
      <h2 style="margin: 12px 0 6px 0; font-size: 22px; color: #1c1917;">Your package has arrived</h2>
      <p style="margin: 0; color: #78716c; font-size: 14px;">Order #${order.orderId}</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
    <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
      Your order #${order.orderId} has been successfully delivered. We hope you love your new authentic pieces.
    </p>
    <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
      If you have a moment, we would love to hear your thoughts. Leave a review from your account dashboard to help fellow craft enthusiasts.
    </p>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${orderUrl}" class="button" target="_blank" rel="noopener noreferrer">View Order & Leave Review</a>
    </div>
  `;

  return sendEmail(email, `Delivered: Order #${order.orderId} - ${APP_NAME}`, getEmailLayout(content, `Order #${order.orderId} delivered`));
}

/**
 * Dispatches Order Cancellation notification with accurate refund status.
 */
export async function sendCancellationNotification(
  email: string,
  order: { orderId: string; shippingAddress?: { name?: string } },
  reason: string,
  refundAmount?: number
): Promise<EmailSendResult> {
  const safeAppUrl = APP_URL.replace(/\/$/, '');
  const customerName = order.shippingAddress?.name || 'Valued Customer';
  const orderUrl = `${safeAppUrl}/account/orders/${order.orderId}`;

  const refundNotice = refundAmount && refundAmount > 0
    ? `<div style="margin: 16px 0; padding: 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 14px; color: #065f46;">
         <strong>Refund Confirmation:</strong> A refund of ${formatPaiseToInr(refundAmount)} has been initiated and will reflect on your original payment source within 5-7 business days.
       </div>`
    : '';

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-cancelled">Order Cancelled</span>
      <h2 style="margin: 12px 0 6px 0; font-size: 22px; color: #1c1917;">Your order has been cancelled</h2>
      <p style="margin: 0; color: #78716c; font-size: 14px;">Order #${order.orderId}</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
    <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
      This email confirms that order #${order.orderId} has been cancelled.
    </p>

    <p style="font-size: 14px; color: #78716c; line-height: 1.6;">
      <strong>Reason for cancellation:</strong> ${reason || 'Requested by customer or store administrator.'}
    </p>

    ${refundNotice}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${orderUrl}" class="button" target="_blank" rel="noopener noreferrer">View Order Details</a>
    </div>
  `;

  return sendEmail(email, `Order Cancelled: #${order.orderId} - ${APP_NAME}`, getEmailLayout(content, `Order #${order.orderId} has been cancelled`));
}

/**
 * Dispatches Contact Form inquiry to store support with customer reply-to.
 */
export async function sendContactInquiry(inquiry: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<EmailSendResult> {
  const supportEmail = process.env.SUPPORT_EMAIL || 'pirzadasalik116@gmail.com';

  const content = `
    <h2 style="font-size: 20px; color: #1c1917; margin-top: 0;">New Customer Inquiry</h2>
    <div style="background-color: #f5f5f4; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 14px;">
      <p style="margin: 4px 0;"><strong>Name:</strong> ${inquiry.name}</p>
      <p style="margin: 4px 0;"><strong>Email:</strong> ${inquiry.email}</p>
      <p style="margin: 4px 0;"><strong>Subject:</strong> ${inquiry.subject}</p>
    </div>

    <div style="font-size: 15px; line-height: 1.6; color: #292524; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px;">
      <strong style="color: #78716c; font-size: 12px; text-transform: uppercase;">Message:</strong>
      <p style="margin: 8px 0 0 0; white-space: pre-line;">${inquiry.message}</p>
    </div>

    <p style="font-size: 12px; color: #78716c; margin-top: 20px;">
      You can reply directly to this email to respond to ${inquiry.name} (${inquiry.email}).
    </p>
  `;

  return sendEmail({
    to: supportEmail,
    subject: `[Customer Inquiry] ${inquiry.subject}`,
    html: getEmailLayout(content, `Inquiry from ${inquiry.name}`),
    replyTo: inquiry.email,
  });
}

/**
 * Dispatches Welcome email upon new user registration.
 */
export async function sendWelcome(email: string, name: string): Promise<EmailSendResult> {
  const safeAppUrl = APP_URL.replace(/\/$/, '');

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; color: #1c1917; margin: 0 0 8px 0;">Welcome to ${APP_NAME}</h2>
      <p style="font-size: 15px; color: #78716c; margin: 0;">We are delighted to have you join our community</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
      Thank you for creating an account with ${APP_NAME}. We curate premium artisanal fashion, heritage textiles, and contemporary lifestyle essentials straight from Kashmir.
    </p>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${safeAppUrl}/shop" class="button" target="_blank" rel="noopener noreferrer">Explore Catalog</a>
    </div>
  `;

  return sendEmail(email, `Welcome to ${APP_NAME}`, getEmailLayout(content, `Welcome to ${APP_NAME}, ${name}!`));
}

/**
 * Dispatches Password Reset email.
 */
export async function sendPasswordReset(email: string, resetUrl: string): Promise<EmailSendResult> {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 22px; color: #1c1917; margin: 0 0 8px 0;">Password Reset Request</h2>
      <p style="font-size: 14px; color: #78716c; margin: 0;">Follow the link below to securely reset your credentials</p>
    </div>

    <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
      We received a request to reset your password for your ${APP_NAME} account. If you initiated this request, click the button below:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" class="button" target="_blank" rel="noopener noreferrer">Reset My Password</a>
    </div>

    <p style="font-size: 12px; color: #a8a29e; line-height: 1.5;">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account remains secure.
    </p>
  `;

  return sendEmail(email, `Password Reset Request - ${APP_NAME}`, getEmailLayout(content, `Reset your password for ${APP_NAME}`));
}
