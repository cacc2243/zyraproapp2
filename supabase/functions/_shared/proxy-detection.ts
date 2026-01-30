// === PROXY INTERCEPTOR DETECTION ===
// Detect Burp Suite, Proxyman, mitmproxy, Charles, Fiddler, etc.

// Known proxy/interceptor User-Agent patterns
const PROXY_USER_AGENT_PATTERNS = [
  /burp/i,
  /portswigger/i,
  /proxyman/i,
  /mitmproxy/i,
  /charles/i,
  /fiddler/i,
  /owasp/i,
  /zaproxy/i,
  /wireshark/i,
  /httpwatch/i,
  /telerik/i,
  /postman/i,  // API testing tools often used for replay attacks
  /insomnia/i,
  /paw\//i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /httpie/i,
  /axios/i,
  /node-fetch/i,
  /undici/i,
  /java\//i,
  /okhttp/i,
  /httpclient/i,
  /libcurl/i,
  /go-http-client/i,
  /ruby/i,
  /perl/i,
  /php/i,
];

// Headers injected by proxies that reveal their presence
const SUSPICIOUS_HEADERS = [
  'x-burp-',
  'x-charles-',
  'x-proxyman-',
  'x-mitmproxy-',
  'x-fiddler-',
  'x-zap-',
  'x-forwarded-server',
  'x-proxy-',
  'x-proxy-id',
  'proxy-agent',
  'proxy-authorization',
  'x-arr-ssl',  // Azure proxy header
  'x-original-url',  // Proxy rewrite indicator
  'x-rewrite-url',
  'x-http-method-override',
  'x-method-override',
];

// Headers that legitimate browsers should have
const EXPECTED_BROWSER_HEADERS = [
  'sec-ch-ua',
  'sec-ch-ua-mobile',
  'sec-ch-ua-platform',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site',
];

export interface ProxyDetectionResult {
  isProxy: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  indicators: string[];
  shouldBlock: boolean;
}

export function detectProxyInterceptor(req: Request): ProxyDetectionResult {
  const indicators: string[] = [];
  let suspicionScore = 0;
  
  const userAgent = req.headers.get('user-agent') || '';
  const headers = Object.fromEntries(req.headers.entries());
  
  // 1. Check User-Agent for proxy patterns
  for (const pattern of PROXY_USER_AGENT_PATTERNS) {
    if (pattern.test(userAgent)) {
      indicators.push(`UA_MATCH:${pattern.source}`);
      suspicionScore += 30;
    }
  }
  
  // 2. Empty User-Agent is highly suspicious
  if (!userAgent || userAgent.length < 10) {
    indicators.push('EMPTY_OR_SHORT_UA');
    suspicionScore += 25;
  }
  
  // 3. Check for proxy-injected headers
  for (const header of SUSPICIOUS_HEADERS) {
    const headerLower = Object.keys(headers).find(h => h.toLowerCase().startsWith(header));
    if (headerLower) {
      indicators.push(`HEADER:${headerLower}`);
      suspicionScore += 25;
    }
  }
  
  // 4. Check for Via header (proxy chain indicator)
  const viaHeader = req.headers.get('via');
  if (viaHeader) {
    indicators.push(`VIA:${viaHeader.substring(0, 50)}`);
    suspicionScore += 20;
    
    // Multiple proxies = higher suspicion
    if ((viaHeader.match(/,/g) || []).length > 0) {
      suspicionScore += 10;
    }
  }
  
  // 5. Missing browser security headers (Chrome/Firefox always send these)
  if (userAgent.includes('Chrome') || userAgent.includes('Firefox')) {
    let missingSecHeaders = 0;
    for (const header of EXPECTED_BROWSER_HEADERS) {
      if (!req.headers.get(header)) {
        missingSecHeaders++;
      }
    }
    if (missingSecHeaders >= 3) {
      indicators.push(`MISSING_SEC_HEADERS:${missingSecHeaders}`);
      suspicionScore += 15;
    }
  }
  
  // 6. Check for TLS fingerprint anomalies (Cloudflare provides these)
  const cfVisitor = req.headers.get('cf-visitor');
  if (cfVisitor && !cfVisitor.includes('"scheme":"https"')) {
    indicators.push('TLS_ANOMALY:not_https');
    suspicionScore += 10;
  }
  
  // 7. Check for Forwarded header inconsistencies
  const forwarded = req.headers.get('forwarded');
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (forwarded && xForwardedFor) {
    // Both present can indicate proxy chaining
    indicators.push('DUAL_FORWARD_HEADERS');
    suspicionScore += 5;
  }
  
  // 8. Empty or suspicious Origin
  const origin = req.headers.get('origin');
  if (!origin && req.method === 'POST') {
    indicators.push('NO_ORIGIN');
    suspicionScore += 10;
  }
  
  // 9. Check for known proxy certificate indicators in headers
  const certHeaders = ['x-ssl-cert', 'x-client-cert', 'x-ssl-client-cert'];
  for (const certHeader of certHeaders) {
    if (req.headers.get(certHeader)) {
      indicators.push(`CERT_HEADER:${certHeader}`);
      suspicionScore += 15;
    }
  }
  
  // 10. Check Accept-Language (automated tools often omit this)
  const acceptLang = req.headers.get('accept-language');
  if (!acceptLang && userAgent.includes('Mozilla')) {
    indicators.push('NO_ACCEPT_LANGUAGE');
    suspicionScore += 10;
  }
  
  // 11. Check for unusual Accept header
  const accept = req.headers.get('accept');
  if (accept === '*/*' && userAgent.includes('Mozilla')) {
    indicators.push('GENERIC_ACCEPT');
    suspicionScore += 5;
  }
  
  // Determine confidence and blocking decision
  let confidence: 'high' | 'medium' | 'low' | 'none';
  let shouldBlock: boolean;
  
  if (suspicionScore >= 50) {
    confidence = 'high';
    shouldBlock = true;
  } else if (suspicionScore >= 30) {
    confidence = 'medium';
    shouldBlock = true;
  } else if (suspicionScore >= 15) {
    confidence = 'low';
    shouldBlock = false; // Log but don't block
  } else {
    confidence = 'none';
    shouldBlock = false;
  }
  
  return {
    isProxy: suspicionScore > 0,
    confidence,
    indicators,
    shouldBlock,
  };
}

export function getClientIP(req: Request): string {
  return req.headers.get('cf-connecting-ip') || 
         req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') ||
         'unknown';
}
