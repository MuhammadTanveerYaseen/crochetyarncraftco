import nodemailer from 'nodemailer';

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

export async function sendPatternEmail({ toEmail, orderId, total, items, tempPassword }: SendPatternEmailArgs) {
  try {
    const transporter = await getTransporter();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Build items HTML list
    const itemsHtml = items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #EEDDCC;">
        <td style="padding: 12px 8px; font-family: sans-serif; font-size: 14px; color: #5C4033; font-weight: bold;">
          ${item.title}
        </td>
        <td style="padding: 12px 8px; font-family: sans-serif; font-size: 14px; text-align: right; color: #A855F7; font-weight: bold;">
          $${item.price.toFixed(2)}
        </td>
        <td style="padding: 12px 8px; text-align: right;">
          <a href="${siteUrl}${item.pdfUrl}" download style="background-color: #A855F7; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: bold; padding: 6px 12px; border-radius: 8px; display: inline-block;">
            Download PDF
          </a>
        </td>
      </tr>
    `).join('');

    const profileHtml = tempPassword ? `
      <div style="background-color: #FAF5FF; border: 1px solid #EEDDCC; border-radius: 16px; padding: 16px; margin: 20px 0; font-size: 13px; color: #5C4033; line-height: 1.5;">
        <h3 style="color: #A855F7; margin-top: 0; margin-bottom: 8px; font-family: serif; font-size: 15px;">Your Account Profile Created</h3>
        <p style="margin: 4px 0 8px 0; font-size: 12px; color: #6B7280;">We automatically created a user profile for you under this email address so you can access your purchased patterns at any time in the future.</p>
        <div style="margin-bottom: 4px;"><strong>Login Email:</strong> <span style="font-family: monospace; font-weight: bold;">${toEmail}</span></div>
        <div><strong>Temporary Password:</strong> <code style="background-color: #FFFDF9; padding: 2px 6px; border: 1px dashed #A855F7; border-radius: 4px; font-family: monospace; font-size: 13px; font-weight: bold; color: #A855F7;">${tempPassword}</code></div>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #9CA3AF; font-style: italic;">We recommend changing this password after logging in for the first time.</p>
      </div>
    ` : '';

    const htmlBody = `
      <div style="background-color: #FFFDF9; padding: 24px; font-family: sans-serif; color: #1F2937; max-width: 600px; margin: 0 auto; border: 1px solid #EEDDCC; border-radius: 24px;">
        <div style="text-align: center; border-bottom: 2px solid #A855F7; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="color: #5C4033; font-family: serif; margin: 0; font-size: 28px;">Yarn<span style="color: #A855F7;">Craft Co</span></h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Your Digital Pattern Delivery</p>
        </div>

        <p style="font-size: 16px; color: #5C4033; font-weight: bold; margin-bottom: 8px;">Hi there,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #5C4033; margin-top: 0;">
          Thank you for your purchase from <strong>Yarn Craft Co</strong>! Your order has been processed successfully. Below are the download links for your purchased crochet patterns.
        </p>

        <div style="background-color: #FBF7F0; border: 1px solid #EEDDCC; border-radius: 16px; padding: 16px; margin: 20px 0; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #5C4033;">
            <span><strong>Order ID:</strong></span>
            <span style="font-family: monospace;">${orderId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #5C4033;">
            <span><strong>Total Amount:</strong></span>
            <span style="color: #A855F7; font-weight: bold;">$${total.toFixed(2)}</span>
          </div>
        </div>

        ${profileHtml}

        <h3 style="color: #5C4033; border-bottom: 1px solid #EEDDCC; padding-bottom: 8px; margin-top: 24px;">Purchased Patterns</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #EEDDCC; text-align: left; font-size: 11px; text-transform: uppercase; color: #6B7280;">
              <th style="padding: 8px;">Pattern Name</th>
              <th style="padding: 8px; text-align: right;">Price</th>
              <th style="padding: 8px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background-color: #FFFDF9; border: 2px dashed #A855F7; border-radius: 16px; padding: 16px; margin: 24px 0 16px 0; text-align: center; color: #5C4033; line-height: 1.5;">
          <h3 style="color: #A855F7; margin-top: 0; margin-bottom: 6px; font-family: serif; font-size: 16px;">🧶 Special Gift: 20% OFF Your Next Pattern!</h3>
          <p style="margin: 4px 0 10px 0; font-size: 12px; color: #6B7280;">We want to support your crochet journey! Use this exclusive discount code during checkout on your next purchase:</p>
          <div style="display: inline-block; background-color: #FAF5FF; padding: 8px 16px; border: 1px solid #A855F7; border-radius: 8px; font-family: monospace; font-size: 16px; font-weight: bold; color: #A855F7; letter-spacing: 1.5px; margin-bottom: 8px;">
            LOVEDYARN20
          </div>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #9CA3AF;">Enter this code on the Polar checkout screen to apply your discount.</p>
        </div>

        <div style="background-color: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.1); border-radius: 12px; padding: 12px; font-size: 11px; color: #6B7280; line-height: 1.4; margin-top: 24px;">
          <strong>Security Note:</strong> These download links are intended only for the purchaser. Do not forward this email or share these links with others. Files are in standard PDF format. If you need any help with a stitch, contact us at <strong>support@yarncraftco.com</strong>.
        </div>

        <div style="text-align: center; border-top: 1px solid #EEDDCC; padding-top: 16px; margin-top: 30px; font-size: 11px; color: #9CA3AF;">
          <p>© ${new Date().getFullYear()} Yarn Craft Co. All rights reserved.</p>
          <p>You received this email because you made a digital purchase from Yarn Craft Co.</p>
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
}

export async function sendMarketingEmail({ toEmail, subject, promoCode, discountPercent, message }: SendMarketingEmailArgs) {
  try {
    const transporter = await getTransporter();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const htmlBody = `
      <div style="background-color: #FFFDF9; padding: 24px; font-family: sans-serif; color: #1F2937; max-width: 600px; margin: 0 auto; border: 1px solid #EEDDCC; border-radius: 24px;">
        <div style="text-align: center; border-bottom: 2px solid #A855F7; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="color: #5C4033; font-family: serif; margin: 0; font-size: 28px;">Yarn<span style="color: #A855F7;">Craft Co</span></h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Exclusive Creator Offer</p>
        </div>

        <p style="font-size: 15px; color: #5C4033; font-weight: bold; margin-bottom: 12px;">Hi Maker,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #5C4033; margin-top: 0; white-space: pre-line;">
          ${message}
        </p>

        <div style="background-color: #FFFDF9; border: 2px dashed #A855F7; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center; color: #5C4033; line-height: 1.5;">
          <h3 style="color: #A855F7; margin-top: 0; margin-bottom: 6px; font-family: serif; font-size: 18px;">🎁 Claim Your ${discountPercent}% OFF Code</h3>
          <p style="margin: 4px 0 12px 0; font-size: 12px; color: #6B7280;">Copy this discount code and apply it during checkout to save:</p>
          <div style="display: inline-block; background-color: #white; padding: 10px 20px; border: 1.5px solid #A855F7; border-radius: 10px; font-family: monospace; font-size: 18px; font-weight: bold; color: #A855F7; letter-spacing: 2px; shadow: sm;">
            ${promoCode.toUpperCase()}
          </div>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #9CA3AF;">Visit our shop to browse our patterns library.</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${siteUrl}" style="background-color: #A855F7; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; padding: 10px 24px; border-radius: 10px; display: inline-block;">
            Browse Patterns Catalog
          </a>
        </div>

        <div style="text-align: center; border-top: 1px solid #EEDDCC; padding-top: 16px; margin-top: 30px; font-size: 11px; color: #9CA3AF;">
          <p>© ${new Date().getFullYear()} Yarn Craft Co. All rights reserved.</p>
          <p>You received this email because you are a registered maker at Yarn Craft Co.</p>
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
