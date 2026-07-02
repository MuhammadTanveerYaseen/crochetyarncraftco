import nodemailer from 'nodemailer';
import { getAttachmentDownloadUrl } from './config';

interface SendPatternEmailArgs {
  toEmail: string;
  orderId: string;
  total: number;
  items: Array<{
    title: string;
    pdfUrl: string;
    price: number;
  }>;
  tempPassword?: string;
  siteUrl?: string;
}

let transporterCached: any = null;

// Helper to initialize or retrieve nodemailer transporter
async function getTransporter() {
  if (transporterCached) return transporterCached;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log('Using configured SMTP settings from .env');
    transporterCached = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass }
    });
    return transporterCached;
  }

  // Fallback: Auto-generate an Ethereal SMTP test account for local testing
  console.log('No SMTP configurations found in .env.local. Generating Ethereal test mailer account...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporterCached = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass  // generated ethereal password
      }
    });
    console.log(`Successfully generated Ethereal test inbox credentials:`);
    console.log(`User: ${testAccount.user}`);
    console.log(`Pass: ${testAccount.pass}`);
    return transporterCached;
  } catch (err) {
    console.error('Failed to create Ethereal SMTP mailer fallback:', err);
    // Silent console log fallback
    transporterCached = {
      sendMail: async (options: any) => {
        console.log('--- SMTP OFFLINE --- EMAIL SIMULATION LOG ---');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`HTML Body Snippet: ${options.html.substring(0, 300)}...`);
        return { messageId: 'simulated-id' };
      }
    };
    return transporterCached;
  }
}

export async function sendPatternEmail(args: SendPatternEmailArgs) {
  const { toEmail, orderId, total, items, tempPassword } = args;
  try {
    const transporter = await getTransporter();
    const siteUrl = args.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Build items HTML list (Etsy row style)
    const itemsHtml = items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #F1ECE6;">
        <td style="padding: 16px 8px; font-family: sans-serif; font-size: 14px; color: #5C4033; font-weight: bold; line-height: 1.4;">
          ${item.title}
        </td>
        <td style="padding: 16px 8px; font-family: sans-serif; font-size: 14px; text-align: right; color: #A855F7; font-weight: 800;">
          $${item.price.toFixed(2)}
        </td>
        <td style="padding: 16px 8px; text-align: right;">
          <a href="${getAttachmentDownloadUrl(item.pdfUrl, item.title, siteUrl)}" download style="background-color: #A855F7; color: #ffffff; text-decoration: none; font-family: sans-serif; font-size: 11px; font-weight: bold; padding: 8px 16px; border-radius: 9999px; display: inline-block;">
            Download
          </a>
        </td>
      </tr>
    `).join('');

    const profileHtml = tempPassword ? `
      <div style="background-color: #FAF5FF; border: 1px solid #EEDDCC; border-radius: 12px; padding: 18px; margin: 24px 0; font-family: sans-serif; font-size: 13px; color: #5C4033; line-height: 1.6;">
        <h3 style="color: #A855F7; margin-top: 0; margin-bottom: 8px; font-family: Georgia, serif; font-size: 15px; font-weight: bold;">Your Maker Profile is Ready</h3>
        <p style="margin: 4px 0 12px 0; font-size: 12px; color: #7F7F8C;">We've created a secure profile under this email so you can access your purchased crochet patterns from any device at any time.</p>
        <div style="margin-bottom: 6px; font-size: 12px;"><strong>Login Email:</strong> <span style="font-family: monospace; font-weight: bold; color: #1F2937;">${toEmail}</span></div>
        <div style="font-size: 12px;"><strong>Temporary Password:</strong> <code style="background-color: #FFFDF9; padding: 2px 6px; border: 1px dashed #A855F7; border-radius: 4px; font-family: monospace; font-size: 13px; font-weight: bold; color: #A855F7;">${tempPassword}</code></div>
        <p style="margin: 12px 0 0 0; font-size: 11px; color: #9CA3AF; font-style: italic;">We recommend changing this password in your profile settings after logging in.</p>
      </div>
    ` : '';

    const htmlBody = `
      <div style="background-color: #F8F6F2; padding: 40px 15px; font-family: sans-serif;">
        <div style="background-color: #FFFFFF; max-width: 600px; margin: 0 auto; border: 1px solid #EEDDCC; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(92, 64, 51, 0.03);">
          
          <!-- Colored Top Border -->
          <div style="height: 6px; background-color: #A855F7;"></div>
          
          <!-- Header -->
          <div style="padding: 32px 32px 16px 32px; text-align: center;">
            <h1 style="color: #5C4033; font-family: Georgia, serif; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
              Yarn<span style="color: #A855F7;">Craft Co</span>
            </h1>
            <div style="height: 1px; background-color: #F1ECE6; margin: 16px auto 0 auto; width: 60px;"></div>
            <p style="margin: 12px 0 0 0; font-size: 11px; color: #8A7366; text-transform: uppercase; font-weight: bold; letter-spacing: 1.2px;">Order Delivery Confirmation</p>
          </div>

          <!-- Body -->
          <div style="padding: 0 32px 32px 32px; font-family: sans-serif;">
            <p style="font-size: 15px; color: #5C4033; font-weight: bold; margin-bottom: 8px;">Hi Maker,</p>
            <p style="font-size: 14px; line-height: 1.5; color: #5C4033; margin-top: 0;">
              Thank you for supporting independent crochet design! Your payment has been authorized and your PDF patterns are ready for immediate download below.
            </p>

            <!-- Order Summary Card -->
            <div style="background-color: #FBF7F0; border-radius: 12px; padding: 18px; margin: 24px 0; border: 1px solid #EEDDCC;">
              <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; color: #5C4033;">
                <tr>
                  <td style="padding: 4px 0; color: #8A7366; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.8px;">Order Reference</td>
                  <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: bold; font-size: 13px; color: #1F2937;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #8A7366; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.8px;">Amount Charged</td>
                  <td style="padding: 4px 0; text-align: right; color: #A855F7; font-weight: 800; font-size: 14px;">$${total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            ${profileHtml}

            <!-- Items Table -->
            <h3 style="color: #5C4033; font-family: Georgia, serif; font-size: 16px; font-weight: bold; border-bottom: 2px solid #EEDDCC; padding-bottom: 8px; margin-top: 32px; margin-bottom: 8px;">Your PDF Downloads</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #8A7366;">
                  <th style="padding: 8px 8px 8px 0; font-weight: bold;">Pattern Details</th>
                  <th style="padding: 8px; text-align: right; font-weight: bold; width: 60px;">Price</th>
                  <th style="padding: 8px 0 8px 8px; text-align: right; font-weight: bold; width: 100px;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Promo Banner -->
            <div style="background-color: #FAF5FF; border: 2px dashed #C084FC; border-radius: 16px; padding: 24px; margin: 32px 0; text-align: center; color: #5C4033;">
              <span style="font-size: 20px; display: block; margin-bottom: 8px;">🎁</span>
              <h3 style="color: #A855F7; margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 16px; font-weight: bold;">Cozy Gift: 20% OFF Your Next Project</h3>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #7F7F8C; line-height: 1.5;">To help keep your crochet hook busy, enjoy 20% off your next digital pattern order. Simply enter this coupon at checkout:</p>
              <div style="display: inline-block; background-color: #FFFFFF; padding: 10px 24px; border: 1px solid #C084FC; border-radius: 8px; font-family: monospace; font-size: 16px; font-weight: bold; color: #A855F7; letter-spacing: 1.5px; box-shadow: 0 2px 4px rgba(168, 85, 247, 0.04);">
                LOVEDYARN20
              </div>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #9CA3AF;">Enter this code on the secure Polar checkout screen to claim your savings.</p>
            </div>

            <!-- Security Footer -->
            <div style="background-color: #F9F9FA; border: 1px solid #E6E6EB; border-radius: 12px; padding: 16px; font-family: sans-serif; font-size: 11px; color: #7F7F8C; line-height: 1.5; margin-top: 32px;">
              <strong>Security & Support:</strong> These download links are intended only for the purchaser. Please do not forward this email or share these links. Files are standard PDF document format. If you need any assistance with a pattern, simply reply to this email or reach us at <strong>support@yarncraftco.com</strong>.
            </div>

            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid #F1ECE6; padding-top: 24px; margin-top: 40px; font-size: 11px; color: #A19085; line-height: 1.6;">
              <p style="margin: 0 0 4px 0;">© ${new Date().getFullYear()} Yarn Craft Co. All rights reserved.</p>
              <p style="margin: 0;">You received this receipt because you completed a digital purchase at Yarn Craft Co.</p>
            </div>
            
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Yarn Craft Co Shop" <${process.env.SMTP_USER || 'no-reply@yarncraftco.com'}>`,
      to: toEmail,
      subject: '🧶 Your Crochet PDF Patterns are Ready to Download!',
      html: htmlBody
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email dispatched successfully! Message ID: ${info.messageId}`);
    
    // Ethereal helper: if using ethereal email, print URL to view sent message
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('----------------------------------------------------');
      console.log('✉ MOCK EMAIL RECEIVED!');
      console.log(`Preview email in your browser: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('----------------------------------------------------');
    }
    return info;
  } catch (error) {
    console.error('Nodemailer dispatch error:', error);
    throw error;
  }
}

interface SendMarketingEmailArgs {
  toEmail: string;
  subject: string;
  promoCode: string;
  discountPercent: number;
  message: string;
  siteUrl?: string;
}

export async function sendMarketingEmail(args: SendMarketingEmailArgs) {
  const { toEmail, subject, promoCode, discountPercent, message } = args;
  try {
    const transporter = await getTransporter();
    const siteUrl = args.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const htmlBody = `
      <div style="background-color: #F8F6F2; padding: 40px 15px; font-family: sans-serif;">
        <div style="background-color: #FFFFFF; max-width: 600px; margin: 0 auto; border: 1px solid #EEDDCC; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(92, 64, 51, 0.03);">
          
          <!-- Colored Top Border -->
          <div style="height: 6px; background-color: #A855F7;"></div>
          
          <!-- Header -->
          <div style="padding: 32px 32px 16px 32px; text-align: center;">
            <h1 style="color: #5C4033; font-family: Georgia, serif; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
              Yarn<span style="color: #A855F7;">Craft Co</span>
            </h1>
            <div style="height: 1px; background-color: #F1ECE6; margin: 16px auto 0 auto; width: 60px;"></div>
            <p style="margin: 12px 0 0 0; font-size: 11px; color: #8A7366; text-transform: uppercase; font-weight: bold; letter-spacing: 1.2px;">Exclusive Offer for Makers</p>
          </div>

          <!-- Body -->
          <div style="padding: 0 32px 32px 32px; font-family: sans-serif;">
            <p style="font-size: 15px; color: #5C4033; font-weight: bold; margin-bottom: 8px;">Hi Maker,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #5C4033; margin-top: 0; white-space: pre-line;">
              ${message}
            </p>

            <!-- Promo Banner -->
            <div style="background-color: #FAF5FF; border: 2px dashed #C084FC; border-radius: 16px; padding: 24px; margin: 32px 0; text-align: center; color: #5C4033;">
              <span style="font-size: 20px; display: block; margin-bottom: 8px;">🎁</span>
              <h3 style="color: #A855F7; margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 16px; font-weight: bold;">Claim Your ${discountPercent}% OFF Coupon</h3>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #7F7F8C;">Copy this discount code and apply it during checkout to claim your savings:</p>
              <div style="display: inline-block; background-color: #FFFFFF; padding: 10px 24px; border: 1px solid #C084FC; border-radius: 8px; font-family: monospace; font-size: 18px; font-weight: bold; color: #A855F7; letter-spacing: 2px; box-shadow: 0 2px 4px rgba(168, 85, 247, 0.04);">
                ${promoCode.toUpperCase()}
              </div>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #9CA3AF;">Visit our shop to browse our patterns library.</p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0 16px 0;">
              <a href="${siteUrl}" style="background-color: #A855F7; color: #ffffff; text-decoration: none; font-family: sans-serif; font-size: 13px; font-weight: bold; padding: 12px 28px; border-radius: 9999px; display: inline-block; box-shadow: 0 4px 10px rgba(168, 85, 247, 0.15);">
                Browse Patterns Catalog
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid #F1ECE6; padding-top: 24px; margin-top: 40px; font-size: 11px; color: #A19085; line-height: 1.6;">
              <p style="margin: 0 0 4px 0;">© ${new Date().getFullYear()} Yarn Craft Co. All rights reserved.</p>
              <p style="margin: 0;">You received this email because you are a registered maker at Yarn Craft Co.</p>
            </div>
            
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Yarn Craft Co Offers" <${process.env.SMTP_USER || 'no-reply@yarncraftco.com'}>`,
      to: toEmail,
      subject: subject,
      html: htmlBody
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Ethereal helper print
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('----------------------------------------------------');
      console.log('✉ MOCK MARKETING EMAIL DISPATCHED!');
      console.log(`Preview email in your browser: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('----------------------------------------------------');
    }
    return info;
  } catch (error) {
    console.error('Marketing email dispatch error:', error);
    throw error;
  }
}

interface SendAdminFavoriteNotificationArgs {
  userEmail?: string;
  productTitle: string;
  productId: string;
  siteUrl?: string;
}

export async function sendAdminFavoriteNotification(args: SendAdminFavoriteNotificationArgs) {
  const { userEmail, productTitle, productId } = args;
  try {
    const transporter = await getTransporter();
    const siteUrl = args.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const adminEmail = 'muhammadtanveer0135@gmail.com';
    const productLink = `${siteUrl}/products/${productId}`;

    const htmlBody = `
      <div style="background-color: #F8F6F2; padding: 40px 15px; font-family: sans-serif;">
        <div style="background-color: #FFFFFF; max-width: 600px; margin: 0 auto; border: 1px solid #EEDDCC; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(92, 64, 51, 0.03);">
          <div style="height: 6px; background-color: #A855F7;"></div>
          <div style="padding: 32px 32px 16px 32px; text-align: center;">
            <h1 style="color: #5C4033; font-family: Georgia, serif; margin: 0; font-size: 24px; font-weight: 900;">
              Yarn<span style="color: #A855F7;">Craft Co</span>
            </h1>
            <div style="height: 1px; background-color: #F1ECE6; margin: 16px auto 0 auto; width: 60px;"></div>
            <p style="margin: 12px 0 0 0; font-size: 11px; color: #8A7366; text-transform: uppercase; font-weight: bold; letter-spacing: 1.2px;">❤️ Pattern Favorited ❤️</p>
          </div>
          <div style="padding: 0 32px 32px 32px; font-family: sans-serif; font-size: 14px; color: #5C4033; line-height: 1.6;">
            <p>Hi Admin,</p>
            <p>A maker has just added a pattern to their favorites list! Here are the details:</p>
            
            <div style="background-color: #FBF7F0; border-radius: 12px; padding: 18px; margin: 24px 0; border: 1px solid #EEDDCC;">
              <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; color: #5C4033;">
                <tr>
                  <td style="padding: 6px 0; color: #8A7366; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.8px;">Pattern Title</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: bold; font-size: 13px; color: #1F2937;">${productTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #8A7366; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.8px;">Product ID</td>
                  <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: bold; color: #5C4033;">${productId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #8A7366; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.8px;">Favorited By</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #A855F7;">${userEmail || 'Anonymous Guest'}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 24px 0 16px 0;">
              <a href="${productLink}" style="background-color: #A855F7; color: #ffffff; text-decoration: none; font-family: sans-serif; font-size: 13px; font-weight: bold; padding: 12px 28px; border-radius: 9999px; display: inline-block;">
                View Product Details
              </a>
            </div>
            
            <div style="text-align: center; border-top: 1px solid #F1ECE6; padding-top: 24px; margin-top: 40px; font-size: 11px; color: #A19085;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Yarn Craft Co Admin Alerts</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Yarn Craft Co Store" <${process.env.SMTP_USER || 'no-reply@yarncraftco.com'}>`,
      to: adminEmail,
      subject: `❤️ Product Favorited: "${productTitle}"`,
      html: htmlBody
    };

    const info = await transporter.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('----------------------------------------------------');
      console.log('✉ MOCK ADMIN FAVORITE NOTIFICATION DISPATCHED!');
      console.log(`Preview email in your browser: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('----------------------------------------------------');
    }
    return info;
  } catch (error) {
    console.error('Admin favorite notification dispatch error:', error);
    throw error;
  }
}

interface SendAdminSaleNotificationArgs {
  orderId: string;
  customerEmail: string;
  totalAmount: number;
  items: Array<{
    title: string;
    price: number;
  }>;
  siteUrl?: string;
}

export async function sendAdminSaleNotification(args: SendAdminSaleNotificationArgs) {
  const { orderId, customerEmail, totalAmount, items } = args;
  try {
    const transporter = await getTransporter();
    const siteUrl = args.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const adminEmail = 'muhammadtanveer0135@gmail.com';
    const adminLink = `${siteUrl}/admin`;

    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #F1ECE6;">
        <td style="padding: 12px 8px; font-family: sans-serif; font-size: 13px; color: #5C4033; font-weight: bold;">
          ${item.title}
        </td>
        <td style="padding: 12px 8px; font-family: sans-serif; font-size: 13px; text-align: right; color: #A855F7; font-weight: 800;">
          $${item.price.toFixed(2)}
        </td>
      </tr>
    `).join('');

    const htmlBody = `
      <div style="background-color: #F8F6F2; padding: 40px 15px; font-family: sans-serif;">
        <div style="background-color: #FFFFFF; max-width: 600px; margin: 0 auto; border: 1px solid #EEDDCC; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(92, 64, 51, 0.03);">
          <div style="height: 6px; background-color: #22C55E;"></div>
          <div style="padding: 32px 32px 16px 32px; text-align: center;">
            <h1 style="color: #5C4033; font-family: Georgia, serif; margin: 0; font-size: 24px; font-weight: 900;">
              Yarn<span style="color: #A855F7;">Craft Co</span>
            </h1>
            <div style="height: 1px; background-color: #F1ECE6; margin: 16px auto 0 auto; width: 60px;"></div>
            <p style="margin: 12px 0 0 0; font-size: 11px; color: #8A7366; text-transform: uppercase; font-weight: bold; letter-spacing: 1.2px;">🎉 New Sale Notification 🎉</p>
          </div>
          <div style="padding: 0 32px 32px 32px; font-family: sans-serif; font-size: 14px; color: #5C4033; line-height: 1.6;">
            <p>Hi Admin,</p>
            <p>Cha-ching! A new sale has been registered on Yarn Craft Co.</p>
            
            <div style="background-color: #FBF7F0; border-radius: 12px; padding: 18px; margin: 24px 0; border: 1px solid #EEDDCC;">
              <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; color: #5C4033;">
                <tr>
                  <td style="padding: 4px 0; color: #8A7366; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.8px;">Order Reference</td>
                  <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: bold; font-size: 13px; color: #1F2937;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #8A7366; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.8px;">Total Amount</td>
                  <td style="padding: 4px 0; text-align: right; color: #22C55E; font-weight: 800; font-size: 14px;">$${totalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #8A7366; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.8px;">Customer Email</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #1F2937;">${customerEmail}</td>
                </tr>
              </table>
            </div>

            <h3 style="color: #5C4033; font-family: Georgia, serif; font-size: 16px; font-weight: bold; border-bottom: 2px solid #EEDDCC; padding-bottom: 8px; margin-top: 32px; margin-bottom: 8px;">Items Purchased</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #8A7366;">
                  <th style="padding: 8px 8px 8px 0; font-weight: bold;">Pattern details</th>
                  <th style="padding: 8px; text-align: right; font-weight: bold; width: 80px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: center; margin: 24px 0 16px 0;">
              <a href="${adminLink}" style="background-color: #22C55E; color: #ffffff; text-decoration: none; font-family: sans-serif; font-size: 13px; font-weight: bold; padding: 12px 28px; border-radius: 9999px; display: inline-block;">
                Go to Admin Dashboard
              </a>
            </div>
            
            <div style="text-align: center; border-top: 1px solid #F1ECE6; padding-top: 24px; margin-top: 40px; font-size: 11px; color: #A19085;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Yarn Craft Co Store Alerts</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Yarn Craft Co Shop" <${process.env.SMTP_USER || 'no-reply@yarncraftco.com'}>`,
      to: adminEmail,
      subject: `🎉 New Sale! $${totalAmount.toFixed(2)} - ${customerEmail}`,
      html: htmlBody
    };

    const info = await transporter.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('----------------------------------------------------');
      console.log('✉ MOCK ADMIN SALE NOTIFICATION DISPATCHED!');
      console.log(`Preview email in your browser: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('----------------------------------------------------');
    }
    return info;
  } catch (error) {
    console.error('Admin sale notification dispatch error:', error);
    throw error;
  }
}
