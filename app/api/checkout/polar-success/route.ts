import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { BCRYPT_ROUNDS, JWT_SECRET, AUTH_COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/config';
import { getPolarCheckoutSession } from '@/lib/polar';
import { sendPatternEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkoutId = searchParams.get('checkout_id');
  const isMock = searchParams.get('mock') === 'true';

  if (!checkoutId) {
    return NextResponse.json({ success: false, error: "Missing checkout_id parameter" }, { status: 400 });
  }

  let isConnected = false;
  try {
    await dbConnect();
    isConnected = true;
  } catch (error) {
    console.warn("Could not connect to MongoDB in Polar success handler:", error);
  }

  try {
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const dynamicSiteUrl = `${proto}://${host}`;

    let orderId = '';
    let customerEmail = '';
    let customerName = '';
    let totalAmount = 0;
    let items: Array<{ title: string; price: number; pdfUrl: string }> = [];
    let tempPassword = undefined;
    let authenticatedUser: any = null;

    if (isMock) {
      // Mock handler gets details directly from query parameters to run without DB
      orderId = searchParams.get('order_id') || `mock-order-${Date.now()}`;
      customerEmail = searchParams.get('email') || 'mock@example.com';
      customerName = searchParams.get('name') || 'Guest';
      totalAmount = Number(searchParams.get('total') || 0);

      const queryTitles = searchParams.getAll('titles');
      const queryPdfs = searchParams.getAll('pdfs');
      items = queryTitles.map((title, idx) => ({
        title,
        price: 0, // mock price
        pdfUrl: queryPdfs[idx] || '/uploads/mock-pattern.pdf'
      }));

      // Try to update DB if connected
      if (isConnected) {
        try {
          // 1. Create or Find User Profile
          let user = await User.findOne({ email: customerEmail.toLowerCase().trim() });
          if (!user) {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
            tempPassword = '';
            for (let i = 0; i < 12; i++) {
              tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS || 10);
            user = await User.create({
              name: customerName,
              email: customerEmail.toLowerCase().trim(),
              password: hashedPassword,
              role: 'user',
              createdAt: new Date()
            });
            console.log(`Automatically created mock user account for ${customerEmail}`);
          }
          authenticatedUser = user;

          // 2. Update Order
          const order = await Order.findById(orderId);
          if (order) {
            order.userId = user._id as any;
            if (order.status === 'pending') {
              order.status = 'completed';
            }
            await order.save();
          }
        } catch (err) {
          console.warn("Failed to update pending mock order or user in DB:", err);
        }
      }

      // Send confirmation email
      try {
        await sendPatternEmail({
          toEmail: customerEmail,
          orderId,
          total: totalAmount,
          items,
          tempPassword,
          siteUrl: dynamicSiteUrl
        });
      } catch (err) {
        console.error("Failed to send mock pattern email:", err);
      }
    } else {
      // Real flow: fetch checkout session from Polar API
      const session = await getPolarCheckoutSession(checkoutId);
      
      if (session.status !== 'succeeded' && session.status !== 'confirmed') {
        // Redirect to checkout with error
        const redirectUrl = new URL('/checkout', request.url);
        redirectUrl.searchParams.set('error', `Polar payment not completed. Status: ${session.status}`);
        return NextResponse.redirect(redirectUrl);
      }

      orderId = session.metadata?.orderId || '';
      customerEmail = session.customerEmail || '';
      customerName = session.customerName || '';

      if (!orderId) {
        throw new Error("Order ID not found in Polar checkout metadata");
      }

      if (!isConnected) {
        throw new Error("Database not connected. Cannot complete real Polar checkout session.");
      }

      // Load order
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found in database.`);
      }

      // If customerEmail is missing from session, fallback to order email
      if (!customerEmail) {
        customerEmail = order.customerEmail;
      }
      totalAmount = order.totalAmount;

      // Resolve items and PDFs
      const resolvedItems: Array<{ title: string; price: number; pdfUrl: string }> = [];
      for (const item of order.items) {
        let pdfUrl = '/uploads/mock-pattern.pdf';
        try {
          const prod = await Product.findById(item.productId).select('pdfUrl').lean();
          if (prod && (prod as any).pdfUrl) {
            pdfUrl = (prod as any).pdfUrl;
          }
        } catch (err) {
          console.warn(`Could not resolve pdfUrl for product ${item.productId}:`, err);
        }
        resolvedItems.push({
          title: item.title,
          price: item.price,
          pdfUrl
        });
      }

      items = resolvedItems;

      // 1. Create or Find User Profile
      let user = await User.findOne({ email: customerEmail.toLowerCase().trim() });
      if (!user) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        tempPassword = '';
        for (let i = 0; i < 12; i++) {
          tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS || 10);
        user = await User.create({
          name: customerName || customerEmail.split('@')[0],
          email: customerEmail.toLowerCase().trim(),
          password: hashedPassword,
          role: 'user',
          createdAt: new Date()
        });
        console.log(`Automatically created user account for ${customerEmail}`);
      }
      authenticatedUser = user;

      // 2. Complete Order if pending
      if (order.status === 'pending') {
        order.status = 'completed';
        order.userId = user._id as any;
        await order.save();

        // 3. Send email with delivery PDFs and profile credentials
        try {
          await sendPatternEmail({
            toEmail: customerEmail,
            orderId,
            total: totalAmount,
            items,
            tempPassword,
            siteUrl: dynamicSiteUrl
          });
        } catch (err) {
          console.error("Failed to send pattern email:", err);
        }
      } else if (!order.userId && user) {
        // Safe link in case order was completed but user wasn't linked
        order.userId = user._id as any;
        await order.save();
      }
    }

    // Automatically establish auth login session in cookies
    if (authenticatedUser) {
      try {
        const cookieStore = await cookies();
        const token = jwt.sign({ userId: authenticatedUser._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
        cookieStore.set(AUTH_COOKIE_NAME, token, {
          ...COOKIE_OPTIONS,
          maxAge: 60 * 60 * 24 * 7 // 7 days in seconds
        });
        console.log(`Successfully auto-logged in user ${customerEmail} after checkout redirection.`);
      } catch (cookieErr) {
        console.warn("Could not set login session cookie in checkout success callback:", cookieErr);
      }
    }

    // Build checkout-success redirect URL
    const successRedirectUrl = new URL('/checkout-success', request.url);
    successRedirectUrl.searchParams.set('email', customerEmail);
    successRedirectUrl.searchParams.set('orderId', orderId);
    items.forEach(item => {
      successRedirectUrl.searchParams.append('titles', item.title);
      successRedirectUrl.searchParams.append('pdfs', item.pdfUrl);
    });

    return NextResponse.redirect(successRedirectUrl);
  } catch (error: any) {
    console.error('Error in Polar success callback handler:', error);
    // Redirect to checkout with error message
    const redirectUrl = new URL('/checkout', request.url);
    redirectUrl.searchParams.set('error', error.message || 'Error completing checkout payment');
    return NextResponse.redirect(redirectUrl);
  }
}
