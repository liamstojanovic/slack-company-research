import crypto from 'crypto';
import { ENV } from '../../config/environment';

export function verifySlackSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const time = Math.floor(Date.now() / 1000);
  const requestTimestamp = parseInt(timestamp, 10);

  // Reject requests older than 5 minutes to prevent replay attacks
  if (Math.abs(time - requestTimestamp) > 60 * 5) {
    return false;
  }

  const sigBaseString = `v0:${timestamp}:${body}`;
  const mySignature =
    'v0=' +
    crypto
      .createHmac('sha256', ENV.slack.signingSecret)
      .update(sigBaseString)
      .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(mySignature)
    );
  } catch {
    return false;
  }
}

export function parseSlackCommand(text: string): {
  companyName: string;
  websiteUrl: string;
} | null {
  const parts = text.trim().split(/\s+/);

  if (parts.length < 2) {
    return null;
  }

  const companyName = parts.slice(0, -1).join(' ');
  const websiteUrl = parts[parts.length - 1];

  return { companyName, websiteUrl };
}

export function isValidUrl(url: string): boolean {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}
