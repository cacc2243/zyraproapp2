import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

const FB_PIXEL_ID = '1390199348609324';
const FB_ACCESS_TOKEN = Deno.env.get('FB_ACCESS_TOKEN') || '';

// Minimum amount for license generation (R$ 107 = 10700 cents - only main extension product)
const MIN_AMOUNT_FOR_LICENSE = 10700;

// Token expiration time in minutes
const EMAIL_UPDATE_TOKEN_EXPIRATION_MINUTES = 15;

// Generate unique license in ZYRA-XXXX-XXXX-XXXX format using cryptographic randomness
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytes = new Uint8Array(12); // 3 segments x 4 chars
  crypto.getRandomValues(randomBytes);
  
  const parts: string[] = ['ZYRA'];
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars[randomBytes[i * 4 + j] % chars.length];
    }
    parts.push(segment);
  }
  
  return parts.join('-');
}

// Generate cryptographically secure email update token
function generateEmailUpdateToken(): string {
  return crypto.randomUUID();
}

// Hash data using SHA-256
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate unique license and save to transaction and licenses table
async function generateAndSaveLicense(
  supabase: any, 
  transactionId: string, 
  amount: number,
  customerEmail?: string,
  customerDocument?: string
): Promise<{ licenseKey: string | null; licenseId: string | null }> {
  // Validate amount
  if (amount < MIN_AMOUNT_FOR_LICENSE) {
    console.log(`Amount ${amount} is less than minimum ${MIN_AMOUNT_FOR_LICENSE}, skipping license generation`);
    return { licenseKey: null, licenseId: null };
  }

  // Check if transaction already has a license
  const { data: existingTx } = await supabase
    .from('transactions')
    .select('license_key')
    .eq('id', transactionId)
    .single();

  if (existingTx?.license_key) {
    console.log(`Transaction ${transactionId} already has license: ${existingTx.license_key}`);
    const { data: existingLicense } = await supabase
      .from('licenses')
      .select('id')
      .eq('license_key', existingTx.license_key)
      .single();
    return { licenseKey: existingTx.license_key, licenseId: existingLicense?.id || null };
  }

  // Generate unique license with retry
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const licenseKey = generateLicenseKey();
    
    // Check if license already exists in licenses table
    const { data: existingLicense } = await supabase
      .from('licenses')
      .select('id')
      .eq('license_key', licenseKey)
      .maybeSingle();

    // Also check transactions table for legacy
    const { data: existingTxLicense } = await supabase
      .from('transactions')
      .select('id')
      .eq('license_key', licenseKey)
      .maybeSingle();

    if (!existingLicense && !existingTxLicense) {
      // Prepare hashes for secure storage
      const emailHash = customerEmail ? await hashData(customerEmail) : null;
      const documentHash = customerDocument ? await hashData(customerDocument.replace(/\D/g, '')) : null;

      // Save to licenses table
      const { data: newLicense, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          license_key: licenseKey,
          transaction_id: transactionId,
          customer_email_hash: emailHash,
          customer_document_hash: documentHash,
          status: 'active',
          origin: 'automatic',
          max_devices: 3
        })
        .select('id')
        .single();

      if (licenseError) {
        console.error('Error saving to licenses table:', licenseError.message);
      }

      // Also save to transactions table for backward compatibility
      const { error: txError } = await supabase
        .from('transactions')
        .update({ 
          license_key: licenseKey,
          license_created_at: new Date().toISOString(),
          license_origin: 'automatic'
        })
        .eq('id', transactionId);

      if (!txError) {
        // Log the creation
        await supabase.from('license_logs').insert({
          license_key: licenseKey,
          license_id: newLicense?.id || null,
          action: 'created',
          metadata: { 
            origin: 'automatic', 
            transaction_id: transactionId,
            source: 'pixup-webhook'
          }
        });

        console.log(`License ${licenseKey} generated and saved for transaction ${transactionId}`);
        return { licenseKey, licenseId: newLicense?.id || null };
      }
      console.error(`Error saving license to transactions: ${txError.message}`);
    }

    attempts++;
    console.log(`License collision, retrying (${attempts}/${maxAttempts})`);
  }

  console.error(`Failed to generate unique license after ${maxAttempts} attempts`);
  return { licenseKey: null, licenseId: null };
}

// Create subscription record
async function createSubscription(
  supabase: any,
  transaction: any,
  licenseId: string | null
): Promise<void> {
  const planType = transaction.plan_type;
  const productType = transaction.product_title?.toLowerCase().includes('v0') ? 'v0' 
    : transaction.product_title?.toLowerCase().includes('manus') ? 'manus' 
    : 'lovable';

  if (!planType || !['weekly', 'monthly', 'yearly'].includes(planType)) {
    console.log('Not a subscription transaction, skipping subscription creation');
    return;
  }

  const now = new Date();
  let periodEnd: Date;
  
  switch (planType) {
    case 'weekly':
      periodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'yearly':
      periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      break;
    default: // monthly
      periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // Create subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      customer_email: transaction.customer_email,
      customer_name: transaction.customer_name,
      customer_document: transaction.customer_document,
      customer_phone: transaction.customer_phone,
      product_type: productType,
      plan_type: planType,
      amount: transaction.amount,
      status: 'active',
      started_at: now.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      next_billing_date: periodEnd.toISOString(),
      license_id: licenseId
    })
    .select('id')
    .single();

  if (subError) {
    console.error('Error creating subscription:', subError.message);
    return;
  }

  // Update transaction with subscription_id
  await supabase
    .from('transactions')
    .update({ subscription_id: subscription.id })
    .eq('id', transaction.id);

  // Create initial payment record
  await supabase
    .from('subscription_payments')
    .insert({
      subscription_id: subscription.id,
      transaction_id: transaction.id,
      amount: transaction.amount,
      status: 'paid',
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      paid_at: now.toISOString()
    });

  console.log(`Subscription ${subscription.id} created for ${transaction.customer_email}`);
}

// Send Facebook Conversions API event
async function sendFacebookPurchaseEvent(params: {
  value: number;
  currency: string;
  transactionId: string;
  email?: string;
  phone?: string;
  fbp?: string;
  fbc?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  if (!FB_ACCESS_TOKEN) {
    console.log('FB_ACCESS_TOKEN not configured, skipping Purchase event');
    return;
  }

  try {
    const eventTime = Math.floor(Date.now() / 1000);
    
    const hashData = async (data: string): Promise<string> => {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const userData: Record<string, string> = {};
    
    if (params.email) userData.em = await hashData(params.email);
    if (params.phone) userData.ph = await hashData(params.phone.replace(/\D/g, ''));
    if (params.fbp) userData.fbp = params.fbp;
    if (params.fbc) userData.fbc = params.fbc;
    if (params.ipAddress) userData.client_ip_address = params.ipAddress;
    if (params.userAgent) userData.client_user_agent = params.userAgent;

    const eventData = {
      data: [{
        event_name: 'Purchase',
        event_time: eventTime,
        action_source: 'website',
        event_id: `purchase_${params.transactionId}`,
        user_data: userData,
        custom_data: {
          value: params.value / 100,
          currency: params.currency,
          transaction_id: params.transactionId,
        }
      }]
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      }
    );

    const result = await response.json();
    console.log('Facebook Purchase event sent:', JSON.stringify(result));
  } catch (error) {
    console.error('Error sending Facebook Purchase event:', error);
  }
}

// Note: Pixup doesn't support custom webhook headers, so we can't validate with a secret
// Security relies on the obscurity of the webhook URL and validating the payload structure

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

try {
    // Note: Pixup doesn't support custom webhook headers for authentication
    // Security relies on URL obscurity and payload structure validation
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    console.log(`Webhook received from IP: ${clientIP}`);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const payload = await req.json();
    console.log('PixUp Webhook received:', JSON.stringify(payload, null, 2));

    const requestBody = payload.requestBody || payload;
    
    const { 
      transactionId, 
      external_id, 
      status
    } = requestBody;

    if (!transactionId) {
      console.error('No transactionId in webhook payload');
      return new Response(
        JSON.stringify({ success: false, error: 'No transactionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusMap: Record<string, string> = {
      'PENDING': 'waiting_payment',
      'PAID': 'paid',
      'EXPIRED': 'cancelled',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'refunded',
      'PROCESSING': 'processing'
    };

    const mappedStatus = statusMap[status?.toUpperCase()] || 'waiting_payment';

    console.log(`Processing transaction ${transactionId} with status: ${status} -> ${mappedStatus}`);
    console.log(`external_id (our reference): ${external_id}`);

    let transaction = null;
    
    if (external_id) {
      console.log(`Searching by transaction_hash: ${external_id}`);
      const { data: txByExternalId, error: extError } = await supabase
        .from('transactions')
        .select('id, customer_email, customer_phone, customer_name, customer_document, amount, fbp, fbc, ip_address, plan_type, is_subscription')
        .eq('transaction_hash', external_id)
        .maybeSingle();
      
      if (extError) {
        console.error('Error searching by external_id:', extError.message);
      }
      
      if (txByExternalId) {
        transaction = txByExternalId;
        console.log(`Found transaction by external_id: ${external_id}, id: ${txByExternalId.id}`);
      } else {
        console.log(`No transaction found with transaction_hash: ${external_id}`);
      }
    }
    
    // Try by PixUp transactionId stored in pepper_transaction_id field
    if (!transaction && transactionId) {
      console.log(`Searching by pepper_transaction_id: ${transactionId}`);
      const { data: txByPixupId, error: pixupError } = await supabase
        .from('transactions')
        .select('id, customer_email, customer_phone, customer_name, customer_document, amount, fbp, fbc, ip_address, plan_type, is_subscription')
        .eq('pepper_transaction_id', transactionId)
        .maybeSingle();
      
      if (pixupError) {
        console.error('Error searching by pepper_transaction_id:', pixupError.message);
      }
      
      if (txByPixupId) {
        transaction = txByPixupId;
        console.log(`Found transaction by pixup_transaction_id: ${transactionId}, id: ${txByPixupId.id}`);
      } else {
        console.log(`No transaction found with pepper_transaction_id: ${transactionId}`);
      }
    }

    if (transaction) {
      const updateData: Record<string, any> = {
        payment_status: mappedStatus,
        pepper_transaction_id: transactionId,
        updated_at: new Date().toISOString()
      };

      if (mappedStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
        updateData.access_granted = true;
        updateData.access_granted_at = new Date().toISOString();
        
        // Generate email update token for secure email changes
        updateData.email_update_token = generateEmailUpdateToken();
        updateData.email_update_token_expires_at = new Date(
          Date.now() + EMAIL_UPDATE_TOKEN_EXPIRATION_MINUTES * 60 * 1000
        ).toISOString();
        
        await sendFacebookPurchaseEvent({
          value: transaction.amount || 0,
          currency: 'BRL',
          transactionId: transaction.id,
          email: transaction.customer_email,
          phone: transaction.customer_phone,
          fbp: transaction.fbp,
          fbc: transaction.fbc,
          ipAddress: transaction.ip_address,
          userAgent: undefined, // Not available from query
        });
      }

      await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id);

      // Generate license if payment is approved and amount >= R$ 97
      if (mappedStatus === 'paid') {
        const { licenseKey, licenseId } = await generateAndSaveLicense(
          supabase, 
          transaction.id, 
          transaction.amount || 0,
          transaction.customer_email,
          transaction.customer_document
        );

        // Create subscription if applicable
        if (transaction.plan_type && transaction.is_subscription) {
          await createSubscription(supabase, transaction, licenseId);
        }
      }

      console.log(`Transaction ${transaction.id} updated to status: ${mappedStatus}`);
    } else {
      console.warn(`Transaction not found. transactionId: ${transactionId}, external_id: ${external_id}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
