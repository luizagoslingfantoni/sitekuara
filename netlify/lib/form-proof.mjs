const fields = ['form-name', 'email', 'nome', 'sobrenome', 'telefone', 'whatsapp', 'consent', 'autorizacao', 'website'];
const encoder = new TextEncoder();
const payload = (data, time) => encoder.encode(JSON.stringify(['kuara-turnstile-v1', time, ...fields.map(key => typeof data[key] === 'string' ? data[key].trim() : '')]));
async function key(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function signForm(data, secret, now = Date.now()) {
  const time = String(Math.floor(now / 1000));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), payload(data, time)));
  return time + '.' + Array.from(signature, byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function verifyForm(data, secret, now = Date.now()) {
  if (!secret || typeof data?.['kuara-verification'] !== 'string') return false;
  const match = /^(\d{10})\.([a-f0-9]{64})$/.exec(data['kuara-verification']);
  if (!match) return false;
  const age = now / 1000 - Number(match[1]);
  // Allows delayed verified events without retaining or reusing Turnstile tokens.
  if (age < -60 || age > 7 * 86400) return false;
  const signature = Uint8Array.from(match[2].match(/../g), byte => parseInt(byte, 16));
  return crypto.subtle.verify('HMAC', await key(secret), signature, payload(data, match[1]));
}
