/**
 * Polar.sh Payment Helper Service
 * Uses raw REST API fetch to avoid npm install sandbox access permission errors on Windows.
 */

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
const POLAR_PRODUCT_ID = process.env.POLAR_PRODUCT_ID;
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const isPolarConfigured = !!(POLAR_ACCESS_TOKEN && POLAR_PRODUCT_ID);

// Detect if using sandbox or live Polar keys
const isSandbox = POLAR_ACCESS_TOKEN?.includes('_sb_') || process.env.POLAR_ENV === 'sandbox';
const BASE_URL = isSandbox ? 'https://sandbox-api.polar.sh/v1' : 'https://api.polar.sh/v1';

interface CreateSessionArgs {
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  orderId: string;
  items: Array<{ productId: string; title: string; price: number; pdfUrl?: string }>;
}

export async function createPolarCheckoutSession({
  customerEmail,
  customerName,
  totalAmount,
  orderId,
  items
}: CreateSessionArgs): Promise<{ url: string; isMock: boolean }> {
  if (!isPolarConfigured) {
    console.warn('Polar.sh credentials missing. Running in Simulated Polar Mode.');
    // In mock mode, we embed order info in the callback url so it works without database lookups too
    const queryParams = new URLSearchParams();
    queryParams.set('checkout_id', `mock-chk-${Date.now()}`);
    queryParams.set('mock', 'true');
    queryParams.set('order_id', orderId);
    queryParams.set('email', customerEmail);
    queryParams.set('name', customerName);
    queryParams.set('total', totalAmount.toString());
    items.forEach(item => {
      queryParams.append('titles', item.title);
      queryParams.append('pdfs', item.pdfUrl || '/uploads/mock-pattern.pdf');
    });

    const mockSuccessUrl = `${NEXT_PUBLIC_SITE_URL}/api/checkout/polar-success?${queryParams.toString()}`;
    return {
      url: mockSuccessUrl,
      isMock: true
    };
  }

  try {
    const successUrl = `${NEXT_PUBLIC_SITE_URL}/api/checkout/polar-success?checkout_id={CHECKOUT_ID}`;
    
    // Polar API requires price amount as an integer in cents/smallest currency unit
    const priceAmountInCents = Math.round(totalAmount * 100);

    const payload = {
      products: [POLAR_PRODUCT_ID],
      prices: {
        [POLAR_PRODUCT_ID!]: [
          {
            amount_type: 'fixed',
            price_amount: priceAmountInCents,
            price_currency: 'usd'
          }
        ]
      },
      success_url: successUrl,
      customer_email: customerEmail,
      customer_name: customerName,
      allow_discount_codes: true,
      metadata: {
        orderId: orderId
      }
    };

    console.log(`Sending request to Polar API (${BASE_URL}/checkouts):`, JSON.stringify(payload, null, 2));

    const response = await fetch(`${BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Polar API checkout creation failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data.url) {
      throw new Error('Polar API response did not contain a checkout URL.');
    }

    return {
      url: data.url,
      isMock: false
    };
  } catch (error: any) {
    console.error('Error creating Polar checkout session:', error);
    throw error;
  }
}

interface RetrieveSessionResult {
  status: string;
  customerEmail?: string;
  customerName?: string;
  metadata: {
    orderId?: string;
  };
}

export async function getPolarCheckoutSession(
  checkoutId: string,
  queryOrderId?: string,
  queryEmail?: string,
  queryName?: string
): Promise<RetrieveSessionResult> {
  // If mock checkout ID or mock mode
  if (checkoutId.startsWith('mock-') || !isPolarConfigured) {
    return {
      status: 'succeeded',
      customerEmail: queryEmail || 'mock@example.com',
      customerName: queryName || 'Guest',
      metadata: {
        orderId: queryOrderId
      }
    };
  }

  try {
    const response = await fetch(`${BASE_URL}/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Polar API checkout retrieval failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      status: data.status,
      customerEmail: data.customer_email || data.customerEmail,
      customerName: data.customer_name || data.customerName,
      metadata: {
        orderId: data.metadata?.orderId
      }
    };
  } catch (error: any) {
    console.error(`Error retrieving Polar checkout session ${checkoutId}:`, error);
    throw error;
  }
}
