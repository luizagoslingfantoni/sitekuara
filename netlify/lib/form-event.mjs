import { forms } from './brevo.mjs';
import { verifyForm } from './form-proof.mjs';

// Netlify consumes form-name as routing metadata and omits it from event.data.
// Recover it only when the original HMAC validates for one of our mapped forms.
export async function verifiedEventData(data, secret) {
  if (!data || typeof data !== 'object') return null;
  const candidates = data['form-name'] ? [data['form-name']] : Object.keys(forms);
  for (const name of candidates) {
    if (!Object.hasOwn(forms, name)) continue;
    const candidate = { ...data, 'form-name': name };
    if (await verifyForm(candidate, secret)) return candidate;
  }
  return null;
}
