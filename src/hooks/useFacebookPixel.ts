declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    __fbAdvancedMatchingSet?: boolean;
  }
}

export const FB_PIXEL_ID = '1390199348609324';

// Check if fbq is available
const isFbqReady = (): boolean => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
};

// Set Advanced Matching data - call this when user data is available
export const setAdvancedMatching = (userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
}) => {
  if (!isFbqReady()) {
    console.warn('FB Pixel not ready for Advanced Matching');
    return;
  }

  // Only set once per session
  if (window.__fbAdvancedMatchingSet) {
    console.log('[FB Pixel] Advanced Matching already set');
    return;
  }

  const matchData: Record<string, string> = {};
  
  if (userData.email) {
    matchData.em = userData.email.toLowerCase().trim();
  }
  if (userData.phone) {
    // Format: country code + number, digits only
    const cleanPhone = userData.phone.replace(/\D/g, '');
    matchData.ph = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  }
  if (userData.firstName) {
    matchData.fn = userData.firstName.toLowerCase().trim();
  }
  if (userData.lastName) {
    matchData.ln = userData.lastName.toLowerCase().trim();
  }
  if (userData.externalId) {
    matchData.external_id = userData.externalId.replace(/\D/g, '');
  }

  // Re-init pixel with user data for advanced matching
  window.fbq('init', FB_PIXEL_ID, matchData);
  window.__fbAdvancedMatchingSet = true;
  console.log('[FB Pixel] Advanced Matching set:', Object.keys(matchData).join(', '));
};

// Track ViewContent - fires once per page load
export const trackViewContent = (contentName: string, category: string = 'Landing Page') => {
  if (!isFbqReady()) {
    console.warn('FB Pixel not ready for ViewContent');
    return;
  }

  window.fbq('track', 'ViewContent', {
    content_name: contentName,
    content_category: category,
  });
  console.log('[FB Pixel] ViewContent:', contentName);
};

// Track InitiateCheckout - fires when checkout page loads
export const trackInitiateCheckout = (value: number) => {
  if (!isFbqReady()) {
    console.warn('FB Pixel not ready for InitiateCheckout');
    return;
  }

  const eventId = `ic_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  window.fbq('track', 'InitiateCheckout', {
    value: value / 100,
    currency: 'BRL',
  }, { eventID: eventId });
  console.log('[FB Pixel] InitiateCheckout:', value / 100, 'eventID:', eventId);
};

// Track PixGerado - fires when PIX is generated (dedupe by transaction)
export const trackPixGerado = (value: number, transactionId: string) => {
  if (!isFbqReady()) {
    console.warn('FB Pixel not ready for PixGerado');
    return;
  }

  // Only dedupe PixGerado per transaction to avoid duplicate fires
  const key = `fb_pix_${transactionId}`;
  if (sessionStorage.getItem(key) === '1') {
    console.log('[FB Pixel] PixGerado already tracked for:', transactionId);
    return;
  }
  sessionStorage.setItem(key, '1');

  const eventId = `pix_${transactionId}`;
  window.fbq('trackCustom', 'PixGerado', {
    value: value / 100,
    currency: 'BRL',
    transaction_id: transactionId,
  }, { eventID: eventId });
  console.log('[FB Pixel] PixGerado:', transactionId, 'value:', value / 100);
};

// Track Purchase - fires when payment is confirmed (dedupe by transaction)
export const trackPurchase = (params: {
  value: number;
  transactionId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDocument?: string;
}) => {
  if (!isFbqReady()) {
    console.warn('FB Pixel not ready for Purchase');
    return;
  }

  // Only dedupe Purchase per transaction to avoid duplicate fires
  const key = `fb_purchase_${params.transactionId}`;
  if (sessionStorage.getItem(key) === '1') {
    console.log('[FB Pixel] Purchase already tracked for:', params.transactionId);
    return;
  }
  sessionStorage.setItem(key, '1');

  const eventId = `purchase_${params.transactionId}`;
  const data: Record<string, unknown> = {
    value: params.value / 100,
    currency: 'BRL',
    content_type: 'product',
    content_ids: ['zyra-pro-license'],
  };

  // Add user data for better matching
  if (params.customerEmail) data.em = params.customerEmail;
  if (params.customerPhone) data.ph = params.customerPhone.replace(/\D/g, '');
  if (params.customerDocument) data.external_id = params.customerDocument.replace(/\D/g, '');

  window.fbq('track', 'Purchase', data, { eventID: eventId });
  console.log('[FB Pixel] Purchase:', params.transactionId, 'value:', params.value / 100, 'eventID:', eventId);
};

// Track AddPaymentInfo - fires when user fills payment form
export const trackAddPaymentInfo = (value: number) => {
  if (!isFbqReady()) {
    console.warn('FB Pixel not ready for AddPaymentInfo');
    return;
  }

  const eventId = `api_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  window.fbq('track', 'AddPaymentInfo', {
    value: value / 100,
    currency: 'BRL',
  }, { eventID: eventId });
  console.log('[FB Pixel] AddPaymentInfo:', value / 100);
};
